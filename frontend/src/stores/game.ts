import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { saveApi } from '../api/save'
import type { GameState, RoleId, CombatRole } from '../types/game'
import rolesConfig from '../game/config/roles.json'

function createDefaultGameState(roleId: RoleId): GameState {
  const role = rolesConfig.find(r => r.roleId === roleId)
  if (!role) throw new Error(`Unknown role: ${roleId}`)

  return {
    player: {
      name: role.name,
      roleId,
      currentForm: 'human',
      combatRole: role.combatRole as CombatRole,
      level: 1,
      exp: 0,
      attrs: { ...role.baseAttrs },
      combatStats: {
        critRate: role.combatStats?.critRate ?? 0.05,
        critDamage: role.combatStats?.critDamage ?? 1.5,
        evasionRate: role.combatStats?.evasionRate ?? 0.05,
        accuracyRate: role.combatStats?.accuracyRate ?? 0.95
      },
      unlockedSkills: [`${roleId}_basic`],
      equippedSkills: [`${roleId}_basic`, null, null]
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
      revealedRegions: ['entrance'],
      completedNodes: [],
      nodeCooldowns: {}
    },
    monsters: {},
    combat: {
      state: 'idle',
      speed: 1,
      canSkip: true,
      skipped: false
    },
    inventory: {},
    equipped: {}
  }
}

export const useGameStore = defineStore('game', () => {
  const state = ref<GameState | null>(null)
  const stateVersion = ref(0)
  const loaded = ref(false)

  const player = computed(() => state.value?.player ?? null)
  const resources = computed(() => state.value?.resources ?? { credits: 0, coins: 0 })
  const progress = computed(() => state.value?.progress ?? null)
  const mapState = computed(() => state.value?.map ?? null)
  const combatState = computed(() => state.value?.combat ?? null)
  const inventory = computed(() => state.value?.inventory ?? {})
  const equipped = computed(() => state.value?.equipped ?? {})

  const unlockedSkills = computed(() => {
    if (!state.value) return []
    return getUnlockedSkillIds(state.value)
  })

  function getUnlockedSkillIds(gs: GameState): string[] {
    const { roleId } = gs.player
    const { chapterCleared, chapterCredits } = gs.progress
    const ids = [`${roleId}_basic`]
    if (gs.progress.currentChapter >= 1) ids.push(`${roleId}_s1`)
    if (chapterCredits >= 8 || chapterCleared[0]) ids.push(`${roleId}_s2`)
    if (chapterCleared[0]) ids.push(`${roleId}_s3`)
    if (chapterCleared[1]) ids.push(`${roleId}_s4`)
    if (chapterCleared[2]) ids.push(`${roleId}_s5`)
    return [...new Set(ids)]
  }

  async function loadSave() {
    try {
      const data = await saveApi.getSave()
      state.value = data.state
      stateVersion.value = data.state_version
      loaded.value = true
    } catch (err) {
      loaded.value = false
    }
  }

  async function saveSave() {
    if (!state.value) return
    try {
      const result = await saveApi.putSave({
        state: state.value,
        state_version: stateVersion.value
      })
      stateVersion.value = result.state_version
    } catch (err) {
      console.error('Save failed:', err)
    }
  }

  async function initSave(roleId: RoleId) {
    const newState = createDefaultGameState(roleId)
    state.value = newState
    stateVersion.value = 0
    await saveSave()
    loaded.value = true
  }

  function switchForm() {
    if (!state.value || !state.value.map.formSwitchAllowed) return
    state.value.player.currentForm =
      state.value.player.currentForm === 'human' ? 'cat' : 'human'
  }

  function addExp(amount: number) {
    if (!state.value) return
    state.value.player.exp += amount
    const expToNext = state.value.player.level * 100
    while (state.value.player.exp >= expToNext) {
      state.value.player.exp -= expToNext
      state.value.player.level++
    }
  }

  function addCredits(amount: number) {
    if (!state.value) return
    state.value.resources.credits += amount
    state.value.progress.chapterCredits += amount
  }

  function addCoins(amount: number) {
    if (!state.value) return
    state.value.resources.coins += amount
  }

  function addItem(itemId: string, count: number = 1) {
    if (!state.value) return
    if (!state.value.inventory[itemId]) {
      state.value.inventory[itemId] = 0
    }
    state.value.inventory[itemId] += count
  }

  function useItem(itemId: string) {
    if (!state.value) return
    if (!state.value.inventory[itemId] || state.value.inventory[itemId] <= 0) return false
    state.value.inventory[itemId]--
    if (state.value.inventory[itemId] === 0) delete state.value.inventory[itemId]
    return true
  }

  function completeNode(nodeId: string) {
    if (!state.value) return
    if (!state.value.map.completedNodes.includes(nodeId)) {
      state.value.map.completedNodes.push(nodeId)
    }
    if (!state.value.progress.clearedNodes.includes(nodeId)) {
      state.value.progress.clearedNodes.push(nodeId)
    }
  }

  function revealRegion(regionId: string) {
    if (!state.value) return
    if (!state.value.map.revealedRegions.includes(regionId)) {
      state.value.map.revealedRegions.push(regionId)
    }
  }

  function addArchive(archiveId: string) {
    if (!state.value) return
    if (!state.value.progress.archives.includes(archiveId)) {
      state.value.progress.archives.push(archiveId)
    }
  }

  function equipSkill(slotIndex: 1 | 2, skillId: string | null) {
    if (!state.value) return
    state.value.player.equippedSkills[slotIndex] = skillId
  }

  return {
    state,
    stateVersion,
    loaded,
    player,
    resources,
    progress,
    mapState,
    combatState,
    inventory,
    equipped,
    unlockedSkills,
    loadSave,
    saveSave,
    initSave,
    switchForm,
    addExp,
    addCredits,
    addCoins,
    addItem,
    useItem,
    completeNode,
    revealRegion,
    addArchive,
    equipSkill
  }
})
