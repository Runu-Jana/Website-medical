import * as THREE from 'three'

// A lightweight, procedurally-built pharmacy scene for the onboarding backdrop:
// colourful floating medicine capsules and tablets (red/white, blue/white,
// yellow/orange, teal, purple… ), a slowly rotating molecule, and a soft
// particle field. No external model files, so it stays small and runs smoothly
// even on low-end phones. Throws if WebGL is unavailable so the caller can fall
// back to a static illustration.
//
// createOnboardingScene(canvas) → { setSlide, resize, dispose }

const TEAL = 0x0e9f8e
const TEAL_LIGHT = 0x2dd4bf
const WHITE = 0xffffff

// Vibrant medicine palette — two-tone capsule pairs [top colour, bottom colour].
const CAPSULE_PAIRS = [
  [0xef4444, 0xffffff], // red / white
  [0x3b82f6, 0xffffff], // blue / white
  [0xfacc15, 0xf97316], // yellow / orange
  [0x0e9f8e, 0xffffff], // teal / white
  [0x8b5cf6, 0xffffff], // purple / white
  [0xf97316, 0xfde68a], // orange / cream
  [0x22c55e, 0xffffff], // green / white
  [0x38bdf8, 0x0ea5e9], // sky / blue
  [0xec4899, 0xffffff], // pink / white
  [0xef4444, 0xfacc15], // red / yellow
]

// Solid round-tablet colours.
const TABLET_COLORS = [0xffffff, 0xf97316, 0xfacc15, 0x38bdf8, 0xf472b6, 0x86efac, 0xef4444]

// Two-tone capsule in a single mesh: top half colour A, bottom half colour B
// (via per-vertex colours), so it reads like a real medicine capsule.
function makeCapsule(colorA, colorB) {
  const geo = new THREE.CapsuleGeometry(0.16, 0.46, 8, 16)
  const pos = geo.attributes.position
  const colors = new Float32Array(pos.count * 3)
  const cA = new THREE.Color(colorA)
  const cB = new THREE.Color(colorB)
  for (let i = 0; i < pos.count; i++) {
    const c = pos.getY(i) >= 0 ? cA : cB
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.32, metalness: 0.05 })
  return new THREE.Mesh(geo, mat)
}

// A round tablet / pill (flattened disc).
function makeTablet(color) {
  const geo = new THREE.CylinderGeometry(0.26, 0.26, 0.12, 24)
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.45,
    metalness: 0.04,
    emissive: new THREE.Color(color).multiplyScalar(0.04),
  })
  return new THREE.Mesh(geo, mat)
}

