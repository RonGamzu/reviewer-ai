function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function openPrintWindow(html) {
  const w = window.open('', '_blank', 'width=940,height=720');
  if (!w) { alert('Please allow popups for this site to export.'); return; }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 600);
}

export function downloadInterviewReport({ questionTitle, category, difficulty, userAnswer, aiScore, aiFeedback, interviewerFocus, username }) {
  const scoreColor = aiScore >= 75 ? '#4ade80' : aiScore >= 50 ? '#fbbf24' : '#f87171';
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Interview Report · ${escapeHtml(questionTitle)}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fff;color:#111827;padding:40px;max-width:800px;margin:0 auto}
    .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;margin-bottom:24px;border-bottom:2px solid #f3f4f6}
    .brand{font-size:22px;font-weight:900;color:#7c3aed;letter-spacing:-.5px}
    .brand-sub{font-size:13px;color:#9ca3af;margin-top:4px}
    .score-block{text-align:right}
    .score-num{font-size:42px;font-weight:900;color:${scoreColor};line-height:1;margin-top:8px}
    .score-unit{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:${scoreColor}}
    .meta{font-size:13px;color:#6b7280;margin-bottom:2px}
    .badges{display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap}
    .badge{padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700}
    .b-cat{background:#ede9fe;color:#7c3aed}
    .b-diff{background:#e0f2fe;color:#0369a1}
    .section{margin-bottom:20px}
    .s-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-bottom:8px}
    .s-body{font-size:15px;line-height:1.7;color:#1f2937;background:#f9fafb;border-radius:8px;padding:14px 16px;border-left:3px solid #e5e7eb;white-space:pre-wrap;word-break:break-word}
    .s-question{font-weight:600;font-size:17px;background:#f3f4f6;border-left-color:#7c3aed}
    .s-feedback{border-left-color:#7c3aed}
    .s-focus{background:#fdf4ff;border-left-color:#d946ef}
    .footer{margin-top:40px;padding-top:16px;border-top:1px solid #f3f4f6;display:flex;justify-content:space-between;font-size:12px;color:#d1d5db}
    @media print{@page{margin:1.5cm}body{padding:0}}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Reviewer.AI</div>
      <div class="brand-sub">Mock Interview Report</div>
    </div>
    <div class="score-block">
      <div class="meta">${escapeHtml(username || 'Candidate')}</div>
      <div class="meta">${date}</div>
      <div class="score-num">${aiScore}</div>
      <div class="score-unit">/ 100</div>
    </div>
  </div>
  <div class="badges">
    <span class="badge b-cat">${escapeHtml(category)}</span>
    <span class="badge b-diff">${escapeHtml(difficulty)}</span>
  </div>
  <div class="section">
    <div class="s-title">Question</div>
    <div class="s-body s-question">${escapeHtml(questionTitle)}</div>
  </div>
  <div class="section">
    <div class="s-title">Your Answer</div>
    <div class="s-body">${escapeHtml(userAnswer)}</div>
  </div>
  <div class="section">
    <div class="s-title">AI Feedback</div>
    <div class="s-body s-feedback">${escapeHtml(aiFeedback)}</div>
  </div>
  ${interviewerFocus ? `
  <div class="section">
    <div class="s-title">Interviewer's Focus</div>
    <div class="s-body s-focus">${escapeHtml(interviewerFocus)}</div>
  </div>` : ''}
  <div class="footer">
    <span>Reviewer.AI</span>
    <span>Generated ${date}</span>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}

export function printScoreCard({ username, profession, level, xp, avgScore, bestScore, totalInterviews, topTechs }) {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const tier = level <= 5 ? 'Apprentice' : level <= 15 ? 'Professional' : level <= 30 ? 'Senior' : level <= 50 ? 'Expert' : 'Principal';
  const initial = (username || 'U')[0].toUpperCase();

  const techRows = (topTechs || []).slice(0, 5).map(t =>
    `<div class="tech-row"><span class="tech-name">${escapeHtml(t.name)}</span><span class="tech-lvl">${escapeHtml(t.level || 'intermediate')}</span></div>`
  ).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Score Card · ${escapeHtml(username)}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f0f1a;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
    .card{background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#1a1a2e 100%);border:1px solid rgba(184,159,255,.2);border-radius:20px;padding:40px;max-width:480px;width:100%;position:relative;overflow:hidden}
    .card::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 70% 20%,rgba(184,159,255,.08) 0%,transparent 60%);pointer-events:none}
    .card-label{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:rgba(184,159,255,.55);margin-bottom:28px}
    .user{display:flex;align-items:center;gap:20px;margin-bottom:32px}
    .avatar{width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a855f7);display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:900;color:#fff;flex-shrink:0}
    .uname{font-size:22px;font-weight:800;color:#f9fafb}
    .urole{font-size:13px;color:rgba(255,255,255,.45);margin-top:3px}
    .lvl-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(184,159,255,.1);border:1px solid rgba(184,159,255,.25);border-radius:999px;padding:4px 12px;margin-top:6px}
    .lvl-num{font-size:14px;font-weight:900;color:#b89fff}
    .lvl-label{font-size:11px;font-weight:700;color:rgba(184,159,255,.7);text-transform:uppercase;letter-spacing:.08em}
    .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px}
    .stat{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:14px 12px;text-align:center}
    .sv{font-size:24px;font-weight:900}
    .sv-p{color:#b89fff}.sv-s{color:#00d2fd}.sv-t{color:#ff59e3}
    .sl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.3);margin-top:4px}
    .techs-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.3);margin-bottom:10px}
    .tech-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.05)}
    .tech-row:last-child{border-bottom:none}
    .tech-name{font-size:13px;font-weight:600;color:rgba(255,255,255,.8)}
    .tech-lvl{font-size:11px;font-weight:700;text-transform:capitalize;color:rgba(184,159,255,.65);background:rgba(184,159,255,.08);padding:2px 8px;border-radius:999px}
    .footer{display:flex;justify-content:space-between;align-items:center;margin-top:28px;padding-top:20px;border-top:1px solid rgba(255,255,255,.07)}
    .fbrand{font-size:13px;font-weight:800;color:rgba(184,159,255,.45)}
    .fdate{font-size:11px;color:rgba(255,255,255,.2)}
    @media print{body{background:#0f0f1a;padding:0}.card{border-radius:0;max-width:100%}}
  </style>
</head>
<body>
  <div class="card">
    <div class="card-label">Reviewer.AI · Score Card</div>
    <div class="user">
      <div class="avatar">${initial}</div>
      <div>
        <div class="uname">@${escapeHtml(username || 'user')}</div>
        <div class="urole">${escapeHtml(profession || 'Software Engineer')}</div>
        <div class="lvl-badge">
          <span class="lvl-num">Lv. ${level}</span>
          <span class="lvl-label">${tier}</span>
        </div>
      </div>
    </div>
    <div class="stats">
      <div class="stat"><div class="sv sv-p">${totalInterviews}</div><div class="sl">Interviews</div></div>
      <div class="stat"><div class="sv sv-s">${avgScore || '—'}</div><div class="sl">Avg Score</div></div>
      <div class="stat"><div class="sv sv-t">${bestScore || '—'}</div><div class="sl">Best Score</div></div>
    </div>
    ${techRows ? `<div><div class="techs-label">Tech Stack</div>${techRows}</div>` : ''}
    <div class="footer">
      <span class="fbrand">reviewer.ai</span>
      <span class="fdate">${date}</span>
    </div>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}
