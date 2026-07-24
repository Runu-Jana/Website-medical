import * as THREE from 'three'

// A friendly, procedurally-built pharmacist character for the onboarding
// backdrop — rounded head, glasses, lab coat, stethoscope and a pill bottle in
// hand, gently breathing/​swaying on a clean white background. No external model
// files, so it stays small and runs on low-end phones. Throws if WebGL is
// unavailable so the caller can fall back to a static illustration.
//
// createOnboardingScene(canvas) → { setSlide, resize, dispose }

const SKIN = 0xf1c197
const HAIR = 0x5b3b22
const COAT = 0xffffff
const SCRUB = 0x0e9f8e
const INK = 0x1e293b
const METAL = 0x9aa4b2

const mat = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...opts })

// Assemble the pharmacist as a group centred around the origin (head up, waist
// down). Returns { group, bottle } so the animation can bob the held bottle.
function makePharmacist() {
  const g = new THREE.Group()
  const skin = mat(SKIN)
  const coat = mat(COAT, { roughness: 0.5 })
  const scrub = mat(SCRUB)
  const ink = mat(INK, { roughness: 0.45 })

  // ── Head ──
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.62, 40, 40), skin)
  head.position.y = 1.18
  head.scale.set(1, 1.05, 0.98)
  g.add(head)

  // Hair — cap over the top/back of the head
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.66, 40, 40, 0, Math.PI * 2, 0, Math.PI * 0.52),
    mat(HAIR, { roughness: 0.8 })
  )
  hair.position.y = 1.26
  hair.rotation.x = -0.12
  g.add(hair)

  // Ears
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), skin)
    ear.position.set(0.6 * s, 1.14, 0.02)
    g.add(ear)
  }

  // Eyes (whites + dark pupils)
  const white = mat(0xffffff, { roughness: 0.25 })
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.1, 18, 18), white)
    w.position.set(0.22 * s, 1.22, 0.52)
    w.scale.z = 0.55
    g.add(w)
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), ink)
    p.position.set(0.23 * s, 1.22, 0.6)
    g.add(p)
    // brow
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.06), mat(HAIR))
    brow.position.set(0.23 * s, 1.36, 0.55)
    brow.rotation.z = -0.06 * s
    g.add(brow)
  }

  // Glasses — two rings + bridge
  const glass = mat(INK, { roughness: 0.35, metalness: 0.3 })
  for (const s of [-1, 1]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.028, 14, 30), glass)
    ring.position.set(0.23 * s, 1.22, 0.55)
    g.add(ring)
  }
  const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.18, 8), glass)
  bridge.rotation.z = Math.PI / 2
  bridge.position.set(0, 1.22, 0.55)
  g.add(bridge)

  // Smile — half torus
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.14, 0.028, 12, 24, Math.PI),
    mat(0x9c5044)
  )
  smile.position.set(0, 1.0, 0.52)
  smile.rotation.z = Math.PI
  g.add(smile)

  // ── Neck ──
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.22, 0.28, 20), skin)
  neck.position.y = 0.64
  g.add(neck)

  // ── Torso (teal scrubs core) ──
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.66, 1.25, 28), scrub)
  torso.position.y = -0.05
  g.add(torso)

  // ── Lab coat shell (white), slightly larger, flattened front→back ──
  const coatMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.72, 1.3, 28), coat)
  coatMesh.position.set(0, -0.05, -0.02)
  coatMesh.scale.z = 0.92
  g.add(coatMesh)

  // Coat lapels — two angled slabs down the front, leaving a teal V of scrubs
  for (const s of [-1, 1]) {
    const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.26, 1.2, 0.08), coat)
    lapel.position.set(0.16 * s, -0.05, 0.5)
    lapel.rotation.z = 0.14 * s
    g.add(lapel)
  }

  // ── Stethoscope: tubing around the neck + hanging ends + chest piece ──
  const tube = mat(0x2f6f68, { roughness: 0.4 })
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.035, 14, 40, Math.PI * 1.15), tube)
  collar.position.set(0, 0.5, 0.16)
  collar.rotation.x = Math.PI * 0.52
  g.add(collar)
  for (const s of [-1, 1]) {
    const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.6, 10), tube)
    drop.position.set(0.28 * s, 0.16, 0.42)
    drop.rotation.x = -0.2
    drop.rotation.z = 0.16 * s
    g.add(drop)
  }
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 20), mat(METAL, { metalness: 0.6, roughness: 0.3 }))
  chest.position.set(-0.2, -0.14, 0.52)
  chest.rotation.x = Math.PI / 2
  g.add(chest)

  // ── Arms ──
  // Left arm (screen-right) resting down the side.
  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.7, 8, 16), coat)
  armL.position.set(-0.66, -0.1, 0.05)
  armL.rotation.z = 0.18
  g.add(armL)
  // Right arm (screen-left) bent forward to hold the bottle.
  const armR = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.55, 8, 16), coat)
  armR.position.set(0.58, 0.02, 0.18)
  armR.rotation.set(0.5, 0, -0.35)
  g.add(armR)
  const foreR = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.45, 8, 16), coat)
  foreR.position.set(0.4, -0.12, 0.55)
  foreR.rotation.set(1.15, 0, -0.2)
  g.add(foreR)
  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 18), skin)
  handR.position.set(0.28, -0.02, 0.72)
  g.add(handR)

  // ── Pill bottle in the right hand ──
  const bottle = new THREE.Group()
  const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.42, 24), mat(0xffffff, { roughness: 0.3 }))
  bottle.add(jar)
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 24), mat(0xf97316, { roughness: 0.45 }))
  cap.position.y = 0.27
  bottle.add(cap)
  // Red cross label on the front
  const labelBg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.01), mat(0xffffff, { roughness: 0.4 }))
  labelBg.position.set(0, -0.02, 0.162)
  bottle.add(labelBg)
  const crossMat = mat(0xef4444, { roughness: 0.5 })
  const cv = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.02), crossMat)
  cv.position.set(0, -0.02, 0.17)
  bottle.add(cv)
  const ch = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.02), crossMat)
  ch.position.set(0, -0.02, 0.17)
  bottle.add(ch)
  bottle.position.set(0.3, 0.12, 0.74)
  bottle.rotation.z = -0.15
  g.add(bottle)

  return { group: g, bottle }
}

