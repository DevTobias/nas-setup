import { FC } from 'react';

import { StarRating } from '$components/StarRating';
import { Process } from '$pages/DashboardPage/data/processing.service';

interface Props {
  process: Process;
}

export const ProcessCard: FC<Props> = ({ process }) => {
  return (
    <div className='dashboard-section flex aspect-square w-[22rem] flex-col gap-5 p-6'>
      <div>
        <div className='flex items-center justify-between'>
          <h2 className='flex items-end gap-2 text-3xl font-bold'>
            <span>Processing</span>
            <span className='loading loading-dots' />
          </h2>
          <StarRating rating={5} />
        </div>
        <div className='flex justify-between'>
          <span>{process.name} (2023)</span>
          <span>{process.runtime} min</span>
        </div>
        <progress className='progress w-full' value='55' max='100' />
      </div>
      <img src={process.dis_url} alt='Shoes' className='mx-auto aspect-square h-3/4 w-3/4 animate-spin-slow' />
    </div>
  );
};
