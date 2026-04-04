import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const PORT = process.env.PORT || 3002;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const AI_SERVICE_SECRET = process.env.AI_SERVICE_SECRET || '';

app.use(cors({ origin: false }));
app.use(express.json({ limit: '512kb' }));

function requireInternalSecret(req, res, next) {
  if (!AI_SERVICE_SECRET) return next();
  const secret = req.headers['x-internal-secret'];
  if (!secret || secret !== AI_SERVICE_SECRET) {
    return res.status(403).json({ error: 'Forbidden: invalid internal secret' });
  }
  next();
}

function getModel() {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

function stripMarkdown(text) {
  return text.trim().replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'reviewer-ai-service', gemini_configured: !!GEMINI_API_KEY });
});

// POST /ai/generate-question
// Generates a fresh technical interview question tailored to the user's tech stack & levels
app.post('/ai/generate-question', requireInternalSecret, async (req, res) => {
  const { tech_stack, years_of_experience } = req.body;

  if (!tech_stack || !tech_stack.length) {
    return res.status(400).json({ error: 'tech_stack is required' });
  }

  if (!GEMINI_API_KEY) {
    // Mock fallback
    const first = tech_stack[0];
    return res.json({
      title: `Explain a key architectural pattern you use with ${first.name} and why you chose it.`,
      category: first.name,
      difficulty: first.level === 'beginner' ? 'Junior' : first.level === 'advanced' ? 'Senior' : first.level === 'expert' ? 'Principal' : 'Mid',
      curator_tip: `Think about trade-offs and real-world scenarios when answering questions about ${first.name}.`,
    });
  }

  // Build a summary of the user's stack with levels
  const stackSummary = tech_stack
    .map(t => `${t.name} (${t.level})`)
    .join(', ');

  // Base difficulty from self-assessed tech level
  const levelToDifficulty = {
    beginner: 'Junior',
    intermediate: 'Mid',
    advanced: 'Senior',
    expert: 'Principal',
  };

  // Adjust difficulty based on years of experience combined with self-assessed level.
  // Experienced engineers who rate themselves as beginners likely need harder questions;
  // very junior engineers who rate themselves as expert may need to be calibrated down.
  const difficultyOrder = ['Junior', 'Mid', 'Senior', 'Principal'];
  function adjustDifficulty(baseDiff, years) {
    let idx = difficultyOrder.indexOf(baseDiff);
    if (idx === -1) idx = 1; // default Mid
    const yrs = years || 0;
    if (yrs >= 8 && idx < 2) idx = Math.min(idx + 1, 3);       // very experienced → bump up
    else if (yrs >= 5 && idx < 1) idx = 1;                       // 5+ yrs, at least Mid
    else if (yrs <= 1 && idx > 2) idx = 2;                       // <2 yrs, cap at Senior
    return difficultyOrder[idx];
  }

  // Pick a random tech from the stack, weighted towards the ones listed first
  const idx = Math.floor(Math.random() * Math.min(tech_stack.length, 5));
  const focusTech = tech_stack[idx];
  const baseDifficulty = levelToDifficulty[focusTech.level] || 'Mid';
  const targetDifficulty = adjustDifficulty(baseDifficulty, years_of_experience);

  const prompt = `You are a senior technical interviewer generating a unique interview question.

The candidate's technology profile:
- Tech stack with self-assessed levels: ${stackSummary}
- Total years of professional experience: ${years_of_experience || 0}
- Focus technology for this question: ${focusTech.name} (self-assessed level: ${focusTech.level})
- Calibrated difficulty for this question: ${targetDifficulty}

The difficulty has been calibrated from the candidate's self-assessed level AND their total years of experience together.

Generate ONE concise technical interview question appropriate for a ${targetDifficulty}-level candidate working with ${focusTech.name}.

Requirements:
- Ask about ONE specific concept, decision, or trade-off — no multi-part questions
- Keep the question under 30 words
- Practical and direct — no lengthy scenario setup
- Answerable in a written response (no coding required)
- Difficulty must match the ${targetDifficulty} level: ${targetDifficulty === 'Junior' ? 'foundational concepts, basic usage' : targetDifficulty === 'Mid' ? 'real-world application, common patterns' : targetDifficulty === 'Senior' ? 'architectural decisions, trade-offs, performance' : 'system design at scale, cross-team impact, deep internals'}

Return ONLY valid JSON (no markdown, no backticks, no extra text) in this exact format:
{
  "title": "<the interview question, max 30 words>",
  "category": "<primary technology or topic, e.g. 'React', 'System Design', 'Node.js'>",
  "difficulty": "${targetDifficulty}",
  "curator_tip": "<1-2 sentence hint about what a strong answer should cover, without giving away the answer>"
}`;

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const text = stripMarkdown(result.response.text());

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error('[AI] generate-question JSON parse failed. Raw:', text);
      return res.status(502).json({ error: 'AI returned malformed JSON' });
    }

    if (!parsed.title || !parsed.category || !parsed.difficulty) {
      return res.status(502).json({ error: 'AI response missing required fields' });
    }

    return res.json(parsed);
  } catch (err) {
    console.error('[AI] generate-question error:', err.message);
    return res.status(502).json({ error: 'AI question generation failed', detail: err.message });
  }
});

