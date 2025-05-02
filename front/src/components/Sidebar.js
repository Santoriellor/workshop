import { Link, useLocation } from 'react-router-dom'

// Components
import CreateItemButton from './buttons/CreateItemButton'
import SvgLogout from './svgGenerics/SvgLogout'
import ThemeToggle from './buttons/ThemeToggle'
// Styles
import '../styles/Sidebar.css'
// Contexts
import { useAuth } from '../contexts/AuthContext'
// Utils
import { capitalizeFirstLetter } from '../utils/stringUtils'

function Sidebar() {
  const { authenticatedUser, logout, loadingAuth } = useAuth()
  const location = useLocation()

  const sidebarItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/report', label: 'Reports' },
    { path: '/owner', label: 'Owners' },
    { path: '/vehicle', label: 'Vehicles' },
    { path: '/invoices', label: 'Invoices' },
    { path: '/inventory', label: 'Inventory' },
    { path: '/tasktemplate', label: 'Task templates' },
  ]

  return (
    <nav className="sidebar">
      {authenticatedUser && (
        <>
          <div className="sidebar-header">
            <ThemeToggle />
            <img className="sidebar-logo" src="images/logo-garage.svg" alt="logo" />
            <span className="sidebar-company-name">The Garage</span>

            <p className="sidebar-welcome">
              <span className="sidebar-small">Logged in as : </span>
              {!loadingAuth ? capitalizeFirstLetter(authenticatedUser.username) : 'Loading...'}
            </p>
            <button className="btn logout" onClick={logout} title="Log Out">
              <p className="sidebar-logout">Log Out</p>
              <SvgLogout />
            </button>
          </div>
          <ul>
            {sidebarItems.map(({ path, label }) => (
              <li key={path}>
                <Link
                  to={path}
                  className={location.pathname === path ? 'active' : ''}
                  disabled={location.pathname === path}
                  aria-disabled={location.pathname === path}
                >
                  <span>{label}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="footer-bottom">
            <p>
              Santoriello <span>&copy;2025</span>
            </p>
          </div>
          {/* Floating create Button */}
          <CreateItemButton />
        </>
      )}
    </nav>
  )
}

export default Sidebar
