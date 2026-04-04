// parseTechStack is a pure utility exported from db.js.
// sqlite3 is mocked globally via moduleNameMapper so db.js can be imported
// without opening a real database file.
import { parseTechStack } from '../db.js';

describe('parseTechStack', () => {
  test('returns [] for null input', () => {
    expect(parseTechStack(null)).toEqual([]);
  });

  test('returns [] for undefined input', () => {
    expect(parseTechStack(undefined)).toEqual([]);
  });

  test('returns [] for empty JSON array string', () => {
    expect(parseTechStack('[]')).toEqual([]);
  });

  test('returns [] for invalid JSON', () => {
    expect(parseTechStack('not-json')).toEqual([]);
  });

  test('returns object array unchanged', () => {
    const input = JSON.stringify([{ name: 'React', level: 'advanced' }]);
    expect(parseTechStack(input)).toEqual([{ name: 'React', level: 'advanced' }]);
  });

  test('normalises plain string entries to {name, level: "intermediate"}', () => {
    const input = JSON.stringify(['React', 'Node.js']);
    expect(parseTechStack(input)).toEqual([
      { name: 'React', level: 'intermediate' },
      { name: 'Node.js', level: 'intermediate' },
    ]);
  });

  test('handles mixed string and object entries', () => {
    const input = JSON.stringify(['React', { name: 'Python', level: 'expert' }]);
    expect(parseTechStack(input)).toEqual([
      { name: 'React', level: 'intermediate' },
      { name: 'Python', level: 'expert' },
    ]);
  });

  test('preserves all levels from object entries', () => {
    const input = JSON.stringify([
      { name: 'Go', level: 'beginner' },
      { name: 'Rust', level: 'expert' },
    ]);
    const result = parseTechStack(input);
    expect(result[0].level).toBe('beginner');
    expect(result[1].level).toBe('expert');
  });
});
