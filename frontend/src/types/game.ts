export type RoleId = 'lina' | 'ayu' | 'zhixia' | 'jiangxun' | 'laodeng'
export type FormType = 'human' | 'cat'
export type CombatRole = 'summon_spirit' | 'dps_strike' | 'dps_burst' | 'dps_aoe' | 'tank_heavy'
export type IdleTask = 'study' | 'intern'
export type CombatStateType = 'idle' | 'init' | 'running' | 'skipped' | 'end' | 'settlement'
export type CombatResultType = 'win' | 'lose' | 'flee'
export type MonsterStateType = 'patrol' | 'alert' | 'chase' | 'combat' | 'cleared' | 'return'

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
}

export interface MapState {
  currentMapId: string
  playerPosition: Position
  formSwitchAllowed: boolean
  revealedRegions: string[]
  completedNodes: string[]
  nodeCooldowns: Record<string, number>
}

export interface MonsterInfo {
  nodeId: string
  monsterId: string
  state: MonsterStateType
  position: Position
  patrolAnchor: Position
  alertRadius: number
  leashRadius: number
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
  lastResult?: {
    monsterId: string
    outcome: string
    rewards: Reward[]
    createdAt: number
  }
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
}
