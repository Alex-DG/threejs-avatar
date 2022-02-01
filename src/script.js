import './style.css'
import * as THREE from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { Pane } from 'tweakpane'

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
)

camera.position.z = 0.5
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Debug
 */
const pane = new Pane()

const debugParams = {
  useShader: false,
  color: '#84ccff',
}

const f1 = pane.addFolder({
  title: 'AmbientLight',
})
const f2 = pane.addFolder({
  title: 'DirectionalLight',
})
const f3 = pane.addFolder({ title: 'XRay Shader' })
/**
 * Light
 */

// AMBIENT
const ambientLight = new THREE.AmbientLight('#FFFFFF', 1.2) // 1.11
scene.add(ambientLight)

f1.addInput(ambientLight, 'intensity', {
  min: 0,
  max: 2,
  step: 0.01,
  label: 'intensity',
})

// DIRECTIONAL
const directionalLight = new THREE.DirectionalLight('#FFC0CB', 1.57)
directionalLight.position.set(0.0, 0.35, 4)
scene.add(directionalLight)

f2.addInput(directionalLight, 'intensity', {
  min: 0,
  max: 2,
  step: 0.01,
  label: 'intensity',
})
f2.addInput(directionalLight.position, 'x', {
  min: -4,
  max: 4,
  step: 0.01,
  label: 'x',
})
f2.addInput(directionalLight.position, 'y', {
  min: -4,
  max: 4,
  step: 0.01,
  label: 'y',
})
f2.addInput(directionalLight.position, 'z', {
  min: -4,
  max: 4,
  step: 0.01,
  label: 'z',
})

/**
 * Model
 */
let alex

const modelLoader = new GLTFLoader()

let defaultMaterials = []

// XRay shader material
const xRayMaterial = new THREE.ShaderMaterial({
  wireframe: true,
  uniforms: {
    uPower: { value: 3.0 },
    uOpacity: { value: 1.0 },
    uGlowColor: { value: new THREE.Color(0x84ccff) },
  },
  vertexShader: `
    uniform float uPower;
    varying float vIntensity;
    ${THREE.ShaderChunk.skinning_pars_vertex}
    void main() {
      vec3 vNormal = normalize(normalMatrix * normal);
      
      mat4 modelViewProjectionMatrix = projectionMatrix * modelViewMatrix;
      ${THREE.ShaderChunk.beginnormal_vertex}
      ${THREE.ShaderChunk.skinbase_vertex}
      ${THREE.ShaderChunk.skinnormal_vertex}
  
      vec3 transformed = vec3(position);
  
      ${THREE.ShaderChunk.skinning_vertex}
  
      gl_Position = modelViewProjectionMatrix * vec4(transformed, 1.0);
      vIntensity = pow(1.0 - abs(dot(vNormal, vec3(0, 0, 1))), uPower);
    }
  `,
  fragmentShader: `
      uniform vec3 uGlowColor;
      uniform float uOpacity;
      varying float vIntensity;
      void main()
      {
          vec3 glow = uGlowColor * vIntensity;
          gl_FragColor = vec4( glow, uOpacity );
      }
    `,
  blending: THREE.AdditiveBlending,
  transparent: true,
  depthWrite: false,
})

modelLoader.load('model/alex.glb', (model) => {
  alex = model.scene
  model.scene.position.y = -0.1
  model.scene.position.z = -0.1

  model.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true
      child.receiveShadow = true

      child.material.opacity = 1
      child.material.transparent = true

      defaultMaterials[child.name] = child.material
    }
  })

  scene.add(model.scene)
})

f3.addInput(debugParams, 'useShader', {
  label: 'enabled',
}).on('change', ({ value }) => {
  alex.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const newMat = value ? xRayMaterial : defaultMaterials[child.name]

      child.material = newMat

      if (child.name.toLowerCase().includes('eye')) {
        child.visible = !value
      }
    }
  })
})

f3.addInput(xRayMaterial.uniforms.uPower, 'value', {
  min: -10,
  max: 10,
  step: 0.001,
  label: 'power',
})

f3.addInput(xRayMaterial.uniforms.uOpacity, 'value', {
  min: 0,
  max: 1,
  step: 0.01,
  label: 'opacity',
})

f3.addInput(debugParams, 'color', {
  label: 'glow color',
}).on('change', ({ value }) => {
  xRayMaterial.uniforms.uGlowColor.value = new THREE.Color(value)
})

/**
 * Mouse
 */
const position = new THREE.Vector2()

canvas.addEventListener('mousemove', (e) => {
  position.x = e.clientX / sizes.width - 0.5
  position.y = e.clientY / sizes.height - 0.5
})

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()
let lastElapsedTime = 0

const tick = () => {
  const elapsedTime = clock.getElapsedTime()
  const deltaTime = elapsedTime - lastElapsedTime
  lastElapsedTime = elapsedTime

  if (alex) alex.rotation.set(position.y / 5, position.x, 0)

  // Update controls
  controls.update()

  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()
