import Phaser from 'phaser'
import { eventBus } from '@/engine/EventBus'

export class ExploreScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ExploreScene' })
    this.player = null
    this.map = null
    this.layer = null
    this.discoveryPoints = null
    this.cursors = null
  }

  init(data) {
    this.areaId = data.areaId || 1
    this.areaName = data.areaName || '未知区域'
  }

  preload() {
    this.createPlaceholderTileset()
    this.createPlayerSprite()
  }

  create() {
    this.createTilemap()
    this.createPlayer()
    this.createDiscoveryPoints()
    this.setupCamera()
    this.setupInput()
    this.setupCollisions()
    
    this.add.text(20, 20, this.areaName, {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#00000080',
      padding: { x: 10, y: 5 }
    }).setScrollFactor(0)
    
    eventBus.emit('scene-ready', 'explore')
  }

  update(time, delta) {
    if (!this.player) return
    
    this.updatePlayerMovement(delta)
    this.checkDiscoveryPoints()
  }

  createPlaceholderTileset() {
    const tilesetGraphics = this.add.graphics()
    
    const colors = {
      grass: 0x90EE90,
      path: 0xD2B48C,
      water: 0x4A90D9,
      wall: 0x8B4513,
      tree: 0x228B22
    }
    
    const tileSize = 32
    let x = 0
    let y = 0
    
    Object.entries(colors).forEach((color, index) => {
      tilesetGraphics.fillStyle(color[1], 1)
      tilesetGraphics.fillRect(x, y, tileSize, tileSize)
      tilesetGraphics.lineStyle(1, 0x000000, 0.2)
      tilesetGraphics.strokeRect(x, y, tileSize, tileSize)
      
      x += tileSize
      if (x >= 160) {
        x = 0
        y += tileSize
      }
    })
    
    tilesetGraphics.generateTexture('tileset', 160, 128)
    tilesetGraphics.destroy()
  }

  createPlayerSprite() {
    const playerGraphics = this.add.graphics()
    playerGraphics.fillStyle(0xFFB7C5, 1)
    playerGraphics.fillCircle(16, 16, 14)
    playerGraphics.lineStyle(2, 0x000000, 0.3)
    playerGraphics.strokeCircle(16, 16, 14)
    
    playerGraphics.fillStyle(0x000000, 1)
    playerGraphics.fillCircle(12, 14, 2)
    playerGraphics.fillCircle(20, 14, 2)
    
    playerGraphics.generateTexture('explore_player', 32, 32)
    playerGraphics.destroy()
  }

  createTilemap() {
    const mapData = this.generateMapData(40, 30)
    
    this.map = this.make.tilemap({
      data: mapData,
      tileWidth: 32,
      tileHeight: 32
    })
    
    const tileset = this.map.addTilesetImage('tileset', 'tileset', 32, 32, 0, 0)
    this.layer = this.map.createLayer(0, tileset, 0, 0)
    
    this.layer.setCollisionByExclusion([-1, 0, 1])
  }

  generateMapData(width, height) {
    const data = []
    for (let y = 0; y < height; y++) {
      const row = []
      for (let x = 0; x < width; x++) {
        let tile = 0
        
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          tile = 3
        } else if (Math.random() < 0.05) {
          tile = 4
        } else if (Math.random() < 0.1) {
          tile = 2
        } else if (x > 5 && x < width - 5 && Math.abs(x - width / 2) < 3) {
          tile = 1
        }
        
        row.push(tile)
      }
      data.push(row)
    }
    return data
  }

  createPlayer() {
    this.player = this.physics.add.sprite(640, 480, 'explore_player')
    this.player.setScale(1.5)
    this.player.setCollideWorldBounds(true)
    this.player.setBounce(0.1)
    this.player.setDepth(10)
  }

  createDiscoveryPoints() {
    this.discoveryPoints = this.physics.add.group()
    
    const numPoints = 5
    for (let i = 0; i < numPoints; i++) {
      const x = Phaser.Math.Between(100, 1180)
      const y = Phaser.Math.Between(100, 620)
      
      const point = this.discoveryPoints.create(x, y, 'explore_player')
      point.setScale(0.8)
      point.setTint(0xFFD700)
      point.setInteractive()
      point.discoveryData = {
        id: i + 1,
        discovered: false,
        reward: {
          exp: 10,
          coins: 5
        }
      }
      
      const glow = this.add.circle(x, y, 20, 0xFFD700, 0.3)
      glow.point = point
      
      this.tweens.add({
        targets: glow,
        scale: 1.5,
        alpha: 0,
        duration: 1000,
        yoyo: true,
        repeat: -1
      })
    }
  }

  setupCamera() {
    this.cameras.main.setBounds(0, 0, 1280, 720)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
  }

  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    })
    
    this.input.keyboard.on('keydown-SPACE', () => {
      this.checkNearbyDiscovery()
    })
  }

  setupCollisions() {
    this.physics.add.collider(this.player, this.layer)
    this.physics.add.overlap(this.player, this.discoveryPoints, (player, point) => {
      this.onDiscoveryOverlap(point)
    })
  }

  updatePlayerMovement(delta) {
    const speed = 180
    const velocity = speed * (delta / 1000)
    
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      this.player.setVelocityX(-velocity)
      this.player.flipX = true
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      this.player.setVelocityX(velocity)
      this.player.flipX = false
    } else {
      this.player.setVelocityX(0)
    }
    
    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      this.player.setVelocityY(-velocity)
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
      this.player.setVelocityY(velocity)
    } else {
      this.player.setVelocityY(0)
    }
  }

  checkDiscoveryPoints() {
    this.discoveryPoints.getChildren().forEach(point => {
      if (!point.discoveryData.discovered) {
        const distance = Phaser.Math.Distance.Between(
          this.player.x, this.player.y,
          point.x, point.y
        )
        
        if (distance < 40) {
          this.showDiscoveryHint(point)
        }
      }
    })
  }

  checkNearbyDiscovery() {
    this.discoveryPoints.getChildren().forEach(point => {
      if (!point.discoveryData.discovered) {
        const distance = Phaser.Math.Distance.Between(
          this.player.x, this.player.y,
          point.x, point.y
        )
        
        if (distance < 50) {
          this.discoverPoint(point)
        }
      }
    })
  }

  onDiscoveryOverlap(point) {
    if (!point.discoveryData.discovered) {
      this.showDiscoveryHint(point)
    }
  }

  showDiscoveryHint(point) {
    if (point.hintText) return
    
    point.hintText = this.add.text(point.x, point.y - 40, '按空格键探索', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000cc',
      padding: { x: 8, y: 4 }
    })
    point.hintText.setOrigin(0.5)
    
    this.time.delayedCall(2000, () => {
      if (point.hintText) {
        point.hintText.destroy()
        point.hintText = null
      }
    })
  }

  discoverPoint(point) {
    point.discoveryData.discovered = true
    
    this.tweens.add({
      targets: point,
      scale: 0,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        point.destroy()
      }
    })
    
    if (point.hintText) {
      point.hintText.destroy()
    }
    
    const rewardText = this.add.text(this.player.x, this.player.y - 50, 
      `+${point.discoveryData.reward.exp}经验 +${point.discoveryData.reward.coins}喵币`, {
      fontSize: '16px',
      color: '#FFD700',
      fontStyle: 'bold',
      backgroundColor: '#000000cc',
      padding: { x: 10, y: 5 }
    })
    rewardText.setOrigin(0.5)
    
    this.tweens.add({
      targets: rewardText,
      y: rewardText.y - 50,
      alpha: 0,
      duration: 1500,
      onComplete: () => rewardText.destroy()
    })
    
    eventBus.emit('discovery-found', {
      id: point.discoveryData.id,
      reward: point.discoveryData.reward,
      areaId: this.areaId
    })
  }
}
