import type { CombatEntity, ActiveSkill, CombatLog } from './types'
import { calcBaseDamage, calcSkillDamage, calcCritDamage, rollEvasion, rollCrit, rollAccuracy } from './formulas'

export function executeSkill(
  attacker: CombatEntity,
  defender: CombatEntity,
  skill: ActiveSkill,
  log: CombatLog[]
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

  const baseDamage = calcBaseDamage(attacker.attack, defender.defense)
  let skillDamage = calcSkillDamage(baseDamage, skill.multiplier)

  if (rollCrit(attacker.critRate)) {
    skillDamage = calcCritDamage(skillDamage, attacker.critDamage)
    result.isCrit = true
  }

  let finalDamage = skillDamage

  if (defender.shield > 0) {
    const absorbed = Math.min(defender.shield, finalDamage)
    defender.shield -= absorbed
    finalDamage -= absorbed
  }

  defender.hp = Math.max(0, defender.hp - finalDamage)
  result.damage = finalDamage

  if (skill.effect) {
    applyEffect(attacker, defender, skill, log)
  }

  log.push({
    timestamp: Date.now(),
    actorId: attacker.id,
    action: skill.name,
    targetId: defender.id,
    damage: finalDamage,
    isCrit: result.isCrit
  })

  return result
}

function applyEffect(
  attacker: CombatEntity,
  defender: CombatEntity,
  skill: ActiveSkill,
  _log: CombatLog[]
) {
  if (!skill.effect) return

  const { type, stat, value, duration, stacks } = skill.effect

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
      }
      break

    case 'heal':
      if (value) {
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + value)
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
    buff.remainingDuration--
    return buff.remainingDuration > 0
  })
}
