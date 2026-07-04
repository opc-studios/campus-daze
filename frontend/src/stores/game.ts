import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { saveApi } from '../api/save'
import type { GameState, RoleId, CombatRole, FinalEndingType, NewGamePlusState } from '../types/game'
import rolesConfig from '../game/config/roles.json'
import skillsConfig from '../game/config/skills.json'
import itemsConfig from '../game/config/items.json'
import { calculateFinalEnding, determineEndingType, calculateArchiveRate } from '../game/ending/ending-calculator'
import type { FinalEnding } from '../game/ending/ending-calculator'

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
      archives: [],
      chapterEndings: [0, 0, 0, 0],
      // GDD §6.6 通关统计字段
      studyTimeSeconds: 0,
      exploreCount: 0,
      eventTriggerCount: 0,
      // GDD §6.5 三因子之一：每章关键事件选择索引
      chapterChoices: [0, 0, 0, 0],
      gameCompleted: false
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

function hasSkillConfig(skillId: string): boolean {
  return skillsConfig.some(s => s.skillId === skillId)
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
    state.value = newState
    stateVersion.value = 0
    await saveSave()
    loaded.value = true
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
    if (!state.value) return false
    if (!state.value.inventory[itemId] || state.value.inventory[itemId] <= 0) return false

    // GDD §4.1 查找道具配置并应用消耗效果
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
          // 战斗外回血：写入 player 当前 HP（若存在 currentHp 字段）
          if ((state.value as any).player?.currentHp !== undefined) {
            ;(state.value as any).player.currentHp = Math.min(
              (state.value as any).player.currentHp + (effect.amount || 0),
              100 + state.value.player.level * 18 + state.value.player.attrs.resilience * 12
            )
          }
          break
        case 'buff':
          // 临时 buff：写入 activeBuffs，过期自动清理
          applyBuff(effect.stat || 'exp_rate', effect.value || 1, effect.duration || 300)
          break
        case 'shield':
          // 护盾：写入 nextCombatShield，战斗开始时应用
          ;(state.value as any).nextCombatShield = ((state.value as any).nextCombatShield || 0) + (effect.amount || 0)
          break
        default:
          // 非 consumable 类型（souvenir/tool）不消耗
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

  /**
   * GDD §4.1 道具效果应用：获取挂机槽位装备的乘数
   * 支持 idle_boost 类型道具（study_headphone EXP+8%, intern_badge 校园币+8%）
   */
  function getIdleMultiplier(task: 'study' | 'intern'): { expRate: number; coinRate: number } {
    let expRate = 1.0
    let coinRate = 1.0
    if (!state.value) return { expRate, coinRate }

    // 1. 装备槽道具（study_headphone / intern_badge）
    const slot = task === 'study' ? 'study' : 'intern'
    const equippedItemId = state.value.equipped[slot]
    if (equippedItemId) {
      const item = itemsConfig.find((i: any) => i.itemId === equippedItemId)
      if (item?.effect?.type === 'idle_boost') {
        if (item.effect.stat === 'exp_rate') expRate *= item.effect.value
        if (item.effect.stat === 'coin_rate') coinRate *= item.effect.value
      }
    }

    // 2. 临时 buff 道具（coffee_boost 等，从 activeBuffs 字段读取）
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
      // 清理过期 buff
      ;(state.value as any).activeBuffs = activeBuffs.filter(b => b.expiresAt > now)
    }

    return { expRate, coinRate }
  }

  /**
   * GDD §4.1 应用消耗品 buff（coffee_boost EXP+20% 持续 5 分钟）
   */
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

  /**
   * GDD §4.1 获取探索罗盘揭示范围加成
   */
  function getRevealBoost(): number {
    if (!state.value) return 1.0
    const equippedItemId = state.value.equipped.explore
    if (!equippedItemId) return 1.0
    const item = itemsConfig.find((i: any) => i.itemId === equippedItemId)
    if (item?.effect?.type === 'reveal_boost') {
      return item.effect.value
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
      // GDD §6.6 通关统计：探索次数
      state.value.progress.exploreCount = (state.value.progress.exploreCount || 0) + 1
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
      // GDD §6.6 通关统计：事件触发数
      state.value.progress.eventTriggerCount = (state.value.progress.eventTriggerCount || 0) + 1
    }
  }

  // GDD §6.6 通关统计：累加学习时长
  function recordStudyTime(seconds: number) {
    if (!state.value) return
    state.value.progress.studyTimeSeconds = (state.value.progress.studyTimeSeconds || 0) + seconds
  }

  // GDD §6.5 三因子之一：记录章节关键事件选择
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
    // GDD §6.5 终章通关时标记 gameCompleted
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
    // GDD §6.5：综合 archivesInChapter 与 chapterChoices 判定 endingLevel
    // endingLevel: 0=标准, 1=记忆未完整, 2=记忆完整
    // chapterChoices[chapterIndex] > 0 视为关键选择有加分（+1 等级，上限 2）
    const choiceBonus = state.value.progress.chapterChoices?.[chapterIndex] ?? 0
    const finalLevel = Math.min(2, endingLevel + (choiceBonus > 0 ? 1 : 0))
    state.value.progress.chapterEndings[chapterIndex] = finalLevel
  }

  // GDD §6.5 三因子最终结局 getter
  function getFinalEnding(): FinalEnding | null {
    if (!state.value) return null
    if (!state.value.progress.gameCompleted) return null
    return calculateFinalEnding(state.value)
  }

  // GDD §6.5 单独暴露结局类型判定（用于 UI 预览）
  function getEndingType(): FinalEndingType | null {
    if (!state.value) return null
    if (!state.value.progress.gameCompleted) return null
    return determineEndingType(state.value)
  }

  // D.3 二周目继承：从旧存档提取继承快照
  // GDD §6.7：二周目保留 archives + unlockedSkills，部分资源（coins/credits）按 50% 继承
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

  // D.3 二周目继承：开启二周目
  // 决策 #16：使用 saveSave() 而非 saveApi.save()，统一走 store 乐观锁路径
  // 流程：1) 校验 gameCompleted 2) 提取继承快照 3) 创建新存档（同 roleId）4) 注入继承项 5) 保存
  async function startNewGamePlus(): Promise<boolean> {
    if (!state.value) return false
    if (!state.value.progress.gameCompleted) return false

    const roleId = state.value.player.roleId
    const snapshot = extractNewGamePlusSnapshot()
    if (!snapshot) return false

    // 创建同角色新存档（重置所有进度）
    const newState = createDefaultGameState(roleId)

    // 注入继承项
    // 1. ngPlusCount 递增
    newState.progress.ngPlusCount = snapshot.ngPlusCount
    // 2. 保留图鉴收集（GDD §6.7）
    newState.progress.archives = [...snapshot.inheritedArchives]
    // 3. 保留已解锁技能（GDD §6.7：二周目保留技能解锁状态）
    // 注意：createDefaultGameState 默认仅解锁 basic 技能；这里合并继承的技能
    const mergedSkills = Array.from(new Set([
      ...newState.player.unlockedSkills,
      ...snapshot.inheritedSkills
    ]))
    newState.player.unlockedSkills = mergedSkills
    // 4. 部分资源继承（50%）
    newState.resources.coins = snapshot.bonusCoins
    newState.resources.credits = snapshot.bonusCredits
    newState.progress.chapterCredits = snapshot.bonusCredits

    // 替换 state 并保存（stateVersion 保持当前值，走乐观锁更新）
    state.value = newState
    await saveSave()
    return true
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
    unlockedSkills,
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
    getRevealBoost
  }
})
