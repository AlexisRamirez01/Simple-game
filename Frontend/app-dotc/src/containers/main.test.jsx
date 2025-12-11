import React from 'react';
import { vi } from 'vitest';
import { createRoot } from 'react-dom/client';

vi.mock('./App/App.jsx', () => ({
  default: () => <div data-testid="app">Mock App</div>,
}));

vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => (
    <div data-testid="mock-browser">{children}</div>
  ),
}));

const mockRender = vi.fn();
vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: mockRender,
  })),
}));

describe('main.jsx (index principal)', () => {
  beforeEach(() => {
    const rootDiv = document.createElement('div');
    rootDiv.id = 'root';
    document.body.appendChild(rootDiv);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('debe crear el root y renderizar StrictMode con BrowserRouter y App', async () => {
    await import('./main.jsx');

    const rootElement = document.getElementById('root');
    expect(createRoot).toHaveBeenCalledWith(rootElement);

    expect(mockRender).toHaveBeenCalledTimes(1);

    const renderedElement = mockRender.mock.calls[0][0];

    expect(renderedElement.type).toBe(React.StrictMode);
    expect(renderedElement.props.children.type.name).toBe('BrowserRouter');
    expect(renderedElement.props.children.props.children.type.name).toBeDefined();
  });
});
