import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock canvas-confetti in test environment
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock HTMLCanvasElement getContext
HTMLCanvasElement.prototype.getContext = vi.fn();
