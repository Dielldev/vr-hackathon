import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Home from './pages/index'
import About from './pages/about'
import Gallery from './pages/gallery'
import Editor from './pages/editor'
import Exhibition from './pages/exb.jsx'
import Robots from './pages/robots.txt'
import './assets/css/index.css'

function AppRoutes() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleInternalNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) {
        return
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }

      const target = event.target as HTMLElement | null
      const link = target?.closest('.menu__link[rel="internal"][href^="/exhibition"]') as HTMLAnchorElement | null
      if (!link) {
        return
      }

      const href = link.getAttribute('href')
      if (!href || href.startsWith('#')) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      ;(event as MouseEvent & { stopImmediatePropagation?: () => void }).stopImmediatePropagation?.()
      navigate(href)
    }

    document.addEventListener('click', handleInternalNavigation, true)
    return () => {
      document.removeEventListener('click', handleInternalNavigation, true)
    }
  }, [navigate])

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