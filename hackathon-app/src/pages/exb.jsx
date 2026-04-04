import { Canvas, useFrame, useThree, extend } from '@react-three/fiber'
import { PointerLockControls, useGLTF } from '@react-three/drei'
import { useRef, useEffect, useState, Suspense } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Vector3 } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import '../exb.css'

extend({ EffectComposer, RenderPass, ShaderPass })

function Model(props) {
  const { scene } = useGLTF('/assets/models/hotel_hall.glb')
  return <primitive object={scene} {...props} />
}

// Glowing block component
function GlowingBlock({ position, onProximity }) {
  const meshRef = useRef()
  const { camera } = useThree()
  
  useFrame((state) => {
    // Animate the glow
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.2
      
      // Check distance to camera
      const distance = camera.position.distanceTo(new Vector3(...position))
      onProximity(distance)
    }
  })
  
  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial 
        color="#00ffff" 
        emissive="#00ffff" 
        emissiveIntensity={2}
        toneMapped={false}
      />
      {/* Add point light for glow effect */}
      <pointLight color="#00ffff" intensity={3} distance={5} />
    </mesh>
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

function CameraController({ setSaturation, canInteract, setCanInteract, onInteract }) {
  const { camera } = useThree()
  const moveSpeed = 0.025
  const velocity = useRef(new Vector3())
  const direction = useRef(new Vector3())
  const targetSaturation = useRef(1.0)
  const currentSaturation = useRef(1.0)
  const canInteractRef = useRef(false)
  
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
  })
  
  const handleProximity = (distance) => {
    const nearObject = distance < 3
    canInteractRef.current = nearObject
    if (canInteract !== nearObject) {
      setCanInteract(nearObject)
    }

    // Restore scene color based on proximity only.
    targetSaturation.current = nearObject ? 0.0 : 1.0
  }

  useEffect(() => {
    canInteractRef.current = canInteract
  }, [canInteract])

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.code) {
        case 'KeyW':
          keys.current.forward = true
          break
        case 'KeyS':
          keys.current.backward = true
          break
        case 'KeyA':
          keys.current.left = true
          break
        case 'KeyD':
          keys.current.right = true
          break
        case 'Space':
          keys.current.up = true
          break
        case 'KeyX':
          keys.current.down = true
          break
        case 'KeyE':
          if (canInteractRef.current) {
            onInteract()
          }
          break
      }
    }

    const handleKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW':
          keys.current.forward = false
          break
        case 'KeyS':
          keys.current.backward = false
          break
        case 'KeyA':
          keys.current.left = false
          break
        case 'KeyD':
          keys.current.right = false
          break
        case 'Space':
          keys.current.up = false
          break
        case 'KeyX':
          keys.current.down = false
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useFrame(() => {
    direction.current.set(0, 0, 0)

    if (keys.current.forward) {
      camera.getWorldDirection(direction.current)
      direction.current.y = 0
      direction.current.normalize()
      velocity.current.add(direction.current.multiplyScalar(moveSpeed))
    }
    if (keys.current.backward) {
      camera.getWorldDirection(direction.current)
      direction.current.y = 0
      direction.current.normalize()
      velocity.current.sub(direction.current.multiplyScalar(moveSpeed))
    }
    if (keys.current.left) {
      camera.getWorldDirection(direction.current)
      direction.current.y = 0
      direction.current.normalize()
      direction.current.cross(camera.up)
      velocity.current.sub(direction.current.multiplyScalar(moveSpeed))
    }
    if (keys.current.right) {
      camera.getWorldDirection(direction.current)
      direction.current.y = 0
      direction.current.normalize()
      direction.current.cross(camera.up)
      velocity.current.add(direction.current.multiplyScalar(moveSpeed))
    }
    if (keys.current.up) {
      velocity.current.y += moveSpeed
    }
    if (keys.current.down) {
      velocity.current.y -= moveSpeed
    }

    camera.position.add(velocity.current)
    velocity.current.multiplyScalar(0.8) // Damping
    
    // Boundaries based on your coordinates
    // X boundaries: left wall to right door
    camera.position.x = Math.max(-5.31, Math.min(-0.46, camera.position.x))
    // Y boundaries: floor to ceiling
    camera.position.y = Math.max(1.22, Math.min(9.72, camera.position.y))
    // Z boundaries: front wall to start door
    camera.position.z = Math.max(-2.20, Math.min(4.25, camera.position.z))
    
    // Smoothly interpolate saturation
    currentSaturation.current += (targetSaturation.current - currentSaturation.current) * 0.05
    setSaturation(currentSaturation.current)
  })

  return <GlowingBlock position={[-2.5, 2, 1]} onProximity={handleProximity} />
}

export default function Exhibition() {
  const location = useLocation()
  const navigate = useNavigate()
  const [saturation, setSaturation] = useState(1.0)
  const [canInteract, setCanInteract] = useState(false)
  const [interactionText, setInteractionText] = useState('')
  const interactionTimerRef = useRef(null)

  const handleInteract = () => {
    setInteractionText('You touched the artifact. It vibrates with hidden memory.')
    if (interactionTimerRef.current) {
      clearTimeout(interactionTimerRef.current)
    }
    interactionTimerRef.current = setTimeout(() => {
      setInteractionText('')
    }, 2400)
  }

  useEffect(() => {
    if (location.pathname !== '/exhibition/start') {
      return
    }

    const onKeyDown = (e) => {
      if (e.code === 'Escape') {
        navigate('/')
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [location.pathname, navigate])

  useEffect(() => {
    return () => {
      if (interactionTimerRef.current) {
        clearTimeout(interactionTimerRef.current)
      }
    }
  }, [])

  if (location.pathname === '/exhibition') {
    return (
      <div className="exhibition-entry">
        <div className="exhibition-entry__card">
          <h1 className="exhibition-entry__title">Enter The Exhibition</h1>
          <p className="exhibition-entry__text">
            Step into the 3D hall and explore the interactive installation.
          </p>
          <Link to="/exhibition/start" className="exhibition-entry__button">
            Start
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="exhibition-page">
      <div className="exhibition-hud">
        <h2 className="exhibition-hud__title">Controls</h2>
        <p className="exhibition-hud__line">Move: W A S D</p>
        <p className="exhibition-hud__line">Up: Space</p>
        <p className="exhibition-hud__line">Down: X</p>
        <p className="exhibition-hud__line">Interact: E {canInteract ? '(available)' : '(get closer)'}</p>
        <p className="exhibition-hud__line">Press Esc: Back to Home</p>
        {interactionText && <p className="exhibition-hud__hint">{interactionText}</p>}
      </div>
      <Canvas className="exhibition-canvas" camera={{ position: [0, 1.6, 5] }}>
        <ambientLight intensity={1} />
        <directionalLight position={[5, 5, 5]} />
        <Suspense fallback={null}>
          <PointerLockControls />
          <CameraController
            setSaturation={setSaturation}
            canInteract={canInteract}
            setCanInteract={setCanInteract}
            onInteract={handleInteract}
          />
          <Model />
        </Suspense>
        <Effects saturation={saturation} />
      </Canvas>
    </div>
  )
}

useGLTF.preload('/assets/models/hotel_hall.glb')