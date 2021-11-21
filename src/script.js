import './style.css'
import * as THREE from 'three'

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

/**
 * Debug
 */
const pane = new Pane()

const f1 = pane.addFolder({
  title: 'Ambient',
})
const f2 = pane.addFolder({
  title: 'Directional',
})

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

modelLoader.load('model/alex.glb', (model) => {
  alex = model.scene
  model.scene.position.y = -0.1
  model.scene.position.z = -0.1

  scene.add(model.scene)
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

  if (alex) {
    alex.rotation.set(position.y / 5, position.x, 0)
  }

  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()
