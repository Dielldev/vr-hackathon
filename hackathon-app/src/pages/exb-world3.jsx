import { Canvas, useFrame, useThree, extend } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useRef, useEffect, useState, Suspense, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Vector3, Quaternion } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { artGalleryWorld } from './worlds/artGalleryWorld'
import { getWorldTransform } from '../utils/worldTransforms.js'
import '../exb.css'

extend({ EffectComposer, RenderPass, ShaderPass })

function Model({ modelPath, scale = 1, position = [0, 0, 0], rotationYDeg = 0, ...props }) {
  const { scene } = useGLTF(modelPath)
  return (
    <primitive
      object={scene}
      scale={scale}
      position={position}
      rotation={[0, (rotationYDeg * Math.PI) / 180, 0]}
      {...props}
    />
  )
}

// World 3 has its own node map so it can use different coordinates than other worlds.
const NAV_NODES_WORLD3 = {
  entry: {
    id: 'entry',
    position: [-1.05, 1.6, 4.0],
    links: { forward: 'hall-1' },
    lookAt: [-1.9, 1.6, 2.1],
  },
  'hall-1': {
    id: 'hall-1',
    position: [-1.55, 1.6, 2.65],
    links: { forward: 'hall-2', back: 'entry' },
    lookAt: [-2.2, 1.6, 1.25],
  },
  'hall-2': {
    id: 'hall-2',
    position: [-2.35, 1.6, 1.28],
    links: { forward: 'hall-3', back: 'hall-1', left: 'left-gallery', right: 'right-gallery' },
    lookAt: [-3.0, 1.6, 0.35],
  },
  'hall-3': {
    id: 'hall-3',
    position: [-3.15, 1.6, -0.15],
    links: { forward: 'hall-end', back: 'hall-2' },
    lookAt: [-3.75, 1.6, -1.25],
  },
  'hall-end': {
    id: 'hall-end',
    position: [-3.0, 1.6, -0.8],
    links: { back: 'hall-3' },
    lookAt: [-3.72, 1.6, -1.82],
  },
  'left-gallery': {
    id: 'left-gallery',
    position: [-3.5, 1.6, 1.3],
    links: { right: 'hall-2' },
    lookAt: [-4.74, 1.6, 1.2],
  },
  'right-gallery': {
    id: 'right-gallery',
    position: [-1.4, 1.6, 0.3],
    links: { left: 'hall-2' },
    lookAt: [-0.62, 1.6, -0.45],
  },
}

// World 3 exhibits are defined locally so their positions can be edited per-map.
const EXHIBITS_WORLD3 = [
  {
    id: 'proto-core',
    label: 'Prototype Core',
    intro: 'A stress-test core used to validate alternate beacon rendering styles.',
    storyTitle: 'The Story',
    story:
      'This object is a deliberate renderer test. It follows the same navigation map, but swaps to a ring-based visual style so we can quickly compare readability and mood changes.',
    messageTitle: 'The Message',
    message: 'Same world, different visual language. This confirms per-world render isolation.',
    position: [-2.36, 1.95, 1.05],
    color: '#00b8ff',
    nodeId: 'hall-2',
  },
  {
    id: 'proto-wave',
    label: 'Wave Relay',
    intro: 'A relay beacon tuned for bright, high-contrast object testing.',
    storyTitle: 'The Story',
    story:
      'Wave Relay intentionally exaggerates highlights and motion. It helps evaluate whether visitors can identify interactive objects faster in low-contrast corners.',
    messageTitle: 'The Message',
    message: 'Prototyping should be obvious. Visibility beats subtlety while testing.',
    position: [-4.74, 1.95, 1.2],
    color: '#ffe066',
    nodeId: 'left-gallery',
  },
  {
    id: 'proto-facet',
    label: 'Facet Node',
    intro: 'A faceted test element used to compare shape recognition speed.',
    storyTitle: 'The Story',
    story:
      'The Facet Node keeps the same location and interaction behavior, but changes geometry style. This gives a clean A/B check for engagement and wayfinding cues.',
    messageTitle: 'The Message',
    message: 'When interaction stays fixed, shape differences are easy to evaluate.',
    position: [-0.62, 1.95, -0.45],
    color: '#8fff8a',
    nodeId: 'right-gallery',
  },
  {
    id: 'proto-gate',
    label: 'Gate Marker',
    intro: 'A terminal marker for testing long-distance visibility in the hall.',
    storyTitle: 'The Story',
    story:
      'The Gate Marker uses the same end point as the primary world but with stronger emissive cues. It is designed to test whether users orient faster when beacon silhouettes are distinct.',
    messageTitle: 'The Message',
    message: 'Consistent map, alternate rendering. Perfect for test sessions.',
    position: [-3.72, 1.95, -1.82],
    color: '#ff6f91',
    nodeId: 'hall-end',
  },
]

