<template>
  <div ref="container" class="three-container" :style="{ width, height }"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

const props = defineProps({
  width: { type: String, default: '100%' },
  height: { type: String, default: '100%' },
  sceneType: { type: String, default: 'showcase' }
})

const emit = defineEmits(['scene-ready'])

const container = ref(null)
let renderer = null
let scene = null
let camera = null
let animationId = null

onMounted(() => {
  initThreeJS()
})

onUnmounted(() => {
  cleanup()
})

const initThreeJS = () => {
  if (!container.value) return

  const width = container.value.clientWidth
  const height = container.value.clientHeight

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf0f0f0)

  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  camera.position.z = 5

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 5, 5)
  scene.add(directionalLight)

  if (props.sceneType === 'showcase') {
    setupShowcaseScene()
  } else if (props.sceneType === 'cutscene') {
    setupCutsceneScene()
  }

  animate()
  emit('scene-ready', { scene, camera, renderer })
}

const setupShowcaseScene = () => {
  const geometry = new THREE.SphereGeometry(1.5, 32, 32)
  const material = new THREE.MeshPhongMaterial({
    color: 0xFFB7C5,
    shininess: 100,
    specular: 0x444444
  })
  const sphere = new THREE.Mesh(geometry, material)
  sphere.name = 'character-model'
  scene.add(sphere)

  const platformGeometry = new THREE.CylinderGeometry(2, 2, 0.2, 32)
  const platformMaterial = new THREE.MeshPhongMaterial({ color: 0x4A90D9 })
  const platform = new THREE.Mesh(platformGeometry, platformMaterial)
  platform.position.y = -2
  scene.add(platform)
}

const setupCutsceneScene = () => {
  const geometry = new THREE.BoxGeometry(4, 2, 0.1)
  const material = new THREE.MeshBasicMaterial({ color: 0x000000 })
  const backdrop = new THREE.Mesh(geometry, material)
  backdrop.position.z = -3
  scene.add(backdrop)
}

const animate = () => {
  animationId = requestAnimationFrame(animate)

  const characterModel = scene?.getObjectByName('character-model')
  if (characterModel) {
    characterModel.rotation.y += 0.01
  }

  renderer?.render(scene, camera)
}

const cleanup = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (renderer) {
    renderer.dispose()
  }
  if (container.value && renderer) {
    const canvas = container.value.querySelector('canvas')
    if (canvas) {
      container.value.removeChild(canvas)
    }
  }
}

defineExpose({ scene, camera, renderer })
</script>

<style scoped>
.three-container {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
}

.three-container canvas {
  display: block;
}
</style>
