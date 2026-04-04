import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Home from './pages/index'
import About from './pages/about'
import Gallery from './pages/gallery'
import Editor from './pages/editor'
import Exhibition from './pages/exb.jsx'
import ExhibitionWorld2 from './pages/exb-world2.jsx'
import ExhibitionWorld3 from './pages/exb-world3.jsx'
import ExhibitionStart from './pages/exhibition-start.jsx'
import Robots from './pages/robots.txt'
import './assets/css/index.css'

function AppRoutes() {
  const location = useLocation()

  useEffect(() => {
    if (location.pathname.startsWith('/exhibition')) {
      return
    }

    // The legacy experience is bundled in this script and expects the page DOM.
    void import('./assets/js/index.js')
  }, [location.pathname])

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/editor" element={<Editor />} />
      <Route path="/exhibition" element={<ExhibitionStart />} />
      <Route path="/exhibition/world/hotel-hall-prototype" element={<ExhibitionWorld2 />} />
      <Route path="/exhibition/world/art-gallery" element={<ExhibitionWorld3 />} />
      <Route path="/exhibition/world/:worldId" element={<Exhibition />} />
      <Route path="/exhibition/world" element={<Exhibition />} />
      <Route path="/exhibition/start" element={<Navigate to="/exhibition" replace />} />
      <Route path="/robots.txt" element={<Robots />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}