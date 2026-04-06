import AppNavbar from './AppNavbar';

export default function RolePageLayout({ role = 'student', activePage = 'Timetable', children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fb' }}>
      <AppNavbar role={role} activePage={activePage} />
      <main>{children}</main>
    </div>
  );
}