// POST /ai/evaluate
app.post('/ai/evaluate', requireInternalSecret, async (req, res) => {
  const { question_title, user_answer, years_of_experience, difficulty } = req.body;

  if (!question_title || !user_answer) {
    return res.status(400).json({ error: 'question_title and user_answer are required' });
  }

  if (!GEMINI_API_KEY) {
    return res.json({
      score: 72,
      feedback: 'Good answer! You demonstrated understanding of the topic. To improve, consider expanding on specific strategies and providing examples from your experience.',
    });
  }

  const prompt = `You are a senior technical interviewer at a top-tier software company conducting a technical interview.

Interview question: "${question_title}"
Candidate experience level: ${years_of_experience} years
Question difficulty: ${difficulty}
Candidate's answer: "${user_answer}"

Write all feedback text in English.

Evaluate the candidate's answer and return ONLY valid JSON (no markdown, no backticks, no extra text) in this exact format:
{
  "score": <integer 0-100>,
  "feedback": "<constructive feedback string, 3-5 sentences covering: what was correct, what was missing, and specific improvements>"
}

Scoring rubric:
- 90-100: Exceptional, covers all aspects with depth, mentions edge cases
- 70-89: Good, covers main points with minor gaps
- 50-69: Adequate, gets the basics right but lacks depth
- 30-49: Partial, some understanding but significant gaps
- 0-29: Poor, misses fundamental concepts

Be constructive and specific. The feedback must be actionable.`;

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const text = stripMarkdown(result.response.text());

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error('[AI] evaluate JSON parse failed. Raw:', text);
      return res.status(502).json({ error: 'AI returned malformed JSON' });
    }

    if (typeof parsed.score !== 'number' || typeof parsed.feedback !== 'string') {
      return res.status(502).json({ error: 'AI response schema mismatch' });
    }

    parsed.score = Math.max(0, Math.min(100, Math.round(parsed.score)));
    return res.json(parsed);
  } catch (err) {
    console.error('[AI] evaluate error:', err.message);
    return res.status(502).json({ error: 'AI evaluation failed', detail: err.message });
  }
});

// POST /ai/analyze-profile
app.post('/ai/analyze-profile', requireInternalSecret, async (req, res) => {
  const { interviews, username, profession, years_of_experience } = req.body;

  if (!Array.isArray(interviews) || interviews.length === 0) {
    return res.status(400).json({ error: 'interviews array is required' });
  }

  const scored = interviews.filter(i => i.ai_score !== null);
  const totalInterviews = interviews.length;
  const avgScore = scored.length > 0
    ? Math.round(scored.reduce((s, i) => s + i.ai_score, 0) / scored.length)
    : 0;
  const bestScore = scored.length > 0 ? Math.max(...scored.map(i => i.ai_score)) : 0;

  const cats = {};
  scored.forEach(i => {
    if (!i.category) return;
    if (!cats[i.category]) cats[i.category] = { total: 0, count: 0 };
    cats[i.category].total += i.ai_score;
    cats[i.category].count++;
  });
  const catSummary = Object.entries(cats)
    .map(([cat, d]) => `${cat}: avg ${Math.round(d.total / d.count)}/100 (${d.count} interview${d.count > 1 ? 's' : ''})`)
    .join('; ');

  const sorted = [...interviews]
    .filter(i => i.ai_score !== null && i.created_at)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const half = Math.max(1, Math.ceil(sorted.length / 2));
  const earlyAvg = sorted.slice(0, half).reduce((s, i) => s + i.ai_score, 0) / half;
  const recentAvg = sorted.slice(-half).reduce((s, i) => s + i.ai_score, 0) / half;
  const trend = recentAvg > earlyAvg + 5 ? 'improving'
    : recentAvg < earlyAvg - 5 ? 'declining'
    : 'stable';

  if (!GEMINI_API_KEY) {
    return res.json({
      analysis: `You have completed ${totalInterviews} mock interview${totalInterviews !== 1 ? 's' : ''} with an average score of ${avgScore}/100 and a best score of ${bestScore}/100. Your performance trend is ${trend}. Keep practicing to continue improving your technical interview skills.`,
    });
  }

  const prompt = `You are an expert technical career coach analyzing a software engineer's mock interview history.

Candidate profile:
- Name: ${username || 'Candidate'}
- Profession: ${profession || 'Software Engineer'}
- Years of experience: ${years_of_experience || 0}
- Total mock interviews: ${totalInterviews}
- Average score: ${avgScore}/100
- Best score: ${bestScore}/100
- Performance by category: ${catSummary || 'N/A'}
- Score trend: ${trend} (early avg: ${Math.round(earlyAvg)}, recent avg: ${Math.round(recentAvg)})

Write a personalized analysis (3–4 sentences) for this candidate. Include:
1. Their strongest area(s) based on category scores
2. Areas needing the most improvement
3. A comment on their score trend
4. One specific, actionable recommendation

Be direct, professional, and encouraging. Write in second person ("You..."). Return plain text only — no JSON, no markdown, no bullet points.`;

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return res.json({ analysis: text });
  } catch (err) {
    console.error('[AI] analyze-profile error:', err.message);
    return res.status(502).json({ error: 'AI analysis failed', detail: err.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Jest sets NODE_ENV='test' automatically — skip listen() so tests can import this module
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AI Service] Reviewer.AI Evaluation Engine running on port ${PORT}`);
    console.log(`[AI Service] Gemini configured: ${!!GEMINI_API_KEY}`);
  });
}

export { stripMarkdown };
export default app;
