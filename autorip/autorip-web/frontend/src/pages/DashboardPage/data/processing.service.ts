export interface Process {
  id: number;
  name: string;
  dis_url: string;
  release_date: string;
  runtime: number;
  vote_average: number;
}

export const getCurrentProcesses = async (): Promise<Process[]> => {
  return [
    {
      id: 1,
      name: 'John Wick: Chapter 4',
      dis_url: 'http://assets.fanart.tv/fanart/movies/603692/moviedisc/john-wick-chapter-4-64071bb59a544.png',
      release_date: '2023-03-22',
      runtime: 170,
      vote_average: 7.796,
    },
    {
      id: 2,
      name: 'John Wick: Chapter 4',
      dis_url: 'http://assets.fanart.tv/fanart/movies/603692/moviedisc/john-wick-chapter-4-64071bb59a544.png',
      release_date: '2023-03-22',
      runtime: 170,
      vote_average: 7.796,
    },
    {
      id: 3,
      name: 'John Wick: Chapter 4',
      dis_url: 'http://assets.fanart.tv/fanart/movies/603692/moviedisc/john-wick-chapter-4-64071bb59a544.png',
      release_date: '2023-03-22',
      runtime: 170,
      vote_average: 7.796,
    },
    {
      id: 4,
      name: 'John Wick: Chapter 4',
      dis_url: 'http://assets.fanart.tv/fanart/movies/603692/moviedisc/john-wick-chapter-4-64071bb59a544.png',
      release_date: '2023-03-22',
      runtime: 170,
      vote_average: 7.796,
    },
    {
      id: 5,
      name: 'John Wick: Chapter 4',
      dis_url: 'http://assets.fanart.tv/fanart/movies/603692/moviedisc/john-wick-chapter-4-64071bb59a544.png',
      release_date: '2023-03-22',
      runtime: 170,
      vote_average: 7.796,
    },
    {
      id: 6,
      name: 'John Wick: Chapter 4',
      dis_url: 'http://assets.fanart.tv/fanart/movies/603692/moviedisc/john-wick-chapter-4-64071bb59a544.png',
      release_date: '2023-03-22',
      runtime: 170,
      vote_average: 7.796,
    },
    {
      id: 7,
      name: 'John Wick: Chapter 4',
      dis_url: 'http://assets.fanart.tv/fanart/movies/603692/moviedisc/john-wick-chapter-4-64071bb59a544.png',
      release_date: '2023-03-22',
      runtime: 170,
      vote_average: 7.796,
    },
  ];
};
