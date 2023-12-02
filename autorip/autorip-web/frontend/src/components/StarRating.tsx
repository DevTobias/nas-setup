import { FC } from 'react';

interface Props {
  rating: number;
}

export const StarRating: FC<Props> = ({ rating }) => {
  const clamped = Math.min(Math.max(rating, 0), 10);

  return (
    <div className='rating rating-half rating-xs'>
      {[...Array(10)].map((_, i) => {
        return (
          <input
            key={i}
            type='radio'
            name='rating-10'
            className={'mask mask-star-2 bg-green-500 ' + (i % 2 === 0 ? 'mask-half-1' : 'mask-half-2')}
            defaultChecked={clamped >= i + 1}
            disabled
          />
        );
      })}
    </div>
  );
};
