import { Outlet } from 'react-router-dom';

import { Navbar } from '$components/common/Navbar';

export const BaseLayout = () => {
  return (
    <div className='grid h-screen grid-rows-layout'>
      <header className='px-16 pb-8 pt-16'>
        <Navbar />
      </header>
      <main className='w-full px-16'>
        <Outlet />
      </main>
    </div>
  );
};
