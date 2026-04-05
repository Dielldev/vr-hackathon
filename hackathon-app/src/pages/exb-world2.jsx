import { Canvas, useFrame, useThree, extend } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useRef, useEffect, useState, Suspense, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Box3, Color, Vector3, Quaternion } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { hotelHallPrototypeWorld } from './worlds/hotelHallPrototypeWorld'
import { getWorldTransform } from '../utils/worldTransforms.js'
import letramezyzaObjectPath from '../assets/objects3D/letramezyza.glb'
import pensAndCaseObjectPath from '../assets/objects3D/pensandcase.glb'
import '../exb.css'

extend({ EffectComposer, RenderPass, ShaderPass })

function Model({ modelPath, targetSize = 16, groundY = 0, fitOffset = [0, 0, 0], rotationYDeg = 0, ...props }) {
  const { scene } = useGLTF(modelPath)

  const fittedScene = useMemo(() => {
    // Fit large external models (like Eiffel) into a predictable world size and center.
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

    clone.position.x += fitOffset[0]
    clone.position.y += fitOffset[1]
    clone.position.z += fitOffset[2]
    clone.rotation.y = (rotationYDeg * Math.PI) / 180

    return clone
  }, [scene, targetSize, groundY, fitOffset, rotationYDeg])

  return <primitive object={fittedScene} {...props} />
}

// World 2 has its own node map so it can use different coordinates than World 1.
const NAV_NODES_WORLD2 = {
  entry: {
    id: 'entry',
    position: [1.6, -1.95, 4.85],
    links: { forward: 'left-gallery' },
    lookAt: [3.27, -2.26, 3.69],
  },
  'hall-end': {
    id: 'hall-end',
    position: [7.05, -2.8, 4.95],
    links: { back: 'left-gallery' },
    lookAt: [8.12, -2.99, 4.36],
  },
  'left-gallery': {
    id: 'left-gallery',
    position: [2.4, -2.05, 4.45],
    links: { forward: 'hall-end', back: 'entry' },
    lookAt: [3.27, -2.26, 3.69],
  },
}

// World 2 exhibits are defined locally so their positions can be edited per-map.
const EXHIBITS_WORLD2 = [
  {
    id: 'proto-wave',
    label: 'Wave Relay',
    intro: 'Gheorghe Zolotco, patient, Moldova. 83, retired kolkhoz director.',
    storyTitle: 'A Manuscript of Life',
    story:
      'In Ohrincea, Gheorghe Zolotco spent a lifetime serving his community through agriculture, history, and literature. After surviving his third angina attack, he returned to writing a handwritten manuscript about village life, encouraged by his wife to preserve memory for future generations. After her passing, the manuscript became both a grief companion and a daily source of strength. He says hardship can become opportunity when people choose dignity and service.',
    messageTitle: 'The Message',
    message: 'Loss and illness did not defeat me; they taught me to stay dignified and serve others.',
    position: [3.27, -2.26, 3.69],
    color: '#ffe066',
    nodeId: 'left-gallery',
  },
  {
    id: 'proto-gate',
    label: 'Gate Maker',
    intro: 'Nadiia, patient, Ukraine. 37, endocrinologist.',
    storyTitle: 'A Battle on Two Fronts',
    story:
      'Nadiia has lived with diabetes since childhood and later became an endocrinologist helping others. War displaced her from Luhansk in 2014 and again in 2022, where shelling and stress pushed her blood sugar beyond control even with insulin. She carries diabetes essentials and a whistle in case she is trapped during attacks. Despite shortages and outages, she continues sharing insulin and supporting patients around her.',
    messageTitle: 'The Message',
    message: 'I fight every day: for my life, and for the lives of others.',
    position: [8.12, -2.99, 4.36],
    color: '#ff6f91',
    nodeId: 'hall-end',
  },
]

const WORLD2_EXHIBIT_MODELS = {
  'proto-wave': letramezyzaObjectPath,
  'proto-gate': pensAndCaseObjectPath,
}

const HARD_CODED_VOICE_NOTES = {
  'proto-wave':
    'Gheorghe Zolotco. Voice note. I keep writing because memory is service. Even after illness and loss, each page gives me strength and leaves guidance for the next generation.',
  'proto-gate':
    'Nadiia. Voice note. Diabetes and war challenge me daily, but I keep helping others. I carry what I need to survive and I share what I can with people left without care.',
}

