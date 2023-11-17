import { Outlet } from 'react-router-dom';

import { Navbar } from '$components/common/Navbar';

export const BaseLayout = () => {
  return (
    <div className='grid h-screen grid-rows-layout'>
      <header className='p-5'>
        <Navbar />
      </header>
      <main className='container mx-auto p-16'>
        <Outlet />
      </main>
    </div>
  );
};
