import Phaser from 'phaser'
import { CombatSimulator } from '../combat/simulator'
import { useGameStore } from '../../stores/game'
import type { ActiveSkill } from '../combat/types'

export class CombatOverlayScene extends Phaser.Scene {
  private simulator!: CombatSimulator
  private playerHpBar!: Phaser.GameObjects.Graphics
  private enemyHpBar!: Phaser.GameObjects.Graphics
  private speedText!: Phaser.GameObjects.Text
  private isRunning = false

  constructor() {
    super({ key: 'CombatOverlayScene' })
  }

  init(data: { monsterId: string }) {
    const gameStore = useGameStore()
    const monstersConfig = this.cache.json.get('monsters') || []
    const skillsConfig = this.cache.json.get('skills') || []
    const rolesConfig = this.cache.json.get('roles') || []

    const monster = monstersConfig.find((m: any) => m.monsterId === data.monsterId)
    if (!monster) {
      this.scene.stop()
      return
    }

    const playerState = gameStore.player
    if (!playerState) {
      this.scene.stop()
      return
    }

    const role = rolesConfig.find((r: any) => r.roleId === playerState.roleId)
    const mainAttr = role?.mainAttr || 'knowledge'

    const equippedSkills: ActiveSkill[] = playerState.equippedSkills
      .filter((skillId): skillId is string => skillId !== null)
      .map(skillId => {
        const skillConfig = skillsConfig.find((s: any) => s.skillId === skillId)
        return {
          skillId: skillConfig.skillId,
          name: skillConfig.name,
          cooldown: skillConfig.cooldown,
          currentCd: 0,
          multiplier: skillConfig.multiplier,
          target: 'enemy' as const,
          unavoidable: skillConfig.unavoidable || false
        }
      })

    this.simulator = new CombatSimulator(
      {
        name: playerState.name,
        level: playerState.level,
        attrs: playerState.attrs,
        combatStats: playerState.combatStats,
        combatRole: playerState.combatRole,
        mainAttr
      },
      {
        monsterId: monster.monsterId,
        name: monster.name,
        hp: monster.hp,
        atk: monster.atk,
        def: monster.def,
        actionInterval: monster.actionInterval,
        evasionRate: monster.evasionRate,
        skills: monster.skills
      },
      equippedSkills
    )
  }

  create() {
    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.8)

    this.add.text(640, 50, '战斗开始!', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5)

    this.add.text(200, 150, this.simulator.getState().player.name, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#4ECDC4'
    }).setOrigin(0.5)

    this.playerHpBar = this.add.graphics()
    this.drawHpBar(100, 180, 200, 20, 1.0, 0x4ECDC4)

    const enemyState = this.simulator.getState().enemy
    this.add.text(1080, 150, enemyState.name, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#FFB7C5'
    }).setOrigin(0.5)

    this.enemyHpBar = this.add.graphics()
    this.drawHpBar(980, 180, 200, 20, 1.0, 0xFFB7C5)

    this.speedText = this.add.text(640, 650, '速度: 1x', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5)

    const btn1x = this.add.text(500, 650, '1x', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#1A3C6E',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive()

    btn1x.on('pointerdown', () => {
      this.simulator.setSpeed(1)
      this.speedText.setText('速度: 1x')
    })

    const btn2x = this.add.text(640, 680, '2x', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#1A3C6E',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive()

    btn2x.on('pointerdown', () => {
      this.simulator.setSpeed(2)
      this.speedText.setText('速度: 2x')
    })

    const btnSkip = this.add.text(780, 650, '跳过', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#FFB7C5',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive()

    btnSkip.on('pointerdown', () => {
      this.simulator.skip()
      this.isRunning = false
      this.endCombat()
    })

    this.isRunning = true
  }

  update(_time: number, delta: number) {
    if (!this.isRunning) return

    this.simulator.step(delta / 1000)

    const state = this.simulator.getState()
    const playerHpPercent = state.player.hp / state.player.maxHp
    const enemyHpPercent = state.enemy.hp / state.enemy.maxHp

    this.playerHpBar.clear()
    this.drawHpBar(100, 180, 200, 20, playerHpPercent, 0x4ECDC4)

    this.enemyHpBar.clear()
    this.drawHpBar(980, 180, 200, 20, enemyHpPercent, 0xFFB7C5)

    if (state.isFinished) {
      this.isRunning = false
      this.endCombat()
    }
  }

  private drawHpBar(x: number, y: number, width: number, height: number, percent: number, color: number) {
    this.add.graphics()
      .fillStyle(0x333333, 1)
      .fillRect(x, y, width, height)

    this.add.graphics()
      .fillStyle(color, 1)
      .fillRect(x, y, width * percent, height)
  }

  private endCombat() {
    const result = this.simulator.getResult()
    if (!result) return

    const gameStore = useGameStore()

    if (result.winner === 'player') {
      const monstersConfig = this.cache.json.get('monsters') || []
      const enemyId = this.simulator.getState().enemy.id
      const monster = monstersConfig.find((m: any) => m.monsterId === enemyId)

      if (monster?.rewards) {
        gameStore.addExp(monster.rewards.exp || 0)
        gameStore.addCredits(monster.rewards.credits || 0)
        gameStore.addCoins(monster.rewards.coins || 0)
      }

      this.add.text(640, 360, '胜利!', {
        fontFamily: 'Arial',
        fontSize: '48px',
        color: '#00FF00'
      }).setOrigin(0.5)
    } else {
      this.add.text(640, 360, '失败...', {
        fontFamily: 'Arial',
        fontSize: '48px',
        color: '#FF0000'
      }).setOrigin(0.5)
    }

    gameStore.saveSave()

    this.time.delayedCall(2000, () => {
      this.scene.stop()
    })
  }
}