function ExhibitObjectModel({ modelPath }) {
  const { scene } = useGLTF(modelPath)
  const objectRef = useRef()
  const clonedScene = useMemo(() => scene.clone(true), [scene])

  useFrame((_, delta) => {
    if (objectRef.current) {
      objectRef.current.rotation.y += delta * 0.9
    }
  })

  return (
    <primitive
      ref={objectRef}
      object={clonedScene}
      scale={[0.24, 0.24, 0.24]}
      position={[0, 0, 0]}
      raycast={() => null}
    />
  )
}

function PopupPreviewModel({ modelPath }) {
  const { scene } = useGLTF(modelPath)
  const modelRef = useRef()
  const clonedScene = useMemo(() => {
    const previewScene = scene.clone(true)

    previewScene.traverse((node) => {
      if (!node.isMesh) {
        return
      }

      node.castShadow = true
      node.receiveShadow = true

      const materials = Array.isArray(node.material) ? node.material : [node.material]
      for (const material of materials) {
        if (material && 'emissiveIntensity' in material) {
          material.emissiveIntensity = Math.max(material.emissiveIntensity || 0, 0.35)
          material.toneMapped = false
        }
      }
    })

    previewScene.updateMatrixWorld(true)
    const box = new Box3().setFromObject(previewScene)
    const size = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())
    const maxDimension = Math.max(size.x, size.y, size.z) || 1
    const scale = 2.75 / maxDimension

    previewScene.scale.setScalar(scale)
    previewScene.position.set(-center.x * scale, -center.y * scale, -center.z * scale)

    return previewScene
  }, [scene])

  useFrame((_, delta) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += delta * 0.55
    }
  })

  return (
    <group ref={modelRef} position={[0, 0, 0]}>
      <primitive object={clonedScene} />
    </group>
  )
}

