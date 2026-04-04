import { render } from '@testing-library/react';
import { ScoreRing } from '../views/Dashboard';

jest.mock('../context/AuthContext.jsx', () => ({ useAuth: () => ({ user: null }) }));
jest.mock('../components/Layout/Sidebar.jsx', () => () => null);
jest.mock('../components/ShareModal.jsx', () => () => null);

describe('ScoreRing', () => {
  test('displays the score number', () => {
    const { container } = render(<ScoreRing score={75} />);
    expect(container).toHaveTextContent('75');
  });

  test('score >= 75 gets data-score-level="high"', () => {
    const { container } = render(<ScoreRing score={75} />);
    expect(container.querySelector('[data-score-level="high"]')).toBeInTheDocument();
  });

  test('score 50–74 gets data-score-level="medium"', () => {
    const { container } = render(<ScoreRing score={60} />);
    expect(container.querySelector('[data-score-level="medium"]')).toBeInTheDocument();
  });

  test('score < 50 gets data-score-level="low"', () => {
    const { container } = render(<ScoreRing score={40} />);
    expect(container.querySelector('[data-score-level="low"]')).toBeInTheDocument();
  });

  test('boundary: score 50 is medium', () => {
    const { container } = render(<ScoreRing score={50} />);
    expect(container.querySelector('[data-score-level="medium"]')).toBeInTheDocument();
  });

  test('boundary: score 74 is medium', () => {
    const { container } = render(<ScoreRing score={74} />);
    expect(container.querySelector('[data-score-level="medium"]')).toBeInTheDocument();
  });

  test('boundary: score 100 is high', () => {
    const { container } = render(<ScoreRing score={100} />);
    expect(container.querySelector('[data-score-level="high"]')).toBeInTheDocument();
  });

  test('renders with custom size', () => {
    const { container } = render(<ScoreRing score={80} size={100} />);
    expect(container.firstChild.style.width).toBe('100px');
    expect(container.firstChild.style.height).toBe('100px');
  });
});
