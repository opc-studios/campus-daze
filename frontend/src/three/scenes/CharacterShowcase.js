/**
 * Character 3D showcase for character creation and detail views
 */
import * as THREE from 'three'

export class CharacterShowcase {
  constructor(scene, camera, renderer) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.characterModel = null
    this.rotationSpeed = 0.01
    this.isAutoRotating = true
  }

  loadCharacter(characterData) {
    this.clearCharacter()

    const group = new THREE.Group()

    const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1, 8, 16)
    const bodyColor = this.getCatColor(characterData.cat_type)
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: bodyColor,
      shininess: 80
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    group.add(body)

    const headGeometry = new THREE.SphereGeometry(0.5, 32, 32)
    const head = new THREE.Mesh(headGeometry, bodyMaterial)
    head.position.y = 1.2
    group.add(head)

    const earGeometry = new THREE.ConeGeometry(0.15, 0.3, 4)
    const earMaterial = new THREE.MeshPhongMaterial({ color: bodyColor })
    const leftEar = new THREE.Mesh(earGeometry, earMaterial)
    leftEar.position.set(-0.25, 1.6, 0)
    group.add(leftEar)
    const rightEar = new THREE.Mesh(earGeometry, earMaterial)
    rightEar.position.set(0.25, 1.6, 0)
    group.add(rightEar)

    const eyeGeometry = new THREE.SphereGeometry(0.08, 16, 16)
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    leftEye.position.set(-0.15, 1.25, 0.4)
    group.add(leftEye)
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    rightEye.position.set(0.15, 1.25, 0.4)
    group.add(rightEye)

    const platformGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.15, 32)
    const platformMaterial = new THREE.MeshPhongMaterial({ color: 0x4A90D9 })
    const platform = new THREE.Mesh(platformGeometry, platformMaterial)
    platform.position.y = -1
    group.add(platform)

    this.characterModel = group
    this.scene.add(group)
  }

  getCatColor(catType) {
    const colors = {
      '橘猫': 0xFF8C42,
      '黑猫': 0x2C3E50,
      '白猫': 0xF0F0F0,
      '狸花猫': 0x8B7355,
      '暹罗猫': 0xDEB887
    }
    return colors[catType] || 0xFFB7C5
  }

  clearCharacter() {
    if (this.characterModel) {
      this.scene.remove(this.characterModel)
      this.characterModel = null
    }
  }

  setRotationSpeed(speed) {
    this.rotationSpeed = speed
  }

  setAutoRotate(enabled) {
    this.isAutoRotating = enabled
  }

  update() {
    if (this.characterModel && this.isAutoRotating) {
      this.characterModel.rotation.y += this.rotationSpeed
    }
  }

  setCameraAngle(angle) {
    const radius = 5
    this.camera.position.x = Math.sin(angle) * radius
    this.camera.position.z = Math.cos(angle) * radius
    this.camera.lookAt(0, 0, 0)
  }
}