function ExhibitBeacon({ position, color, variant = 'crystal', phaseOffset = 0, onClick, isFreeNav, modelPath }) {
  const meshRef = useRef()
  const modelLightRef = useRef()
  const [hovered, setHovered] = useState(false)
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime + phaseOffset
      meshRef.current.rotation.y += 0.008
      meshRef.current.position.y = position[1] + Math.sin(t * 1.2) * 0.1
    }

    if (modelPath && modelLightRef.current) {
      const target = hovered ? 2.2 : 1.6
      modelLightRef.current.intensity += (target - modelLightRef.current.intensity) * Math.min(1, 8 * delta)
    }
  })
  
  return (
    <group ref={meshRef} position={position}>
      {modelPath ? (
        <>
          <ExhibitObjectModel modelPath={modelPath} />
          <pointLight ref={modelLightRef} color={color} intensity={1.6} distance={5} />
          <mesh
            onClick={(e) => {
              if (!isFreeNav) {
                return
              }
              e.stopPropagation()
              onClick?.()
            }}
            onPointerOver={() => {
              if (!isFreeNav) {
                return
              }
              setHovered(true)
            }}
            onPointerOut={() => setHovered(false)}
          >
            <sphereGeometry args={[0.52, 12, 12]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        </>
      ) : (
        <mesh
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
      )}
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

const lerpNumber = (start, end, amount) => start + (end - start) * amount

function WorldLighting({ sunsetTarget }) {
  const { scene, gl } = useThree()
  const ambientRef = useRef()
  const hemisphereRef = useRef()
  const keyLightRef = useRef()
  const fillLightRef = useRef()
  const blendRef = useRef(sunsetTarget)

  const dayColors = useMemo(
    () => ({
      ambient: new Color('#f5fbff'),
      sky: new Color('#d7ecff'),
      ground: new Color('#728298'),
      key: new Color('#fff7e1'),
      fill: new Color('#d5e8ff'),
      backdrop: new Color('#d8ecff'),
    }),
    [],
  )

  const sunsetColors = useMemo(
    () => ({
      ambient: new Color('#ffc98f'),
      sky: new Color('#ffb07a'),
      ground: new Color('#8c644f'),
      key: new Color('#ffd39f'),
      fill: new Color('#ffc790'),
      backdrop: new Color('#ffbe88'),
    }),
    [],
  )

  const scratchColor = useMemo(() => new Color(), [])

  useFrame((_, delta) => {
    const smoothing = 1 - Math.exp(-delta * 0.45)
    blendRef.current += (sunsetTarget - blendRef.current) * smoothing
    const blend = blendRef.current

    if (ambientRef.current) {
      scratchColor.lerpColors(dayColors.ambient, sunsetColors.ambient, blend)
      ambientRef.current.color.copy(scratchColor)
      ambientRef.current.intensity = lerpNumber(1.42, 1.62, blend)
    }

    if (hemisphereRef.current) {
      scratchColor.lerpColors(dayColors.sky, sunsetColors.sky, blend)
      hemisphereRef.current.color.copy(scratchColor)
      scratchColor.lerpColors(dayColors.ground, sunsetColors.ground, blend)
      hemisphereRef.current.groundColor.copy(scratchColor)
      hemisphereRef.current.intensity = lerpNumber(0.82, 1.02, blend)
    }

    if (keyLightRef.current) {
      scratchColor.lerpColors(dayColors.key, sunsetColors.key, blend)
      keyLightRef.current.color.copy(scratchColor)
      keyLightRef.current.intensity = lerpNumber(1.44, 1.72, blend)
    }

    if (fillLightRef.current) {
      scratchColor.lerpColors(dayColors.fill, sunsetColors.fill, blend)
      fillLightRef.current.color.copy(scratchColor)
      fillLightRef.current.intensity = lerpNumber(0.84, 1.08, blend)
    }

    if (!scene.background || !scene.background.isColor) {
      scene.background = new Color()
    }

    scratchColor.lerpColors(dayColors.backdrop, sunsetColors.backdrop, blend)
    scene.background.copy(scratchColor)
    gl.toneMappingExposure = lerpNumber(1.24, 1.38, blend)
  })

  return (
    <>
      <ambientLight ref={ambientRef} intensity={1.35} color={'#f5fbff'} />
      <hemisphereLight ref={hemisphereRef} args={['#d7ecff', '#728298', 0.72]} />
      <directionalLight ref={keyLightRef} position={[6, 9, 4]} intensity={1.35} color={'#fff7e1'} />
      <directionalLight ref={fillLightRef} position={[-5, 4, -6]} intensity={0.65} color={'#d5e8ff'} />
    </>
  )
}

function CameraController({ setSaturation, activeNodeId, setActiveNodeId, targetNodeId, setIsMoving, onArriveAtExhibit, yaw, pitch, isFreeNav, onExhibitClick, zoomedExhibit, exhibits, beaconVariant }) {
  const { camera } = useThree()
  const moveDirection = useRef(new Vector3())
  const targetSaturation = useRef(1.0)
  const currentSaturation = useRef(1.0)
  const nearbyExhibitId = useRef(null)
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
      const currentNode = NAV_NODES_WORLD2[activeNodeId]
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
      const currentNode = NAV_NODES_WORLD2[activeNodeId]
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
      
      setSaturation(0.12)
      return
    }

    if (targetNodeId) {
      const destination = NAV_NODES_WORLD2[targetNodeId]
      const destPos = new Vector3(...destination.position)

      moveDirection.current.copy(destPos).sub(camera.position)
      const distance = moveDirection.current.length()

      if (distance <= 0.02) {
        camera.position.copy(destPos)
        setActiveNodeId(targetNodeId)
        setIsMoving(false)
        isTransitioning.current = false
        onArriveAtExhibit(null, { clearTargetNode: true })
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

    let nearestDistance = Number.POSITIVE_INFINITY
    let nearestExhibit = null
    for (const item of exhibits) {
      const d = camera.position.distanceTo(new Vector3(...item.position))
      if (d < nearestDistance) {
        nearestDistance = d
        nearestExhibit = item
      }
    }

    targetSaturation.current = nearestDistance < 1.5 ? 0.0 : 0.12
    currentSaturation.current += (targetSaturation.current - currentSaturation.current) * 0.05
    setSaturation(currentSaturation.current)

    const nextNearbyExhibit = !targetNodeId && nearestDistance < 1.5 ? nearestExhibit : null
    const nextNearbyId = nextNearbyExhibit ? nextNearbyExhibit.id : null

    if (nextNearbyId !== nearbyExhibitId.current) {
      nearbyExhibitId.current = nextNearbyId
      onArriveAtExhibit(nextNearbyExhibit)
    }
  })

  return (
    <>
      {exhibits.map((item, index) => (
        <ExhibitBeacon
          key={item.id}
          position={item.position}
          color={item.color}
          variant={beaconVariant}
          modelPath={WORLD2_EXHIBIT_MODELS[item.id]}
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
          variant="ring"
          modelPath={WORLD2_EXHIBIT_MODELS[exhibit.id]}
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
  const selectedWorld = hotelHallPrototypeWorld
  const transform = getWorldTransform(selectedWorld.id)
  const exhibits = useMemo(() => {
    // Keep world 2 exhibits fixed to source coordinates so admin/local overrides cannot drift detection.
    const sourceExhibits = selectedWorld.exhibits?.length ? selectedWorld.exhibits : EXHIBITS_WORLD2
    const normalizedExhibits = []
    for (const exhibit of sourceExhibits) {
      normalizedExhibits.push({
        ...exhibit,
        position: [exhibit.position[0], exhibit.position[1], exhibit.position[2]],
      })
    }
    return normalizedExhibits
  }, [selectedWorld])
  const [saturation, setSaturation] = useState(1.0)
  const [activeNodeId, setActiveNodeId] = useState('entry')
  const [targetNodeId, setTargetNodeId] = useState(null)
  const [isMoving, setIsMoving] = useState(false)
  const [interactionText, setInteractionText] = useState('')
  const [showPopup, setShowPopup] = useState(false)
  const [currentExhibit, setCurrentExhibit] = useState(null)
  const [nearbyExhibit, setNearbyExhibit] = useState(null)
  const [commentsByExhibit, setCommentsByExhibit] = useState({})
  const [commentDraft, setCommentDraft] = useState('')
  const [speakingExhibitId, setSpeakingExhibitId] = useState(null)
  const [sunsetTarget, setSunsetTarget] = useState(1)
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

  const currentNode = NAV_NODES_WORLD2[activeNodeId]
  const currentExhibitModelPath = currentExhibit ? WORLD2_EXHIBIT_MODELS[currentExhibit.id] : null
  const currentExhibitComments = currentExhibit ? (commentsByExhibit[currentExhibit.id] || []) : []
  const voiceSignalBars = []

  for (let index = 0; index < 24; index += 1) {
    voiceSignalBars.push(
      <span
        key={`voice-bar-${index}`}
        className="voice-note-player__bar"
        style={{ animationDelay: `${(index % 8) * 0.1}s` }}
      />,
    )
  }

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

  const stopVoiceNote = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setSpeakingExhibitId(null)
  }, [])

  const playVoiceNote = useCallback((exhibit) => {
    if (!exhibit) {
      return
    }

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      showTemporaryMessage('Voice notes are not supported in this browser.', 2200)
      return
    }

    const text = HARD_CODED_VOICE_NOTES[exhibit.id] || `${exhibit.label}. ${exhibit.message}`
    if (!text) {
      return
    }

    window.speechSynthesis.cancel()
    setSpeakingExhibitId(exhibit.id)

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.96
    utterance.pitch = 1
    utterance.onstart = () => setSpeakingExhibitId(exhibit.id)
    utterance.onend = () => setSpeakingExhibitId(null)
    utterance.onerror = () => setSpeakingExhibitId(null)
    window.speechSynthesis.speak(utterance)
  }, [showTemporaryMessage])

  const moveToDirection = (direction) => {
    if (isMoving) {
      return
    }

    const current = NAV_NODES_WORLD2[activeNodeId]
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

  const triggerSunsetShift = useCallback(() => {
    setSunsetTarget((current) => (current < 1 ? 1 : current))
  }, [])

  const onArriveAtExhibit = (exhibit, options = {}) => {
    if (options.clearTargetNode) {
      setTargetNodeId(null)
    }
    if (exhibit) {
      setNearbyExhibit(exhibit)
    } else {
      setNearbyExhibit(null)
    }
  }

  const openExhibitPopup = () => {
    if (nearbyExhibit) {
      triggerSunsetShift()
      setCurrentExhibit(nearbyExhibit)
      setShowPopup(true)
    }
  }

  const onExhibitClick = (exhibit) => {
    if (exhibit) {
      triggerSunsetShift()
    }

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
    stopVoiceNote()
    setShowPopup(false)
    setCurrentExhibit(null)
    setCommentDraft('')
    if (isFreeNav) {
      setZoomedExhibit(null)
    }
  }

  const submitComment = (event) => {
    event.preventDefault()
    if (!currentExhibit) {
      return
    }

    const nextText = commentDraft.trim()
    if (!nextText) {
      return
    }

    setCommentsByExhibit((previous) => {
      const next = { ...previous }
      const existing = next[currentExhibit.id] ? [...next[currentExhibit.id]] : []
      existing.push({
        id: `${Date.now()}-${existing.length}`,
        text: nextText,
      })
      next[currentExhibit.id] = existing
      return next
    })

    setCommentDraft('')
  }

  useEffect(() => {
    if (isFreeNav) {
      setNearbyExhibit(null)
      setTargetNodeId(null)
    }
  }, [isFreeNav])

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
      if (e.code === 'Space' && nearbyExhibit && !isVRMode && !isFreeNav) {
        openExhibitPopup()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [navigate, activeNodeId, isMoving, nearbyExhibit, isVRMode, isFreeNav])

  useEffect(() => {
    return () => {
      if (interactionTimerRef.current) {
        clearTimeout(interactionTimerRef.current)
      }
      stopVoiceNote()
    }
  }, [stopVoiceNote])

  useEffect(() => {
    setCommentDraft('')
    if (!currentExhibit) {
      stopVoiceNote()
    }
  }, [currentExhibit, stopVoiceNote])

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
                {currentExhibitModelPath ? (
                  <Canvas camera={{ position: [0, 0, 4.2], fov: 34 }} style={{ width: '100%', height: '100%' }}>
                    <ambientLight intensity={1.05} />
                    <directionalLight position={[2, 4, 3]} intensity={1.35} color={currentExhibit.color} />
                    <pointLight position={[-2, 1.5, 1.2]} color={currentExhibit.color} intensity={1.1} distance={7} />
                    <pointLight position={[2, 1.8, -1]} color={'#ffffff'} intensity={0.7} distance={7} />
                    <PopupPreviewModel modelPath={currentExhibitModelPath} />
                  </Canvas>
                ) : (
                  <div 
                    className="exhibition-popup-orb" 
                    style={{ 
                      backgroundColor: currentExhibit.color, 
                      boxShadow: `0 0 60px ${currentExhibit.color}, 0 0 120px ${currentExhibit.color}40` 
                    }} 
                  />
                )}
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
              <div className="exhibition-popup-section">
                <p className="exhibition-popup-section-title">Voice Note</p>
                <div className="voice-note-player">
                  <button
                    type="button"
                    className="voice-note-player__play"
                    aria-label={`Play voice note for ${currentExhibit.label}`}
                    onClick={() => playVoiceNote(currentExhibit)}
                  >
                    <span className="voice-note-player__play-icon" aria-hidden="true">▶</span>
                  </button>
                  <div className={`voice-note-player__signal ${speakingExhibitId === currentExhibit.id ? 'is-active' : ''}`}>
                    {voiceSignalBars}
                  </div>
                </div>
              </div>
              <div className="exhibition-popup-section">
                <p className="exhibition-popup-section-title">Comments</p>
                <form onSubmit={submitComment} style={{ display: 'grid', gap: 8 }}>
                  <textarea
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    placeholder="Write a comment"
                    rows={3}
                    style={{
                      resize: 'vertical',
                      minHeight: 68,
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.18)',
                      background: 'rgba(12, 16, 26, 0.55)',
                      color: '#ffffff',
                      padding: '10px 12px',
                    }}
                  />
                  <button type="submit" className="exhibition-interact-btn">Post Comment</button>
                </form>
                {currentExhibitComments.length === 0 ? (
                  <p className="exhibition-popup-message" style={{ marginTop: 10 }}>No comments yet.</p>
                ) : (
                  <div style={{ display: 'grid', gap: 8, marginTop: 10, maxHeight: 140, overflowY: 'auto' }}>
                    {currentExhibitComments.map((comment) => (
                      <p key={comment.id} className="exhibition-popup-message" style={{ margin: 0 }}>
                        {comment.text}
                      </p>
                    ))}
                  </div>
                )}
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
          gl.toneMappingExposure = 1.3
          gl.xr.enabled = true
          gl.xr.setReferenceSpaceType('local-floor')
        }}
      >
        <WorldLighting sunsetTarget={sunsetTarget} />
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
            targetSize={transform.targetSize ?? 28}
            groundY={transform.groundY ?? 0}
            fitOffset={[transform.offsetX ?? -2.4, transform.offsetY ?? 1.2, transform.offsetZ ?? 0.8]}
            rotationYDeg={transform.rotationYDeg ?? 180}
          />
        </Suspense>
        {!isVRMode && <Effects saturation={saturation} />}
      </Canvas>
    </div>
  )
}

useGLTF.preload('/assets/models/dae_diorama_-_grandmas_house.glb')
useGLTF.preload(letramezyzaObjectPath)
useGLTF.preload(pensAndCaseObjectPath)