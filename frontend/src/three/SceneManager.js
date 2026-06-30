import * as THREE from 'three'

export class SceneManager {
  constructor(container) {
    this.container = container
    this.scene = null
    this.camera = null
    this.renderer = null
    this.currentScene = null
    this.scenes = new Map()
  }

  init() {
    this.scene = new THREE.Scene()
    
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    )
    this.camera.position.z = 5

    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    })
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.container.appendChild(this.renderer.domElement)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 5, 5)
    this.scene.add(directionalLight)

    window.addEventListener('resize', () => this.onResize())

    this.animate()
  }

  registerScene(name, sceneSetup) {
    this.scenes.set(name, sceneSetup)
  }

  loadScene(name) {
    if (this.currentScene) {
      this.currentScene.cleanup()
    }

    const sceneSetup = this.scenes.get(name)
    if (sceneSetup) {
      this.currentScene = sceneSetup(this.scene, this.camera)
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate())

    if (this.currentScene && this.currentScene.update) {
      this.currentScene.update()
    }

    this.renderer.render(this.scene, this.camera)
  }

  onResize() {
    const width = this.container.clientWidth
    const height = this.container.clientHeight

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(width, height)
  }

  dispose() {
    if (this.currentScene && this.currentScene.cleanup) {
      this.currentScene.cleanup()
    }
    
    this.renderer.dispose()
    this.container.removeChild(this.renderer.domElement)
    
    window.removeEventListener('resize', () => this.onResize())
  }
}
