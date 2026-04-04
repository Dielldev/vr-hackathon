import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls, TransformControls, useGLTF } from '@react-three/drei'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Box3, Group, MathUtils, Vector3 } from 'three'
import {
  getAllWorldTransforms,
  resetWorldTransform,
  updateWorldTransform,
} from '../utils/worldTransforms.js'
import './admin.css'

const WORLD_OPTIONS = [
  { id: 'hotel-hall', label: 'World 1 - Hotel Hall', route: '/exhibition/world/hotel-hall' },
  {
    id: 'hotel-hall-prototype',
    label: 'World 2 - Eiffel Prototype',
    route: '/exhibition/world/hotel-hall-prototype',
  },
  { id: 'art-gallery', label: 'World 3 - Art Gallery', route: '/exhibition/world/art-gallery' },
]

const WORLD_MODEL_PATHS: Record<string, string> = {
  'hotel-hall': '/assets/models/hotel_hall.glb',
  'hotel-hall-prototype': '/assets/models/eiffel_tower_paris_france.glb',
  'art-gallery': '/assets/models/art_gallery.glb',
}

type GizmoMode = 'translate' | 'rotate'
type TransformPatch = Record<string, number>

type PreviewSceneHandle = {
  getCurrentPatch: () => TransformPatch | null
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function buttonStyle(background: string, color: string) {
  return {
    background,
    color,
    border: 'none',
    borderRadius: 8,
    padding: '10px 14px',
    fontWeight: 700,
    cursor: 'pointer',
  } as const
}

const PreviewScene = forwardRef<PreviewSceneHandle, {
  worldId: string
  transform: TransformPatch
  mode: GizmoMode
  onPatch: (patch: TransformPatch) => void
  onDraftChange: (patch: TransformPatch) => void
}>(({ worldId, transform, mode, onPatch, onDraftChange }, ref) => {
  const modelPath = WORLD_MODEL_PATHS[worldId]
  const { scene } = useGLTF(modelPath)
  const groupRef = useRef<Group>(null)
   const controlsRef = useRef<any>(null)
  const orbitRef = useRef<any>(null)
  const draggingRef = useRef(false)
  const isPrototype = worldId === 'hotel-hall-prototype'

  const fittedPrototype = useMemo(() => {
    if (!isPrototype) {
      return null
    }

    const targetSize = transform.targetSize ?? 28
    const groundY = transform.groundY ?? 0

    const clone = scene.clone(true)
    clone.updateMatrixWorld(true)

    const box = new Box3().setFromObject(clone)
    const size = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())
    const maxDimension = Math.max(size.x, size.y, size.z) || 1
    const scale = targetSize / maxDimension

    clone.scale.setScalar(scale)
    clone.position.set(
      -center.x * scale,
      groundY - box.min.y * scale,
      -center.z * scale,
    )

    return clone
  }, [isPrototype, scene, transform.targetSize, transform.groundY])

  const position = isPrototype
    ? [transform.offsetX ?? -2.4, transform.offsetY ?? 1.2, transform.offsetZ ?? 0.8]
    : [transform.posX ?? 0, transform.posY ?? 0, transform.posZ ?? 0]

  const rotationY = MathUtils.degToRad(transform.rotationYDeg ?? (isPrototype ? 180 : 0))
  const scaleValue = isPrototype ? 1 : transform.scale ?? 1

  const getTransformPatchFromGizmo = (): TransformPatch | null => {
     const target = controlsRef.current?.object || groupRef.current
     if (!target) {
      return null
    }

    if (isPrototype) {
       return {
         offsetX: round(target.position.x),
         offsetY: round(target.position.y),
         offsetZ: round(target.position.z),
         rotationYDeg: round(MathUtils.radToDeg(target.rotation.y), 1),
      }
    }

    return {
       posX: round(target.position.x),
       posY: round(target.position.y),
       posZ: round(target.position.z),
       rotationYDeg: round(MathUtils.radToDeg(target.rotation.y), 1),
       scale: round(target.scale.x, 3),
    }
  }

  const commitTransformFromGizmo = () => {
    const patch = getTransformPatchFromGizmo()
    if (!patch) {
      return
    }

    onDraftChange(patch)
    onPatch(patch)
  }

  useImperativeHandle(ref, () => ({
    getCurrentPatch: getTransformPatchFromGizmo,
  }))

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight intensity={1.4} position={[8, 10, 6]} />
      <Environment preset="city" />

      <gridHelper args={[80, 80, '#334155', '#1e293b']} position={[0, 0, 0]} />

      <TransformControls
         ref={controlsRef}
        mode={mode}
        size={0.9}
        onMouseDown={() => {
          draggingRef.current = true
          if (orbitRef.current) {
            orbitRef.current.enabled = false
          }
        }}
        onMouseUp={() => {
          draggingRef.current = false
          if (orbitRef.current) {
            orbitRef.current.enabled = true
          }
          commitTransformFromGizmo()
        }}
      >
        <group ref={groupRef} position={position as [number, number, number]} rotation={[0, rotationY, 0]}>
          {isPrototype ? (
            <primitive object={fittedPrototype ?? scene} />
          ) : (
            <primitive object={scene} scale={scaleValue} />
          )}
        </group>
      </TransformControls>

      <OrbitControls ref={orbitRef} makeDefault enableDamping />
    </>
  )
})

