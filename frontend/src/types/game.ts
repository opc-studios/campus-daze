export type RoleId = 'lina' | 'ayu' | 'zhixia' | 'jiangxun' | 'laodeng'
export type FormType = 'human' | 'cat'
export type CombatRole = 'summon_spirit' | 'dps_strike' | 'dps_burst' | 'dps_aoe' | 'tank_heavy'
export type IdleTask = 'study' | 'intern'
export type CombatStateType = 'idle' | 'init' | 'running' | 'skipped' | 'end' | 'settlement'
export type CombatResultType = 'win' | 'lose' | 'flee'
export type MonsterStateType = 'patrol' | 'alert' | 'chase' | 'combat' | 'cleared' | 'return'

// GDD §6.5 三因子最终结局类型
export type FinalEndingType = 'perfect_memory' | 'memory_remaining' | 'standard'

export interface Position {
  x: number
  y: number
}

export interface Attrs {
  knowledge: number
  practice: number
  insight: number
  resilience: number
}

export interface CombatStats {
  critRate: number
  critDamage: number
  evasionRate: number
  accuracyRate: number
}

export interface PlayerState {
  name: string
  roleId: RoleId
  currentForm: FormType
  combatRole: CombatRole
  level: number
  exp: number
  attrs: Attrs
  combatStats: CombatStats
  unlockedSkills: string[]
  equippedSkills: [string, string | null, string | null]
  currentHp?: number
  buffs?: { id: string; name: string; duration: number; effect: string }[]
  debuffs?: { id: string; name: string; duration: number; effect: string }[]
}

export interface ResourcesState {
  credits: number
  coins: number
}

export interface IdleState {
  task: IdleTask
  startedAt: number
  lastClaimedAt: number
}

export interface ProgressState {
  currentChapter: number
  chapterCleared: boolean[]
  chapterCredits: number
  clearedNodes: string[]
  seenEvents: string[]
  archives: string[]
  chapterEndings?: number[]
  // GDD §6.6 通关统计字段
  studyTimeSeconds?: number
  exploreCount?: number
  eventTriggerCount?: number
  // GDD §6.5 三因子之一：每章关键事件选择索引
  chapterChoices?: number[]
  // 通关标记
  gameCompleted?: boolean
  // D.3 二周目继承：周目数（0=首周目，每次开启二周目递增）
  ngPlusCount?: number
}

// D.3 二周目继承快照（开启二周目时从旧存档提取的继承数据）
export interface NewGamePlusState {
  // 周目数（新存档写入 ngPlusCount = old + 1）
  ngPlusCount: number
  // 继承的校史图鉴 ID 列表（GDD §6.7：二周目保留图鉴收集）
  inheritedArchives: string[]
  // 继承的已解锁技能 ID 列表（GDD §6.7：保留技能解锁状态）
  inheritedSkills: string[]
  // 继承的初始校园币（部分资源继承，例如 oldCoins * 0.5）
  bonusCoins: number
  // 继承的初始学分（部分资源继承，例如 oldCredits * 0.5）
  bonusCredits: number
}

export interface MapState {
  currentMapId: string
  playerPosition: Position
  formSwitchAllowed: boolean
  revealedRegions: string[]
  completedNodes: string[]
  nodeCooldowns: Record<string, number>
  currentZone?: string
}

export interface MonsterInfo {
  nodeId?: string
  monsterId?: string
  state: MonsterStateType
  position?: Position
  patrolAnchor?: Position
  alertRadius?: number
  leashRadius?: number
  failCount: number
}

export interface Reward {
  type: string
  amount: number
  itemId?: string
}

export interface CombatInfo {
  state: CombatStateType
  speed: 1 | 2
  canSkip: boolean
  skipped: boolean
  result?: CombatResultType
  activeCombatId?: string
  monsterId?: string
  lastResult?: {
    resultId?: string
    monsterId: string
    outcome: string
    rewards: Reward[]
    createdAt: number
  }
  comboCount?: number
  shield?: number
}

export interface GameState {
  player: PlayerState
  resources: ResourcesState
  idle: IdleState
  progress: ProgressState
  map: MapState
  monsters: Record<string, MonsterInfo>
  combat: CombatInfo
  inventory: Record<string, number>
  equipped: Record<string, string | undefined>
  tasks?: Array<{
    id: string
    name: string
    description: string
    type: 'main' | 'side' | 'daily'
    progress: number
    target: number
    rewards: { exp?: number; coins?: number; credits?: number; items?: string[] }
    completed: boolean
    claimed: boolean
  }>
  collections?: Array<{
    id: string
    name: string
    description: string
    category: string
    rarity: string
    obtained: boolean
    obtainedAt?: number
  }>
  notifications?: Array<{
    id: string
    type: string
    title: string
    message: string
    data?: Record<string, any>
    timestamp: number
  }>
  activeBuffs?: Array<{
    id: string
    name: string
    icon: string
    duration: number
    effect: Record<string, any>
  }>
  nextCombatShield?: number
}
