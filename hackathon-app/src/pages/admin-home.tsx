import { Link } from 'react-router-dom'
import './admin.css'

export default function AdminHome() {
  return (
    <div className="admin-shell">
      <header className="header">
        <nav className="header__menu">
          <Link to="/" aria-label="Resilient Echo home">
            <div className="header__menu_item--lab">
              <span className="header__menu_lab_text">Resilient Echo</span>
            </div>
          </Link>
          <ul className="menu__items">
            <li className="menu__item menu__item--is-separator"><span>|</span></li>
            <li className="menu__item"><Link to="/" className="menu__link">Home</Link></li>
            <li className="menu__item"><Link to="/admin" className="menu__link is-active">Admin</Link></li>
          </ul>
        </nav>
      </header>

      <main className="admin-shell__content">
      <div className="admin-panel">
        <h1 className="admin-title">Admin</h1>
        <p className="admin-subtitle">Choose a tool.</p>

        <div
          className="admin-card"
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <Link
            to="/admin/editor"
            style={{
              background: '#00ffad',
              color: '#051015',
              borderRadius: 8,
              padding: '10px 14px',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Editor
          </Link>
          <Link
            to="/admin/map-editor"
            style={{
              background: '#223b44',
              color: '#efefef',
              borderRadius: 8,
              padding: '10px 14px',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            MapEditor
          </Link>
        </div>
      </div>
      </main>
    </div>
  )
}