function ExhibitBeacon({ position, color, variant = 'crystal', phaseOffset = 0, onClick, isFreeNav }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)
  
  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime + phaseOffset
      meshRef.current.rotation.y += 0.008
      meshRef.current.position.y = position[1] + Math.sin(t * 1.2) * 0.1
    }
  })
  
  return (
    <group>
      <mesh
        ref={meshRef} 
        position={position}
        onClick={(e) => {
          if (isFreeNav) {
            e.stopPropagation()
            onClick?.()
          }
        }}
        onPointerOver={() => isFreeNav && setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {variant === 'ring' ? (
          <>
            <torusKnotGeometry args={[hovered ? 0.24 : 0.2, 0.08, 120, 12]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={hovered ? 3.8 : 2.2}
              metalness={0.7}
              roughness={0.2}
              wireframe
              toneMapped={false}
            />
          </>
        ) : (
          <>
            <icosahedronGeometry args={[hovered ? 0.38 : 0.3, 0]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={hovered ? 4 : 2.5}
              toneMapped={false}
            />
          </>
        )}
        <pointLight color={color} intensity={hovered ? 4 : 2.8} distance={6} />
      </mesh>
    </group>
  )
}

// Grayscale effect shader
const GrayscaleShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount: { value: 1.0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    varying vec2 vUv;
    
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      gl_FragColor = vec4(mix(color.rgb, vec3(gray), amount), color.a);
    }
  `
}

function Effects({ saturation }) {
  const { gl, scene, camera, size } = useThree()
  const composerRef = useRef()
  const grayscalePassRef = useRef()
  
  useEffect(() => {
    const composer = new EffectComposer(gl)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)
    
    const grayscalePass = new ShaderPass(GrayscaleShader)
    grayscalePass.renderToScreen = true
    composer.addPass(grayscalePass)
    
    composerRef.current = composer
    grayscalePassRef.current = grayscalePass
    
    return () => {
      composer.dispose()
    }
  }, [gl, scene, camera])
  
  useEffect(() => {
    if (composerRef.current) {
      composerRef.current.setSize(size.width, size.height)
    }
  }, [size])
  
  useFrame(() => {
    if (grayscalePassRef.current) {
      grayscalePassRef.current.uniforms.amount.value = saturation
    }
    if (composerRef.current) {
      composerRef.current.render()
    }
  }, 1)
  
  return null
}

// Overview camera position for free nav mode
const FREE_NAV_CAMERA = {
  position: [-2.5, 4.5, 2.5],
  lookAt: [-2.5, 0, -0.5],
}

function CameraController({ setSaturation, activeNodeId, setActiveNodeId, targetNodeId, setIsMoving, onArriveAtExhibit, yaw, pitch, isFreeNav, onExhibitClick, zoomedExhibit, exhibits, beaconVariant }) {
  const { camera } = useThree()
  const moveDirection = useRef(new Vector3())
  const targetSaturation = useRef(1.0)
  const currentSaturation = useRef(1.0)
  const moveSpeed = 0.9
  const baseQuaternion = useRef(new Quaternion())
  const targetQuaternion = useRef(new Quaternion())
  const isTransitioning = useRef(false)
  const targetPosition = useRef(new Vector3())
  const targetLookAt = useRef(new Vector3())

  useEffect(() => {
    if (isFreeNav) {
      // Set target to overview position
      targetPosition.current.set(...FREE_NAV_CAMERA.position)
      targetLookAt.current.set(...FREE_NAV_CAMERA.lookAt)
      isTransitioning.current = true
    } else {
      const currentNode = NAV_NODES_WORLD3[activeNodeId]
      if (!currentNode) return
      
      targetPosition.current.set(...currentNode.position)
      targetLookAt.current.set(...currentNode.lookAt)
      isTransitioning.current = true
    }
  }, [isFreeNav, activeNodeId])

  useEffect(() => {
    if (isFreeNav && zoomedExhibit) {
      // Zoom towards the exhibit
      const exhibitPos = new Vector3(...zoomedExhibit.position)
      const direction = new Vector3().subVectors(exhibitPos, new Vector3(...FREE_NAV_CAMERA.position)).normalize()
      targetPosition.current.copy(exhibitPos).addScaledVector(direction, -1.5)
      targetPosition.current.y = Math.max(targetPosition.current.y, 2.5)
      targetLookAt.current.copy(exhibitPos)
      isTransitioning.current = true
    } else if (isFreeNav && !zoomedExhibit) {
      targetPosition.current.set(...FREE_NAV_CAMERA.position)
      targetLookAt.current.set(...FREE_NAV_CAMERA.lookAt)
      isTransitioning.current = true
    }
  }, [isFreeNav, zoomedExhibit])

  useEffect(() => {
    if (!isFreeNav) {
      const currentNode = NAV_NODES_WORLD3[activeNodeId]
      if (!currentNode) return

      const [x, y, z] = currentNode.position
      const [lx, ly, lz] = currentNode.lookAt
      camera.position.set(x, y, z)
      
      const lookTarget = new Vector3(lx, ly, lz)
      camera.lookAt(lookTarget)
      baseQuaternion.current.copy(camera.quaternion)
    }
  }, [activeNodeId, camera, isFreeNav])

  useFrame((_, delta) => {
    // Handle free nav mode camera
    if (isFreeNav) {
      // Smoothly move to target position
      camera.position.lerp(targetPosition.current, 2.5 * delta)
      
      // Smoothly rotate to look at target
      const tempCam = camera.clone()
      tempCam.lookAt(targetLookAt.current)
      camera.quaternion.slerp(tempCam.quaternion, 2.5 * delta)
      
      setSaturation(1.0)
      return
    }

    if (targetNodeId) {
      const destination = NAV_NODES_WORLD3[targetNodeId]
      const destPos = new Vector3(...destination.position)

      moveDirection.current.copy(destPos).sub(camera.position)
      const distance = moveDirection.current.length()

      if (distance <= 0.02) {
        camera.position.copy(destPos)
        setActiveNodeId(targetNodeId)
        setIsMoving(false)
        isTransitioning.current = false

        const arrivedExhibit = exhibits.find((item) => item.nodeId === targetNodeId)
        if (arrivedExhibit) {
          onArriveAtExhibit(arrivedExhibit)
        } else {
          onArriveAtExhibit(null)
        }
      } else {
        setIsMoving(true)
        isTransitioning.current = true
        moveDirection.current.normalize()
        const step = Math.min(distance, moveSpeed * delta)
        camera.position.addScaledVector(moveDirection.current, step)
        
        // Calculate target rotation towards destination
        const tempCam = camera.clone()
        tempCam.lookAt(destPos)
        targetQuaternion.current.copy(tempCam.quaternion)
        
        // Smoothly interpolate rotation (slerp)
        const rotationSpeed = 2.5 * delta
        camera.quaternion.slerp(targetQuaternion.current, rotationSpeed)
        baseQuaternion.current.copy(camera.quaternion)
      }
    } else if (!isTransitioning.current) {
      // Apply mouse look rotation on top of base orientation
      const yawQuat = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw)
      const pitchQuat = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), pitch)
      
      camera.quaternion.copy(baseQuaternion.current)
      camera.quaternion.multiply(yawQuat)
      camera.quaternion.multiply(pitchQuat)
    }

    const nearestDistance = exhibits.reduce((closest, item) => {
      const d = camera.position.distanceTo(new Vector3(...item.position))
      return Math.min(closest, d)
    }, Number.POSITIVE_INFINITY)

    targetSaturation.current = nearestDistance < 1.5 ? 0.0 : 1.0
    currentSaturation.current += (targetSaturation.current - currentSaturation.current) * 0.05
    setSaturation(currentSaturation.current)
  })

  return (
    <>
      {exhibits.map((item, index) => (
        <ExhibitBeacon
          key={item.id}
          position={item.position}
          color={item.color}
          variant={beaconVariant}
          label={item.label}
          phaseOffset={index * 0.8}
          isFreeNav={isFreeNav}
          onClick={() => onExhibitClick(item)}
        />
      ))}
    </>
  )
}

function VRCameraController({ exhibits, onExhibitClick }) {
  const { camera } = useThree()
  const gazeTargetRef = useRef(null)
  const gazeDurationRef = useRef(0)
  const GAZE_DURATION_THRESHOLD = 1.5

  useFrame(() => {
    const direction = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion)

    let gazedExhibit = null
    for (const exhibit of exhibits) {
      const distance = camera.position.distanceTo(new Vector3(...exhibit.position))
      if (distance < 6) {
        const dirToExhibit = new Vector3(...exhibit.position).sub(camera.position).normalize()
        const dotProduct = direction.dot(dirToExhibit)
        if (dotProduct > 0.8) {
          gazedExhibit = exhibit
          break
        }
      }
    }

    if (gazedExhibit && gazeTargetRef.current?.id === gazedExhibit.id) {
      gazeDurationRef.current += 0.016
      if (gazeDurationRef.current >= GAZE_DURATION_THRESHOLD) {
        onExhibitClick(gazedExhibit)
        gazeDurationRef.current = 0
      }
    } else if (gazedExhibit) {
      gazeTargetRef.current = gazedExhibit
      gazeDurationRef.current = 0
    } else {
      gazeTargetRef.current = null
      gazeDurationRef.current = 0
    }
  })

  return (
    <>
      {exhibits.map((exhibit, index) => (
        <ExhibitBeacon
          key={exhibit.id}
          position={exhibit.position}
          color={exhibit.color}
          variant="crystal"
          phaseOffset={index * 0.8}
          isFreeNav={true}
          onClick={() => onExhibitClick(exhibit)}
        />
      ))}
    </>
  )
}

export default function Exhibition() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const selectedWorld = artGalleryWorld
  const transform = getWorldTransform(selectedWorld.id)
  const exhibits = EXHIBITS_WORLD3
  const [saturation, setSaturation] = useState(1.0)
  const [activeNodeId, setActiveNodeId] = useState('entry')
  const [targetNodeId, setTargetNodeId] = useState(null)
  const [isMoving, setIsMoving] = useState(false)
  const [interactionText, setInteractionText] = useState('')
  const [showPopup, setShowPopup] = useState(false)
  const [currentExhibit, setCurrentExhibit] = useState(null)
  const [nearbyExhibit, setNearbyExhibit] = useState(null)
  const [isFreeNav, setIsFreeNav] = useState(false)
  const [zoomedExhibit, setZoomedExhibit] = useState(null)
  const [isVRMode, setIsVRMode] = useState(searchParams.get('vr') === 'true')
  const [isXRActive, setIsXRActive] = useState(false)
  const [xrSupported, setXrSupported] = useState(true)
  const [xrMessage, setXrMessage] = useState('')
  const interactionTimerRef = useRef(null)
  const rendererRef = useRef(null)
  const xrSessionRef = useRef(null)
  
  // Mouse look state
  const [yaw, setYaw] = useState(0)
  const [pitch, setPitch] = useState(0)
  const isDragging = useRef(false)
  const hasDragged = useRef(false)
  const lastTouch = useRef({ x: 0, y: 0 })

  const currentNode = NAV_NODES_WORLD3[activeNodeId]

  const endVRSession = useCallback(async () => {
    const activeSession = xrSessionRef.current || rendererRef.current?.xr?.getSession?.()
    if (!activeSession) {
      return
    }

    try {
      await activeSession.end()
    } catch {
      // Session can already be closed by headset runtime.
    }
  }, [])

  const startVRSession = useCallback(
    async ({ fromUserAction = false } = {}) => {
      if (!isVRMode || !rendererRef.current) {
        return
      }

      if (!navigator.xr || typeof navigator.xr.isSessionSupported !== 'function') {
        setXrSupported(false)
        setXrMessage('WebXR is unavailable on this device or browser.')
        return
      }

      try {
        const supported = await navigator.xr.isSessionSupported('immersive-vr')
        setXrSupported(supported)

        if (!supported) {
          setXrMessage('Immersive VR is not supported in this browser.')
          return
        }

        const existingSession = rendererRef.current.xr.getSession()
        if (existingSession) {
          xrSessionRef.current = existingSession
          setIsXRActive(true)
          setXrMessage('')
          return
        }

        const session = await navigator.xr.requestSession('immersive-vr', {
          optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'layers'],
        })

        session.addEventListener('end', () => {
          xrSessionRef.current = null
          setIsXRActive(false)
          setIsVRMode(false)
        })

        await rendererRef.current.xr.setSession(session)
        xrSessionRef.current = session
        setIsXRActive(true)
        setXrMessage('')
      } catch (error) {
        const message = String(error?.message ?? error ?? '')
        const needsUserGesture = /user gesture|user activation|must be activated/i.test(message)

        if (!fromUserAction && needsUserGesture) {
          setXrMessage('Tap "Enter Immersive VR" to start the headset session.')
          return
        }

        setXrMessage('Unable to start VR session. Check headset/browser WebXR support.')
      }
    },
    [isVRMode],
  )

  const showTemporaryMessage = (text, duration = 3000) => {
    setInteractionText(text)
    if (interactionTimerRef.current) {
      clearTimeout(interactionTimerRef.current)
    }
    interactionTimerRef.current = setTimeout(() => {
      setInteractionText('')
    }, duration)
  }

  const moveToDirection = (direction) => {
    if (isMoving) {
      return
    }

    const current = NAV_NODES_WORLD3[activeNodeId]
    const destination = current?.links?.[direction]
    if (!destination) {
      showTemporaryMessage('No path in that direction from here.', 1500)
      return
    }

    // Reset look angle when moving
    setYaw(0)
    setPitch(0)
    setTargetNodeId(destination)
    showTemporaryMessage('Moving...', 1200)
  }

  const onArriveAtExhibit = (exhibit) => {
    setTargetNodeId(null)
    if (exhibit) {
      setNearbyExhibit(exhibit)
    } else {
      setNearbyExhibit(null)
    }
  }

  const openExhibitPopup = () => {
    if (nearbyExhibit) {
      setCurrentExhibit(nearbyExhibit)
      setShowPopup(true)
    }
  }

  const onExhibitClick = (exhibit) => {
    if (isFreeNav) {
      setZoomedExhibit(exhibit)
      setCurrentExhibit(exhibit)
      setShowPopup(true)
    } else {
      setCurrentExhibit(exhibit)
      setShowPopup(true)
    }
  }

  const closePopup = () => {
    setShowPopup(false)
    setCurrentExhibit(null)
    if (isFreeNav) {
      setZoomedExhibit(null)
    }
  }

  // Mouse drag handlers for look-around
  const handleMouseDown = useCallback((e) => {
    // Don't start drag if clicking on interactive elements
    if (e.target.closest('button, .exhibition-hud, .exhibition-nav, .exhibition-interact-prompt, .exhibition-popup-overlay')) {
      return
    }
    if (e.button === 0) {
      isDragging.current = true
      hasDragged.current = false
      lastTouch.current = { x: e.clientX, y: e.clientY }
    }
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return
    
    const deltaX = e.clientX - lastTouch.current.x
    const deltaY = e.clientY - lastTouch.current.y
    
    // Only count as drag if moved more than 3 pixels
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      hasDragged.current = true
    }
    
    if (!hasDragged.current) return
    
    lastTouch.current = { x: e.clientX, y: e.clientY }
    
    const sensitivity = 0.003
    setYaw(prev => prev - deltaX * sensitivity)
    setPitch(prev => Math.max(-Math.PI / 4, Math.min(Math.PI / 4, prev - deltaY * sensitivity)))
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
  }, [])

  // Touch handlers for mobile look-around
  const handleTouchStart = useCallback((e) => {
    // Don't start drag if touching interactive elements
    if (e.target.closest('button, .exhibition-hud, .exhibition-nav, .exhibition-interact-prompt, .exhibition-popup-overlay')) {
      return
    }
    if (e.touches.length === 1) {
      isDragging.current = true
      hasDragged.current = false
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!isDragging.current || e.touches.length !== 1) return
    
    const touch = e.touches[0]
    const deltaX = touch.clientX - lastTouch.current.x
    const deltaY = touch.clientY - lastTouch.current.y
    lastTouch.current = { x: touch.clientX, y: touch.clientY }
    
    const sensitivity = 0.004
    setYaw(prev => prev - deltaX * sensitivity)
    setPitch(prev => Math.max(-Math.PI / 4, Math.min(Math.PI / 4, prev - deltaY * sensitivity)))
  }, [])

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false
  }, [])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'Escape') {
        if (isVRMode) {
          setIsVRMode(false)
        } else {
          navigate('/exhibition')
        }
      }
      if (!isVRMode) {
        if (e.code === 'ArrowUp') {
          moveToDirection('forward')
        }
        if (e.code === 'ArrowDown') {
          moveToDirection('back')
        }
        if (e.code === 'ArrowLeft') {
          moveToDirection('left')
        }
        if (e.code === 'ArrowRight') {
          moveToDirection('right')
        }
      }
      if (e.code === 'Space' && nearbyExhibit && !isVRMode) {
        openExhibitPopup()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [navigate, activeNodeId, isMoving, nearbyExhibit, isVRMode])

  useEffect(() => {
    return () => {
      if (interactionTimerRef.current) {
        clearTimeout(interactionTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isVRMode) {
      setIsXRActive(false)
      setXrMessage('')
      void endVRSession()
      return
    }

    void startVRSession()
  }, [isVRMode, startVRSession, endVRSession])

  useEffect(() => {
    return () => {
      void endVRSession()
    }
  }, [endVRSession])

  return (
    <div 
      className="exhibition-page"
      onMouseDown={!isVRMode ? handleMouseDown : undefined}
      onMouseMove={!isVRMode ? handleMouseMove : undefined}
      onMouseUp={!isVRMode ? handleMouseUp : undefined}
      onMouseLeave={!isVRMode ? handleMouseUp : undefined}
      onTouchStart={!isVRMode ? handleTouchStart : undefined}
      onTouchMove={!isVRMode ? handleTouchMove : undefined}
      onTouchEnd={!isVRMode ? handleTouchEnd : undefined}
    >
      <div className="exhibition-hud">
        <p className="exhibition-hud__line">World: {selectedWorld.label}</p>
        {isVRMode && <p className="exhibition-hud__line" style={{ color: '#ff6ba9' }}>🎮 VR MODE</p>}
        {isVRMode && !isXRActive && xrSupported && (
          <button
            className="exhibition-nav-toggle exhibition-nav-toggle--vr-exit"
            onClick={() => void startVRSession({ fromUserAction: true })}
            title="Start immersive headset session"
          >
            Enter Immersive VR
          </button>
        )}
        {isVRMode && xrMessage && <p className="exhibition-hud__line">{xrMessage}</p>}
        {!isVRMode && !isFreeNav && <p className="exhibition-hud__line">Current: {activeNodeId}</p>}
        {!isVRMode && !isFreeNav && <p className="exhibition-hud__line">Drag to look around</p>}
        {!isVRMode && isFreeNav && <p className="exhibition-hud__line">Click an exhibit to view</p>}
        {isVRMode && <p className="exhibition-hud__line">Look at objects to interact</p>}
        {!isVRMode && (
          <button 
            className={`exhibition-nav-toggle ${isFreeNav ? 'exhibition-nav-toggle--active' : ''}`}
            onClick={() => setIsFreeNav(!isFreeNav)}
          >
            {isFreeNav ? '🎯 Free Nav' : '🚶 Guided'}
          </button>
        )}
        {isVRMode && (
          <button
            className="exhibition-nav-toggle exhibition-nav-toggle--vr-exit"
            onClick={() => setIsVRMode(false)}
            title="Exit VR mode (ESC)"
          >
            Exit VR
          </button>
        )}
      </div>

      {!isVRMode && !isFreeNav && nearbyExhibit && !showPopup && (
        <div className="exhibition-interact-prompt">
          <button className="exhibition-interact-btn" onClick={openExhibitPopup}>
            View {nearbyExhibit.label}
          </button>
        </div>
      )}

      {showPopup && currentExhibit && (
        <div className="exhibition-popup-overlay" onClick={closePopup}>
          <div className="exhibition-popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="exhibition-popup-left">
              <div className="exhibition-popup-orb-shell">
                <div 
                  className="exhibition-popup-orb" 
                  style={{ 
                    backgroundColor: currentExhibit.color, 
                    boxShadow: `0 0 60px ${currentExhibit.color}, 0 0 120px ${currentExhibit.color}40` 
                  }} 
                />
              </div>
              <div className="exhibition-popup-meta">
                <p className="exhibition-popup-kicker">Object</p>
                <h2 className="exhibition-popup-title">{currentExhibit.label}</h2>
                <p className="exhibition-popup-intro">{currentExhibit.intro}</p>
              </div>
            </div>
            <div className="exhibition-popup-right">
              <button className="exhibition-popup-close" onClick={closePopup} aria-label="Close object details">×</button>
              <div className="exhibition-popup-section">
                <p className="exhibition-popup-section-title">{currentExhibit.storyTitle}</p>
                <p className="exhibition-popup-message">{currentExhibit.story}</p>
              </div>
              <div className="exhibition-popup-section exhibition-popup-section--message">
                <p className="exhibition-popup-section-title">{currentExhibit.messageTitle}</p>
                <p className="exhibition-popup-quote">“{currentExhibit.message}”</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isVRMode && !isFreeNav && (
        <div className="exhibition-nav" aria-label="Street view navigation">
          {currentNode?.links?.left && (
            <div
              className={`exhibition-nav__arrow exhibition-nav__arrow--left ${isMoving ? 'is-disabled' : ''}`}
              role="button"
              aria-label="Move left"
              tabIndex={isMoving ? -1 : 0}
              onClick={() => moveToDirection('left')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  moveToDirection('left')
                }
              }}
            >
              ←
            </div>
          )}
          {currentNode?.links?.forward && (
            <div
              className={`exhibition-nav__arrow exhibition-nav__arrow--forward ${isMoving ? 'is-disabled' : ''}`}
              role="button"
              aria-label="Move forward"
              tabIndex={isMoving ? -1 : 0}
              onClick={() => moveToDirection('forward')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  moveToDirection('forward')
                }
              }}
            >
              ↑
            </div>
          )}
          {currentNode?.links?.right && (
            <div
              className={`exhibition-nav__arrow exhibition-nav__arrow--right ${isMoving ? 'is-disabled' : ''}`}
              role="button"
              aria-label="Move right"
              tabIndex={isMoving ? -1 : 0}
              onClick={() => moveToDirection('right')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  moveToDirection('right')
                }
              }}
            >
              →
            </div>
          )}
          {currentNode?.links?.back && (
            <div
              className={`exhibition-nav__arrow exhibition-nav__arrow--back ${isMoving ? 'is-disabled' : ''}`}
              role="button"
              aria-label="Move back"
              tabIndex={isMoving ? -1 : 0}
              onClick={() => moveToDirection('back')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  moveToDirection('back')
                }
              }}
            >
              ↓
            </div>
          )}
        </div>
      )}

      <Canvas
        className="exhibition-canvas"
        camera={{ position: [0, 1.6, 5] }}
        onCreated={({ gl }) => {
          rendererRef.current = gl
          gl.xr.enabled = true
          gl.xr.setReferenceSpaceType('local-floor')
        }}
      >
        <ambientLight intensity={1} />
        <directionalLight position={[5, 5, 5]} />
        <Suspense fallback={null}>
          {!isVRMode ? (
            <CameraController
              setSaturation={setSaturation}
              activeNodeId={activeNodeId}
              setActiveNodeId={setActiveNodeId}
              targetNodeId={targetNodeId}
              setIsMoving={setIsMoving}
              onArriveAtExhibit={onArriveAtExhibit}
              yaw={yaw}
              pitch={pitch}
              isFreeNav={isFreeNav}
              onExhibitClick={onExhibitClick}
              zoomedExhibit={zoomedExhibit}
              exhibits={exhibits}
              beaconVariant={selectedWorld.beaconVariant}
            />
          ) : (
            <VRCameraController exhibits={exhibits} onExhibitClick={onExhibitClick} />
          )}
          <Model
            modelPath={selectedWorld.modelPath}
            scale={transform.scale ?? 1}
            position={[transform.posX ?? 0, transform.posY ?? 0, transform.posZ ?? 0]}
            rotationYDeg={transform.rotationYDeg ?? 0}
          />
        </Suspense>
        {!isVRMode && <Effects saturation={saturation} />}
      </Canvas>
    </div>
  )
}

useGLTF.preload('/assets/models/art_gallery.glb')