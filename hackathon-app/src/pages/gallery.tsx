import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Gallery() {
  const navigate = useNavigate()
  const [story, setStory] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!photo || !story.trim()) {
      return
    }

    setIsSubmitted(true)
    setStory('')
    setPhoto(null)
  }

  return (
    <div className="gallery-page" style={{ minHeight: '100vh', backgroundColor: '#051015' }}>
      <meta charSet="utf-8" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge,chrome=1" />
      <title>Gallery</title>
      <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
      <link rel="stylesheet" href="https://use.typekit.net/upz7xsh.css" />
      <link rel="stylesheet" href="assets/css/index.css" />
      <link rel="dns-prefetch" href="https://shadertoy.com" />

      <div id="app" style={{ minHeight: '100vh' }}>
        <header className="header">
          <nav className="header__menu">
            <a href="#" target="_blank">
              <div className="header__menu_item--lab">
                <span className="header__menu_lab_text">Resilient Echoes</span>
              </div>
            </a>
            <ul className="menu__items">
              <li className="menu__item">
                <button className="menu__audio" aria-label="Toggle Audio" />
              </li>
              <li className="menu__item menu__item--is-separator"><span>|</span></li>
              <li className="menu__item">
                <a href="/" className="menu__link">Home</a>
              </li>
              <li className="menu__item menu__item--is-gallery">
                <a href="/gallery" className="menu__link is-active">Gallery</a>
              </li>
              <li className="menu__item menu__item--is-exhibition">
                <button
                  type="button"
                  className="menu__link"
                  onClick={() => navigate('/exhibition')}
                  style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
                >
                  Exhibition
                </button>
              </li>
              <li className="menu__item">
                <a href="/about" className="menu__link">About</a>
              </li>
            </ul>
          </nav>
        </header>

        <canvas id="main-canvas" />
        <div id="shader-context">
          <h4 id="shader-title" />
          <div id="shader-desc" />
        </div>

        <div className="gallery is-visible" style={{ position: 'fixed', inset: 0, opacity: 1, pointerEvents: 'all' }}>
          <div className="gallery__wrapper">
            <header className="gallery__header">
              <h1 className="gallery__title">Share your story</h1>
            </header>
            <main className="gallery__inner" style={{ display: 'block' }}>
              <form
                onSubmit={handleSubmit}
                style={{
                  maxWidth: 900,
                  margin: '24px auto 0',
                  padding: '28px 32px',
                  background: 'rgba(8, 21, 28, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 12,
                  boxShadow: '0 24px 50px rgba(0, 0, 0, 0.35)',
                }}
              >
                <p style={{ marginTop: 0, marginBottom: 24, fontSize: '1rem', opacity: 0.9 }}>
                  Upload an image and tell your story.
                </p>

                <label htmlFor="story-photo" style={{ display: 'block', marginBottom: 10, fontSize: '0.95rem' }}>
                  Add a photo
                </label>
                <input
                  id="story-photo"
                  type="file"
                  accept="image/*"
                  required
                  onChange={(event) => {
                    const selected = event.target.files?.[0] ?? null
                    setPhoto(selected)
                    setIsSubmitted(false)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    marginBottom: 24,
                    padding: '12px 14px',
                    border: '1px dashed rgba(255, 255, 255, 0.38)',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: '#efefef',
                  }}
                />

                <label htmlFor="story-text" style={{ display: 'block', marginBottom: 10, fontSize: '0.95rem' }}>
                  Your story
                </label>
                <textarea
                  id="story-text"
                  value={story}
                  onChange={(event) => {
                    setStory(event.target.value)
                    setIsSubmitted(false)
                  }}
                  required
                  rows={10}
                  placeholder="Write your story here..."
                  style={{
                    width: '100%',
                    marginBottom: 24,
                    padding: '14px 16px',
                    resize: 'vertical',
                    minHeight: 240,
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    color: '#efefef',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.24)',
                    borderRadius: 10,
                    outline: 'none',
                  }}
                />

                <button
                  type="submit"
                  className="button-default"
                  style={{
                    minWidth: 180,
                    fontSize: '1rem',
                    padding: '0.55em 1.4em',
                    borderColor: '#efefef',
                  }}
                >
                  Submit
                </button>

                {isSubmitted && (
                  <p style={{ marginTop: 16, color: '#9ff0d0', fontSize: '0.95rem' }}>
                    Thank you. Your story has been submitted.
                  </p>
                )}
              </form>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}