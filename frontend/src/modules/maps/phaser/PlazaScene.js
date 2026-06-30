import Phaser from 'phaser'
import { eventBus } from '@/engine/EventBus'

export class PlazaScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlazaScene' })
    this.player = null
    this.npcs = null
    this.buildings = null
    this.cursors = null
  }

  preload() {
    this.createPlaceholderGraphics()
    
    this.load.on('loaderror', (file) => {
      console.warn('Failed to load:', file.key)
    })
  }

  create() {
    this.createBackground()
    this.createBuildings()
    this.createNPCs()
    this.createPlayer()
    this.setupCamera()
    this.setupInput()
    this.setupCollisions()
    
    eventBus.emit('scene-ready', 'plaza')
  }

  update(time, delta) {
    if (!this.player) return
    
    this.updatePlayerMovement(delta)
    this.updateNPCCollisions()
  }

  createPlaceholderGraphics() {
    const playerGraphics = this.add.graphics()
    playerGraphics.fillStyle(0xFFB7C5, 1)
    playerGraphics.fillCircle(20, 20, 18)
    playerGraphics.lineStyle(2, 0x000000, 0.3)
    playerGraphics.strokeCircle(20, 20, 18)
    
    playerGraphics.fillStyle(0x000000, 1)
    playerGraphics.fillCircle(14, 16, 3)
    playerGraphics.fillCircle(26, 16, 3)
    
    playerGraphics.fillStyle(0xFF69B4, 1)
    playerGraphics.fillTriangle(16, 8, 20, 4, 24, 8)
    
    playerGraphics.generateTexture('player', 40, 40)
    playerGraphics.destroy()

    const npcGraphics = this.add.graphics()
    npcGraphics.fillStyle(0x4A90D9, 1)
    npcGraphics.fillCircle(20, 20, 18)
    npcGraphics.lineStyle(2, 0x000000, 0.3)
    npcGraphics.strokeCircle(20, 20, 18)
    
    npcGraphics.fillStyle(0x000000, 1)
    npcGraphics.fillCircle(14, 16, 3)
    npcGraphics.fillCircle(26, 16, 3)
    
    npcGraphics.generateTexture('npc', 40, 40)
    npcGraphics.destroy()

    const buildingGraphics = this.add.graphics()
    buildingGraphics.fillStyle(0x8B4513, 1)
    buildingGraphics.fillRect(0, 0, 200, 150)
    buildingGraphics.lineStyle(3, 0x654321, 1)
    buildingGraphics.strokeRect(0, 0, 200, 150)
    
    buildingGraphics.fillStyle(0x87CEEB, 1)
    buildingGraphics.fillRect(20, 20, 40, 40)
    buildingGraphics.fillRect(140, 20, 40, 40)
    buildingGraphics.fillRect(20, 90, 40, 40)
    buildingGraphics.fillRect(140, 90, 40, 40)
    
    buildingGraphics.generateTexture('building', 200, 150)
    buildingGraphics.destroy()
  }

  createBackground() {
    this.sky = this.add.rectangle(640, 360, 1280, 720, 0x87CEEB)
    
    this.ground = this.add.rectangle(640, 600, 1280, 240, 0x90EE90)
    this.physics.world.enable(this.ground)
    this.ground.body.setImmovable(true)
    
    this.add.particles(0, 0, 'player', {
      x: { min: 0, max: 1280 },
      y: { min: 0, max: 200 },
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.5, end: 0 },
      speed: 10,
      lifespan: 3000,
      frequency: 500,
      blendMode: 'ADD'
    })
  }

  createBuildings() {
    this.buildings = this.physics.add.staticGroup()
    
    const buildingData = [
      { x: 200, y: 400, name: '教学楼', key: 'building' },
      { x: 640, y: 350, name: '图书馆', key: 'building' },
      { x: 1080, y: 400, name: '宿舍楼', key: 'building' }
    ]
    
    buildingData.forEach(data => {
      const building = this.buildings.create(data.x, data.y, data.key)
      building.setScale(1)
      building.refreshBody()
      
      const text = this.add.text(data.x, data.y - 100, data.name, {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#00000080',
        padding: { x: 10, y: 5 }
      })
      text.setOrigin(0.5)
    })
  }

  createNPCs() {
    this.npcs = this.physics.add.group({ immovable: true })
    
    const npcData = [
      { x: 300, y: 550, name: '教授喵', dialogue: '欢迎来到校园！' },
      { x: 640, y: 580, name: '同学喵', dialogue: '一起去图书馆吗？' },
      { x: 980, y: 550, name: '学姐喵', dialogue: '需要帮助吗？' }
    ]
    
    npcData.forEach(data => {
      const npc = this.npcs.create(data.x, data.y, 'npc')
      npc.setScale(2)
      npc.setInteractive()
      npc.npcData = data
      
      const nameText = this.add.text(data.x, data.y - 50, data.name, {
        fontSize: '16px',
        color: '#000000',
        backgroundColor: '#ffffff',
        padding: { x: 8, y: 4 }
      })
      nameText.setOrigin(0.5)
      
      npc.on('pointerdown', () => {
        eventBus.emit('npc-interact', data)
      })
      
      npc.on('pointerover', () => {
        npc.setTint(0xcccccc)
      })
      
      npc.on('pointerout', () => {
        npc.clearTint()
      })
    })
  }

  createPlayer() {
    this.player = this.physics.add.sprite(640, 600, 'player')
    this.player.setScale(2)
    this.player.setCollideWorldBounds(true)
    this.player.setBounce(0.2)
    this.player.setDepth(10)
  }

  setupCamera() {
    this.cameras.main.setBounds(0, 0, 1280, 720)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setZoom(1)
  }

  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    })
    
    this.input.on('gameobjectdown', (pointer, gameObject) => {
      if (gameObject.npcData) {
        eventBus.emit('npc-interact', gameObject.npcData)
      }
    })
  }

  setupCollisions() {
    this.physics.add.collider(this.player, this.ground)
    this.physics.add.collider(this.player, this.buildings)
    this.physics.add.collider(this.player, this.npcs)
  }

  updatePlayerMovement(delta) {
    const speed = 200
    const velocity = speed * (delta / 1000)
    
    let moving = false
    
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      this.player.setVelocityX(-velocity)
      this.player.flipX = true
      moving = true
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      this.player.setVelocityX(velocity)
      this.player.flipX = false
      moving = true
    } else {
      this.player.setVelocityX(0)
    }
    
    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      this.player.setVelocityY(-velocity)
      moving = true
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
      this.player.setVelocityY(velocity)
      moving = true
    } else {
      this.player.setVelocityY(0)
    }
    
    if (moving && !this.player.anims.currentAnim) {
      this.player.anims.play('walk', true)
    } else if (!moving && this.player.anims.currentAnim) {
      this.player.anims.stop()
    }
  }

  updateNPCCollisions() {
    this.npcs.getChildren().forEach(npc => {
      if (Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        npc.x, npc.y
      ) < 50) {
        if (!npc.nearbyShown) {
          npc.nearbyShown = true
          this.showInteractionHint(npc)
        }
      } else {
        npc.nearbyShown = false
      }
    })
  }

  showInteractionHint(npc) {
    const hint = this.add.text(npc.x, npc.y - 70, '按空格键对话', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000cc',
      padding: { x: 8, y: 4 }
    })
    hint.setOrigin(0.5)
    
    this.tweens.add({
      targets: hint,
      alpha: 0,
      duration: 2000,
      onComplete: () => hint.destroy()
    })
  }
}
