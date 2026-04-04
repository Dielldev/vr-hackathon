import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/index'
import About from './pages/about'
import Gallery from './pages/gallery'
import Editor from './pages/editor'
import Exhibition from './pages/exb.jsx'
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
      <Route path="/exhibition" element={<Exhibition />} />
      <Route path="/exhibition/start" element={<Exhibition />} />
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