export function createOnboardingScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'default' })
  // Cap the pixel ratio so we never over-render on high-DPI phones.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100)
  camera.position.set(0, 0, 6)

  // Soft, airy lighting.
  scene.add(new THREE.AmbientLight(WHITE, 1.15))
  const key = new THREE.DirectionalLight(WHITE, 1.1)
  key.position.set(3, 4, 5)
  scene.add(key)
  const rim = new THREE.PointLight(TEAL_LIGHT, 0.9, 30)
  rim.position.set(-4, -2, 3)
  scene.add(rim)

  // ── Floating medicines (colourful capsules + round tablets) ────────
  const capsules = []
  const capsuleGroup = new THREE.Group()
  // Give each floater a random position, tumble and gentle bob so the whole
  // group drifts like pills suspended in liquid.
  const addFloater = (m) => {
    m.position.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4 - 1)
    m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
    m.userData = {
      spin: new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4),
      bob: 0.15 + Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
      baseY: m.position.y,
    }
    capsules.push(m)
    capsuleGroup.add(m)
  }
  // 11 vibrant two-tone capsules…
  for (let i = 0; i < 11; i++) {
    const [a, b] = CAPSULE_PAIRS[i % CAPSULE_PAIRS.length]
    addFloater(makeCapsule(a, b))
  }
  // …and 5 solid round tablets sprinkled in.
  for (let i = 0; i < 5; i++) {
    addFloater(makeTablet(TABLET_COLORS[i % TABLET_COLORS.length]))
  }
  scene.add(capsuleGroup)

  // ── Molecule (central atom + orbiting atoms + bonds) ───────────────
  const molecule = new THREE.Group()
  const atomMat = new THREE.MeshStandardMaterial({ color: TEAL, roughness: 0.3, emissive: new THREE.Color(TEAL).multiplyScalar(0.1) })
  const nodeMat = new THREE.MeshStandardMaterial({ color: TEAL_LIGHT, roughness: 0.3 })
  const bondMat = new THREE.MeshStandardMaterial({ color: WHITE, roughness: 0.6, transparent: true, opacity: 0.55 })
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 20), atomMat)
  molecule.add(core)
  const orbits = 4
  for (let i = 0; i < orbits; i++) {
    const a = (i / orbits) * Math.PI * 2
    const r = 0.85
    const pos = new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * 0.7, Math.sin(a * 1.3) * 0.4)
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), nodeMat)
    node.position.copy(pos)
    molecule.add(node)
    // bond = thin cylinder from core to node
    const bond = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, pos.length(), 8), bondMat)
    bond.position.copy(pos.clone().multiplyScalar(0.5))
    bond.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize())
    molecule.add(bond)
  }
  molecule.position.set(2.4, 1.1, -0.5)
  molecule.scale.setScalar(0.9)
  scene.add(molecule)

  // ── Particle field (soft floating dust) ────────────────────────────
  const pCount = 260
  const pGeo = new THREE.BufferGeometry()
  const pPos = new Float32Array(pCount * 3)
  for (let i = 0; i < pCount; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 14
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 10
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
  const points = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({ color: TEAL_LIGHT, size: 0.05, transparent: true, opacity: 0.5, depthWrite: false })
  )
  scene.add(points)

  // Per-slide gentle camera targets (subtle parallax between slides).
  const slideTargets = [
    { x: 0, y: 0 },
    { x: 0.7, y: 0.3 },
    { x: -0.6, y: -0.2 },
  ]
  let targetX = 0
  let targetY = 0
  const setSlide = (i) => {
    const t = slideTargets[Math.max(0, Math.min(slideTargets.length - 1, i))] || slideTargets[0]
    targetX = t.x
    targetY = t.y
  }

  const resize = () => {
    const w = canvas.clientWidth || canvas.parentElement?.clientWidth || window.innerWidth
    const h = canvas.clientHeight || canvas.parentElement?.clientHeight || window.innerHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()

  const clock = new THREE.Clock()
  let raf = 0
  let running = true

  const animate = () => {
    if (!running) return
    raf = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()

    for (const m of capsules) {
      m.rotation.x += m.userData.spin.x * 0.01
      m.rotation.y += m.userData.spin.y * 0.01
      m.position.y = m.userData.baseY + Math.sin(t * 0.6 + m.userData.phase) * m.userData.bob
    }
    capsuleGroup.rotation.y = Math.sin(t * 0.1) * 0.15
    molecule.rotation.y += 0.006
    molecule.rotation.x = Math.sin(t * 0.4) * 0.2
    points.rotation.y = t * 0.02

    // Ease the camera toward the current slide's parallax target.
    camera.position.x += (targetX - camera.position.x) * 0.05
    camera.position.y += (targetY - camera.position.y) * 0.05
    camera.lookAt(0, 0, 0)

    renderer.render(scene, camera)
  }
  animate()

  // Pause when the tab/app is backgrounded — saves battery.
  const onVisibility = () => {
    if (document.hidden) {
      running = false
      cancelAnimationFrame(raf)
    } else if (!running) {
      running = true
      clock.getDelta()
      animate()
    }
  }
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('resize', resize)

  const dispose = () => {
    running = false
    cancelAnimationFrame(raf)
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('resize', resize)
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose?.()
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach((mm) => mm.dispose?.())
      }
    })
    renderer.dispose()
  }

  return { setSlide, resize, dispose }
}
