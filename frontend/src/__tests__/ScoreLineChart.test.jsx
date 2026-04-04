import { render, screen } from '@testing-library/react';
import { ScoreLineChart } from '../views/Dashboard';

jest.mock('../context/AuthContext.jsx', () => ({ useAuth: () => ({ user: null }) }));
jest.mock('../components/Layout/Sidebar.jsx', () => () => null);
jest.mock('../components/ShareModal.jsx', () => () => null);

describe('ScoreLineChart', () => {
  test('shows placeholder with no interviews', () => {
    render(<ScoreLineChart interviews={[]} />);
    expect(screen.getByText(/Complete at least 2 interviews/)).toBeInTheDocument();
  });

  test('shows placeholder with only 1 scored interview', () => {
    render(<ScoreLineChart interviews={[{ id: 1, ai_score: 80, created_at: '2026-01-01' }]} />);
    expect(screen.getByText(/Complete at least 2 interviews/)).toBeInTheDocument();
  });

  test('shows placeholder when all scores are null', () => {
    render(<ScoreLineChart interviews={[
      { id: 1, ai_score: null, created_at: '2026-01-01' },
      { id: 2, ai_score: null, created_at: '2026-01-02' },
    ]} />);
    expect(screen.getByText(/Complete at least 2 interviews/)).toBeInTheDocument();
  });

  test('renders SVG chart when 2+ scored interviews exist', () => {
    const { container } = render(<ScoreLineChart interviews={[
      { id: 1, ai_score: 70, created_at: '2026-01-01' },
      { id: 2, ai_score: 85, created_at: '2026-01-02' },
    ]} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelector('polyline')).toBeInTheDocument();
  });

  test('renders one dot per scored interview', () => {
    const { container } = render(<ScoreLineChart interviews={[
      { id: 1, ai_score: 70, created_at: '2026-01-01' },
      { id: 2, ai_score: 85, created_at: '2026-01-02' },
      { id: 3, ai_score: 90, created_at: '2026-01-03' },
    ]} />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(3);
  });

  test('mixed null/scored: only counts scored interviews', () => {
    const { container } = render(<ScoreLineChart interviews={[
      { id: 1, ai_score: null, created_at: '2026-01-01' },
      { id: 2, ai_score: 70, created_at: '2026-01-02' },
      { id: 3, ai_score: 85, created_at: '2026-01-03' },
    ]} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(2);
  });
});
