import { getPageNumbers } from '../views/Dashboard';

jest.mock('../context/AuthContext.jsx', () => ({ useAuth: () => ({ user: null }) }));
jest.mock('../components/Layout/Sidebar.jsx', () => () => null);
jest.mock('../components/ShareModal.jsx', () => () => null);

describe('getPageNumbers', () => {
  test('returns all pages when total <= 7', () => {
    expect(getPageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPageNumbers(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  test('always includes first and last page for large totals', () => {
    const result = getPageNumbers(1, 20);
    expect(result).toContain(1);
    expect(result).toContain(20);
  });

  test('includes current page and its neighbours', () => {
    const result = getPageNumbers(10, 20);
    expect(result).toContain(9);
    expect(result).toContain(10);
    expect(result).toContain(11);
  });

  test('inserts ellipsis string for gaps', () => {
    const result = getPageNumbers(10, 20);
    expect(result).toContain('...');
  });

  test('no ellipsis when pages are contiguous', () => {
    const result = getPageNumbers(2, 4);
    expect(result).not.toContain('...');
  });

  test('returns [1] for total of 1', () => {
    expect(getPageNumbers(1, 1)).toEqual([1]);
  });

  test('result is sorted ascending', () => {
    const result = getPageNumbers(5, 15);
    const numbers = result.filter(p => p !== '...');
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
  });
});
