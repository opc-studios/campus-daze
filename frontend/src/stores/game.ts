import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { saveApi } from '../api/save'
import type { GameState, RoleId, CombatRole, FinalEndingType, NewGamePlusState } from '../types/game'
import rolesConfig from '../game/config/roles.json'
import skillsConfig from '../game/config/skills.json'
import itemsConfig from '../game/config/items.json'
import { calculateFinalEnding, determineEndingType } from '../game/ending/ending-calculator'
import type { FinalEnding } from '../game/ending/ending-calculator'

export interface Task {
  id: string
  name: string
  description: string
  type: 'main' | 'side' | 'daily'
  progress: number
  target: number
  rewards: { exp?: number; coins?: number; credits?: number; items?: string[] }
  completed: boolean
  claimed: boolean
}

export interface CollectionItem {
  id: string
  name: string
  description: string
  category: string
  rarity: string
  obtained: boolean
  obtainedAt?: number
}

function createDefaultGameState(roleId: RoleId): GameState {
  const role = rolesConfig.find(r => r.roleId === roleId)
  if (!role) throw new Error(`Unknown role: ${roleId}`)

  return {
    player: {
      name: role.name,
      roleId,
      currentForm: 'cat',
      combatRole: role.combatRole as CombatRole,
      level: 1,
      exp: 0,
      attrs: { ...role.baseAttrs },
      combatStats: {
        critRate: role.combatStats?.critRate ?? 0,
        critDamage: role.combatStats?.critDamage ?? 1.5,
        evasionRate: role.combatStats?.evasionRate ?? 0,
        accuracyRate: role.combatStats?.accuracyRate ?? 1.0
      },
      unlockedSkills: [`${roleId}_basic`],
      equippedSkills: [`${roleId}_basic`, null, null],
      currentHp: 100 + role.baseAttrs.resilience * 12,
      buffs: [],
      debuffs: []
    },
    resources: { credits: 0, coins: 0 },
    idle: { task: 'study', startedAt: 0, lastClaimedAt: 0 },
    progress: {
      currentChapter: 0,
      chapterCleared: [false, false, false, false],
      chapterCredits: 0,
      clearedNodes: [],
      seenEvents: [],
      archives: [],
      chapterEndings: [0, 0, 0, 0],
      studyTimeSeconds: 0,
      exploreCount: 0,
      eventTriggerCount: 0,
      chapterChoices: [0, 0, 0, 0],
      gameCompleted: false,
      ngPlusCount: 0
    },
    map: {
      currentMapId: 'ch1_map1',
      playerPosition: { x: 100, y: 300 },
      formSwitchAllowed: true,
      revealedRegions: ['entrance'],
      completedNodes: [],
      nodeCooldowns: {},
      currentZone: 'zhonghe'
    },
    monsters: {},
    combat: {
      state: 'idle',
      speed: 1,
      canSkip: true,
      skipped: false,
      comboCount: 0,
      shield: 0
    },
    inventory: {},
    equipped: {},
    tasks: [],
    collections: [],
    notifications: [],
    activeBuffs: [],
    nextCombatShield: 0
  }
}

function hasSkillConfig(skillId: string): boolean {
  return skillsConfig.some(s => s.skillId === skillId)
}

function createDefaultTasks(): Task[] {
  return [
    { id: 'task_study_1', name: '初次学习', description: '完成一次挂机学习', type: 'main', progress: 0, target: 1, rewards: { exp: 100 }, completed: false, claimed: false },
    { id: 'task_battle_1', name: '初次战斗', description: '击败一只怪物', type: 'main', progress: 0, target: 1, rewards: { exp: 150 }, completed: false, claimed: false },
    { id: 'task_exp_1', name: '提升等级', description: '提升到 3 级', type: 'main', progress: 1, target: 3, rewards: { coins: 100 }, completed: false, claimed: false },
    { id: 'task_credit_1', name: '获得学分', description: '累计获得 10 学分', type: 'side', progress: 0, target: 10, rewards: { exp: 200 }, completed: false, claimed: false },
    { id: 'task_explore_1', name: '探索地图', description: '完成 5 个地图节点', type: 'side', progress: 0, target: 5, rewards: { items: ['potion_exp'] }, completed: false, claimed: false }
  ]
}

