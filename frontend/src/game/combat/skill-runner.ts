import type { CombatEntity, ActiveSkill, CombatLog, CombatState, SkillEffect } from './types'
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

  let totalDamage = 0
  let anyCrit = false

  for (let i = 0; i < hits; i++) {
    const effectiveDef = armorPen > 0 ? Math.max(0, defender.defense * (1 - armorPen)) : defender.defense
    const baseDamage = calcBaseDamage(attacker.attack, effectiveDef)
    let skillDamage = calcSkillDamage(baseDamage, skill.multiplier)

    if (rollCrit(attacker.critRate)) {
      skillDamage = calcCritDamage(skillDamage, attacker.critDamage)
      anyCrit = true
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
      if (context && effect.damage && duration) {
        const summonId = `${attacker.id}_summon_${Date.now()}`
        const summonEntity: CombatEntity = {
          id: summonId,
          name: '学风精灵',
          hp: 1,
          maxHp: 1,
          attack: effect.damage,
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
        log.push({
          timestamp: Date.now(),
          actorId: attacker.id,
          action: `${skill.name} - 召唤学风精灵 (${duration}回合)`
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
  if (!reflectBuff || !reflectBuff.value) return 0
  return Math.floor(incomingDamage * reflectBuff.value)
}
