export interface CombatEntity {
  id: string
  name: string
  hp: number
  maxHp: number
  attack: number
  defense: number
  actionInterval: number
  currentActionGauge: number
  skills: ActiveSkill[]
  buffs: Buff[]
  shield: number
  evasionRate: number
  accuracyRate: number
  critRate: number
  critDamage: number
  isPlayer: boolean
}

export interface ActiveSkill {
  skillId: string
  name: string
  cooldown: number
  currentCd: number
  multiplier: number
  target: 'enemy' | 'self' | 'all_enemies'
  effect?: SkillEffect
  unavoidable: boolean
}

export interface SkillEffect {
  type: 'damage' | 'buff' | 'debuff' | 'heal' | 'shield' | 'dot' | 'summon' | 'multi_hit' | 'armor_pen' | 'reflect'
  stat?: string
  value?: number
  duration?: number
  stacks?: boolean
  hits?: number
  damage?: number
}

export interface Buff {
  type: 'buff' | 'debuff'
  stat: string
  value: number
  remainingDuration: number
  stacks?: number
}

export interface CombatLog {
  timestamp: number
  actorId: string
  action: string
  targetId?: string
  damage?: number
  healing?: number
  isCrit?: boolean
  isEvaded?: boolean
}

export interface CombatResult {
  winner: 'player' | 'enemy'
  rewards?: {
    exp: number
    credits: number
    coins: number
    items?: string[]
  }
  log: CombatLog[]
  duration: number
}

export interface CombatState {
  player: CombatEntity
  enemy: CombatEntity
  summons: CombatEntity[]
  log: CombatLog[]
  isFinished: boolean
  winner?: 'player' | 'enemy'
  startTime: number
}
