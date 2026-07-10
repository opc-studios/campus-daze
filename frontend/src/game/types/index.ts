export interface ActionDef {
  id: string
  label: string
  hint: string
  row: number
  fps: number
  repeat: number
  frames: number[]
}

export interface RoleDef {
  roleId: string
  name: string
  title: string
  emoji: string
  color: string
  portrait: string
  sprite: string
  combatRole: string
  mainAttr: string
  baseAttrs: {
    knowledge: number
    practice: number
    insight: number
    resilience: number
  }
  combatStats: {
    critRate: number
    critDamage: number
    evasionRate: number
    accuracyRate: number
  }
  stats: {
    hp: number
    atk: number
    def: number
    speed: number
  }
  growth: {
    hp: number
    atk: number
    def: number
  }
  passive: {
    id: string
    name: string
    effect: string
    value: number
    desc: string
  }
  description: string
  quote: string
  combat: string
  weapon: string
  cat: string
  actionGuide: string
  highlightQuotes: string[]
  voiceLines: {
    idle: string[]
    event: string[]
    combat: string[]
  }
  bossRecLevel: number
  selectLine: string
}