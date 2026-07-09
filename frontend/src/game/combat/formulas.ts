export interface PassiveEffect {
  kind: string
  value?: number
  maxStacks?: number
  threshold?: number
  reductionPercent?: number
}

export interface CharacterStats {
  hp: number
  maxHp: number
  atk: number
  def: number
  speed: number
  critRate: number
  critDamage: number
  evasionRate: number
  accuracyRate: number
  armorPen: number
}

export interface PassiveContext {
  attacker: CharacterStats
  defender: CharacterStats
  baseDamage: number
  isCrit: boolean
  skillMultiplier: number
  comboCount: number
  summonPresent: boolean
}

export function calcMaxHp(level: number, resilience: number): number {
  return 100 + level * 18 + resilience * 12
}

export function calcAttack(level: number, mainAttr: number): number {
  return level * 4 + mainAttr * 6
}

export function calcDefense(resilience: number, practice: number): number {
  return resilience * 2 + practice * 1
}

export function calcActionInterval(insight: number): number {
  return Math.max(0.8, 2.0 - insight * 0.03)
}

export function calcBaseDamage(attackerAtk: number, defenderDef: number, armorPen: number = 0): number {
  const effectiveDef = defenderDef * (1 - armorPen)
  return Math.max(1, attackerAtk - effectiveDef * 0.5)
}

export function calcSkillDamage(baseDamage: number, multiplier: number): number {
  return baseDamage * multiplier
}

export function calcCritDamage(baseDamage: number, critDamage: number): number {
  return baseDamage * critDamage
}

export function rollEvasion(evasionRate: number): boolean {
  return Math.random() < evasionRate
}

export function rollCrit(critRate: number): boolean {
  return Math.random() < critRate
}

export function rollAccuracy(accuracyRate: number): boolean {
  return Math.random() < accuracyRate
}

export function calcExpToNextLevel(level: number): number {
  return level * 100
}

export function calcIdleExpRate(task: 'study' | 'intern'): number {
  return task === 'study' ? 10 : 6
}

export function calcIdleCoinRate(task: 'study' | 'intern'): number {
  return task === 'study' ? 0 : 8
}

export function calcOfflineRewards(
  task: 'study' | 'intern',
  offlineSeconds: number
): { exp: number; coins: number } {
  const maxOffline = 8 * 60 * 60
  const effectiveSeconds = Math.min(offlineSeconds, maxOffline)
  const ticks = Math.floor(effectiveSeconds / 5)
  
  return {
    exp: ticks * calcIdleExpRate(task),
    coins: ticks * calcIdleCoinRate(task)
  }
}

export function applyPassiveEffects(
  baseDamage: number,
  passives: PassiveEffect[],
  context: PassiveContext
): number {
  let finalDamage = baseDamage

  passives.forEach(passive => {
    switch (passive.kind) {
      case 'crit_rate_bonus':
        if (context.isCrit && passive.value) {
          finalDamage *= (1 + passive.value)
        }
        break
      case 'crit_damage_bonus':
        if (context.isCrit && passive.value) {
          finalDamage *= (1 + passive.value)
        }
        break
      case 'atk_percent':
        if (passive.value) {
          finalDamage *= (1 + passive.value)
        }
        break
      case 'stack_atk_per_kill':
        if (passive.value && context.comboCount > 0) {
          const stacks = Math.min(context.comboCount, passive.maxStacks || 5)
          finalDamage *= (1 + stacks * passive.value)
        }
        break
      case 'armor_pen_on_combo':
        if (passive.threshold && passive.value && context.comboCount >= passive.threshold) {
          const effectiveDef = context.defender.def * (1 - passive.value)
          finalDamage = Math.max(1, context.attacker.atk - effectiveDef * 0.5) * context.skillMultiplier
        }
        break
      case 'damage_bonus_vs_high_def':
        if (passive.value && context.defender.def > context.attacker.atk * 0.8) {
          finalDamage *= (1 + passive.value)
        }
        break
      case 'action_interval_percent':
        break
      case 'cooldown_reduction':
        break
      case 'heavy_mitigation':
        break
      case 'reflect_by_def':
        break
      case 'summon_formula':
        if (context.summonPresent) {
          finalDamage *= 1.2
        }
        break
      case 'item_effect_bonus':
        break
      case 'credit_bonus':
        break
      case 'exp_bonus':
        break
    }
  })

  return finalDamage
}

export function calcReflectDamage(receivedDamage: number, defenderDef: number, reflectPercent: number): number {
  return Math.floor(receivedDamage * reflectPercent + defenderDef * 0.1)
}

export function calcArmorPenetration(baseDamage: number, armorPenValue: number, defenderDef: number): number {
  const effectiveDef = defenderDef * (1 - armorPenValue)
  return Math.max(1, baseDamage + (defenderDef - effectiveDef) * 0.5)
}

export function calcComboDamage(baseDamage: number, comboCount: number, comboBonus: number = 0.05): number {
  const maxComboBonus = Math.min(comboCount * comboBonus, 0.25)
  return baseDamage * (1 + maxComboBonus)
}

export function calcTrueDamage(maxHp: number, percent: number, maxLimit: number): number {
  const damage = maxHp * percent
  return Math.min(damage, maxLimit)
}

export function calcOverTimeDamage(baseValue: number, duration: number, stacks: number = 1): number {
  return baseValue * duration * stacks
}

export function calcShieldDamage(shield: number, damage: number): { remainingShield: number; actualDamage: number } {
  if (shield >= damage) {
    return { remainingShield: shield - damage, actualDamage: 0 }
  }
  return { remainingShield: 0, actualDamage: damage - shield }
}