<template>
  <div class="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
    <TransitionGroup name="notification">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="bg-white rounded-lg shadow-lg p-4 min-w-[280px] max-w-[400px] pointer-events-auto"
      >
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" :class="getIconClass(notification.source)">
            <span class="text-xl">{{ getIcon(notification.source) }}</span>
          </div>
          <div class="flex-1">
            <h4 class="font-semibold text-[#1A3C6E] mb-1">{{ getTitle(notification) }}</h4>
            <div class="space-y-1">
              <div v-for="(reward, index) in notification.rewards" :key="index" class="text-sm text-gray-600">
                {{ formatReward(reward) }}
              </div>
            </div>
          </div>
          <button
            @click="removeNotification(notification.id)"
            class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Reward {
  type: string
  amount?: number
  itemId?: string
  stat?: string
  value?: number
  duration?: number
}

interface RewardNotification {
  id: string
  source: string
  rewards: Reward[]
  eventId?: string
  achievementId?: string
  achievementName?: string
  chapterId?: number
}

const notifications = ref<RewardNotification[]>([])

const handleWebSocketReward = (event: CustomEvent) => {
  const notification: RewardNotification = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    source: event.detail.source,
    rewards: event.detail.rewards || [],
    eventId: event.detail.event_id,
    achievementId: event.detail.achievement_id,
    achievementName: event.detail.achievement_name,
    chapterId: event.detail.chapter_id
  }
  
  notifications.value.push(notification)
  
  // 自动移除（5秒后）
  setTimeout(() => {
    removeNotification(notification.id)
  }, 5000)
}

const removeNotification = (id: string) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

const getIcon = (source: string): string => {
  const icons: Record<string, string> = {
    offline: '🌙',
    combat: '⚔️',
    event: '🎁',
    achievement: '🏆',
    chapter_clear: '🎉'
  }
  return icons[source] || '✨'
}

const getIconClass = (source: string): string => {
  const classes: Record<string, string> = {
    offline: 'bg-purple-100',
    combat: 'bg-red-100',
    event: 'bg-yellow-100',
    achievement: 'bg-blue-100',
    chapter_clear: 'bg-green-100'
  }
  return classes[source] || 'bg-gray-100'
}

const getTitle = (notification: RewardNotification): string => {
  const titles: Record<string, string> = {
    offline: '离线收益',
    combat: '战斗胜利',
    event: '事件奖励',
    achievement: '成就解锁',
    chapter_clear: '章节通关'
  }
  
  if (notification.source === 'achievement' && notification.achievementName) {
    return notification.achievementName
  }
  
  return titles[notification.source] || '获得奖励'
}

const formatReward = (reward: Reward): string => {
  switch (reward.type) {
    case 'exp':
      return `经验值 +${reward.amount}`
    case 'credits':
      return `学分 +${reward.amount}`
    case 'coins':
      return `校园币 +${reward.amount}`
    case 'item':
      return `道具 x${reward.amount}`
    case 'buff':
      return `${reward.stat} +${reward.value} (${reward.duration}秒)`
    case 'archive':
      return `图鉴 +1`
    default:
      return `${reward.type} +${reward.amount || 1}`
  }
}

onMounted(() => {
  window.addEventListener('ws-reward', handleWebSocketReward as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('ws-reward', handleWebSocketReward as EventListener)
})
</script>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}
</style>
