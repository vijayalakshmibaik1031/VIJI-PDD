import AppShell from '../../components/AppShell';

export default function EmployeeLayout() {
  return (
    <AppShell
      title="Employee Portal"
      links={[
        { label: 'Raise Complaint', to: '/employee/raise' },
        { label: 'My Complaints (Private)', to: '/employee/private' },
        { label: 'Public Complaints', to: '/employee/public' },
        { label: 'Account', to: '/employee/account' },
      ]}
    />
  );
}

