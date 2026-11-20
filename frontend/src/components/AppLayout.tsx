import { Link, NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../api/auth'

export default function AppLayout({ children }: { children?: React.ReactNode }) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout().catch(() => {})
    localStorage.removeItem('accessToken')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-teal-700 font-semibold text-lg tracking-tight">
          WellTrack
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <NavItem to="/">Dashboard</NavItem>
          <NavItem to="/history">History</NavItem>
          <NavItem to="/trends">Trends</NavItem>
          <NavItem to="/settings">Settings</NavItem>
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-red-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        isActive ? 'text-teal-700 font-medium' : 'text-gray-600 hover:text-gray-900'
      }
    >
      {children}
    </NavLink>
  )
}
