import { describe, it, expect } from 'vitest'
import { CombatSimulator } from '../../src/game/combat/simulator'
import type { ActiveSkill } from '../../src/game/combat/types'

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
    const simulator = new CombatSimulator(
      createPlayerState(),
      createEnemyConfig(),
      createSkills()
    )

    const state = simulator.getState()
    expect(state.player.name).toBe('Test Player')
    expect(state.enemy.name).toBe('Test Monster')
    expect(state.isFinished).toBe(false)
  })

  it('should finish combat when enemy HP reaches 0', () => {
    const simulator = new CombatSimulator(
      createPlayerState(),
      { ...createEnemyConfig(), hp: 10 },
      createSkills()
    )

    simulator.runToCompletion()
    const result = simulator.getResult()

    expect(result).not.toBeNull()
    expect(result!.winner).toBe('player')
  })

  it('should finish combat when player HP reaches 0', () => {
    const simulator = new CombatSimulator(
      { ...createPlayerState(), level: 1, attrs: { knowledge: 1, practice: 1, insight: 1, resilience: 1 } },
      { ...createEnemyConfig(), hp: 1000, atk: 100 },
      createSkills()
    )

    simulator.runToCompletion()
    const result = simulator.getResult()

    expect(result).not.toBeNull()
    expect(result!.winner).toBe('enemy')
  })

  it('should support skip functionality', () => {
    const simulator = new CombatSimulator(
      createPlayerState(),
      createEnemyConfig(),
      createSkills()
    )

    simulator.skip()
    const result = simulator.getResult()

    expect(result).not.toBeNull()
    expect(result!.winner).toBeDefined()
  })

  it('should support speed multiplier', () => {
    const simulator = new CombatSimulator(
      createPlayerState(),
      createEnemyConfig(),
      createSkills()
    )

    simulator.setSpeed(2)
    simulator.step(0.5) // 0.5 * 2 = 1.0，不会超过 actionInterval

    const state = simulator.getState()
    expect(state.player.currentActionGauge).toBe(1.0)
  })
})
