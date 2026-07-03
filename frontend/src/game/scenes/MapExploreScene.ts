import Phaser from 'phaser'
import { useGameStore } from '../../stores/game'
import { MonsterAISystem } from '../systems/MonsterAISystem'

export class MapExploreScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Arc
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private mapNodes: any[] = []
  private fogGraphics!: Phaser.GameObjects.Graphics
  private nodeSprites: Phaser.GameObjects.Arc[] = []
  private monsterAI!: MonsterAISystem
  private chapterTitleText!: Phaser.GameObjects.Text
  private creditsText!: Phaser.GameObjects.Text
  private currentChapter = 1

  constructor() {
    super({ key: 'MapExploreScene' })
  }

  create() {
    const gameStore = useGameStore()
    const mapNodesConfig = this.cache.json.get('mapNodes') || []
    const puzzlesConfig = this.cache.json.get('puzzles') || []
    const monstersConfig = this.cache.json.get('monsters') || []

    this.currentChapter = gameStore.currentChapter || 1
    if (this.currentChapter < 1) this.currentChapter = 1
    if (this.currentChapter > 4) this.currentChapter = 4

    this.cameras.main.setBounds(0, 0, 1280, 720)
    this.add.rectangle(640, 360, 1280, 720, 0x2a4a7a)

    this.mapNodes = mapNodesConfig.filter((n: any) => n.chapter === this.currentChapter)

    this.monsterAI = new MonsterAISystem(this)
    this.nodeSprites = []

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

      const isBossLocked =
        node.type === 'boss' &&
        node.creditRequirement &&
        (gameStore.progress?.chapterCredits || 0) < node.creditRequirement

      const isNodeCleared =
        node.type !== 'boss' && gameStore.state?.map.completedNodes.includes(node.nodeId)

      if (isBossLocked) {
        circle.setAlpha(0.5)
        const lockText = this.add.text(
          node.position.x,
          node.position.y - 30,
          `需 ${node.creditRequirement} 学分`,
          {
            fontFamily: 'Arial',
            fontSize: '10px',
            color: '#FFD700'
          }
        )
        lockText.setOrigin(0.5, 1)
      } else if (isNodeCleared) {
        circle.setAlpha(0.4)
        const clearedText = this.add.text(node.position.x, node.position.y - 30, '已完成', {
          fontFamily: 'Arial',
          fontSize: '10px',
          color: '#888888'
        })
        clearedText.setOrigin(0.5, 1)
      } else {
        circle.setInteractive()
        circle.on('pointerdown', () => {
          this.handleNodeClick(node, puzzlesConfig)
        })
      }

      this.nodeSprites.push(circle)

      if (!isNodeCleared && !isBossLocked) {
        this.spawnNodeMonsters(node, monstersConfig)
      }
    })

    this.player = this.add.circle(
      gameStore.mapState?.playerPosition.x || 100,
      gameStore.mapState?.playerPosition.y || 300,
      15,
      0xFFB7C5
    )
    this.player.setStrokeStyle(3, 0xffffff)
    this.player.setDepth(10)

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

    this.chapterTitleText = this.add.text(20, 20, `第 ${this.currentChapter} 章`, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    })
    this.chapterTitleText.setScrollFactor(0)

    this.creditsText = this.add.text(
      20,
      50,
      `累计学分: ${gameStore.resources?.credits || 0}  章节学分: ${gameStore.progress?.chapterCredits || 0}`,
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 3
      }
    )
    this.creditsText.setScrollFactor(0)

    this.events.on('monster-attack', (monsterId: string) => {
      this.handleMonsterAttack(monsterId)
    })
  }

  update(_time: number, deltaMs: number) {
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

    this.player.x = Phaser.Math.Clamp(this.player.x, 0, 1280)
    this.player.y = Phaser.Math.Clamp(this.player.y, 0, 720)

    const gameStore = useGameStore()
    if (gameStore.state) {
      gameStore.state.map.playerPosition = { x: this.player.x, y: this.player.y }
    }

    if (this.monsterAI) {
      this.monsterAI.updatePlayerPosition(this.player.x, this.player.y)
      this.monsterAI.update(deltaMs / 1000)
    }

    if (this.creditsText && gameStore.progress) {
      this.creditsText.setText(
        `累计学分: ${gameStore.resources?.credits || 0}  章节学分: ${gameStore.progress?.chapterCredits || 0}`
      )
    }
  }

  private spawnNodeMonsters(node: any, monstersConfig: any[]) {
    if (!node.monsters || node.monsters.length === 0) return
    if (node.type === 'boss') {
      const monster = monstersConfig.find((m: any) => m.monsterId === node.monsterId)
      if (monster) {
        this.monsterAI.addMonster(
          `monster_${node.nodeId}`,
          node.nodeId,
          monster.monsterId,
          node.position.x,
          node.position.y,
          monster.alertRadius || 120,
          monster.leashRadius || 999,
          monster.actionInterval || 2.0
        )
        const monsterData = this.monsterAI.getMonster(`monster_${node.nodeId}`)
        if (monsterData) {
          monsterData.sprite.setFillStyle(0xff0000)
          monsterData.sprite.setRadius(18)
        }
      }
      return
    }

    node.monsters.forEach((monsterId: string, idx: number) => {
      const monster = monstersConfig.find((m: any) => m.monsterId === monsterId)
      if (!monster) return
      const offsetX = (idx - (node.monsters.length - 1) / 2) * 40
      const offsetY = -50
      this.monsterAI.addMonster(
        `monster_${node.nodeId}_${idx}`,
        node.nodeId,
        monsterId,
        node.position.x + offsetX,
        node.position.y + offsetY,
        monster.alertRadius || 80,
        monster.leashRadius || 200,
        monster.actionInterval || 2.0
      )
    })
  }

  private handleMonsterAttack(monsterInstanceId: string) {
    const monster = this.monsterAI.getMonster(monsterInstanceId)
    if (!monster) return
    if (this.isInCombat()) return

    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      monster.position.x,
      monster.position.y
    )
    if (distance > 40) {
      this.monsterAI.setMonsterState(monsterInstanceId, 'chase')
      return
    }

    const gameStore = useGameStore()
    if (gameStore.state?.map.completedNodes.includes(monster.nodeId)) {
      this.monsterAI.setMonsterState(monsterInstanceId, 'cleared')
      return
    }

    this.monsterAI.setMonsterState(monsterInstanceId, 'combat')
    this.startCombat(monster.monsterId, monster.nodeId, false)
  }

  private isInCombat(): boolean {
    const gameStore = useGameStore()
    return (
      gameStore.combatState?.state === 'running' ||
      gameStore.combatState?.state === 'init'
    )
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

  private handleNodeClick(node: any, puzzlesConfig: any[]) {
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

    if (gameStore.state?.map.completedNodes.includes(node.nodeId) && node.type !== 'boss') {
      this.showFloatingText(node, '已完成', '#888888')
      return
    }

    switch (node.type) {
      case 'boss':
        if (
          node.creditRequirement &&
          (gameStore.progress?.chapterCredits || 0) < node.creditRequirement
        ) {
          this.showFloatingText(
            node,
            `需要 ${node.creditRequirement} 章节学分才能挑战 Boss`,
            '#FFD700'
          )
          return
        }
        this.startCombat(node.monsterId, node.nodeId, true)
        break
      case 'event':
        this.triggerEvent(node.eventId)
        break
      case 'puzzle':
        this.triggerPuzzle(node.puzzleId, puzzlesConfig)
        break
      case 'resource':
        this.collectResource(node)
        break
      case 'normal':
        if (node.monsters && node.monsters.length > 0) {
          const randomMonster = Phaser.Utils.Array.GetRandom(node.monsters) as string
          this.startCombat(randomMonster, node.nodeId, false)
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
    this.fogGraphics.fillCircle(node.position.x, node.position.y, 100)
  }

  private startCombat(monsterId: string, nodeId: string, isBoss: boolean) {
    const gameStore = useGameStore()
    if (this.isInCombat()) return

    if (gameStore.state) {
      if (!gameStore.state.monsters[nodeId]) {
        gameStore.state.monsters[nodeId] = {
          state: 'patrol',
          failCount: 0
        }
      }
      gameStore.setCombatState({
        state: 'init',
        activeCombatId: nodeId,
        monsterId
      })
    }
    this.scene.launch('CombatOverlayScene', { monsterId, nodeId, isBoss })
  }

  private triggerEvent(eventId: string) {
    window.dispatchEvent(
      new CustomEvent('map-event-trigger', {
        detail: { eventId, source: 'map' }
      })
    )
  }

  private triggerPuzzle(puzzleId: string, puzzlesConfig: any[]) {
    const puzzle = puzzlesConfig.find(p => p.puzzleId === puzzleId)
    if (!puzzle) {
      this.showFloatingText({ position: { x: this.player.x, y: this.player.y } }, '谜题配置缺失', '#FF0000')
      return
    }

    window.dispatchEvent(
      new CustomEvent('puzzle-trigger', {
        detail: { puzzle }
      })
    )
  }

  private collectResource(node: any) {
    const gameStore = useGameStore()
    if (gameStore.state?.map.completedNodes.includes(node.nodeId)) {
      this.showFloatingText(node, '已收集过', '#888888')
      return
    }
    if (node.rewards) {
      if (node.rewards.coins) {
        gameStore.addCoins(node.rewards.coins)
      }
      if (node.rewards.itemId) {
        gameStore.addItem(node.rewards.itemId, 1)
      }
    }
    gameStore.completeNode(node.nodeId)
    this.showFloatingText(node, '获得奖励!', '#00FF00')
    gameStore.saveSave()
  }

  private showFloatingText(node: any, text: string, color: string) {
    const floatingText = this.add.text(node.position.x, node.position.y - 30, text, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: color
    })
    floatingText.setOrigin(0.5)
    floatingText.setDepth(20)
    this.tweens.add({
      targets: floatingText,
      y: node.position.y - 60,
      alpha: 0,
      duration: 1500,
      onComplete: () => floatingText.destroy()
    })
  }

  shutdown() {
    if (this.monsterAI) {
      this.monsterAI.destroy()
    }
    this.events.off('monster-attack')
  }
}
