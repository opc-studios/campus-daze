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

export function calcBaseDamage(attackerAtk: number, defenderDef: number): number {
  return Math.max(1, attackerAtk - defenderDef * 0.5)
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
