import { ProcessCard } from '$pages/DashboardPage/components/ProcessesSection/components/ProcessesCard';
import { useProcesses } from '$pages/DashboardPage/hooks/useProcesses';

export const ProcessesSection = () => {
  const { data } = useProcesses();

  if (!data) return;

  return (
    <div className='max-w-full'>
      <div className='flex max-w-full gap-8'>
        {data.map((process) => {
          return <ProcessCard key={process.id} process={process} />;
        })}
      </div>
    </div>
  );
};
