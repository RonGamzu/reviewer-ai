import { render, screen } from '@testing-library/react';
import { CategoryChart } from '../views/Dashboard';

jest.mock('../context/AuthContext.jsx', () => ({ useAuth: () => ({ user: null }) }));
jest.mock('../components/Layout/Sidebar.jsx', () => () => null);
jest.mock('../components/ShareModal.jsx', () => () => null);

describe('CategoryChart', () => {
  test('shows placeholder with empty interviews', () => {
    render(<CategoryChart interviews={[]} />);
    expect(screen.getByText(/No category data yet/)).toBeInTheDocument();
  });

  test('shows placeholder when all scores are null', () => {
    render(<CategoryChart interviews={[{ id: 1, category: 'JavaScript', ai_score: null }]} />);
    expect(screen.getByText(/No category data yet/)).toBeInTheDocument();
  });

  test('renders SVG when data is present', () => {
    const { container } = render(<CategoryChart interviews={[
      { id: 1, category: 'JavaScript', ai_score: 80 },
    ]} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  test('calculates average score per category (80+60=70)', () => {
    const { container } = render(<CategoryChart interviews={[
      { id: 1, category: 'JavaScript', ai_score: 80 },
      { id: 2, category: 'JavaScript', ai_score: 60 },
    ]} />);
    expect(container.textContent).toContain('70');
  });

  test('renders a label for each distinct category', () => {
    const { container } = render(<CategoryChart interviews={[
      { id: 1, category: 'JavaScript', ai_score: 80 },
      { id: 2, category: 'Python', ai_score: 70 },
      { id: 3, category: 'SQL', ai_score: 60 },
    ]} />);
    const allText = container.textContent;
    expect(allText).toContain('JavaScript');
    expect(allText).toContain('Python');
    expect(allText).toContain('SQL');
  });

  test('sorts categories by average score descending', () => {
    const { container } = render(<CategoryChart interviews={[
      { id: 1, category: 'Python', ai_score: 60 },
      { id: 2, category: 'JavaScript', ai_score: 90 },
    ]} />);
    const allText = container.textContent;
    expect(allText.indexOf('JavaScript')).toBeLessThan(allText.indexOf('Python'));
  });

  test('truncates category names longer than 13 characters', () => {
    const { container } = render(<CategoryChart interviews={[
      { id: 1, category: 'VeryLongCategoryNameHere', ai_score: 75 },
    ]} />);
    expect(container.textContent).toContain('…');
  });
});
