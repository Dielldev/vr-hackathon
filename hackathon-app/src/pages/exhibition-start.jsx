import { useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { Box3, Vector3 } from 'three'
import '../exb-new.css'

const START_WORLDS = [
  { id: 'hotel-hall', title: 'Castle', available: true, modelPath: '/assets/models/hotel_hall.glb' },
  {
    id: 'hotel-hall-prototype',
    title: 'World 2',
    available: true,
    modelPath: '/assets/models/hotel_hall.glb',
  },
  { id: 'art-gallery', title: 'World 3', available: true, modelPath: '/assets/models/art_gallery.glb' },
]

function PreviewModel({ modelPath }) {
  const { scene } = useGLTF(modelPath)
  const groupRef = useRef()

  const fittedScene = useMemo(() => {
    const clone = scene.clone(true)
    clone.updateMatrixWorld(true)

    const box = new Box3().setFromObject(clone)
    const size = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())
    const maxDimension = Math.max(size.x, size.y, size.z) || 1
    const scale = 2.2 / maxDimension

    clone.scale.setScalar(scale)
    clone.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale)

    return clone
  }, [scene])

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.45
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.08
    }
  })

  return (
    <group ref={groupRef}>
      <primitive object={fittedScene} />
    </group>
  )
}

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
              <Canvas camera={{ position: [0, 1.3, 4.4], fov: 42 }}>
                <ambientLight intensity={1.2} />
                <directionalLight position={[4, 5, 6]} intensity={1.4} />
                <spotLight position={[-5, 5, 5]} intensity={0.8} />
                <PreviewModel modelPath={world.modelPath} />
                <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
              </Canvas>
            </div>

            <h2>{world.title}</h2>
            <p>{world.available ? 'Available Now' : 'Coming Soon'}</p>

            {world.available ? (
              <div className="world-tile__actions">
                <Link className="world-tile__start" to={`/exhibition/world/${world.id}`}>
                  Enter World
                </Link>
                <Link 
                  className="world-tile__start world-tile__start--vr" 
                  to={`/exhibition/world/${world.id}?vr=true`}
                  title="Enter VR mode - requires a VR headset"
                >
                  🎮 VR Mode
                </Link>
              </div>
            ) : (
              <span className="world-tile__locked-pill">Not Available</span>
            )}
          </article>
        ))}
      </section>
    </main>
  )
}

useGLTF.preload('/assets/models/hotel_hall.glb')
useGLTF.preload('/assets/models/hotel_hall.glb')
useGLTF.preload('/assets/models/art_gallery.glb')
