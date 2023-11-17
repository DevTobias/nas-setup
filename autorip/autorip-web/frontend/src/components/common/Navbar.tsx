import { Link } from 'react-router-dom';

export const Navbar = () => {
  return (
    <div className='navbar w-full rounded-lg bg-base-200 shadow-sm'>
      <div className='flex-1'>
        <Link to='/' className='btn btn-ghost text-xl'>
          Autoripper
        </Link>
      </div>

      <ul className='menu menu-horizontal'>
        <li>
          <Link to='/'>Login</Link>
        </li>
      </ul>
    </div>
  );
};
