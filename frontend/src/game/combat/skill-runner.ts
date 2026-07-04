import type { CombatEntity, ActiveSkill, CombatLog, CombatState, SkillEffect, PassiveSkill } from './types'
import {
  calcBaseDamage,
  calcSkillDamage,
  calcCritDamage,
  rollEvasion,
  rollCrit,
  rollAccuracy
} from './formulas'

export interface SkillExecutorContext {
  state: CombatState
  // GDD §4.4 莉娜精灵亲和公式所需：召唤者属性
  summonerAttrs?: { attack: number; insight: number; maxHp: number }
}

// GDD §4.4 莉娜精灵亲和：精灵攻击 = 莉娜攻击 ×35% + 灵感 ×0.8；精灵生命 = 莉娜最大 HP ×25%
function calcSummonAttack(summonerAttack: number, summonerInsight: number): number {
  return Math.floor(summonerAttack * 0.35 + summonerInsight * 0.8)
}

function calcSummonMaxHp(summonerMaxHp: number): number {
  return Math.floor(summonerMaxHp * 0.25)
}

export function executeSkill(
  attacker: CombatEntity,
  defender: CombatEntity,
  skill: ActiveSkill,
  log: CombatLog[],
  context?: SkillExecutorContext
): { damage: number; isCrit: boolean; isEvaded: boolean } {
  const result = { damage: 0, isCrit: false, isEvaded: false }

  if (!skill.unavoidable && rollEvasion(defender.evasionRate)) {
    result.isEvaded = true
    log.push({
      timestamp: Date.now(),
      actorId: attacker.id,
      action: `${skill.name} - 闪避`,
      targetId: defender.id,
      isEvaded: true
    })
    return result
  }

  if (!rollAccuracy(attacker.accuracyRate)) {
    log.push({
      timestamp: Date.now(),
      actorId: attacker.id,
      action: `${skill.name} - 未命中`,
      targetId: defender.id
    })
    return result
  }

  const hits = skill.effect?.type === 'multi_hit' ? skill.effect.hits || 1 : 1
  const armorPen = skill.effect?.type === 'armor_pen' ? skill.effect.value || 0 : 0

  // GDD §4.4 江寻「破甲连击」被动：连续 2 次命中同一目标后，第 3 次攻击无视 30% 防御
  let bonusArmorPen = 0
  if (attacker.passiveState && attacker.passives?.some(p => p.effect.kind === 'armor_pen_on_combo')) {
    const combo = attacker.passiveState
    if (combo.lastTargetId === defender.id) {
      combo.consecutiveHits = (combo.consecutiveHits || 0) + 1
    } else {
      combo.consecutiveHits = 1
      combo.lastTargetId = defender.id
    }
    const comboPassive = attacker.passives.find(p => p.effect.kind === 'armor_pen_on_combo')!
    if (combo.consecutiveHits >= (comboPassive.effect.threshold || 2) + 1) {
      bonusArmorPen = comboPassive.effect.value || 0.3
    }
  } else {
    // 无该被动也维护 lastTargetId 以便其他逻辑使用
    if (attacker.passiveState) {
      attacker.passiveState.lastTargetId = defender.id
    }
  }

  let totalDamage = 0
  let anyCrit = false

  for (let i = 0; i < hits; i++) {
    const totalArmorPen = Math.min(1, armorPen + bonusArmorPen)
    const effectiveDef = totalArmorPen > 0 ? Math.max(0, defender.defense * (1 - totalArmorPen)) : defender.defense
    const baseDamage = calcBaseDamage(attacker.attack, effectiveDef)
    let skillDamage = calcSkillDamage(baseDamage, skill.multiplier)

    if (rollCrit(attacker.critRate)) {
      skillDamage = calcCritDamage(skillDamage, attacker.critDamage)
      anyCrit = true
    }

    // GDD §4.4 江寻「穿透箭术」：对防御高于自身的敌人额外 +15% 伤害
    if (attacker.passives?.some(p => p.effect.kind === 'damage_bonus_vs_high_def')) {
      if (defender.defense > attacker.defense) {
        const dmgBonus = attacker.passives.find(p => p.effect.kind === 'damage_bonus_vs_high_def')!.effect.value || 0.15
        skillDamage = Math.floor(skillDamage * (1 + dmgBonus))
      }
    }

    // GDD §4.4 老登「钢筋铁骨」被动：单次伤害超过最大 HP 25% 时，该次额外减免 30%，限 3 次/场
    const singleHitDamage = skillDamage
    if (defender.passiveState && defender.passives?.some(p => p.effect.kind === 'heavy_mitigation')) {
      const heavyP = defender.passives.find(p => p.effect.kind === 'heavy_mitigation')!
      const threshold = (heavyP.effect.threshold || 0.25) * defender.maxHp
      if (singleHitDamage > threshold && (defender.passiveState.heavyMitigationLeft ?? 0) > 0) {
        const reduction = heavyP.effect.reductionPercent || 0.3
        skillDamage = Math.floor(skillDamage * (1 - reduction))
        defender.passiveState.heavyMitigationLeft = (defender.passiveState.heavyMitigationLeft ?? 0) - 1
        log.push({
          timestamp: Date.now(),
          actorId: defender.id,
          action: `钢筋铁骨 - 减免 ${Math.floor(singleHitDamage * reduction)}（剩余 ${defender.passiveState.heavyMitigationLeft} 次）`
        })
      }
    }

    let finalDamage = skillDamage

    if (defender.shield > 0) {
      const absorbed = Math.min(defender.shield, finalDamage)
      defender.shield -= absorbed
      finalDamage -= absorbed
    }

    defender.hp = Math.max(0, defender.hp - finalDamage)
    totalDamage += finalDamage
  }

  result.damage = totalDamage
  result.isCrit = anyCrit

  if (skill.effect) {
    applyEffect(attacker, defender, skill, skill.effect, log, context)
  }

  // GDD §4.4 知夏「公式记忆」被动：每释放 3 次主动技能，下次主动技能冷却 -30%
  if (attacker.passiveState && attacker.passives?.some(p => p.effect.kind === 'cooldown_reduction')) {
    attacker.passiveState.skillsCast = (attacker.passiveState.skillsCast || 0) + 1
    const cdPassive = attacker.passives.find(p => p.effect.kind === 'cooldown_reduction')!
    const threshold = cdPassive.effect.threshold || 3
    if (attacker.passiveState.skillsCast >= threshold) {
      attacker.passiveState.skillsCast = 0
      if (skill.cooldown > 0) {
        const reduction = cdPassive.effect.reductionPercent || 0.3
        const reducedCd = Math.floor(skill.cooldown * (1 - reduction))
        skill.currentCd = reducedCd
        log.push({
          timestamp: Date.now(),
          actorId: attacker.id,
          action: `公式记忆 - 冷却缩减 ${skill.cooldown - reducedCd}s`
        })
      }
    }
  }

  log.push({
    timestamp: Date.now(),
    actorId: attacker.id,
    action: hits > 1 ? `${skill.name} x${hits}` : skill.name,
    targetId: defender.id,
    damage: totalDamage,
    isCrit: anyCrit
  })

  return result
}

