import type {
  CombatEntity,
  ActiveSkill,
  CombatState,
  CombatResult,
  PassiveSkill,
  SkillEffect
} from './types'
import {
  executeSkill,
  tickBuffs,
  applyReflect,
  applyPassiveOnCombatStart,
  applyPassiveOnKill
} from './skill-runner'
import { calcMaxHp, calcAttack, calcDefense, calcActionInterval } from './formulas'

// GDD §4.4 Boss 阶段配置（含阶段专属技能引用）
interface BossPhase {
  hpThreshold: number
  atkMultiplier?: number
  defMultiplier?: number
  atkBonus?: number
  defBonus?: number
  skillIndex?: number
  phaseSkillId?: string
  name?: string
}

// GDD §4.4 Boss 阶段专属技能详细参数（在 monsters.json 的 phaseSkills 字段中定义）
interface BossPhaseSkillDef {
  skillId: string
  name?: string
  multiplier?: number
  effect?: SkillEffect
  unavoidable?: boolean
}

// GDD §5.3 怪物技能循环配置（运行时镜像 monsters.json 的 skillCycle 字段）
interface SkillCycleConfig {
  interval: number
  skillId: string
  multiplier?: number
  name?: string
  effect?: SkillEffect
  unavoidable?: boolean
  hpThreshold?: number
}

export interface CombatSimulatorCtorOptions {
  playerState: {
    name: string
    level: number
    attrs: { knowledge: number; practice: number; insight: number; resilience: number }
    combatStats: { critRate: number; critDamage: number; evasionRate: number; accuracyRate: number }
    combatRole: string
    mainAttr: string
    initialShield?: number
  }
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
  }
  equippedSkills: ActiveSkill[]
  // GDD §4.4 玩家被动技能（5 角色 × 2 = 10 条）
  passives?: PassiveSkill[]
  // GDD §5.3 怪物技能循环
  skillCycle?: SkillCycleConfig[]
  // GDD §4.4 Boss 阶段专属技能详细参数
  phaseSkills?: BossPhaseSkillDef[]
}

export class CombatSimulator {
  private state: CombatState
  private speed: 1 | 2 = 1
  private bossPhases: BossPhase[] = []
  private phaseSkillDefs: BossPhaseSkillDef[] = []
  // GDD §4.4 当前阶段索引：-1 表示初始阶段（未触发任何阶段切换）
  // 修复：原值为 0 导致 phases[0] 永远不会被 checkBossPhase 触发
  private currentPhaseIndex = -1
  private skillCycle: SkillCycleConfig[] = []
  private elapsedSinceEnemyAction = 0
  private elapsedTotal = 0
  // GDD §4.4 莉娜精灵亲和公式所需：玩家灵感值（在构造时缓存）
  private playerInsight = 0

  constructor(opts: CombatSimulatorCtorOptions) {
    const { playerState, enemyConfig, equippedSkills } = opts
    const mainAttrValue = playerState.attrs[playerState.mainAttr as keyof typeof playerState.attrs] || 0
    this.playerInsight = playerState.attrs.insight || 0

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
      isPlayer: true,
      // GDD §4.4 注入玩家被动技能
      passives: opts.passives,
      passiveState: {
        killStacks: 0,
        consecutiveHits: 0,
        lastTargetId: undefined,
        skillsCast: 0,
        heavyMitigationLeft: 3,
        hasSummon: false
      }
    }

