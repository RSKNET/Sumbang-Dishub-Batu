import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import Footer from './Footer';

global.IS_REACT_ACT_ENVIRONMENT = true;

test('renders footer content', () => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = createRoot(container);
  act(() => {
    root.render(<Footer />);
  });

  expect(container.textContent).toContain('SUMBANG');
  expect(container.textContent).toContain('Sarana Prasarana Untuk Masyarakat Batu Gampang');

  // Clean up
  act(() => {
    root.unmount();
  });
  document.body.removeChild(container);
});