function applyEffect(
  attacker: CombatEntity,
  defender: CombatEntity,
  skill: ActiveSkill,
  effect: SkillEffect,
  log: CombatLog[],
  context?: SkillExecutorContext
) {
  const { type, stat, value, duration, stacks } = effect

  switch (type) {
    case 'buff':
      if (stat && value && duration) {
        const existingBuff = attacker.buffs.find(b => b.stat === stat && b.type === 'buff')
        if (existingBuff && stacks) {
          existingBuff.stacks = (existingBuff.stacks || 1) + 1
          existingBuff.value += value
          existingBuff.remainingDuration = duration
        } else {
          attacker.buffs.push({
            type: 'buff',
            stat,
            value,
            remainingDuration: duration,
            stacks: stacks ? 1 : undefined
          })
        }
        applyBuffStat(attacker, stat, value)
      }
      break

    case 'debuff':
      if (stat && value && duration) {
        defender.buffs.push({
          type: 'debuff',
          stat,
          value,
          remainingDuration: duration
        })
        applyBuffStat(defender, stat, value)
      }
      break

    case 'shield':
      if (value) {
        attacker.shield += value
        log.push({
          timestamp: Date.now(),
          actorId: attacker.id,
          action: `${skill.name} - 获得 ${value} 护盾`
        })
      }
      break

    case 'heal':
      if (value) {
        const healAmount = Math.min(value, attacker.maxHp - attacker.hp)
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + value)
        log.push({
          timestamp: Date.now(),
          actorId: attacker.id,
          action: `${skill.name} - 回复 ${healAmount} HP`,
          healing: healAmount
        })
      }
      break

    case 'dot':
      if (value && duration) {
        defender.buffs.push({
          type: 'debuff',
          stat: 'dot',
          value,
          remainingDuration: duration
        })
      }
      break

    case 'summon':
      if (context && duration) {
        // GDD §4.4 莉娜精灵亲和：精灵攻击 = 莉娜攻击 ×35% + 灵感 ×0.8；精灵生命 = 莉娜最大 HP ×25%
        let summonAttack = 20
        let summonMaxHp = 1
        if (effect.useSummonFormula && context.summonerAttrs) {
          summonAttack = calcSummonAttack(context.summonerAttrs.attack, context.summonerAttrs.insight)
          summonMaxHp = calcSummonMaxHp(context.summonerAttrs.maxHp)
        } else if (effect.damage) {
          summonAttack = effect.damage
        }

        const summonId = `${attacker.id}_summon_${Date.now()}`
        const summonEntity: CombatEntity = {
          id: summonId,
          name: '学风精灵',
          hp: summonMaxHp,
          maxHp: summonMaxHp,
          attack: summonAttack,
          defense: 0,
          actionInterval: 1.5,
          currentActionGauge: 0,
          skills: [
            {
              skillId: `${summonId}_attack`,
              name: '精灵冲击',
              cooldown: 0,
              currentCd: 0,
              multiplier: 1.0,
              target: 'enemy',
              unavoidable: false
            }
          ],
          buffs: [
            {
              type: 'buff',
              stat: 'summon_ttl',
              value: duration,
              remainingDuration: duration
            }
          ],
          shield: 0,
          evasionRate: 0,
          accuracyRate: 1.0,
          critRate: 0,
          critDamage: 1.0,
          isPlayer: attacker.isPlayer
        }
        context.state.summons.push(summonEntity)

        // GDD §4.4 莉娜「学风共鸣」：场上存在精灵时，莉娜攻击力 +15%
        if (attacker.passiveState) {
          attacker.passiveState.hasSummon = true
        }
        const resonanceP = attacker.passives?.find(p => p.effect.kind === 'atk_percent' && p.trigger === 'on_summon_present')
        if (resonanceP && !attacker.buffs.some(b => b.stat === 'resonance_atk')) {
          const bonus = Math.floor(attacker.attack * (resonanceP.effect.value || 0.15))
          attacker.attack += bonus
          attacker.buffs.push({
            type: 'buff',
            stat: 'resonance_atk',
            value: bonus,
            remainingDuration: 999
          })
          log.push({
            timestamp: Date.now(),
            actorId: attacker.id,
            action: `学风共鸣 - 攻击力 +${bonus}（${Math.round((resonanceP.effect.value || 0.15) * 100)}%）`
          })
        }

        log.push({
          timestamp: Date.now(),
          actorId: attacker.id,
          action: `${skill.name} - 召唤学风精灵 (攻击 ${summonAttack} / 生命 ${summonMaxHp}，${duration}回合)`
        })
      }
      break

    case 'armor_pen':
      // 已在 executeSkill 中处理，这里无需再扣血
      break

    case 'reflect':
      if (value && duration) {
        attacker.buffs.push({
          type: 'buff',
          stat: 'reflect',
          value,
          remainingDuration: duration
        })
      }
      break
  }
}