    // GDD §4.4 战斗开始时应用 on_combat_start/static 类被动（知夏学术专注/江寻风之眷顾等）
    applyPassiveOnCombatStart(player)

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
      isPlayer: false,
      // GDD §5.3 怪物技能循环运行时状态
      skillCycleState: {
        cycleIndex: 0,
        lastSpecialAt: 0
      }
    }

    this.bossPhases = enemyConfig.phases || []
    this.phaseSkillDefs = opts.phaseSkills || []
    this.skillCycle = opts.skillCycle || []

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
    this.elapsedTotal += effectiveDelta
    this.elapsedSinceEnemyAction += effectiveDelta

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
      this.elapsedSinceEnemyAction = 0
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
        // GDD §4.4 阶段切换：从 currentPhaseIndex（可能为 -1 表示初始阶段）切换到 i
        const prevPhase = this.currentPhaseIndex >= 0 ? this.bossPhases[this.currentPhaseIndex] : undefined
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

        // GDD §4.4 Boss 阶段专属技能：替换 enemy.skills 中对应索引的技能
        if (newPhase.phaseSkillId) {
          const phaseSkillDef = this.phaseSkillDefs.find(p => p.skillId === newPhase.phaseSkillId)
          if (phaseSkillDef) {
            const replaceIndex = newPhase.skillIndex ?? 1
            while (this.state.enemy.skills.length <= replaceIndex) {
              this.state.enemy.skills.push({
                skillId: `phase_placeholder_${this.state.enemy.skills.length}`,
                name: '阶段技能',
                cooldown: 0,
                currentCd: 0,
                multiplier: 1.0,
                target: 'enemy',
                unavoidable: false
              })
            }
            this.state.enemy.skills[replaceIndex] = {
              skillId: phaseSkillDef.skillId,
              name: phaseSkillDef.name || '阶段技能',
              cooldown: 0,
              currentCd: 0,
              multiplier: phaseSkillDef.multiplier || 1.5,
              target: 'enemy',
              unavoidable: phaseSkillDef.unavoidable || false,
              effect: phaseSkillDef.effect
            }
          }
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
    // GDD §4.4 莉娜精灵亲和公式所需：传入召唤者属性（attack/insight/maxHp）
    executeSkill(this.state.player, this.state.enemy, availableSkill, this.state.log, {
      state: this.state,
      summonerAttrs: {
        attack: this.state.player.attack,
        insight: this.playerInsight,
        maxHp: this.state.player.maxHp
      }
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

    // GDD §4.4 知夏「公式记忆」被动会在 executeSkill 内将 currentCd 设为 reducedCd
    // 此处仅当被动未触发（currentCd 仍为 0）时才设置正常冷却
    if (availableSkill.cooldown > 0 && availableSkill.currentCd === 0) {
      availableSkill.currentCd = availableSkill.cooldown
    }

    this.state.player.skills.forEach(s => {
      if (s.currentCd > 0) s.currentCd--
    })
  }

  private executeEnemyAction() {
    // GDD §5.3 怪物技能循环：按 interval 释放特殊技能，否则用普通攻击
    // 阶段切换时通过 phaseSkillId 已替换 enemy.skills 中对应索引的技能
    const currentPhase = this.currentPhaseIndex >= 0 ? this.bossPhases[this.currentPhaseIndex] : undefined
    const phaseSkillIndex = currentPhase?.skillIndex
    const fallbackIndex = phaseSkillIndex !== undefined
      ? Math.min(phaseSkillIndex, this.state.enemy.skills.length - 1)
      : 0

    let skill = this.state.enemy.skills[fallbackIndex] || this.state.enemy.skills[0]

    // 检查是否应释放技能循环中的特殊技能
    if (this.skillCycle.length > 0 && this.state.enemy.skillCycleState) {
      const cycState = this.state.enemy.skillCycleState
      const elapsedSinceSpecial = this.elapsedTotal - cycState.lastSpecialAt

      // 取当前 cycleIndex 对应的循环条目（轮询方式）
      const cycleEntry = this.skillCycle[cycState.cycleIndex % this.skillCycle.length]
      if (cycleEntry && elapsedSinceSpecial >= cycleEntry.interval) {
        // 检查 hpThreshold（如过拟合史莱姆 < 40% 才触发）
        const hpPercent = this.state.enemy.hp / this.state.enemy.maxHp
        const hpOk = cycleEntry.hpThreshold === undefined || hpPercent <= cycleEntry.hpThreshold
        if (hpOk) {
          // 构造临时 ActiveSkill
          skill = {
            skillId: cycleEntry.skillId,
            name: cycleEntry.name || '特殊技能',
            cooldown: 0,
            currentCd: 0,
            multiplier: cycleEntry.multiplier || 1.0,
            target: 'enemy',
            unavoidable: cycleEntry.unavoidable || false,
            effect: cycleEntry.effect
          }
          cycState.lastSpecialAt = this.elapsedTotal
          cycState.cycleIndex = (cycState.cycleIndex + 1) % this.skillCycle.length
        }
      }
    }

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
    // 召唤物使用召唤者属性（即玩家属性）来支持精灵亲和公式（如需要）
    executeSkill(summon, this.state.enemy, skill, this.state.log, {
      state: this.state,
      summonerAttrs: {
        attack: this.state.player.attack,
        insight: 0,
        maxHp: this.state.player.maxHp
      }
    })
  }

  private checkCombatEnd() {
    if (this.state.player.hp <= 0) {
      this.state.isFinished = true
      this.state.winner = 'enemy'
    } else if (this.state.enemy.hp <= 0) {
      this.state.isFinished = true
      this.state.winner = 'player'
      // GDD §4.4 阿宇「愈战愈勇」：击败敌人时叠加攻击力（用于多波次或后续战斗的延续）
      applyPassiveOnKill(this.state.player, this.state.log)
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
      applyPassiveOnKill(this.state.player, this.state.log)
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
