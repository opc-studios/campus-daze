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
  passives?: PassiveSkill[]
  buffs: Buff[]
  shield: number
  evasionRate: number
  accuracyRate: number
  critRate: number
  critDamage: number
  isPlayer: boolean
  // GDD §4.4 被动技能运行时状态
  passiveState?: {
    // 阿宇「愈战愈勇」：击败敌人叠加层数
    killStacks?: number
    // 阿宇「破甲连击」：连续命中同一目标次数
    consecutiveHits?: number
    lastTargetId?: string
    // 知夏「公式记忆」：已释放主动技能次数
    skillsCast?: number
    // 老登「钢筋铁骨」：单次高额伤害减免剩余次数
    heavyMitigationLeft?: number
    // 莉娜「学风共鸣」：场上是否存在精灵
    hasSummon?: boolean
  }
  // GDD §5.3 怪物技能循环运行时状态
  skillCycleState?: {
    cycleIndex: number
    lastSpecialAt: number
  }
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

// GDD §4.4 被动技能：常驻生效，不占用 3 个战斗技能格
export interface PassiveSkill {
  skillId: string
  name: string
  roleId: string
  type: 'passive'
  trigger: 'on_combat_start' | 'on_summon_present' | 'on_kill' | 'on_attack_hit' | 'on_attacked' | 'on_skill_cast' | 'static'
  effect: {
    kind: 'atk_percent' | 'summon_formula' | 'stack_atk_per_kill' | 'armor_pen_on_combo'
      | 'crit_rate_bonus' | 'crit_damage_set' | 'cooldown_reduction' | 'action_interval_percent'
      | 'damage_bonus_vs_high_def' | 'heavy_mitigation' | 'reflect_by_def'
    value?: number
    maxStacks?: number
    threshold?: number
    reductionPercent?: number
  }
}

export interface SkillEffect {
  type: 'damage' | 'buff' | 'debuff' | 'heal' | 'shield' | 'dot' | 'summon' | 'multi_hit' | 'armor_pen' | 'reflect'
  stat?: string
  value?: number
  duration?: number
  stacks?: boolean
  hits?: number
  damage?: number
  // GDD §4.4 莉娜精灵亲和：召唤物数值改为公式计算（不再用固定 damage）
  useSummonFormula?: boolean
}

// GDD §5.3 怪物技能循环配置
export interface SkillCycleEntry {
  interval: number       // 每 N 秒释放一次
  skillId: string        // 引用 ActiveSkill.skillId
  multiplier?: number    // 伤害倍率覆盖
  effect?: SkillEffect   // 附加效果
  unavoidable?: boolean
  hpThreshold?: number   // 血量低于此比例才触发（如过拟合史莱姆 40%）
}

// GDD §4.4 Boss 阶段专属技能：phases 扩展 skillId 字段
export interface BossPhaseSkill {
  hpThreshold: number
  name?: string
  atkBonus?: number
  defBonus?: number
  atkMultiplier?: number
  defMultiplier?: number
  skillIndex?: number       // 该阶段使用的技能索引（enemy.skills 中）
  phaseSkillId?: string     // 阶段专属技能 ID
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