function applyBuffStat(entity: CombatEntity, stat: string, value: number) {
  switch (stat) {
    case 'atk':
    case 'attack':
      entity.attack += value
      break
    case 'def':
    case 'defense':
      entity.defense += value
      break
    case 'critRate':
      entity.critRate += value
      break
    case 'evasionRate':
      entity.evasionRate += value
      break
  }
}

export function tickBuffs(entity: CombatEntity) {
  entity.buffs = entity.buffs.filter(buff => {
    if (buff.stat === 'dot' && buff.value > 0) {
      entity.hp = Math.max(0, entity.hp - buff.value)
    }
    buff.remainingDuration--
    return buff.remainingDuration > 0
  })
}

export function applyReflect(entity: CombatEntity, incomingDamage: number): number {
  const reflectBuff = entity.buffs.find(b => b.stat === 'reflect' && b.type === 'buff')
  if (reflectBuff && reflectBuff.value) {
    return Math.floor(incomingDamage * reflectBuff.value)
  }
  // GDD §4.4 老登「混凝土反震」被动：受到攻击时反弹伤害 = 防御 ×0.3
  const reflectPassive = entity.passives?.find(p => p.effect.kind === 'reflect_by_def')
  if (reflectPassive) {
    return Math.floor(entity.defense * (reflectPassive.effect.value || 0.3))
  }
  return 0
}

