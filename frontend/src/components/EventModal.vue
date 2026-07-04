<template>
  <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
      <h3 class="text-xl font-bold text-[#1A3C6E] mb-2">{{ currentEvent?.name }}</h3>
      <p class="text-gray-600 mb-2">{{ currentEvent?.description }}</p>
      <p v-if="insightHint" class="text-xs text-purple-600 mb-4">{{ insightHint }}</p>
      <p v-else class="mb-4"></p>

      <div class="space-y-3">
        <button
          v-for="(option, index) in visibleOptions"
          :key="index"
          @click="handleSelect(option.originalIndex)"
          :disabled="isResolving"
          :class="[
            'w-full text-left p-4 border-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed',
            option.rare
              ? 'border-purple-400 bg-purple-50 hover:border-purple-600 hover:bg-purple-100'
              : 'border-gray-200 hover:border-[#1A3C6E] hover:bg-blue-50'
          ]"
        >
          <p :class="option.rare ? 'font-semibold text-purple-700' : 'font-semibold text-[#1A3C6E]'">
            {{ option.text }}
            <span v-if="option.rare" class="ml-1 text-xs text-purple-500">♪ 灵感</span>
          </p>
          <p class="text-xs text-gray-500 mt-1">
            {{ formatRewards(option.rewards) }}
          </p>
        </button>
      </div>

      <button @click="handleClose" :disabled="isResolving" class="mt-4 w-full py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50">
        关闭
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { eventApi } from '../api/event'
import { useGameStore } from '../stores/game'

interface EventOption {
  text: string
  rare?: boolean
  rewards: Array<{ type: string; amount?: number; itemId?: string; stat?: string; value?: number; duration?: number }>
}

interface GameEvent {
  eventId: string
  name: string
  description: string
  options: EventOption[]
  prerequisite?: string
  chapter?: number
}

const showModal = ref(false)
const currentEvent = ref<GameEvent | null>(null)
const isResolving = ref(false)
const gameStore = useGameStore()

const emit = defineEmits<{
  close: []
  select: [option: EventOption]
  resolved: [eventId: string, optionIndex: number, rewards: any]
}>()

// GDD §4.1 灵感影响事件稀有选项：高灵感角色可看到 ♪ 标记的稀有选项
// GDD §6.2 樱花书签道具：事件稀有选项概率 +5%
const INSIGHT_THRESHOLD = 6
const SAKURA_BOOKMARK_ITEM_ID = 'sakuraBookmark'
const SAKURA_BONUS_RATE = 0.05

/**
 * 当前角色灵感值
 */
const currentInsight = computed(() => {
  return gameStore.player?.attrs?.insight ?? 0
})

/**
 * 是否持有樱花书签
 */
const hasSakuraBookmark = computed(() => {
  const inv = gameStore.inventory
  return (inv[SAKURA_BOOKMARK_ITEM_ID] ?? 0) > 0
})

/**
 * 灵感提示文案
 */
const insightHint = computed(() => {
  if (!currentEvent.value) return ''
  const hasRare = currentEvent.value.options.some(o => o.rare)
  if (!hasRare) return ''
  if (currentInsight.value >= INSIGHT_THRESHOLD) {
    return `✦ 灵感 ${currentInsight.value}：已解锁稀有选项${hasSakuraBookmark.value ? '（樱花书签 +5%）' : ''}`
  }
  if (hasSakuraBookmark.value) {
    return '✦ 樱花书签：稀有选项概率 +5%'
  }
  return `✦ 灵感不足（需 ${INSIGHT_THRESHOLD}）`
})

/**
 * GDD §4.1：根据灵感值过滤稀有选项
 * - 灵感 ≥ 6：所有稀有选项可见
 * - 灵感 < 6 但持有樱花书签：5% 概率显示每个稀有选项
 * - 否则：隐藏稀有选项
 */
