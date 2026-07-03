import type { CombatEntity, ActiveSkill, CombatState, CombatResult } from './types'
import { executeSkill, tickBuffs, applyReflect } from './skill-runner'
import { calcMaxHp, calcAttack, calcDefense, calcActionInterval } from './formulas'

interface BossPhase {
  hpThreshold: number
  atkMultiplier?: number
  defMultiplier?: number
  atkBonus?: number
  defBonus?: number
  skillIndex?: number
  name?: string
}

export class CombatSimulator {
  private state: CombatState
  private speed: 1 | 2 = 1
  private bossPhases: BossPhase[] = []
  private currentPhaseIndex = 0

  constructor(
    playerState: {
      name: string
      level: number
      attrs: { knowledge: number; practice: number; insight: number; resilience: number }
      combatStats: { critRate: number; critDamage: number; evasionRate: number; accuracyRate: number }
      combatRole: string
      mainAttr: string
      initialShield?: number
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
      phases?: BossPhase[]
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
      shield: playerState.initialShield || 0,
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

    this.bossPhases = enemyConfig.phases || []

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

    this.checkBossPhase()

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

    this.state.summons = this.state.summons.filter(summon => {
      const ttlBuff = summon.buffs.find(b => b.stat === 'summon_ttl')
      if (!ttlBuff) return true
      ttlBuff.remainingDuration--
      return ttlBuff.remainingDuration > 0 && summon.hp > 0
    })

    tickBuffs(this.state.player)
    tickBuffs(this.state.enemy)

    this.checkCombatEnd()
  }

  private checkBossPhase() {
    if (this.bossPhases.length === 0) return
    const hpPercent = this.state.enemy.hp / this.state.enemy.maxHp

    for (let i = this.currentPhaseIndex + 1; i < this.bossPhases.length; i++) {
      if (hpPercent <= this.bossPhases[i].hpThreshold) {
        const prevPhase = this.bossPhases[this.currentPhaseIndex]
        const newPhase = this.bossPhases[i]
        this.currentPhaseIndex = i

        if (newPhase.atkMultiplier) {
          const prevMult = prevPhase?.atkMultiplier || 1
          this.state.enemy.attack = Math.floor(
            (this.state.enemy.attack / prevMult) * newPhase.atkMultiplier
          )
        }
        if (newPhase.defMultiplier) {
          const prevMult = prevPhase?.defMultiplier || 1
          this.state.enemy.defense = Math.floor(
            (this.state.enemy.defense / prevMult) * newPhase.defMultiplier
          )
        }
        if (newPhase.atkBonus !== undefined) {
          const prevBonus = prevPhase?.atkBonus || 0
          this.state.enemy.attack += newPhase.atkBonus - prevBonus
        }
        if (newPhase.defBonus !== undefined) {
          const prevBonus = prevPhase?.defBonus || 0
          this.state.enemy.defense += newPhase.defBonus - prevBonus
        }
        this.state.log.push({
          timestamp: Date.now(),
          actorId: this.state.enemy.id,
          action: newPhase.name ? `进入阶段：${newPhase.name}` : `进入阶段 ${i + 1}！`
        })
      }
    }
  }

  private executePlayerAction() {
    const availableSkill = this.state.player.skills.find(s => s.currentCd === 0)
    if (!availableSkill) return

    const beforeHp = this.state.enemy.hp
    executeSkill(this.state.player, this.state.enemy, availableSkill, this.state.log, {
      state: this.state
    })
    const damageDealt = beforeHp - this.state.enemy.hp
    if (damageDealt > 0) {
      const reflect = applyReflect(this.state.enemy, damageDealt)
      if (reflect > 0) {
        this.state.player.hp = Math.max(0, this.state.player.hp - reflect)
        this.state.log.push({
          timestamp: Date.now(),
          actorId: this.state.enemy.id,
          action: `反伤 - ${reflect}`,
          targetId: this.state.player.id,
          damage: reflect
        })
      }
    }

    if (availableSkill.cooldown > 0) {
      availableSkill.currentCd = availableSkill.cooldown
    }

    this.state.player.skills.forEach(s => {
      if (s.currentCd > 0) s.currentCd--
    })
  }

  private executeEnemyAction() {
    const phaseSkillIndex = this.bossPhases[this.currentPhaseIndex]?.skillIndex
    const skillIndex = phaseSkillIndex !== undefined ? Math.min(phaseSkillIndex, this.state.enemy.skills.length - 1) : 0
    const skill = this.state.enemy.skills[skillIndex] || this.state.enemy.skills[0]
    const beforeHp = this.state.player.hp
    executeSkill(this.state.enemy, this.state.player, skill, this.state.log, {
      state: this.state
    })
    const damageDealt = beforeHp - this.state.player.hp
    if (damageDealt > 0) {
      const reflect = applyReflect(this.state.player, damageDealt)
      if (reflect > 0) {
        this.state.enemy.hp = Math.max(0, this.state.enemy.hp - reflect)
        this.state.log.push({
          timestamp: Date.now(),
          actorId: this.state.player.id,
          action: `反伤 - ${reflect}`,
          targetId: this.state.enemy.id,
          damage: reflect
        })
      }
    }
  }

  private executeSummonAction(summon: CombatEntity) {
    const skill = summon.skills[0]
    executeSkill(summon, this.state.enemy, skill, this.state.log, { state: this.state })
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
