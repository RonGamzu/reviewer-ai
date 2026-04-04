import { stripMarkdown } from '../index.js';

describe('stripMarkdown', () => {
  test('returns plain text unchanged', () => {
    expect(stripMarkdown('hello world')).toBe('hello world');
  });

  test('strips leading ```json fence', () => {
    const input = '```json\n{"score": 85}';
    expect(stripMarkdown(input)).toBe('{"score": 85}');
  });

  test('strips trailing ``` fence', () => {
    const input = '{"score": 85}\n```';
    expect(stripMarkdown(input)).toBe('{"score": 85}');
  });

  test('strips both opening and closing fences', () => {
    const input = '```json\n{"score": 85}\n```';
    expect(stripMarkdown(input)).toBe('{"score": 85}');
  });

  test('strips plain ``` without language tag', () => {
    const input = '```\n{"score": 85}\n```';
    expect(stripMarkdown(input)).toBe('{"score": 85}');
  });

  test('trims leading and trailing whitespace', () => {
    expect(stripMarkdown('  {"score": 85}  ')).toBe('{"score": 85}');
  });

  test('produces valid JSON after stripping Gemini code fences', () => {
    const raw = '```json\n{"title": "Q", "category": "React", "difficulty": "Mid"}\n```';
    const stripped = stripMarkdown(raw);
    expect(() => JSON.parse(stripped)).not.toThrow();
    expect(JSON.parse(stripped).title).toBe('Q');
  });
});
