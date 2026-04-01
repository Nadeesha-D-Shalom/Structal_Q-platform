import { NavLink, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import './AppNavbar.css';

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 4.5h6l.7 1.5H19a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.3L9 4.5Z" />
      <rect x="9" y="3" width="6" height="3.5" rx="1.2" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    </svg>
  );
}

function DoubleCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m2.5 13.2 3.1 3.1 6.2-6.4" />
      <path d="m8.8 13.2 3.1 3.1L21.5 6.5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10.5h18M8 3v4M16 3v4" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 19h16" />
      <rect x="6" y="11" width="3" height="6" rx="1" />
      <rect x="11" y="8" width="3" height="9" rx="1" />
      <rect x="16" y="5" width="3" height="12" rx="1" />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9.2 9a2.8 2.8 0 1 1 4.7 2.1c-1 .9-1.9 1.5-1.9 3" />
      <circle cx="12" cy="17.2" r="1" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 17v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v2" />
      <path d="M14 12H3m0 0 3.5-3.5M3 12l3.5 3.5" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4a4 4 0 0 1 4 4v2.4c0 1.2.4 2.4 1.1 3.4l1.1 1.6H5.8l1.1-1.6c.7-1 1.1-2.2 1.1-3.4V8a4 4 0 0 1 4-4Z" />
      <path d="M9.5 18a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

const ICONS = {
  dashboard: GridIcon,
  subjects: ClipboardIcon,
  grades: StarIcon,
  publish: DoubleCheckIcon,
  timetable: CalendarIcon,
  submissions: FileIcon,
  evaluation: ChartIcon,
  concerns: QuestionIcon,
};

const NAV_ITEMS = {
  lecturer: [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'subjects', label: 'Subjects' },
    { key: 'grades', label: 'Grades & Marks' },
    { key: 'publish', label: 'Publish Marks' },
    { key: 'timetable', label: 'Timetable', to: '/view' },
    { key: 'submissions', label: 'Submissions' },
    { key: 'evaluation', label: 'Evaluation' },
  ],
  student: [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'submissions', label: 'Submissions' },
    { key: 'grades', label: 'Grades & Marks' },
    { key: 'timetable', label: 'Timetable', to: '/student-view' },
    { key: 'concerns', label: 'Concerns' },
  ],
};

const PROFILE_BY_ROLE = {
  lecturer: {
    name: 'Dr. Robert Fox',
    meta: '',
    avatarClassName: 'appNavbar__avatar appNavbar__avatar--lecturer',
  },
  student: {
    name: 'Nadeesha S.',
    meta: 'Student ID: 202401',
    avatarClassName: 'appNavbar__avatar appNavbar__avatar--student',
  },
};

function getStoredUser() {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getProfile(role) {
  const user = getStoredUser();
  const fallback = PROFILE_BY_ROLE[role] || PROFILE_BY_ROLE.student;
  const fullName =
    user?.full_name ||
    user?.fullName ||
    user?.name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
  const studentId = user?.student_id || user?.studentId || user?.id;

  return {
    name: fullName || fallback.name,
    meta: role === 'student' ? (studentId ? `Student ID: ${studentId}` : fallback.meta) : '',
    avatarClassName: fallback.avatarClassName,
  };
}

export default function AppNavbar({ role = 'student', activePage = 'Timetable' }) {
  const navigate = useNavigate();
  const safeRole = role === 'lecturer' ? 'lecturer' : 'student';
  const items = NAV_ITEMS[safeRole];
  const profile = getProfile(safeRole);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user_type');
    navigate('/view');
  }

  return (
    <header className="appNavbar">
      <div className="appNavbar__left">
        <div className="appNavbar__brand">
          <img src={logo} alt="StructalQ logo" className="appNavbar__logo" />
          <h1 className="appNavbar__brandText">
            Structal<span>Q</span>
          </h1>
        </div>

        <nav className="appNavbar__nav" aria-label={`${safeRole} navigation`}>
          {items.map((item) => {
            const Icon = ICONS[item.key];
            const isActive = activePage === item.label;
            const className = `appNavbar__navItem${isActive ? ' appNavbar__navItem--active' : ''}`;

            if (item.to) {
              return (
                <NavLink key={item.key} to={item.to} className={className}>
                  <Icon />
                  <span>{item.label}</span>
                </NavLink>
              );
            }

            return (
              <button key={item.key} type="button" className={className}>
                <Icon />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="appNavbar__right">
        <button type="button" className="appNavbar__circleBtn" onClick={handleLogout} aria-label="Log out">
          <LogoutIcon />
        </button>

        <button type="button" className="appNavbar__circleBtn" aria-label="Notifications">
          <BellIcon />
        </button>

        <div className="appNavbar__profile">
          <div className="appNavbar__profileText">
            <p className="appNavbar__profileName">{profile.name}</p>
            {profile.meta ? <p className="appNavbar__profileMeta">{profile.meta}</p> : null}
          </div>

          <div className={profile.avatarClassName}>
            <UserIcon />
          </div>
        </div>
      </div>
    </header>
  );
}
