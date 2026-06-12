import AppShell from '../../components/AppShell';

export default function ManagerLayout() {
  return (
    <AppShell
      title="Manager Dashboard"
      links={[
        { label: 'Pending Complaints', to: '/manager/pending' },
        { label: 'Merge Area', to: '/manager/merge' },
        { label: 'Accepted / In Progress', to: '/manager/inprogress' },
        { label: 'Completed', to: '/manager/completed' },
        { label: 'All Complaints', to: '/manager/all' },
      ]}
    />
  );
}