export function createOnboardingScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'default' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0xffffff) // clean white studio

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
  camera.position.set(0, 0.3, 5.0)
  camera.lookAt(0, 0.35, 0)

  // Soft studio lighting.
  scene.add(new THREE.AmbientLight(0xffffff, 1.05))
  const key = new THREE.DirectionalLight(0xffffff, 1.15)
  key.position.set(2.5, 4, 4)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xdff3ef, 0.6)
  fill.position.set(-4, 1, 2)
  scene.add(fill)
  const rim = new THREE.DirectionalLight(0xffffff, 0.5)
  rim.position.set(0, 2, -4)
  scene.add(rim)

  const { group: pharma, bottle } = makePharmacist()
  pharma.position.y = -0.1 // sit a touch lower so the head clears the brand mark
  scene.add(pharma)

  // Soft contact shadow under the character (a faded dark ellipse).
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.85, 40),
    new THREE.MeshBasicMaterial({ color: 0x0e9f8e, transparent: true, opacity: 0.1 })
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = -0.85
  shadow.scale.set(1, 0.45, 1)
  scene.add(shadow)

  // Per-slide gentle turn so each slide feels a touch different.
  const slideTurns = [0, 0.28, -0.28]
  let targetTurn = 0
  const setSlide = (i) => {
    targetTurn = slideTurns[Math.max(0, Math.min(slideTurns.length - 1, i))] || 0
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
  const baseY = pharma.position.y

  const animate = () => {
    if (!running) return
    raf = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()

    // Gentle breathing bob + idle sway, easing toward the current slide's turn.
    pharma.position.y = baseY + Math.sin(t * 1.1) * 0.04
    const sway = Math.sin(t * 0.5) * 0.12 + targetTurn
    pharma.rotation.y += (sway - pharma.rotation.y) * 0.05
    // Little bottle bob so it reads as "presenting" the medicine.
    bottle.position.y = 0.12 + Math.sin(t * 1.6) * 0.02
    bottle.rotation.z = -0.15 + Math.sin(t * 0.9) * 0.05

    renderer.render(scene, camera)
  }
  animate()

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
