import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { DashboardPage } from '$pages/DashboardPage';
import { TestPage } from '$pages/TestPage';
import { routes } from '$routes';

export const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={routes.DASHBOARD} element={<DashboardPage />} />
        <Route path={routes.TEST} element={<TestPage />} />
      </Routes>
    </BrowserRouter>
  );
};