function createDefaultCollections(): CollectionItem[] {
  return itemsConfig
    .filter((item: any) => item.category === 'souvenir')
    .map((item: any) => ({
      id: item.itemId,
      name: item.name,
      description: item.description,
      category: item.subType || 'archive',
      rarity: item.rarity || 'common',
      obtained: false
    }))
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
  const currentChapter = computed(() => state.value?.progress.currentChapter ?? 0)
  const tasks = computed(() => (state.value as any)?.tasks ?? [])
  const collections = computed(() => (state.value as any)?.collections ?? [])
  const notifications = computed(() => (state.value as any)?.notifications ?? [])

  const unlockedSkills = computed(() => {
    if (!state.value) return []
    return getUnlockedSkillIds(state.value)
  })

  const unclaimedRewards = computed(() => {
    return tasks.value.filter((t: any) => t.completed && !t.claimed)
  })

  const completedCollections = computed(() => {
    return collections.value.filter((c: any) => c.obtained)
  })

  function getUnlockedSkillIds(gs: GameState): string[] {
    const { roleId } = gs.player
    const { chapterCleared, chapterCredits } = gs.progress
    const ids = [`${roleId}_basic`]
    if (gs.progress.currentChapter >= 1) ids.push(`${roleId}_s1`)
    if (chapterCredits >= 8 || chapterCleared[0]) ids.push(`${roleId}_s2`)
    if (chapterCleared[0]) ids.push(`${roleId}_s3`)
    if (chapterCleared[1] && hasSkillConfig(`${roleId}_s4`)) ids.push(`${roleId}_s4`)
    if (chapterCleared[2] && hasSkillConfig(`${roleId}_s5`)) ids.push(`${roleId}_s5`)
    return [...new Set(ids)]
  }

  async function loadSave() {
    try {
      const data = await saveApi.getSave()
      state.value = data.state
      stateVersion.value = data.state_version
      loaded.value = true
      initializeTasksIfMissing()
      initializeCollectionsIfMissing()
    } catch {
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
    ;(newState as any).tasks = createDefaultTasks()
    ;(newState as any).collections = createDefaultCollections()
    ;(newState as any).notifications = []
    state.value = newState
    stateVersion.value = 0
    await saveSave()
    loaded.value = true
  }

  function initializeTasksIfMissing() {
    if (!state.value) return
    if (!((state.value as any).tasks) || ((state.value as any).tasks).length === 0) {
      ;(state.value as any).tasks = createDefaultTasks()
    }
  }

  function initializeCollectionsIfMissing() {
    if (!state.value) return
    if (!((state.value as any).collections) || ((state.value as any).collections).length === 0) {
      ;(state.value as any).collections = createDefaultCollections()
    }
  }

  function switchForm() {
    if (!state.value || !state.value.map.formSwitchAllowed) return
    if (state.value.combat.state === 'running' || state.value.combat.state === 'init') return
    state.value.player.currentForm =
      state.value.player.currentForm === 'human' ? 'cat' : 'human'
  }

  function setForm(form: 'human' | 'cat') {
    if (!state.value) return
    state.value.player.currentForm = form
  }

  function addExp(amount: number) {
    if (!state.value) return
    state.value.player.exp += amount
    let expToNext = state.value.player.level * 100
    while (state.value.player.exp >= expToNext) {
      state.value.player.exp -= expToNext
      state.value.player.level++
      expToNext = state.value.player.level * 100
      updateTaskProgress('task_exp_1', 1)
      addNotification('level_up', `恭喜升级！当前等级：${state.value.player.level}`)
    }
  }

  function addCredits(amount: number) {
    if (!state.value) return
    state.value.resources.credits += amount
    state.value.progress.chapterCredits += amount
    updateTaskProgress('task_credit_1', amount)
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
    unlockCollection(itemId)
  }

  function unlockCollection(itemId: string) {
    if (!state.value) return
    const collection = ((state.value as any).collections || []).find((c: CollectionItem) => c.id === itemId)
    if (collection && !collection.obtained) {
      collection.obtained = true
      collection.obtainedAt = Date.now()
      addNotification('collection', `获得收集品：${collection.name}`)
    }
  }

  function useItem(itemId: string) {
    if (!state.value) return false
    if (!state.value.inventory[itemId] || state.value.inventory[itemId] <= 0) return false

    const item = itemsConfig.find((i: any) => i.itemId === itemId)
    const effect = item?.effect
    if (effect) {
      switch (effect.type) {
        case 'exp':
          addExp(effect.amount || 0)
          break
        case 'credits':
          addCredits(effect.amount || 0)
          break
        case 'coins':
          addCoins(effect.amount || 0)
          break
        case 'heal':
          if ((state.value as any).player?.currentHp !== undefined) {
            const maxHp = 100 + state.value.player.level * 18 + state.value.player.attrs.resilience * 12
            ;(state.value as any).player.currentHp = Math.min(
              (state.value as any).player.currentHp + (effect.amount || 0),
              maxHp
            )
          }
          break
        case 'buff':
          applyBuff(effect.stat || 'exp_rate', effect.value || 1, effect.duration || 300)
          break
        case 'shield':
          ;(state.value as any).nextCombatShield = ((state.value as any).nextCombatShield || 0) + (effect.amount || 0)
          break
        default:
          if (item?.category !== 'consumable') return false
      }
    }

    state.value.inventory[itemId]--
    if (state.value.inventory[itemId] === 0) delete state.value.inventory[itemId]
    return true
  }

  function equipItem(slot: 'study' | 'intern' | 'explore', itemId: string | undefined) {
    if (!state.value) return
    state.value.equipped[slot] = itemId
  }

  function getIdleMultiplier(task: 'study' | 'intern'): { expRate: number; coinRate: number } {
    let expRate = 1.0
    let coinRate = 1.0
    if (!state.value) return { expRate, coinRate }

    const slot = task === 'study' ? 'study' : 'intern'
    const equippedItemId = state.value.equipped[slot]
    if (equippedItemId) {
      const item = itemsConfig.find((i: any) => i.itemId === equippedItemId)
      if (item?.effect?.type === 'idle_boost') {
        if (item.effect.stat === 'exp_rate') expRate *= item.effect.value
        if (item.effect.stat === 'coin_rate') coinRate *= item.effect.value
      }
    }

    const activeBuffs = (state.value as any).activeBuffs as Array<{
      stat: string
      value: number
      expiresAt: number
    }> | undefined
    if (activeBuffs && activeBuffs.length > 0) {
      const now = Math.floor(Date.now() / 1000)
      activeBuffs.forEach(buff => {
        if (buff.expiresAt > now) {
          if (buff.stat === 'exp_rate') expRate *= buff.value
          if (buff.stat === 'coin_rate') coinRate *= buff.value
        }
      })
      ;(state.value as any).activeBuffs = activeBuffs.filter(b => b.expiresAt > now)
    }

    return { expRate, coinRate }
  }

  function applyBuff(stat: string, value: number, durationSeconds: number) {
    if (!state.value) return
    if (!(state.value as any).activeBuffs) {
      ;(state.value as any).activeBuffs = []
    }
    ;(state.value as any).activeBuffs.push({
      stat,
      value,
      expiresAt: Math.floor(Date.now() / 1000) + durationSeconds
    })
  }

  function getRevealBoost(): number {
    if (!state.value) return 1.0
    const equippedItemId = state.value.equipped.explore
    if (!equippedItemId) return 1.0
    const item = itemsConfig.find((i: any) => i.itemId === equippedItemId)
    if (item?.effect?.type === 'reveal_boost') {
      return item.effect.value ?? 1.0
    }
    return 1.0
  }

  function completeNode(nodeId: string) {
    if (!state.value) return
    if (!state.value.map.completedNodes.includes(nodeId)) {
      state.value.map.completedNodes.push(nodeId)
    }
    if (!state.value.progress.clearedNodes.includes(nodeId)) {
      state.value.progress.clearedNodes.push(nodeId)
      state.value.progress.exploreCount = (state.value.progress.exploreCount || 0) + 1
      updateTaskProgress('task_explore_1', 1)
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

  function addSeenEvent(eventId: string) {
    if (!state.value) return
    if (!state.value.progress.seenEvents.includes(eventId)) {
      state.value.progress.seenEvents.push(eventId)
      state.value.progress.eventTriggerCount = (state.value.progress.eventTriggerCount || 0) + 1
    }
  }

  function recordStudyTime(seconds: number) {
    if (!state.value) return
    state.value.progress.studyTimeSeconds = (state.value.progress.studyTimeSeconds || 0) + seconds
    if (seconds > 0) {
      updateTaskProgress('task_study_1', 1)
    }
  }

  function recordChapterChoice(chapterIndex: number, choiceIndex: number) {
    if (!state.value) return
    if (!state.value.progress.chapterChoices) {
      state.value.progress.chapterChoices = [0, 0, 0, 0]
    }
    if (chapterIndex >= 0 && chapterIndex < 4) {
      state.value.progress.chapterChoices[chapterIndex] = choiceIndex
    }
  }

  function clearChapter(chapterIndex: number) {
    if (!state.value) return
    state.value.progress.chapterCleared[chapterIndex] = true
    state.value.progress.chapterCredits = 0
    if (chapterIndex + 1 < 4) {
      state.value.progress.currentChapter = chapterIndex + 1
    }
    if (chapterIndex === 3) {
      state.value.progress.gameCompleted = true
    }
  }

  function equipSkill(slotIndex: 1 | 2, skillId: string | null) {
    if (!state.value) return
    state.value.player.equippedSkills[slotIndex] = skillId
  }

  function setCombatState(combatState: Partial<GameState['combat']>) {
    if (!state.value) return
    state.value.combat = { ...state.value.combat, ...combatState }
  }

  function setMonsterState(nodeId: string, monsterState: Partial<GameState['monsters'][string]>) {
    if (!state.value) return
    if (!state.value.monsters[nodeId]) return
    state.value.monsters[nodeId] = { ...state.value.monsters[nodeId], ...monsterState }
  }

  function setChapterEnding(chapterIndex: number, endingLevel: number) {
    if (!state.value) return
    if (!state.value.progress.chapterEndings) {
      state.value.progress.chapterEndings = [0, 0, 0, 0]
    }
    const choiceBonus = state.value.progress.chapterChoices?.[chapterIndex] ?? 0
    const finalLevel = Math.min(2, endingLevel + (choiceBonus > 0 ? 1 : 0))
    state.value.progress.chapterEndings[chapterIndex] = finalLevel
  }

  function getFinalEnding(): FinalEnding | null {
    if (!state.value) return null
    if (!state.value.progress.gameCompleted) return null
    return calculateFinalEnding(state.value)
  }

  function getEndingType(): FinalEndingType | null {
    if (!state.value) return null
    if (!state.value.progress.gameCompleted) return null
    return determineEndingType(state.value)
  }

  function extractNewGamePlusSnapshot(): NewGamePlusState | null {
    if (!state.value) return null
    if (!state.value.progress.gameCompleted) return null

    const oldNgPlusCount = state.value.progress.ngPlusCount ?? 0
    const oldArchives = [...(state.value.progress.archives || [])]
    const oldSkills = [...(state.value.player.unlockedSkills || [])]
    const oldCoins = state.value.resources.coins || 0
    const oldCredits = state.value.resources.credits || 0

    return {
      ngPlusCount: oldNgPlusCount + 1,
      inheritedArchives: oldArchives,
      inheritedSkills: oldSkills,
      bonusCoins: Math.floor(oldCoins * 0.5),
      bonusCredits: Math.floor(oldCredits * 0.5)
    }
  }

  async function startNewGamePlus(): Promise<boolean> {
    if (!state.value) return false
    if (!state.value.progress.gameCompleted) return false

    const roleId = state.value.player.roleId
    const snapshot = extractNewGamePlusSnapshot()
    if (!snapshot) return false

    const newState = createDefaultGameState(roleId)
    ;(newState as any).tasks = createDefaultTasks()
    ;(newState as any).collections = ((state.value as any).collections || []).map((c: CollectionItem) => ({
      ...c,
      claimed: false
    }))
    ;(newState as any).notifications = []

    newState.progress.ngPlusCount = snapshot.ngPlusCount
    newState.progress.archives = [...snapshot.inheritedArchives]
    const mergedSkills = Array.from(new Set([
      ...newState.player.unlockedSkills,
      ...snapshot.inheritedSkills
    ]))
    newState.player.unlockedSkills = mergedSkills
    newState.resources.coins = snapshot.bonusCoins
    newState.resources.credits = snapshot.bonusCredits
    newState.progress.chapterCredits = snapshot.bonusCredits

    state.value = newState
    await saveSave()
    return true
  }

  function updateTaskProgress(taskId: string, amount: number) {
    if (!state.value) return
    const task = ((state.value as any).tasks || []).find((t: Task) => t.id === taskId)
    if (task && !task.completed) {
      task.progress += amount
      if (task.progress >= task.target) {
        task.completed = true
        addNotification('task', `任务完成：${task.name}`)
      }
    }
  }

  function claimTaskReward(taskId: string): boolean {
    if (!state.value) return false
    const task = ((state.value as any).tasks || []).find((t: Task) => t.id === taskId)
    if (!task || !task.completed || task.claimed) return false

    if (task.rewards.exp) addExp(task.rewards.exp)
    if (task.rewards.coins) addCoins(task.rewards.coins)
    if (task.rewards.credits) addCredits(task.rewards.credits)
    if (task.rewards.items) {
      task.rewards.items.forEach((itemId: string) => addItem(itemId))
    }

    task.claimed = true
    return true
  }

  function addNotification(type: string, message: string, data?: any) {
    if (!state.value) return
    if (!((state.value as any).notifications)) {
      ;(state.value as any).notifications = []
    }
    ;(state.value as any).notifications.unshift({
      id: Date.now().toString(),
      type,
      message,
      data,
      timestamp: Date.now()
    })
    if (((state.value as any).notifications).length > 20) {
      ;(state.value as any).notifications.pop()
    }
  }

  function dismissNotification(notificationId: string) {
    if (!state.value) return
    ;(state.value as any).notifications = ((state.value as any).notifications || []).filter(
      (n: any) => n.id !== notificationId
    )
  }

  function setCurrentZone(zoneId: string) {
    if (!state.value) return
    state.value.map.currentZone = zoneId
  }

  function incrementComboCount() {
    if (!state.value) return
    ;(state.value as any).combat.comboCount = ((state.value as any).combat.comboCount || 0) + 1
  }

  function resetComboCount() {
    if (!state.value) return
    ;(state.value as any).combat.comboCount = 0
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
    currentChapter,
    tasks,
    collections,
    notifications,
    unlockedSkills,
    unclaimedRewards,
    completedCollections,
    loadSave,
    saveSave,
    initSave,
    switchForm,
    setForm,
    addExp,
    addCredits,
    addCoins,
    addItem,
    useItem,
    equipItem,
    completeNode,
    revealRegion,
    addArchive,
    addSeenEvent,
    clearChapter,
    equipSkill,
    setCombatState,
    setMonsterState,
    setChapterEnding,
    getUnlockedSkillIds,
    recordStudyTime,
    recordChapterChoice,
    getFinalEnding,
    getEndingType,
    extractNewGamePlusSnapshot,
    startNewGamePlus,
    getIdleMultiplier,
    applyBuff,
    getRevealBoost,
    updateTaskProgress,
    claimTaskReward,
    addNotification,
    dismissNotification,
    setCurrentZone,
    incrementComboCount,
    resetComboCount
  }
})