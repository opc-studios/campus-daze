/**
 * Cutscene manager for chapter transitions and boss introductions
 */
import * as THREE from 'three'

export class CutsceneManager {
  constructor(scene, camera, renderer) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.isPlaying = false
    this.timeline = []
    this.currentTime = 0
  }

  playChapterTransition(chapterName, callback) {
    this.isPlaying = true
    this.timeline = [
      { time: 0, action: () => this.fadeToBlack() },
      { time: 1000, action: () => this.showTitle(chapterName) },
      { time: 3000, action: () => this.fadeFromBlack() },
      { time: 4000, action: () => this.finish(callback) }
    ]
    this.currentTime = 0
    this.animate()
  }

  playBossIntro(bossName, callback) {
    this.isPlaying = true
    this.timeline = [
      { time: 0, action: () => this.shakeCamera() },
      { time: 500, action: () => this.showBossName(bossName) },
      { time: 2500, action: () => this.finish(callback) }
    ]
    this.currentTime = 0
    this.animate()
  }

  fadeToBlack() {
    const overlay = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 })
    )
    overlay.position.z = -1
    overlay.name = 'cutscene-overlay'
    this.scene.add(overlay)

    this.animateProperty(overlay.material, 'opacity', 0, 1, 500)
  }

  fadeFromBlack() {
    const overlay = this.scene.getObjectByName('cutscene-overlay')
    if (overlay) {
      this.animateProperty(overlay.material, 'opacity', 1, 0, 500, () => {
        this.scene.remove(overlay)
      })
    }
  }

  showTitle(text) {
    console.log(`[Cutscene] Chapter: ${text}`)
  }

  showBossName(name) {
    console.log(`[Cutscene] Boss: ${name}`)
  }

  shakeCamera() {
    const originalPosition = this.camera.position.clone()
    let shakeCount = 0
    const shakeInterval = setInterval(() => {
      this.camera.position.x = originalPosition.x + (Math.random() - 0.5) * 0.2
      this.camera.position.y = originalPosition.y + (Math.random() - 0.5) * 0.2
      shakeCount++
      if (shakeCount > 20) {
        clearInterval(shakeInterval)
        this.camera.position.copy(originalPosition)
      }
    }, 50)
  }

  animateProperty(obj, prop, from, to, duration, callback) {
    const start = performance.now()
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      obj[prop] = from + (to - from) * progress
      if (progress < 1) {
        requestAnimationFrame(step)
      } else if (callback) {
        callback()
      }
    }
    requestAnimationFrame(step)
  }

  animate() {
    if (!this.isPlaying) return
    this.currentTime += 16
    this.timeline.forEach(item => {
      if (!item.executed && this.currentTime >= item.time) {
        item.action()
        item.executed = true
      }
    })
    if (this.timeline.every(item => item.executed)) {
      this.isPlaying = false
    } else {
      requestAnimationFrame(() => this.animate())
    }
  }

  finish(callback) {
    this.isPlaying = false
    if (callback) callback()
  }
}
