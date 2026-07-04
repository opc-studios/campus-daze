import { describe, it, expect } from 'vitest'
import { CombatSimulator } from '../../src/game/combat/simulator'
import { calcActionInterval } from '../../src/game/combat/formulas'
import type { ActiveSkill, PassiveSkill } from '../../src/game/combat/types'

describe('CombatSimulator', () => {
  const createPlayerState = () => ({
    name: 'Test Player',
    level: 5,
    attrs: { knowledge: 8, practice: 5, insight: 6, resilience: 4 },
    combatStats: { critRate: 0.1, critDamage: 1.5, evasionRate: 0.05, accuracyRate: 0.95 },
    combatRole: 'summon_spirit',
    mainAttr: 'knowledge'
  })

  const createEnemyConfig = () => ({
    monsterId: 'test_monster',
    name: 'Test Monster',
    hp: 100,
    atk: 15,
    def: 5,
    actionInterval: 2.0,
    evasionRate: 0.05,
    skills: ['basic']
  })

  const createSkills = (): ActiveSkill[] => [
    {
      skillId: 'basic',
      name: 'Basic Attack',
      cooldown: 0,
      currentCd: 0,
      multiplier: 1.0,
      target: 'enemy',
      unavoidable: false
    }
  ]

  it('should initialize combat state correctly', () => {
    const simulator = new CombatSimulator({
      playerState: createPlayerState(),
      enemyConfig: createEnemyConfig(),
      equippedSkills: createSkills()
    })

    const state = simulator.getState()
    expect(state.player.name).toBe('Test Player')
    expect(state.enemy.name).toBe('Test Monster')
    expect(state.isFinished).toBe(false)
  })

  it('should finish combat when enemy HP reaches 0', () => {
    const simulator = new CombatSimulator({
      playerState: createPlayerState(),
      enemyConfig: { ...createEnemyConfig(), hp: 10 },
      equippedSkills: createSkills()
    })

    simulator.runToCompletion()
    const result = simulator.getResult()

    expect(result).not.toBeNull()
    expect(result!.winner).toBe('player')
  })

  it('should finish combat when player HP reaches 0', () => {
    const simulator = new CombatSimulator({
      playerState: {
        ...createPlayerState(),
        level: 1,
        attrs: { knowledge: 1, practice: 1, insight: 1, resilience: 1 }
      },
      enemyConfig: { ...createEnemyConfig(), hp: 1000, atk: 100 },
      equippedSkills: createSkills()
    })

    simulator.runToCompletion()
    const result = simulator.getResult()

    expect(result).not.toBeNull()
    expect(result!.winner).toBe('enemy')
  })

  it('should support skip functionality', () => {
    const simulator = new CombatSimulator({
      playerState: createPlayerState(),
      enemyConfig: createEnemyConfig(),
      equippedSkills: createSkills()
    })

    simulator.skip()
    const result = simulator.getResult()

    expect(result).not.toBeNull()
    expect(result!.winner).toBeDefined()
  })

  it('should support speed multiplier', () => {
    const simulator = new CombatSimulator({
      playerState: createPlayerState(),
      enemyConfig: createEnemyConfig(),
      equippedSkills: createSkills()
    })

    simulator.setSpeed(2)
    simulator.step(0.5) // 0.5 * 2 = 1.0，不会超过 actionInterval

    const state = simulator.getState()
    expect(state.player.currentActionGauge).toBe(1.0)
  })

  // GDD §4.4 被动技能体系测试
  it('should apply on_combat_start passives (知夏学术专注 critRate +15%)', () => {
    const zhixiaPassives: PassiveSkill[] = [
      {
        skillId: 'zhixia_p1',
        name: '学术专注',
        roleId: 'zhixia',
        type: 'passive',
        trigger: 'on_combat_start',
        effect: { kind: 'crit_rate_bonus', value: 0.15 }
      }
    ]
    const simulator = new CombatSimulator({
      playerState: {
        ...createPlayerState(),
        combatStats: { critRate: 0, critDamage: 2.0, evasionRate: 0, accuracyRate: 1.0 }
      },
      enemyConfig: createEnemyConfig(),
      equippedSkills: createSkills(),
      passives: zhixiaPassives
    })

    const state = simulator.getState()
    expect(state.player.critRate).toBe(0.15) // 0 + 0.15
  })

  it('should apply 江苏风之眷顾 actionInterval -8%', () => {
    const jiangxunPassives: PassiveSkill[] = [
      {
        skillId: 'jiangxun_p1',
        name: '风之眷顾',
        roleId: 'jiangxun',
        type: 'passive',
        trigger: 'on_combat_start',
        effect: { kind: 'action_interval_percent', value: -0.08 }
      }
    ]
    const simulator = new CombatSimulator({
      playerState: createPlayerState(),
      enemyConfig: createEnemyConfig(),
      equippedSkills: createSkills(),
      passives: jiangxunPassives
    })

    const state = simulator.getState()
    const baseInterval = state.player.actionInterval
    // GDD §4.4 风之眷顾：行动间隔额外 -8%
    // 原 calcActionInterval(6) = max(0.8, 2.0 - 0.18) = 1.82
    // 应用 -8% 后 = 1.82 × 0.92 = 1.6744
    const expectedInterval = calcActionInterval(6) * 0.92
    expect(baseInterval).toBeCloseTo(expectedInterval, 3)
  })

  // GDD §5.3 怪物技能循环测试
  it('should trigger skillCycle special skill after interval', () => {
    const simulator = new CombatSimulator({
      playerState: createPlayerState(),
      enemyConfig: createEnemyConfig(),
      equippedSkills: createSkills(),
      skillCycle: [
        {
          interval: 4,
          skillId: 'test_special',
          multiplier: 1.5,
          name: '测试特殊技能',
          unavoidable: true
        }
      ]
    })

    // 模拟 6 秒战斗（确保超过 interval=4）
    simulator.step(6)
    const state = simulator.getState()
    const hasSpecialLog = state.log.some(
      l => l.action && l.action.includes('测试特殊技能')
    )
    expect(hasSpecialLog).toBe(true)
  })

  it('should respect hpThreshold in skillCycle (过拟合史莱姆 < 40%)', () => {
    const simulator = new CombatSimulator({
      playerState: createPlayerState(),
      enemyConfig: { ...createEnemyConfig(), hp: 1000 }, // 高血量确保不进入 40% 阈值
      equippedSkills: createSkills(),
      skillCycle: [
        {
          interval: 2,
          skillId: 'test_threshold_skill',
          multiplier: 0.5,
          name: '阈值限定技能',
          hpThreshold: 0.4
        }
      ]
    })

    simulator.step(4) // 4 秒，超过 interval=2 但 HP 仍满
    const state = simulator.getState()
    const hasSpecialLog = state.log.some(
      l => l.action && l.action.includes('阈值限定技能')
    )
    expect(hasSpecialLog).toBe(false) // 因 HP > 40%，不应触发
  })

  // GDD §4.4 Boss 阶段专属技能测试
  it('should switch enemy skill on boss phase transition', () => {
    // 使用高血量 + 高阈值，确保阶段切换在敌人死亡前触发
    const simulator = new CombatSimulator({
      playerState: createPlayerState(),
      enemyConfig: {
        ...createEnemyConfig(),
        hp: 500,
        def: 0,
        phases: [
          {
            hpThreshold: 0.9,  // 90% 血量即触发，确保第一击后就进入阶段 2
            name: '第二阶段',
            phaseSkillId: 'phase2_skill',
            skillIndex: 1
          }
        ]
      },
      equippedSkills: createSkills(),
      phaseSkills: [
        {
          skillId: 'phase2_skill',
          name: '阶段二技能',
          multiplier: 2.0,
          unavoidable: true
        }
      ]
    })

    simulator.runToCompletion()
    const state = simulator.getState()

    // 应有进入第二阶段的日志
    const phaseLog = state.log.find(l => l.action && l.action.includes('第二阶段'))
    expect(phaseLog).toBeDefined()
  })
})
