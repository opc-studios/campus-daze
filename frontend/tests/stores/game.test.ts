import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '../../src/stores/game'

describe('Game Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with null state', () => {
    const store = useGameStore()
    expect(store.state).toBeNull()
    expect(store.loaded).toBe(false)
  })

  it('should add exp correctly', () => {
    const store = useGameStore()
    store.state = {
      player: {
        name: 'Test',
        roleId: 'lina',
        currentForm: 'human',
        combatRole: 'summon_spirit',
        level: 1,
        exp: 0,
        attrs: { knowledge: 8, practice: 5, insight: 6, resilience: 4 },
        combatStats: { critRate: 0.05, critDamage: 1.5, evasionRate: 0.05, accuracyRate: 0.95 },
        unlockedSkills: ['lina_basic'],
        equippedSkills: ['lina_basic', null, null]
      },
      resources: { credits: 0, coins: 0 },
      idle: { task: 'study', startedAt: 0, lastClaimedAt: 0 },
      progress: {
        currentChapter: 0,
        chapterCleared: [false, false, false, false],
        chapterCredits: 0,
        clearedNodes: [],
        seenEvents: [],
        archives: []
      },
      map: {
        currentMapId: 'ch1_map1',
        playerPosition: { x: 100, y: 300 },
        formSwitchAllowed: true,
        revealedRegions: [],
        completedNodes: [],
        nodeCooldowns: {}
      },
      monsters: {},
      combat: { state: 'idle', speed: 1, canSkip: true, skipped: false },
      inventory: {},
      equipped: {}
    }

    store.addExp(50)
    expect(store.state.player.exp).toBe(50)

    store.addExp(60)
    expect(store.state.player.level).toBe(2)
    expect(store.state.player.exp).toBe(10)
  })

  it('should add credits correctly', () => {
    const store = useGameStore()
    store.state = {
      player: {
        name: 'Test',
        roleId: 'lina',
        currentForm: 'human',
        combatRole: 'summon_spirit',
        level: 1,
        exp: 0,
        attrs: { knowledge: 8, practice: 5, insight: 6, resilience: 4 },
        combatStats: { critRate: 0.05, critDamage: 1.5, evasionRate: 0.05, accuracyRate: 0.95 },
        unlockedSkills: ['lina_basic'],
        equippedSkills: ['lina_basic', null, null]
      },
      resources: { credits: 0, coins: 0 },
      idle: { task: 'study', startedAt: 0, lastClaimedAt: 0 },
      progress: {
        currentChapter: 0,
        chapterCleared: [false, false, false, false],
        chapterCredits: 0,
        clearedNodes: [],
        seenEvents: [],
        archives: []
      },
      map: {
        currentMapId: 'ch1_map1',
        playerPosition: { x: 100, y: 300 },
        formSwitchAllowed: true,
        revealedRegions: [],
        completedNodes: [],
        nodeCooldowns: {}
      },
      monsters: {},
      combat: { state: 'idle', speed: 1, canSkip: true, skipped: false },
      inventory: {},
      equipped: {}
    }

    store.addCredits(10)
    expect(store.state.resources.credits).toBe(10)
    expect(store.state.progress.chapterCredits).toBe(10)
  })

  it('should switch form correctly', () => {
    const store = useGameStore()
    store.state = {
      player: {
        name: 'Test',
        roleId: 'lina',
        currentForm: 'human',
        combatRole: 'summon_spirit',
        level: 1,
        exp: 0,
        attrs: { knowledge: 8, practice: 5, insight: 6, resilience: 4 },
        combatStats: { critRate: 0.05, critDamage: 1.5, evasionRate: 0.05, accuracyRate: 0.95 },
        unlockedSkills: ['lina_basic'],
        equippedSkills: ['lina_basic', null, null]
      },
      resources: { credits: 0, coins: 0 },
      idle: { task: 'study', startedAt: 0, lastClaimedAt: 0 },
      progress: {
        currentChapter: 0,
        chapterCleared: [false, false, false, false],
        chapterCredits: 0,
        clearedNodes: [],
        seenEvents: [],
        archives: []
      },
      map: {
        currentMapId: 'ch1_map1',
        playerPosition: { x: 100, y: 300 },
        formSwitchAllowed: true,
        revealedRegions: [],
        completedNodes: [],
        nodeCooldowns: {}
      },
      monsters: {},
      combat: { state: 'idle', speed: 1, canSkip: true, skipped: false },
      inventory: {},
      equipped: {}
    }

    expect(store.state.player.currentForm).toBe('human')
    store.switchForm()
    expect(store.state.player.currentForm).toBe('cat')
    store.switchForm()
    expect(store.state.player.currentForm).toBe('human')
  })

  it('should add and use items correctly', () => {
    const store = useGameStore()
    store.state = {
      player: {
        name: 'Test',
        roleId: 'lina',
        currentForm: 'human',
        combatRole: 'summon_spirit',
        level: 1,
        exp: 0,
        attrs: { knowledge: 8, practice: 5, insight: 6, resilience: 4 },
        combatStats: { critRate: 0.05, critDamage: 1.5, evasionRate: 0.05, accuracyRate: 0.95 },
        unlockedSkills: ['lina_basic'],
        equippedSkills: ['lina_basic', null, null]
      },
      resources: { credits: 0, coins: 0 },
      idle: { task: 'study', startedAt: 0, lastClaimedAt: 0 },
      progress: {
        currentChapter: 0,
        chapterCleared: [false, false, false, false],
        chapterCredits: 0,
        clearedNodes: [],
        seenEvents: [],
        archives: []
      },
      map: {
        currentMapId: 'ch1_map1',
        playerPosition: { x: 100, y: 300 },
        formSwitchAllowed: true,
        revealedRegions: [],
        completedNodes: [],
        nodeCooldowns: {}
      },
      monsters: {},
      combat: { state: 'idle', speed: 1, canSkip: true, skipped: false },
      inventory: {},
      equipped: {}
    }

    store.addItem('potion_exp', 3)
    expect(store.state.inventory['potion_exp']).toBe(3)

    store.useItem('potion_exp')
    expect(store.state.inventory['potion_exp']).toBe(2)

    store.useItem('potion_exp')
    store.useItem('potion_exp')
    expect(store.state.inventory['potion_exp']).toBeUndefined()
  })
})
