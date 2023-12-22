import useSWR from 'swr';

import { getCurrentProcesses } from '$pages/DashboardPage/data/processing.service';

export const useProcesses = () => {
  return useSWR('/api/processes', getCurrentProcesses);
};
