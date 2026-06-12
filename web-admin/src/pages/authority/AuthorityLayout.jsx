import AppShell from '../../components/AppShell';

export default function AuthorityLayout() {
  return (
    <AppShell
      title="Authority Dashboard"
      links={[
        { label: 'Overview', to: '/authority/overview' },
        { label: 'All Complaints', to: '/authority/all' },
        { label: 'Escalated / High Priority', to: '/authority/escalated' },
      ]}
    />
  );
}