// GDD §4.4 战斗开始时应用被动技能
export function applyPassiveOnCombatStart(entity: CombatEntity) {
  if (!entity.passives) return

  entity.passiveState = {
    killStacks: 0,
    consecutiveHits: 0,
    lastTargetId: undefined,
    skillsCast: 0,
    heavyMitigationLeft: 3,
    hasSummon: false
  }

  for (const passive of entity.passives) {
    if (passive.trigger !== 'on_combat_start' && passive.trigger !== 'static') continue

    switch (passive.effect.kind) {
      case 'crit_rate_bonus': {
        // 知夏「学术专注」：暴击率 +15%
        entity.critRate += passive.effect.value || 0.15
        break
      }
      case 'crit_damage_set': {
        // 知夏被动同时设置暴击伤害 = 2 倍（如配置）
        if (passive.effect.value) {
          entity.critDamage = passive.effect.value
        }
        break
      }
      case 'action_interval_percent': {
        // 江寻「风之眷顾」：行动间隔额外 -8%
        const factor = 1 + (passive.effect.value || 0)
        entity.actionInterval = Math.max(0.5, entity.actionInterval * factor)
        break
      }
      // summon_formula 在 applyEffect 的 summon 分支中处理
      default:
        break
    }
  }
}

// GDD §4.4 阿宇「愈战愈勇」：击败敌人时叠加攻击力
export function applyPassiveOnKill(entity: CombatEntity, log: CombatLog[]) {
  if (!entity.passives || !entity.passiveState) return
  const killStackP = entity.passives.find(p => p.effect.kind === 'stack_atk_per_kill')
  if (!killStackP) return

  const maxStacks = killStackP.effect.maxStacks || 5
  if ((entity.passiveState.killStacks || 0) < maxStacks) {
    entity.passiveState.killStacks = (entity.passiveState.killStacks || 0) + 1
    const bonus = Math.floor(entity.attack * (killStackP.effect.value || 0.08))
    entity.attack += bonus
    log.push({
      timestamp: Date.now(),
      actorId: entity.id,
      action: `愈战愈勇 - 攻击力 +${bonus}（${entity.passiveState.killStacks}/${maxStacks} 层）`
    })
  }
}