function SizeButtons({
  worldId,
  transform,
  onPatch,
}: {
  worldId: string
  transform: Record<string, number>
  onPatch: (patch: Record<string, number>) => void
}) {
  const isPrototype = worldId === 'hotel-hall-prototype'

  if (isPrototype) {
    const value = transform.targetSize ?? 28
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => onPatch({ targetSize: clamp(round(value - 1, 2), 2, 120) })}
          style={buttonStyle('#334155', '#e2e8f0')}
        >
          Smaller
        </button>
        <button
          type="button"
          onClick={() => onPatch({ targetSize: clamp(round(value + 1, 2), 2, 120) })}
          style={buttonStyle('#334155', '#e2e8f0')}
        >
          Bigger
        </button>
        <span style={{ fontSize: 12, opacity: 0.78 }}>Target Size: {round(value, 2)}</span>
      </div>
    )
  }

  const value = transform.scale ?? 1
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={() => onPatch({ scale: clamp(round(value - 0.1, 3), 0.05, 15) })}
        style={buttonStyle('#334155', '#e2e8f0')}
      >
        Smaller
      </button>
      <button
        type="button"
        onClick={() => onPatch({ scale: clamp(round(value + 0.1, 3), 0.05, 15) })}
        style={buttonStyle('#334155', '#e2e8f0')}
      >
        Bigger
      </button>
      <span style={{ fontSize: 12, opacity: 0.78 }}>Scale: {round(value, 3)}</span>
    </div>
  )
}

export default function AdminPage() {
  const [allTransforms, setAllTransforms] = useState(() => getAllWorldTransforms())
  const [selectedWorldId, setSelectedWorldId] = useState('hotel-hall-prototype')
  const [mode, setMode] = useState<GizmoMode>('translate')
  const [previewTransform, setPreviewTransform] = useState<TransformPatch>(() => {
    const all = getAllWorldTransforms()
    return all['hotel-hall-prototype'] || {}
  })
  const previewRef = useRef<PreviewSceneHandle | null>(null)

  const selectedWorld = useMemo(
    () => WORLD_OPTIONS.find((world) => world.id === selectedWorldId) || WORLD_OPTIONS[0],
    [selectedWorldId],
  )

  const activeTransform = allTransforms[selectedWorld.id] || {}

  useEffect(() => {
    setPreviewTransform(allTransforms[selectedWorld.id] || {})
  }, [selectedWorld.id, allTransforms])

  const patchTransform = (patch: Record<string, number>) => {
    setPreviewTransform((prev: TransformPatch) => ({
      ...prev,
      ...patch,
    }))
    setAllTransforms((prev: Record<string, TransformPatch>) => ({
      ...prev,
      [selectedWorld.id]: {
        ...(prev[selectedWorld.id] || {}),
        ...patch,
      },
    }))
  }

  const saveCurrent = () => {
    const livePatch = previewRef.current?.getCurrentPatch() || {}
    const merged = {
      ...(previewTransform || {}),
      ...livePatch,
    }
    const saved = updateWorldTransform(selectedWorld.id, merged)
    setAllTransforms((prev: Record<string, TransformPatch>) => ({
      ...prev,
      [selectedWorld.id]: saved,
    }))
    setPreviewTransform(saved)
  }

  const resetCurrent = () => {
    const reset = resetWorldTransform(selectedWorld.id)
    setAllTransforms((prev: Record<string, TransformPatch>) => ({
      ...prev,
      [selectedWorld.id]: reset,
    }))
    setPreviewTransform(reset)
  }

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

      <main className="admin-shell__content admin-scroll">
      <div className="admin-panel">
        <h1 className="admin-title">MapEditor</h1>
        <p className="admin-subtitle">
          Mouse editor: drag in preview to move model, switch to rotate mode to spin it, then save.
        </p>
        <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link
            to="/admin"
            style={{
              background: '#182931',
              color: '#e2e8f0',
              borderRadius: 8,
              padding: '10px 14px',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Admin Home
          </Link>
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
          <span
            style={{
              background: '#223b44',
              color: '#efefef',
              borderRadius: 8,
              padding: '10px 14px',
              fontWeight: 700,
            }}
          >
            MapEditor
          </span>
        </div>

        <div
          className="admin-card"
          style={{
            display: 'grid',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ display: 'grid', gap: 6, minWidth: 260 }}>
              <span style={{ fontSize: 12, opacity: 0.8 }}>World</span>
              <select
                value={selectedWorld.id}
                onChange={(e) => setSelectedWorldId(e.target.value)}
                style={{
                  background: '#182931',
                  border: '1px solid #334155',
                  color: '#e2e8f0',
                  borderRadius: 8,
                  padding: '10px 12px',
                }}
              >
                {WORLD_OPTIONS.map((world) => (
                  <option key={world.id} value={world.id}>
                    {world.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => setMode('translate')}
              style={buttonStyle(mode === 'translate' ? '#22d3ee' : '#334155', mode === 'translate' ? '#042f3a' : '#e2e8f0')}
            >
              Move
            </button>
            <button
              type="button"
              onClick={() => setMode('rotate')}
              style={buttonStyle(mode === 'rotate' ? '#22d3ee' : '#334155', mode === 'rotate' ? '#042f3a' : '#e2e8f0')}
            >
              Rotate
            </button>
          </div>

          <div
            style={{
              height: 460,
              borderRadius: 12,
              overflow: 'hidden',
              border: '1px solid #334155',
              background: '#051015',
            }}
          >
            <Canvas camera={{ position: [8, 6, 10], fov: 50 }}>
              <PreviewScene
                ref={previewRef}
                key={`${selectedWorld.id}-${activeTransform.targetSize ?? 0}-${activeTransform.groundY ?? 0}`}
                worldId={selectedWorld.id}
                transform={activeTransform}
                mode={mode}
                onPatch={patchTransform}
                onDraftChange={(patch) => {
                  setPreviewTransform((prev) => ({
                    ...prev,
                    ...patch,
                  }))
                }}
              />
            </Canvas>
          </div>

          <SizeButtons worldId={selectedWorld.id} transform={activeTransform} onPatch={patchTransform} />

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" onClick={saveCurrent} style={buttonStyle('#22c55e', '#04110a')}>
              Save
            </button>
            <button type="button" onClick={resetCurrent} style={buttonStyle('#f59e0b', '#1f1302')}>
              Reset
            </button>
            <Link
              to={selectedWorld.route}
              style={{
                background: '#223b44',
                color: '#efefef',
                borderRadius: 8,
                padding: '10px 14px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Open World
            </Link>
            <Link
              to="/"
              style={{
                background: '#182931',
                color: '#e2e8f0',
                borderRadius: 8,
                padding: '10px 14px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Back Home
            </Link>
          </div>

          <p style={{ margin: 0, opacity: 0.72, fontSize: 13 }}>
            Tip: drag gizmo arrows to move. Save, then open the world route to see it live.
          </p>
        </div>
      </div>
      </main>
    </div>
  )
}

useGLTF.preload('/assets/models/hotel_hall.glb')
useGLTF.preload('/assets/models/eiffel_tower_paris_france.glb')
useGLTF.preload('/assets/models/art_gallery.glb')
