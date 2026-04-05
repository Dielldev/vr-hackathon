import { Canvas, useFrame, useThree, extend } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useRef, useEffect, useState, Suspense, useCallback, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Vector3, Quaternion, Box3, BufferGeometry, Float32BufferAttribute, Line as ThreeLine, LineBasicMaterial } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { DEFAULT_WORLD_ID, WORLD_REGISTRY } from './worlds'
import { getWorldTransform } from '../utils/worldTransforms.js'
import bloodPressureObjectPath from '../assets/objects3D/bloodpresure.glb'
import penObjectPath from '../assets/objects3D/pen3D.glb'
import perlapsaObjectPath from '../assets/objects3D/perlapsa.glb'
import portraitObjectPath from '../assets/objects3D/portrait.glb'
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
const NAV_NODES = {
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

const HOTEL_HALL_EXHIBIT_MODELS = {
  'memory-cube': bloodPressureObjectPath,
  'signal-orb': penObjectPath,
  'echo-prism': perlapsaObjectPath,
  'time-gate': portraitObjectPath,
}

function ExhibitObjectModel({ modelPath }) {
  const { scene } = useGLTF(modelPath)
  const objectRef = useRef()
  const clonedScene = useMemo(() => scene.clone(true), [scene])

  useFrame((_, delta) => {
    if (objectRef.current) {
      objectRef.current.rotation.y += delta * 0.9
      objectRef.current.scale.setScalar(0.24)
    }
  })

  return (
    <primitive
      ref={objectRef}
      object={clonedScene}
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
  const hoverRef = useRef(false)
  const modelLightRef = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame((state, delta) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime + phaseOffset
      meshRef.current.rotation.y += 0.008
      meshRef.current.position.y = position[1] + Math.sin(t * 1.2) * 0.1
    }

    if (modelPath && modelLightRef.current) {
      const target = hoverRef.current ? 2.2 : 1.6
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
              if (!isFreeNav) return
              e.stopPropagation()
              onClick?.()
            }}
            onPointerOver={() => {
              if (!isFreeNav) return
              hoverRef.current = true
            }}
            onPointerOut={() => {
              hoverRef.current = false
            }}
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

function RendererProfile({ isVRMode }) {
  const { gl } = useThree()

  useEffect(() => {
    const previousExposure = gl.toneMappingExposure

    gl.toneMappingExposure = 1

    return () => {
      gl.toneMappingExposure = previousExposure
    }
  }, [gl, isVRMode])

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
      const currentNode = NAV_NODES[activeNodeId]
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
      const currentNode = NAV_NODES[activeNodeId]
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
      
      setSaturation(0.0)
      return
    }

    if (targetNodeId) {
      const destination = NAV_NODES[targetNodeId]
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

    setSaturation(0.0)
  })

  return (
    <>
      {exhibits.map((item, index) => (
        <ExhibitBeacon
          key={item.id}
          position={item.position}
          color={item.color}
          variant={beaconVariant}
          modelPath={HOTEL_HALL_EXHIBIT_MODELS[item.id]}
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
  const { camera, gl } = useThree()
  const triggerLatchedRef = useRef(false)
  const selectLastAtRef = useRef(0)
  const xrSpawnAppliedRef = useRef(false)
  const xrBaseReferenceSpaceRef = useRef(null)
  const locomotionOffsetRef = useRef(new Vector3())
  const locomotionYawRef = useRef(0)
  const leftControllerForwardRef = useRef(new Vector3())
  const leftControllerRightRef = useRef(new Vector3())
  const aimedExhibitRef = useRef(null)
  const sessionHandlersRef = useRef(null)
  const laserLinesRef = useRef([null, null])
  const worldPosRef = useRef(new Vector3())
  const forwardRef = useRef(new Vector3())
  const toExhibitRef = useRef(new Vector3())
  const rightRef = useRef(new Vector3())
  const rayOriginRef = useRef(new Vector3())
  const rayDirRef = useRef(new Vector3())
  const rayTempRef = useRef(new Vector3())
  const rayQuatRef = useRef(new Quaternion())
  const up = useMemo(() => new Vector3(0, 1, 0), [])

  const VR_SPAWN = useMemo(() => ({
    position: [-1.6, 1.6, 2.5],
    lookAt: [-2.36, 1.85, 1.05],
  }), [])

  const findFocusedExhibitFromRay = useCallback((origin, direction) => {
    let best = null
    let bestScore = -Infinity

    for (const exhibit of exhibits) {
      toExhibitRef.current.set(...exhibit.position).sub(origin)
      const projection = toExhibitRef.current.dot(direction)
      if (projection < 0) {
        continue
      }

      const distance = toExhibitRef.current.length()
      if (distance > 14) {
        continue
      }

      rayTempRef.current.copy(toExhibitRef.current).addScaledVector(direction, -projection)
      const lateralDistance = rayTempRef.current.length()
      if (lateralDistance > 1.2) {
        continue
      }

      const score = projection - lateralDistance * 1.2 - distance * 0.02
      if (score > bestScore) {
        bestScore = score
        best = exhibit
      }
    }

    return best
  }, [exhibits])

  const findFocusedExhibit = useCallback(() => {
    camera.getWorldPosition(worldPosRef.current)
    camera.getWorldDirection(forwardRef.current)
    return findFocusedExhibitFromRay(worldPosRef.current, forwardRef.current)
  }, [camera, findFocusedExhibitFromRay])

  useEffect(() => {
    const [x, y, z] = VR_SPAWN.position
    const [lx, ly, lz] = VR_SPAWN.lookAt
    camera.position.set(x, y, z)
    camera.lookAt(new Vector3(lx, ly, lz))
  }, [camera, VR_SPAWN])

  useEffect(() => {
    const makeLaser = () => {
      const geometry = new BufferGeometry()
      geometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 0, 0, -14], 3))
      const material = new LineBasicMaterial({ color: '#67e8f9', transparent: true, opacity: 0.9 })
      return new ThreeLine(geometry, material)
    }

    for (let i = 0; i < 2; i += 1) {
      const controller = gl.xr.getController(i)
      if (!controller || laserLinesRef.current[i]) {
        continue
      }

      const line = makeLaser()
      line.name = `vr-laser-${i}`
      controller.add(line)
      laserLinesRef.current[i] = line
    }

    return () => {
      for (let i = 0; i < 2; i += 1) {
        const controller = gl.xr.getController(i)
        const line = laserLinesRef.current[i]
        if (controller && line) {
          controller.remove(line)
          line.geometry.dispose()
          line.material.dispose()
        }
        laserLinesRef.current[i] = null
      }
    }
  }, [gl])

  useEffect(() => {
    return () => {
      if (sessionHandlersRef.current?.session) {
        const active = sessionHandlersRef.current
        active.session.removeEventListener('select', active.onSelect)
        active.session.removeEventListener('selectstart', active.onSelect)
        active.session.removeEventListener('squeezestart', active.onSelect)
        active.session.removeEventListener('selectend', active.onSelectEnd)
        active.session.removeEventListener('squeezeend', active.onSelectEnd)
      }
    }
  }, [])

  useFrame((_, delta, xrFrame) => {
    const session = gl.xr.getSession()
    if (!session) {
      xrSpawnAppliedRef.current = false
      xrBaseReferenceSpaceRef.current = null
      aimedExhibitRef.current = null
      triggerLatchedRef.current = false
      if (sessionHandlersRef.current?.session) {
        const active = sessionHandlersRef.current
        active.session.removeEventListener('select', active.onSelect)
        active.session.removeEventListener('selectstart', active.onSelect)
        active.session.removeEventListener('squeezestart', active.onSelect)
        active.session.removeEventListener('selectend', active.onSelectEnd)
        active.session.removeEventListener('squeezeend', active.onSelectEnd)
        sessionHandlersRef.current = null
      }
      return
    }

    if (sessionHandlersRef.current?.session !== session) {
      if (sessionHandlersRef.current?.session) {
        const previous = sessionHandlersRef.current
        previous.session.removeEventListener('select', previous.onSelect)
        previous.session.removeEventListener('selectstart', previous.onSelect)
        previous.session.removeEventListener('squeezestart', previous.onSelect)
        previous.session.removeEventListener('selectend', previous.onSelectEnd)
        previous.session.removeEventListener('squeezeend', previous.onSelectEnd)
      }

      const onSelect = () => {
        const now = performance.now()
        if (now - selectLastAtRef.current < 220) {
          return
        }
        selectLastAtRef.current = now

        const focusedExhibit = aimedExhibitRef.current || findFocusedExhibit()
        if (focusedExhibit) {
          onExhibitClick(focusedExhibit)
        }
      }

      const onSelectEnd = () => {}

      session.addEventListener('select', onSelect)
      session.addEventListener('selectstart', onSelect)
      session.addEventListener('squeezestart', onSelect)
      session.addEventListener('selectend', onSelectEnd)
      session.addEventListener('squeezeend', onSelectEnd)

      sessionHandlersRef.current = { session, onSelect, onSelectEnd }
      xrBaseReferenceSpaceRef.current = gl.xr.getReferenceSpace?.() || null
      locomotionOffsetRef.current.set(0, 0, 0)
      locomotionYawRef.current = 0
    }

    const xrCamera = gl.xr.getCamera(camera)
    const movementTarget = xrCamera?.parent || camera.parent || camera

    if (!xrSpawnAppliedRef.current) {
      const [spawnX, spawnY, spawnZ] = VR_SPAWN.position
      movementTarget.position.set(spawnX, spawnY, spawnZ)
      xrSpawnAppliedRef.current = true
    }

    let moveStrafeInput = 0
    let moveForwardInput = 0
    let turnInput = 0
    let moveSamples = 0
    let turnSamples = 0
    let hasLeftControllerBasis = false
    let triggerPressed = false
    let aimedByController = null
    let aimedScore = -Infinity
    const referenceSpace = gl.xr.getReferenceSpace?.()

    for (let index = 0; index < session.inputSources.length; index += 1) {
      const inputSource = session.inputSources[index]
      const gamepad = inputSource?.gamepad

      const controllerObject = gl.xr.getController(index)
      if (controllerObject) {
        if (inputSource?.handedness === 'left') {
          controllerObject.getWorldQuaternion(rayQuatRef.current)
          leftControllerForwardRef.current.set(0, 0, -1).applyQuaternion(rayQuatRef.current)
          leftControllerForwardRef.current.y = 0
          if (leftControllerForwardRef.current.lengthSq() > 1e-5) {
            leftControllerForwardRef.current.normalize()
            leftControllerRightRef.current.set(1, 0, 0).applyQuaternion(rayQuatRef.current)
            leftControllerRightRef.current.y = 0
            leftControllerRightRef.current.normalize()
            hasLeftControllerBasis = true
          }
        }

        controllerObject.getWorldPosition(rayOriginRef.current)
        controllerObject.getWorldQuaternion(rayQuatRef.current)
        const rayDirections = [
          new Vector3(0, 0, -1).applyQuaternion(rayQuatRef.current).normalize(),
          new Vector3(0, 0, 1).applyQuaternion(rayQuatRef.current).normalize(),
        ]

        for (const dir of rayDirections) {
          const candidate = findFocusedExhibitFromRay(rayOriginRef.current, dir)
          if (candidate) {
            toExhibitRef.current.set(...candidate.position).sub(rayOriginRef.current)
            const score = toExhibitRef.current.dot(dir)
            if (score > aimedScore) {
              aimedScore = score
              aimedByController = candidate
            }
          }
        }
      } else if (xrFrame && referenceSpace && inputSource?.targetRaySpace) {
        const pose = xrFrame.getPose(inputSource.targetRaySpace, referenceSpace)
        if (pose) {
          rayOriginRef.current.set(
            pose.transform.position.x,
            pose.transform.position.y,
            pose.transform.position.z,
          )

          rayQuatRef.current.set(
            pose.transform.orientation.x,
            pose.transform.orientation.y,
            pose.transform.orientation.z,
            pose.transform.orientation.w,
          )

          rayDirRef.current.set(0, 0, -1).applyQuaternion(rayQuatRef.current).normalize()
          const candidate = findFocusedExhibitFromRay(rayOriginRef.current, rayDirRef.current)
          if (candidate) {
            toExhibitRef.current.set(...candidate.position).sub(rayOriginRef.current)
            const score = toExhibitRef.current.dot(rayDirRef.current)
            if (score > aimedScore) {
              aimedScore = score
              aimedByController = candidate
            }
          }
        }
      }

      if (!gamepad) {
        continue
      }

      const axes = gamepad.axes || []
      const stickPairs = []
      if (axes.length >= 2) {
        stickPairs.push([axes[0] || 0, axes[1] || 0])
      }
      if (axes.length >= 4) {
        stickPairs.push([axes[2] || 0, axes[3] || 0])
      }

      if (stickPairs.length > 0) {
        let stickX = 0
        let stickY = 0
        let strongestMagnitude = 0
        for (const [candidateX, candidateY] of stickPairs) {
          const magnitude = Math.hypot(candidateX, candidateY)
          if (magnitude > strongestMagnitude) {
            strongestMagnitude = magnitude
            stickX = candidateX
            stickY = candidateY
          }
        }

        if (inputSource?.handedness === 'right') {
          turnInput += stickX
          turnSamples += 1
          moveForwardInput += stickY
          moveSamples += 1
        } else if (inputSource?.handedness === 'left') {
          moveStrafeInput += stickX
          moveForwardInput += stickY
          moveSamples += 1
        } else {
          moveStrafeInput += stickX
          moveForwardInput += stickY
          moveSamples += 1
          turnInput += stickX
          turnSamples += 1
        }
      }

      const triggerPrimary = gamepad.buttons?.[0]
      const triggerSecondary = gamepad.buttons?.[1]
      const anyButtonPressed = gamepad.buttons?.some((button) => button?.pressed || (button?.value ?? 0) > 0.2)
      const triggerPressedNow =
        !!triggerPrimary?.pressed ||
        !!triggerSecondary?.pressed ||
        (triggerPrimary?.value ?? 0) > 0.2 ||
        (triggerSecondary?.value ?? 0) > 0.2 ||
        !!anyButtonPressed

      if (triggerPressedNow) {
        triggerPressed = true
      }
    }

    aimedExhibitRef.current = aimedByController || findFocusedExhibit()

    if (moveSamples > 0) {
      moveStrafeInput /= moveSamples
      moveForwardInput /= moveSamples
    }
    if (turnSamples > 0) {
      turnInput /= turnSamples
    }

    const deadZone = 0.15
    if (Math.abs(moveStrafeInput) < deadZone) moveStrafeInput = 0
    if (Math.abs(moveForwardInput) < deadZone) moveForwardInput = 0
    if (Math.abs(turnInput) < deadZone) turnInput = 0

    let turnStep = 0
    if (turnInput !== 0) {
      const turnSpeed = 1.9
      turnStep = turnInput * turnSpeed * delta
      movementTarget.rotation.y += turnStep
      locomotionYawRef.current -= turnStep
    }

    const yawQuaternion = new Quaternion().setFromAxisAngle(up, -locomotionYawRef.current)

    let moveStrafeStep = 0
    let moveForwardStep = 0

    if (moveStrafeInput !== 0 || moveForwardInput !== 0) {
      if (hasLeftControllerBasis) {
        forwardRef.current.copy(leftControllerForwardRef.current)
        rightRef.current.copy(leftControllerRightRef.current)
      } else {
        forwardRef.current.set(0, 0, -1).applyQuaternion(yawQuaternion)
        forwardRef.current.normalize()
        rightRef.current.set(1, 0, 0).applyQuaternion(yawQuaternion)
        rightRef.current.normalize()
      }

      const speed = 2.1
      moveStrafeStep = moveStrafeInput * speed * delta
      moveForwardStep = -moveForwardInput * speed * delta

      movementTarget.position.addScaledVector(rightRef.current, moveStrafeStep)
      movementTarget.position.addScaledVector(forwardRef.current, moveForwardStep)
    }

    if (moveStrafeStep !== 0 || moveForwardStep !== 0 || turnStep !== 0) {
      const baseRefSpace = xrBaseReferenceSpaceRef.current || gl.xr.getReferenceSpace?.()
      if (baseRefSpace && typeof XRRigidTransform !== 'undefined') {
        if (moveStrafeStep !== 0 || moveForwardStep !== 0) {
          locomotionOffsetRef.current.addScaledVector(rightRef.current, moveStrafeStep)
          locomotionOffsetRef.current.addScaledVector(forwardRef.current, moveForwardStep)
        }

        const offsetRefSpace = baseRefSpace.getOffsetReferenceSpace(
          new XRRigidTransform({
            x: -locomotionOffsetRef.current.x,
            y: 0,
            z: -locomotionOffsetRef.current.z,
          }, {
            x: yawQuaternion.x,
            y: yawQuaternion.y,
            z: yawQuaternion.z,
            w: yawQuaternion.w,
          }),
        )
        gl.xr.setReferenceSpace(offsetRefSpace)
      }
    }

    if (triggerPressed && !triggerLatchedRef.current) {
      const focusedExhibit = aimedExhibitRef.current || findFocusedExhibit()
      if (focusedExhibit) {
        onExhibitClick(focusedExhibit)
      }
    }

    triggerLatchedRef.current = triggerPressed
  })

  return (
    <>
      {exhibits.map((exhibit, index) => (
        <ExhibitBeacon
          key={exhibit.id}
          position={exhibit.position}
          color={exhibit.color}
          modelPath={HOTEL_HALL_EXHIBIT_MODELS[exhibit.id]}
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
  const { worldId } = useParams()
  const [searchParams] = useSearchParams()
  const selectedWorldId = worldId || searchParams.get('world') || DEFAULT_WORLD_ID
  const selectedWorld = WORLD_REGISTRY[selectedWorldId] || WORLD_REGISTRY[DEFAULT_WORLD_ID]
  const transform = getWorldTransform(selectedWorld.id)
  const exhibits = selectedWorld.exhibits
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
  const [immersiveRequested, setImmersiveRequested] = useState(false)
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

  const currentNode = NAV_NODES[activeNodeId]
  const currentExhibitModelPath = currentExhibit ? HOTEL_HALL_EXHIBIT_MODELS[currentExhibit.id] : null

  const endVRSession = useCallback(async () => {
    const activeSession = xrSessionRef.current || rendererRef.current?.xr?.getSession?.()
    if (!activeSession) {
      return
    }

    try {
      await activeSession.end()
    } catch {
      // The session may already be ended by the headset runtime.
    }
  }, [])

  const startVRSession = useCallback(
    async ({ fromUserAction = false } = {}) => {
      if ((!isVRMode && !fromUserAction) || !rendererRef.current) {
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
          setIsVRMode(true)
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
        setIsVRMode(true)
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

    const current = NAV_NODES[activeNodeId]
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

    void startVRSession({ fromUserAction: true })
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
          !immersiveRequested && (
            <button
              className="exhibition-nav-toggle exhibition-nav-toggle--vr-exit"
              onClick={() => {
                setImmersiveRequested(true)
                void startVRSession({ fromUserAction: true })
              }}
              title="Start immersive headset session"
            >
              Enter Immersive VR
            </button>
          )
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
        {isVRMode && !isXRActive && (
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
        camera={{ position: [-1.6, 1.6, 2.5] }}
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
            <>
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
              <Effects saturation={saturation} />
            </>
          ) : (
            <>
              <VRCameraController exhibits={exhibits} onExhibitClick={onExhibitClick} />
            </>
          )}
          <Model
            modelPath={selectedWorld.modelPath}
            scale={transform.scale ?? 1}
            position={[transform.posX ?? 0, transform.posY ?? 0, transform.posZ ?? 0]}
            rotationYDeg={transform.rotationYDeg ?? 0}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

useGLTF.preload('/assets/models/hotel_hall.glb')