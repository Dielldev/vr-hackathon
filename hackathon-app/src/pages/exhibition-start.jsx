import { Link } from 'react-router-dom'
import '../exb-new.css'

const START_WORLDS = [
  { id: 'hotel-hall', title: 'Castle', available: true },
  { id: 'hotel-hall-prototype', title: 'World 2', available: true },
  { id: 'art-gallery', title: 'World 3', available: true },
]

export default function ExhibitionStart() {
  return (
    <main className="world-select" aria-label="Exhibition world selector">
      <div className="world-select__bg" aria-hidden="true" />

      <header className="header">
        <nav className="header__menu">
          <Link to="/" aria-label="Resilient Echoes home">
            <div className="header__menu_item--lab">
              <span className="header__menu_lab_text">Resilient Echoes</span>
            </div>
          </Link>

          <ul className="menu__items">
            <li className="menu__item menu__item--is-separator"><span>|</span></li>
            <li className="menu__item">
              <Link to="/" className="menu__link">Home</Link>
            </li>
            <li className="menu__item menu__item--is-gallery">
              <Link to="/gallery" className="menu__link">Gallery</Link>
            </li>
            <li className="menu__item menu__item--is-editor">
              <Link to="/editor" className="menu__link">Editor</Link>
            </li>
            <li className="menu__item menu__item--is-exhibition">
              <Link to="/exhibition" className="menu__link is-active">Exhibition</Link>
            </li>
            <li className="menu__item">
              <Link to="/about" className="menu__link">About</Link>
            </li>
          </ul>
        </nav>
      </header>

      <section className="world-select__hero">
        <h1>Choose A World</h1>
        <p className="world-select__subtext">
          Clean starter view. World logic is removed.
        </p>
      </section>

      <section className="world-select__grid" role="list" aria-label="Available worlds">
        {START_WORLDS.map((world) => (
          <article
            className={`world-tile ${world.available ? 'world-tile--available' : 'world-tile--locked'}`}
            key={world.id}
            role="listitem"
          >
            <div className="world-tile__preview" aria-hidden="true">
              <span>No World Loaded</span>
            </div>

            <h2>{world.title}</h2>
            <p>{world.available ? 'Available Now' : 'Coming Soon'}</p>

            {world.available ? (
              <Link className="world-tile__start" to={`/exhibition/world/${world.id}`}>
                Enter World
              </Link>
            ) : (
              <span className="world-tile__locked-pill">Not Available</span>
            )}
          </article>
        ))}
      </section>
    </main>
  )
}
