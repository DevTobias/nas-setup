import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { Router } from '$components/core/Router';

import '$styles/main.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router />
  </StrictMode>
);
