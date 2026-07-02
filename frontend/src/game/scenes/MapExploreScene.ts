import Phaser from 'phaser'
import { useGameStore } from '../../stores/game'

export class MapExploreScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Arc
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private mapNodes: any[] = []
  private fogGraphics!: Phaser.GameObjects.Graphics

  constructor() {
    super({ key: 'MapExploreScene' })
  }

  create() {
    const gameStore = useGameStore()
    const mapNodesConfig = this.cache.json.get('mapNodes') || []

    this.cameras.main.setBounds(0, 0, 1280, 720)

    this.add.rectangle(640, 360, 1280, 720, 0x2a4a7a)

    this.mapNodes = mapNodesConfig.filter((n: any) => n.chapter === 1)

    this.mapNodes.forEach((node: any) => {
      const color = this.getNodeColor(node.type)
      const circle = this.add.circle(node.position.x, node.position.y, 20, color)
      circle.setStrokeStyle(2, 0xffffff)

      const text = this.add.text(node.position.x, node.position.y + 30, node.name, {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#ffffff'
      })
      text.setOrigin(0.5, 0)

      circle.setInteractive()
      circle.on('pointerdown', () => {
        this.handleNodeClick(node)
      })
    })

    this.player = this.add.circle(
      gameStore.mapState?.playerPosition.x || 100,
      gameStore.mapState?.playerPosition.y || 300,
      15,
      0xFFB7C5
    )
    this.player.setStrokeStyle(3, 0xffffff)

    this.fogGraphics = this.add.graphics()
    this.fogGraphics.fillStyle(0x000000, 0.7)
    this.fogGraphics.fillRect(0, 0, 1280, 720)

    const revealedRegions = gameStore.mapState?.revealedRegions || ['entrance']
    revealedRegions.forEach((regionId: string) => {
      this.revealRegion(regionId)
    })

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)

    this.cursors = this.input.keyboard!.createCursorKeys()

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        const worldX = pointer.x + this.cameras.main.scrollX
        const worldY = pointer.y + this.cameras.main.scrollY
        this.movePlayerTo(worldX, worldY)
      }
    })
  }

  update() {
    const speed = 3

    if (this.cursors.left?.isDown) {
      this.player.x -= speed
    } else if (this.cursors.right?.isDown) {
      this.player.x += speed
    } else if (this.cursors.up?.isDown) {
      this.player.y -= speed
    } else if (this.cursors.down?.isDown) {
      this.player.y += speed
    }

    const gameStore = useGameStore()
    if (gameStore.state) {
      gameStore.state.map.playerPosition = { x: this.player.x, y: this.player.y }
    }
  }

  private getNodeColor(type: string): number {
    const colors: Record<string, number> = {
      start: 0x4ECDC4,
      normal: 0x1A3C6E,
      event: 0xFFB7C5,
      puzzle: 0xFFD700,
      resource: 0x00FF00,
      boss: 0xFF0000
    }
    return colors[type] || 0x808080
  }

  private handleNodeClick(node: any) {
    const gameStore = useGameStore()

    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      node.position.x,
      node.position.y
    )

    if (distance > 50) {
      this.movePlayerTo(node.position.x, node.position.y)
      return
    }

    switch (node.type) {
      case 'boss':
        this.startCombat(node.monsterId)
        break
      case 'event':
        this.triggerEvent(node.eventId)
        break
      case 'resource':
        this.collectResource(node)
        break
      case 'normal':
        if (node.monsters && node.monsters.length > 0) {
          const randomMonster = Phaser.Utils.Array.GetRandom(node.monsters) as string
          this.startCombat(randomMonster)
        }
        break
    }

    gameStore.revealRegion(node.nodeId)
  }

  private movePlayerTo(x: number, y: number) {
    this.tweens.add({
      targets: this.player,
      x: x,
      y: y,
      duration: 500,
      ease: 'Power2'
    })
  }

  private revealRegion(regionId: string) {
    const node = this.mapNodes.find(n => n.nodeId === regionId)
    if (!node) return

    this.fogGraphics.fillStyle(0x000000, 0)
    this.fogGraphics.fillCircle(node.position.x, node.position.y, 80)
  }

  private startCombat(monsterId: string) {
    this.scene.launch('CombatOverlayScene', { monsterId })
  }

  private triggerEvent(eventId: string) {
    this.events.emit('trigger-event', eventId)
  }

  private collectResource(node: any) {
    const gameStore = useGameStore()
    if (node.rewards) {
      if (node.rewards.coins) {
        gameStore.addCoins(node.rewards.coins)
      }
      if (node.rewards.itemId) {
        gameStore.addItem(node.rewards.itemId, 1)
      }
    }
    gameStore.completeNode(node.nodeId)

    this.add.text(node.position.x, node.position.y - 30, '获得奖励!', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#00FF00'
    }).setOrigin(0.5).setAlpha(1)

    this.tweens.add({
      targets: this.children.getAt(this.children.length - 1),
      y: node.position.y - 60,
      alpha: 0,
      duration: 1000
    })
  }
}
