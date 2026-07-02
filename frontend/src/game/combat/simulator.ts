import type { CombatEntity, ActiveSkill, CombatState, CombatResult } from './types'
import { executeSkill, tickBuffs } from './skill-runner'
import { calcMaxHp, calcAttack, calcDefense, calcActionInterval } from './formulas'

export class CombatSimulator {
  private state: CombatState
  private speed: 1 | 2 = 1

  constructor(
    playerState: {
      name: string
      level: number
      attrs: { knowledge: number; practice: number; insight: number; resilience: number }
      combatStats: { critRate: number; critDamage: number; evasionRate: number; accuracyRate: number }
      combatRole: string
      mainAttr: string
    },
    enemyConfig: {
      monsterId: string
      name: string
      hp: number
      atk: number
      def: number
      actionInterval: number
      evasionRate: number
      skills: string[]
    },
    equippedSkills: ActiveSkill[]
  ) {
    const mainAttrValue = playerState.attrs[playerState.mainAttr as keyof typeof playerState.attrs] || 0

    const player: CombatEntity = {
      id: 'player',
      name: playerState.name,
      hp: calcMaxHp(playerState.level, playerState.attrs.resilience),
      maxHp: calcMaxHp(playerState.level, playerState.attrs.resilience),
      attack: calcAttack(playerState.level, mainAttrValue),
      defense: calcDefense(playerState.attrs.resilience, playerState.attrs.practice),
      actionInterval: calcActionInterval(playerState.attrs.insight),
      currentActionGauge: 0,
      skills: equippedSkills,
      buffs: [],
      shield: 0,
      evasionRate: playerState.combatStats.evasionRate,
      accuracyRate: playerState.combatStats.accuracyRate,
      critRate: playerState.combatStats.critRate,
      critDamage: playerState.combatStats.critDamage,
      isPlayer: true
    }

    const enemy: CombatEntity = {
      id: enemyConfig.monsterId,
      name: enemyConfig.name,
      hp: enemyConfig.hp,
      maxHp: enemyConfig.hp,
      attack: enemyConfig.atk,
      defense: enemyConfig.def,
      actionInterval: enemyConfig.actionInterval,
      currentActionGauge: 0,
      skills: [
        {
          skillId: 'enemy_basic',
          name: '攻击',
          cooldown: 0,
          currentCd: 0,
          multiplier: 1.0,
          target: 'enemy',
          unavoidable: false
        }
      ],
      buffs: [],
      shield: 0,
      evasionRate: enemyConfig.evasionRate,
      accuracyRate: 0.95,
      critRate: 0.05,
      critDamage: 1.5,
      isPlayer: false
    }

    this.state = {
      player,
      enemy,
      summons: [],
      log: [],
      isFinished: false,
      startTime: Date.now()
    }
  }

  setSpeed(speed: 1 | 2) {
    this.speed = speed
  }

  skip() {
    this.runToCompletion()
  }

  step(deltaTime: number) {
    if (this.state.isFinished) return

    const effectiveDelta = deltaTime * this.speed

    this.state.player.currentActionGauge += effectiveDelta
    this.state.enemy.currentActionGauge += effectiveDelta

    if (this.state.player.currentActionGauge >= this.state.player.actionInterval) {
      this.state.player.currentActionGauge = 0
      this.executePlayerAction()
    }

    if (this.state.enemy.currentActionGauge >= this.state.enemy.actionInterval) {
      this.state.enemy.currentActionGauge = 0
      this.executeEnemyAction()
    }

    this.state.summons.forEach(summon => {
      summon.currentActionGauge += effectiveDelta
      if (summon.currentActionGauge >= summon.actionInterval) {
        summon.currentActionGauge = 0
        this.executeSummonAction(summon)
      }
    })

    tickBuffs(this.state.player)
    tickBuffs(this.state.enemy)

    this.checkCombatEnd()
  }

  private executePlayerAction() {
    const availableSkill = this.state.player.skills.find(s => s.currentCd === 0)
    if (!availableSkill) return

    executeSkill(this.state.player, this.state.enemy, availableSkill, this.state.log)

    if (availableSkill.cooldown > 0) {
      availableSkill.currentCd = availableSkill.cooldown
    }

    this.state.player.skills.forEach(s => {
      if (s.currentCd > 0) s.currentCd--
    })
  }

  private executeEnemyAction() {
    const skill = this.state.enemy.skills[0]
    executeSkill(this.state.enemy, this.state.player, skill, this.state.log)
  }

  private executeSummonAction(summon: CombatEntity) {
    const skill = summon.skills[0]
    executeSkill(summon, this.state.enemy, skill, this.state.log)
  }

  private checkCombatEnd() {
    if (this.state.player.hp <= 0) {
      this.state.isFinished = true
      this.state.winner = 'enemy'
    } else if (this.state.enemy.hp <= 0) {
      this.state.isFinished = true
      this.state.winner = 'player'
    }
  }

  runToCompletion() {
    const maxSteps = 1000
    let steps = 0

    while (!this.state.isFinished && steps < maxSteps) {
      this.step(0.1)
      steps++
    }

    if (!this.state.isFinished) {
      this.state.isFinished = true
      this.state.winner = 'player'
    }
  }

  getState(): CombatState {
    return { ...this.state }
  }

  getResult(): CombatResult | null {
    if (!this.state.isFinished) return null

    return {
      winner: this.state.winner!,
      log: this.state.log,
      duration: Date.now() - this.state.startTime
    }
  }
}