const visibleOptions = computed(() => {
  if (!currentEvent.value) return []
  const insight = currentInsight.value
  const bookmark = hasSakuraBookmark.value

  return currentEvent.value.options
    .map((option, originalIndex) => ({ ...option, originalIndex }))
    .filter(option => {
      if (!option.rare) return true
      // 稀有选项可见性判定
      if (insight >= INSIGHT_THRESHOLD) return true
      if (bookmark) {
        // 樱花书签 +5% 概率显示
        return Math.random() < SAKURA_BONUS_RATE
      }
      return false
    })
})

const handleWebSocketEvent = (event: CustomEvent) => {
  console.log('Received WebSocket event:', event.detail)
  currentEvent.value = event.detail
  showModal.value = true
}

const handleMapEvent = (event: CustomEvent) => {
  const { eventId } = event.detail
  const eventsConfig = (window as any).__gameConfigs?.events || []
  const evt = eventsConfig.find((e: any) => e.eventId === eventId)
  if (evt) {
    // GDD §6.2 前置条件检查：例如樱花分支需要 archive_1927 解锁
    if (evt.prerequisite && !checkPrerequisite(evt.prerequisite)) {
      console.log(`Event ${eventId} requires prerequisite: ${evt.prerequisite}`)
      return
    }
    currentEvent.value = evt
    showModal.value = true
  }
}

/**
 * 检查事件前置条件
 * 支持：archive_XXX（图鉴）、unlock_sakura_quest、found_hairpin 等自定义 flag
 */
function checkPrerequisite(prerequisite: string): boolean {
  if (!gameStore.state) return false
  const archives = gameStore.progress?.archives || []
  const seenEvents = gameStore.progress?.seenEvents || []

  // 图鉴前置
  if (prerequisite.startsWith('archive_')) {
    return archives.includes(prerequisite)
  }

  // 自定义 flag：通过 seenEvents 中是否包含特定事件来判定
  // unlock_sakura_quest：完成 evt_sakura_xiaoying（选了"蹲下来回应它"）
  // found_hairpin：完成 evt_sakura_hairpin（选了"顺着樱花飘落的方向寻找"）
  // complete_sakura_branch：完成 evt_sakura_memory
  const flagToEvent: Record<string, string> = {
    unlock_sakura_quest: 'evt_sakura_xiaoying',
    found_hairpin: 'evt_sakura_hairpin',
    complete_sakura_branch: 'evt_sakura_memory'
  }
  const requiredEvent = flagToEvent[prerequisite]
  if (requiredEvent) {
    return seenEvents.includes(requiredEvent)
  }

  return false
}

const handleSelect = async (optionIndex: number) => {
  if (!currentEvent.value || isResolving.value) return

  isResolving.value = true

  try {
    const result = await eventApi.resolveEvent({ eventId: currentEvent.value.eventId, optionIndex })
    console.log('Event resolved:', result)

    // GDD §6.2 记录已触发事件（用于前置条件判定）
    gameStore.addSeenEvent(currentEvent.value.eventId)

    emit('select', currentEvent.value.options[optionIndex])
    emit('resolved', currentEvent.value.eventId, optionIndex, result.rewards)

    showModal.value = false
    currentEvent.value = null
  } catch (error) {
    console.error('Failed to resolve event:', error)
  } finally {
    isResolving.value = false
  }
}

const handleClose = () => {
  if (isResolving.value) return

  showModal.value = false
  currentEvent.value = null
  emit('close')
}

const formatRewards = (rewards: EventOption['rewards']) => {
  return rewards.map(r => {
    switch (r.type) {
      case 'exp': return `EXP +${r.amount}`
      case 'credits': return `学分 +${r.amount}`
      case 'coins': return `校园币 +${r.amount}`
      case 'item': return `道具 x${r.amount}`
      case 'buff': return `增益效果`
      case 'archive': return `图鉴 +1`
      default: return r.type
    }
  }).join(', ')
}

onMounted(() => {
  window.addEventListener('ws-random-event', handleWebSocketEvent as EventListener)
  window.addEventListener('map-event-trigger', handleMapEvent as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('ws-random-event', handleWebSocketEvent as EventListener)
  window.removeEventListener('map-event-trigger', handleMapEvent as EventListener)
})
</script>
