import Phaser from 'phaser'
import { useGameStore } from '../../stores/game'

interface ZoneData {
  id: string
  name: string
  x: number
  y: number
  w: number
  h: number
  color: string
  chapter: number
}

interface TeleportPoint {
  id: string
  name: string
  x: number
  y: number
  targetChapter: number
  targetNode: string
}

interface MemoryPoint {
  id: string
  name: string
  x: number
  y: number
  archiveId: string
  description: string
}

export class WorldMapScene extends Phaser.Scene {
  private worldMapConfig: any = null
  private zones: ZoneData[] = []
  private teleportPoints: TeleportPoint[] = []
  private memoryPoints: MemoryPoint[] = []
  private zoneSprites: Map<string, Phaser.GameObjects.Rectangle> = new Map()
  private teleportSprites: Map<string, Phaser.GameObjects.Arc> = new Map()
  private memorySprites: Map<string, Phaser.GameObjects.Star> = new Map()
  private playerMarker!: Phaser.GameObjects.Sprite
  private currentChapter = 1
  private zoneInfoPanel!: Phaser.GameObjects.Container
  private teleportInfoPanel!: Phaser.GameObjects.Container
  private chapterLabels: Phaser.GameObjects.Text[] = []
  private zoneNameText!: Phaser.GameObjects.Text
  private zoneDescText!: Phaser.GameObjects.Text
  private teleportNameText!: Phaser.GameObjects.Text
  private teleportDescText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'WorldMapScene' })
  }

  create() {
    const gameStore = useGameStore()
    this.currentChapter = gameStore.currentChapter || 1

    this.worldMapConfig = this.cache.json.get('worldMap') || {}
    this.zones = this.worldMapConfig.zones || []
    this.teleportPoints = this.worldMapConfig.teleportPoints || []
    this.memoryPoints = this.worldMapConfig.memoryPoints || []

    this.setupCamera()
    this.drawWorldMap()
    this.drawZones()
    this.drawTeleportPoints()
    this.drawMemoryPoints()
    this.drawPlayerMarker()
    this.createInfoPanels()
    this.setupInput()
    this.drawChapterLabels()
  }

  private setupCamera() {
    const mapWidth = this.worldMapConfig.width || 2048
    const mapHeight = this.worldMapConfig.height || 1024

    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight)
    this.cameras.main.setZoom(0.5)
    this.cameras.main.centerOn(mapWidth / 2, mapHeight / 2)

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: any[], _deltaX: number, _deltaY: number, deltaZ: number) => {
      let zoom = this.cameras.main.zoom + deltaZ * 0.001
      zoom = Math.max(0.2, Math.min(2, zoom))
      this.cameras.main.setZoom(zoom)
    })

    this.input.on('pointerdown', () => {
      this.hideInfoPanels()
    })
  }

  private drawWorldMap() {
    if (this.textures.exists('world_map')) {
      const mapWidth = this.worldMapConfig.width || 2048
      const mapHeight = this.worldMapConfig.height || 1024
      this.add.image(mapWidth / 2, mapHeight / 2, 'world_map')
    } else {
      const mapWidth = this.worldMapConfig.width || 2048
      const mapHeight = this.worldMapConfig.height || 1024
      const bg = this.add.rectangle(mapWidth / 2, mapHeight / 2, mapWidth, mapHeight, 0x2a4a7a)
      bg.setDepth(-1)
    }
  }

  private drawZones() {
    this.zones.forEach(zone => {
      const rect = this.add.rectangle(
        zone.x + zone.w / 2,
        zone.y + zone.h / 2,
        zone.w,
        zone.h,
        this.hexToNumber(zone.color),
        0.3
      )
      rect.setStrokeStyle(2, this.hexToNumber(zone.color), 0.8)
      rect.setDepth(1)

      const zoneLabel = this.add.text(
        zone.x + zone.w / 2,
        zone.y + zone.h / 2,
        zone.name,
        {
          fontFamily: 'Arial',
          fontSize: '14px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2,
          align: 'center'
        }
      )
      zoneLabel.setOrigin(0.5)
      zoneLabel.setDepth(2)

      const clickZone = this.add.rectangle(
        zone.x + zone.w / 2,
        zone.y + zone.h / 2,
        zone.w,
        zone.h,
        0xffffff,
        0
      )
      clickZone.setInteractive()
      clickZone.setDepth(3)

      clickZone.on('pointerover', () => {
        rect.setAlpha(0.5)
        this.showZoneInfo(zone)
      })

      clickZone.on('pointerout', () => {
        rect.setAlpha(0.3)
        this.hideZoneInfo()
      })

      clickZone.on('pointerdown', () => {
        this.teleportToChapter(zone.chapter, '')
      })

      this.zoneSprites.set(zone.id, rect)
    })
  }

  private drawTeleportPoints() {
    this.teleportPoints.forEach(point => {
      const circle = this.add.circle(point.x, point.y, 16, 0x4ECDC4, 0.8)
      circle.setStrokeStyle(3, 0xffffff, 1)
      circle.setDepth(4)

      const glow = this.add.circle(point.x, point.y, 24, 0x4ECDC4, 0.3)
      glow.setDepth(3)
      this.tweens.add({
        targets: glow,
        radius: 32,
        alpha: 0,
        duration: 1500,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })

      const clickArea = this.add.circle(point.x, point.y, 30, 0xffffff, 0)
      clickArea.setInteractive()
      clickArea.setDepth(5)

      clickArea.on('pointerover', () => {
        circle.setScale(1.2)
        this.showTeleportInfo(point)
      })

      clickArea.on('pointerout', () => {
        circle.setScale(1)
        this.hideTeleportInfo()
      })

      clickArea.on('pointerdown', () => {
        this.teleportToChapter(point.targetChapter, point.targetNode)
      })

      this.teleportSprites.set(point.id, circle)
    })
  }

  private drawMemoryPoints() {
    const gameStore = useGameStore()
    const collectedArchives = gameStore.progress?.archives || []

    this.memoryPoints.forEach(point => {
      const isCollected = collectedArchives.includes(point.archiveId)
      const color = isCollected ? 0xFFD700 : 0x808080
      const alpha = isCollected ? 1 : 0.5

      const star = this.add.star(point.x, point.y, 5, 12, 6, color, alpha)
      star.setDepth(4)

      if (isCollected) {
        this.tweens.add({
          targets: star,
          scale: [1, 1.3, 1],
          duration: 2000,
          repeat: -1,
          ease: 'Sine.easeInOut'
        })
      }

      const clickArea = this.add.circle(point.x, point.y, 25, 0xffffff, 0)
      clickArea.setInteractive()
      clickArea.setDepth(5)

      clickArea.on('pointerover', () => {
        star.setScale(1.2)
        if (isCollected) {
          this.showMemoryInfo(point)
        }
      })

      clickArea.on('pointerout', () => {
        star.setScale(1)
        this.hideMemoryInfo()
      })

      clickArea.on('pointerdown', () => {
        if (isCollected) {
          window.dispatchEvent(new CustomEvent('game-notification', {
            detail: {
              type: 'collection',
              title: point.name,
              message: point.description
            }
          }))
        }
      })

      this.memorySprites.set(point.id, star)
    })
  }

  private drawPlayerMarker() {
    const playerX = this.teleportPoints.find(p => p.targetChapter === this.currentChapter)?.x || 880
    const playerY = this.teleportPoints.find(p => p.targetChapter === this.currentChapter)?.y || 380

    this.playerMarker = this.add.sprite(playerX, playerY, 'particle_star')
    this.playerMarker.setScale(2)
    this.playerMarker.setDepth(6)

    this.tweens.add({
      targets: this.playerMarker,
      y: playerY - 10,
      duration: 1000,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    })
  }

  private drawChapterLabels() {
    const chapterLabels = [
      { chapter: 1, x: 880, y: 450, text: '第一章\nAI与协议革命' },
      { chapter: 2, x: 675, y: 600, text: '第二章\n樱花济与食堂危机' },
      { chapter: 3, x: 1540, y: 550, text: '第三章\n智械危机' },
      { chapter: 4, x: 1840, y: 520, text: '终章\n120周年校庆' }
    ]

    chapterLabels.forEach(label => {
      const text = this.add.text(label.x, label.y, label.text, {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center'
      })
      text.setOrigin(0.5)
      text.setDepth(2)
      this.chapterLabels.push(text)
    })
  }

  private createInfoPanels() {
    const panelWidth = 200
    const panelHeight = 100

    this.zoneInfoPanel = this.add.container(0, 0)
    this.zoneInfoPanel.setVisible(false)
    this.zoneInfoPanel.setDepth(100)

    const zoneBg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x1A3C6E, 0.9)
    zoneBg.setStrokeStyle(2, 0x4ECDC4)
    this.zoneInfoPanel.add(zoneBg)

    this.zoneNameText = this.add.text(0, -30, '', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#FFB7C5'
    }).setOrigin(0.5)
    this.zoneInfoPanel.add(this.zoneNameText)

    this.zoneDescText = this.add.text(0, 0, '', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5)
    this.zoneInfoPanel.add(this.zoneDescText)

    this.teleportInfoPanel = this.add.container(0, 0)
    this.teleportInfoPanel.setVisible(false)
    this.teleportInfoPanel.setDepth(100)

    const teleportBg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x1A3C6E, 0.9)
    teleportBg.setStrokeStyle(2, 0x4ECDC4)
    this.teleportInfoPanel.add(teleportBg)

    this.teleportNameText = this.add.text(0, -30, '', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#4ECDC4'
    }).setOrigin(0.5)
    this.teleportInfoPanel.add(this.teleportNameText)

    this.teleportDescText = this.add.text(0, 0, '', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5)
    this.teleportInfoPanel.add(this.teleportDescText)

    const teleportHintText = this.add.text(0, 30, '点击传送', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#FFD700'
    }).setOrigin(0.5)
    this.teleportInfoPanel.add(teleportHintText)
  }

  private showZoneInfo(zone: ZoneData) {
    this.zoneInfoPanel.setVisible(true)
    this.zoneInfoPanel.setPosition(zone.x + zone.w / 2, zone.y - 20)
    this.zoneNameText.setText(zone.name)
    this.zoneDescText.setText(`章节 ${zone.chapter}`)
  }

  private hideZoneInfo() {
    this.zoneInfoPanel.setVisible(false)
  }

  private showTeleportInfo(point: TeleportPoint) {
    this.teleportInfoPanel.setVisible(true)
    this.teleportInfoPanel.setPosition(point.x, point.y - 40)
    this.teleportNameText.setText(point.name)
    this.teleportDescText.setText(`前往章节 ${point.targetChapter}`)
  }

  private hideTeleportInfo() {
    this.teleportInfoPanel.setVisible(false)
  }

  private showMemoryInfo(point: MemoryPoint) {
    window.dispatchEvent(new CustomEvent('game-notification', {
      detail: {
        type: 'collection',
        title: point.name,
        message: point.description
      }
    }))
  }

  private hideMemoryInfo() {
  }

  private hideInfoPanels() {
    this.hideZoneInfo()
    this.hideTeleportInfo()
  }

  private teleportToChapter(chapter: number, _nodeId: string) {
    const gameStore = useGameStore()
    ;(gameStore as any).currentChapter = chapter

    this.scene.start('MapExploreScene')

    window.dispatchEvent(new CustomEvent('game-notification', {
      detail: {
        type: 'info',
        title: '传送',
        message: `正在前往章节 ${chapter}...`
      }
    }))
  }

  private setupInput() {
    if (this.input.keyboard) {
      const backKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
      backKey.on('down', () => {
        this.scene.start('MapExploreScene')
      })

      const worldKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M)
      worldKey.on('down', () => {
        this.scene.start('MapExploreScene')
      })
    }
  }

  private hexToNumber(hex: string): number {
    return parseInt(hex.replace('#', ''), 16)
  }
}