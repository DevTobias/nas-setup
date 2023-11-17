const processes = [
  {
    id: 1,
    name: 'John Wick: Chapter 4',
    description:
      'With the price on his head ever increasing, John Wick uncovers a path to defeating The High Table. But before he can earn his freedom, Wick must face off against a new enemy with powerful alliances across the globe and forces that turn old friends into foes.',
    poster_path: '/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg',
    release_date: '2023-03-22',
    runtime: 170,
    vote_average: 7.796,
  },
];

export const DashboardPage = () => {
  return (
    <>
      <h1 className='text-3xl font-bold'>Ripped Movies or TV Shows</h1>
      {processes.map((process) => {
        return (
          <div key={process.id} className='card w-96 bg-base-100 shadow-xl'>
            <figure>
              <img
                className='max-h-[70px]'
                src='http://assets.fanart.tv/fanart/movies/603692/moviebanner/john-wick-chapter-4-63f36bcab4cfb.jpg'
                alt='Shoes'
              />
            </figure>
            <div className='card-body'>
              <h2 className='card-title'>Shoes!</h2>
              <p>If a dog chews shoes whose shoes does he choose?</p>
              <div className='card-actions justify-end'>
                <button className='btn btn-primary'>Buy Now</button>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

// embed an tmdb image
// https://www.themoviedb.org/t/p/w1280/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg
