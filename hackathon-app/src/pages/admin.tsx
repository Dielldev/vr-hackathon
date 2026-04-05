import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls, TransformControls, useGLTF } from '@react-three/drei'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Box3, Group, MathUtils, Vector3 } from 'three'
import { hotelHallPrototypeWorld } from './worlds/hotelHallPrototypeWorld.js'
import {
  getAllWorldTransforms,
  resetWorldTransform,
  updateWorldTransform,
} from '../utils/worldTransforms.js'
import {
  mergeExhibitsWithTransforms,
  resetWorldExhibitTransforms,
  updateWorldExhibitTransforms,
} from '../utils/exhibitTransforms.js'
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
  'hotel-hall-prototype': '/assets/models/dae_diorama_-_grandmas_house.glb',
  'art-gallery': '/assets/models/art_gallery.glb',
}

type GizmoMode = 'translate' | 'rotate'
type EditTarget = 'world' | 'object'
type TransformPatch = Record<string, number>

type WorldExhibit = {
  id: string
  label: string
  color: string
  position: [number, number, number]
  intro?: string
  storyTitle?: string
  story?: string
  messageTitle?: string
  message?: string
  nodeId?: string
}

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

function getBaseWorldExhibits(worldId: string): WorldExhibit[] {
  if (worldId === 'hotel-hall-prototype') {
    const source = hotelHallPrototypeWorld.exhibits || []
    const output: WorldExhibit[] = []

    for (const exhibit of source) {
      output.push({
        ...exhibit,
        position: [exhibit.position[0], exhibit.position[1], exhibit.position[2]],
      })
    }

    return output
  }

  return []
}

function getEditableWorldExhibits(worldId: string): WorldExhibit[] {
  const base = getBaseWorldExhibits(worldId)
  return mergeExhibitsWithTransforms(worldId, base)
}

const PreviewScene = forwardRef<PreviewSceneHandle, {
  worldId: string
  transform: TransformPatch
  mode: GizmoMode
  editTarget: EditTarget
  exhibits: WorldExhibit[]
  selectedExhibitId: string | null
  onPatch: (patch: TransformPatch) => void
  onDraftChange: (patch: TransformPatch) => void
  onSelectExhibit: (exhibitId: string) => void
  onExhibitPatch: (exhibitId: string, position: [number, number, number]) => void
}>(({
  worldId,
  transform,
  mode,
  editTarget,
  exhibits,
  selectedExhibitId,
  onPatch,
  onDraftChange,
  onSelectExhibit,
  onExhibitPatch,
}, ref) => {
  const modelPath = WORLD_MODEL_PATHS[worldId]
  const { scene } = useGLTF(modelPath)
  const worldGroupRef = useRef<Group>(null)
  const selectedExhibitGroupRef = useRef<Group>(null)
  const worldControlsRef = useRef<any>(null)
  const exhibitControlsRef = useRef<any>(null)
  const orbitRef = useRef<any>(null)
  const isPrototype = worldId === 'hotel-hall-prototype'

  const selectedExhibit = useMemo(() => {
    for (const exhibit of exhibits) {
      if (exhibit.id === selectedExhibitId) {
        return exhibit
      }
    }

    return null
  }, [exhibits, selectedExhibitId])

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

  const getWorldTransformPatchFromGizmo = (): TransformPatch | null => {
    const target = worldControlsRef.current?.object || worldGroupRef.current
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

  const commitWorldTransformFromGizmo = () => {
    const patch = getWorldTransformPatchFromGizmo()
    if (!patch) {
      return
    }

    onDraftChange(patch)
    onPatch(patch)
  }

  const commitExhibitTransformFromGizmo = () => {
    if (!selectedExhibit) {
      return
    }

    const target = exhibitControlsRef.current?.object || selectedExhibitGroupRef.current
    if (!target) {
      return
    }

    onExhibitPatch(selectedExhibit.id, [
      round(target.position.x, 2),
      round(target.position.y, 2),
      round(target.position.z, 2),
    ])
  }

  useImperativeHandle(ref, () => ({
    getCurrentPatch: getWorldTransformPatchFromGizmo,
  }))

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight intensity={1.4} position={[8, 10, 6]} />
      <Environment preset="city" />

      <gridHelper args={[80, 80, '#334155', '#1e293b']} position={[0, 0, 0]} />

      {editTarget === 'world' ? (
        <TransformControls
          ref={worldControlsRef}
          mode={mode}
          size={0.9}
          onMouseDown={() => {
            if (orbitRef.current) {
              orbitRef.current.enabled = false
            }
          }}
          onMouseUp={() => {
            if (orbitRef.current) {
              orbitRef.current.enabled = true
            }
            commitWorldTransformFromGizmo()
          }}
        >
          <group ref={worldGroupRef} position={position as [number, number, number]} rotation={[0, rotationY, 0]}>
            {isPrototype ? (
              <primitive object={fittedPrototype ?? scene} />
            ) : (
              <primitive object={scene} scale={scaleValue} />
            )}
          </group>
        </TransformControls>
      ) : (
        <group ref={worldGroupRef} position={position as [number, number, number]} rotation={[0, rotationY, 0]}>
          {isPrototype ? (
            <primitive object={fittedPrototype ?? scene} />
          ) : (
            <primitive object={scene} scale={scaleValue} />
          )}
        </group>
      )}

      {exhibits.map((exhibit) => {
        const isSelected = exhibit.id === selectedExhibitId
        const baseMesh = (
          <mesh
            onClick={(e) => {
              e.stopPropagation()
              onSelectExhibit(exhibit.id)
            }}
          >
            <sphereGeometry args={[isSelected ? 0.28 : 0.22, 24, 24]} />
            <meshStandardMaterial
              color={exhibit.color}
              emissive={exhibit.color}
              emissiveIntensity={isSelected ? 2.8 : 1.8}
              toneMapped={false}
            />
          </mesh>
        )

        if (editTarget === 'object' && isSelected) {
          return (
            <TransformControls
              key={exhibit.id}
              ref={exhibitControlsRef}
              mode="translate"
              size={0.8}
              onMouseDown={() => {
                if (orbitRef.current) {
                  orbitRef.current.enabled = false
                }
              }}
              onMouseUp={() => {
                if (orbitRef.current) {
                  orbitRef.current.enabled = true
                }
                commitExhibitTransformFromGizmo()
              }}
            >
              <group ref={selectedExhibitGroupRef} position={exhibit.position}>
                {baseMesh}
              </group>
            </TransformControls>
          )
        }

        return (
          <group key={exhibit.id} position={exhibit.position}>
            {baseMesh}
          </group>
        )
      })}

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
  const location = useLocation()
  const [allTransforms, setAllTransforms] = useState(() => getAllWorldTransforms())
  const [selectedWorldId, setSelectedWorldId] = useState('hotel-hall-prototype')
  const [mode, setMode] = useState<GizmoMode>('translate')
  const [editTarget, setEditTarget] = useState<EditTarget>('world')
  const [previewTransform, setPreviewTransform] = useState<TransformPatch>(() => {
    const all = getAllWorldTransforms()
    return all['hotel-hall-prototype'] || {}
  })
  const [editableExhibits, setEditableExhibits] = useState<WorldExhibit[]>(() => getEditableWorldExhibits('hotel-hall-prototype'))
  const [selectedExhibitId, setSelectedExhibitId] = useState<string | null>(() => {
    const initial = getEditableWorldExhibits('hotel-hall-prototype')
    return initial[0]?.id || null
  })

  const previewRef = useRef<PreviewSceneHandle | null>(null)

  const selectedWorld = useMemo(
    () => WORLD_OPTIONS.find((world) => world.id === selectedWorldId) || WORLD_OPTIONS[0],
    [selectedWorldId],
  )

  const activeTransform = allTransforms[selectedWorld.id] || {}
  const hasExhibits = editableExhibits.length > 0

  const selectedExhibit = useMemo(() => {
    for (const exhibit of editableExhibits) {
      if (exhibit.id === selectedExhibitId) {
        return exhibit
      }
    }

    return null
  }, [editableExhibits, selectedExhibitId])

  const selectedPositionLine = useMemo(() => {
    if (!selectedExhibit) {
      return ''
    }

    return `position: [${round(selectedExhibit.position[0], 2)}, ${round(selectedExhibit.position[1], 2)}, ${round(selectedExhibit.position[2], 2)}],`
  }, [selectedExhibit])

  useEffect(() => {
    setPreviewTransform(allTransforms[selectedWorld.id] || {})
  }, [selectedWorld.id, allTransforms])

  useEffect(() => {
    const nextExhibits = getEditableWorldExhibits(selectedWorld.id)
    setEditableExhibits(nextExhibits)

    if (nextExhibits.length === 0) {
      setSelectedExhibitId(null)
      if (editTarget === 'object') {
        setEditTarget('world')
      }
      return
    }

    let stillExists = false
    for (const exhibit of nextExhibits) {
      if (exhibit.id === selectedExhibitId) {
        stillExists = true
        break
      }
    }

    if (!stillExists) {
      setSelectedExhibitId(nextExhibits[0].id)
    }
  }, [selectedWorld.id])

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

  const patchExhibitPosition = (exhibitId: string, position: [number, number, number]) => {
    setEditableExhibits((prev) => {
      const next = [...prev]

      for (let index = 0; index < next.length; index += 1) {
        if (next[index].id !== exhibitId) {
          continue
        }

        next[index] = {
          ...next[index],
          position,
        }
        break
      }

      return next
    })
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

    if (editableExhibits.length > 0) {
      updateWorldExhibitTransforms(selectedWorld.id, editableExhibits)
    }
  }

  const resetCurrent = () => {
    const reset = resetWorldTransform(selectedWorld.id)
    setAllTransforms((prev: Record<string, TransformPatch>) => ({
      ...prev,
      [selectedWorld.id]: reset,
    }))
    setPreviewTransform(reset)

    resetWorldExhibitTransforms(selectedWorld.id)
    const nextExhibits = getEditableWorldExhibits(selectedWorld.id)
    setEditableExhibits(nextExhibits)
    setSelectedExhibitId(nextExhibits[0]?.id || null)
  }

  const handleSaveClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    saveCurrent()
  }

  const handleResetClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    resetCurrent()
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

      <main className="admin-shell__content admin-scroll" data-route={location.pathname}>
      <div className="admin-panel">
        <h1 className="admin-title">MapEditor</h1>
        <p className="admin-subtitle">
          Move world layout and objects with the gizmo, then save to persist edits.
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
            <button
              type="button"
              onClick={() => setEditTarget('world')}
              style={buttonStyle(editTarget === 'world' ? '#22d3ee' : '#334155', editTarget === 'world' ? '#042f3a' : '#e2e8f0')}
            >
              Edit World
            </button>
            {hasExhibits && (
              <button
                type="button"
                onClick={() => setEditTarget('object')}
                style={buttonStyle(editTarget === 'object' ? '#22d3ee' : '#334155', editTarget === 'object' ? '#042f3a' : '#e2e8f0')}
              >
                Edit Objects
              </button>
            )}
          </div>

          {editTarget === 'object' && hasExhibits && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ display: 'grid', gap: 6, minWidth: 300 }}>
                <span style={{ fontSize: 12, opacity: 0.8 }}>Object</span>
                <select
                  value={selectedExhibitId || ''}
                  onChange={(e) => setSelectedExhibitId(e.target.value)}
                  style={{
                    background: '#182931',
                    border: '1px solid #334155',
                    color: '#e2e8f0',
                    borderRadius: 8,
                    padding: '10px 12px',
                  }}
                >
                  {editableExhibits.map((exhibit) => (
                    <option key={exhibit.id} value={exhibit.id}>
                      {exhibit.label}
                    </option>
                  ))}
                </select>
              </label>
              {selectedExhibit && (
                <div style={{ display: 'grid', gap: 4 }}>
                  <span style={{ fontSize: 12, opacity: 0.82 }}>
                    Position: {round(selectedExhibit.position[0], 2)}, {round(selectedExhibit.position[1], 2)}, {round(selectedExhibit.position[2], 2)}
                  </span>
                  <label style={{ display: 'grid', gap: 4 }}>
                    <span style={{ fontSize: 12, opacity: 0.76 }}>
                      Manual line for hotelHallPrototypeWorld.js
                    </span>
                    <input
                      readOnly
                      value={selectedPositionLine}
                      onFocus={(event) => event.currentTarget.select()}
                      style={{
                        width: 360,
                        maxWidth: '100%',
                        background: '#0b1720',
                        border: '1px solid #334155',
                        color: '#e2e8f0',
                        borderRadius: 8,
                        padding: '8px 10px',
                        fontFamily: 'Consolas, Monaco, monospace',
                        fontSize: 12,
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          )}

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
                key={`${selectedWorld.id}-${editTarget}-${selectedExhibitId ?? 'none'}-${activeTransform.targetSize ?? 0}-${activeTransform.groundY ?? 0}`}
                worldId={selectedWorld.id}
                transform={activeTransform}
                mode={mode}
                editTarget={editTarget}
                exhibits={editableExhibits}
                selectedExhibitId={selectedExhibitId}
                onPatch={patchTransform}
                onDraftChange={(patch) => {
                  setPreviewTransform((prev) => ({
                    ...prev,
                    ...patch,
                  }))
                }}
                onSelectExhibit={setSelectedExhibitId}
                onExhibitPatch={patchExhibitPosition}
              />
            </Canvas>
          </div>

          <SizeButtons worldId={selectedWorld.id} transform={activeTransform} onPatch={patchTransform} />

          <div
            style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" onClick={handleSaveClick} style={buttonStyle('#22c55e', '#04110a')}>
              Save
            </button>
            <button type="button" onClick={handleResetClick} style={buttonStyle('#f59e0b', '#1f1302')}>
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
            Tip: switch to Edit Objects, choose an object, drag it with the gizmo, then Save and open world.
          </p>
        </div>
      </div>
      </main>
    </div>
  )
}

useGLTF.preload('/assets/models/dae_diorama_-_grandmas_house.glb')
useGLTF.preload('/assets/models/hotel_hall.glb')
useGLTF.preload('/assets/models/art_gallery.glb')
