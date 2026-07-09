<template>
  <div class="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
    <TransitionGroup name="notification">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="bg-white rounded-lg shadow-lg p-4 min-w-[280px] max-w-[400px] pointer-events-auto border-l-4"
        :class="getBorderClass(notification.type)"
      >
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" :class="getIconClass(notification.type)">
            <span class="text-xl">{{ getIcon(notification.type) }}</span>
          </div>
          <div class="flex-1">
            <h4 class="font-semibold text-[#1A3C6E] mb-1">{{ notification.title }}</h4>
            <p class="text-sm text-gray-600">{{ notification.message }}</p>
            <div v-if="notification.data" class="mt-2 text-xs text-gray-500">
              <span v-for="(value, key) in notification.data" :key="key" class="mr-2">
                {{ formatData(key, value) }}
              </span>
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
import { useGameStore } from '../stores/game'

interface GameNotification {
  id: string
  type: string
  title: string
  message: string
  data?: Record<string, any>
  timestamp: number
}

const notifications = ref<GameNotification[]>([])
const gameStore = useGameStore()

const handleGameNotification = (event: CustomEvent) => {
  const detail = event.detail
  const notification: GameNotification = {
    id: detail.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
    type: detail.type || 'info',
    title: detail.title || '通知',
    message: detail.message || '',
    data: detail.data,
    timestamp: Date.now()
  }
  
  notifications.value.push(notification)
  
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

const getIcon = (type: string): string => {
  const icons: Record<string, string> = {
    level_up: '⭐',
    task: '📋',
    collection: '✨',
    combat: '⚔️',
    resource: '💎',
    event: '🎁',
    achievement: '🏆',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    offline: '🌙',
    chapter_clear: '🎉'
  }
  return icons[type] || '🔔'
}

const getIconClass = (type: string): string => {
  const classes: Record<string, string> = {
    level_up: 'bg-yellow-100',
    task: 'bg-blue-100',
    collection: 'bg-purple-100',
    combat: 'bg-red-100',
    resource: 'bg-green-100',
    event: 'bg-orange-100',
    achievement: 'bg-gold-100',
    error: 'bg-red-100',
    warning: 'bg-yellow-100',
    info: 'bg-gray-100',
    offline: 'bg-indigo-100',
    chapter_clear: 'bg-green-100'
  }
  return classes[type] || 'bg-gray-100'
}

const getBorderClass = (type: string): string => {
  const classes: Record<string, string> = {
    level_up: 'border-yellow-400',
    task: 'border-blue-400',
    collection: 'border-purple-400',
    combat: 'border-red-400',
    resource: 'border-green-400',
    event: 'border-orange-400',
    achievement: 'border-yellow-500',
    error: 'border-red-500',
    warning: 'border-yellow-500',
    info: 'border-gray-400',
    offline: 'border-indigo-400',
    chapter_clear: 'border-green-500'
  }
  return classes[type] || 'border-gray-400'
}

const formatData = (key: string, value: any): string => {
  const labels: Record<string, string> = {
    level: '等级',
    exp: '经验',
    coins: '校园币',
    credits: '学分',
    items: '道具'
  }
  return `${labels[key] || key}: ${value}`
}

const syncStoreNotifications = () => {
  const storeNotifications = gameStore.notifications || []
  storeNotifications.forEach((notification: GameNotification) => {
    if (!notifications.value.find(n => n.id === notification.id)) {
      notifications.value.push({
        id: notification.id,
        type: notification.type,
        title: getTitle(notification.type),
        message: notification.message,
        data: notification.data,
        timestamp: notification.timestamp
      })
      setTimeout(() => {
        removeNotification(notification.id)
      }, 5000)
    }
  })
}

const getTitle = (type: string): string => {
  const titles: Record<string, string> = {
    level_up: '升级',
    task: '任务',
    collection: '收集',
    combat: '战斗',
    resource: '资源',
    event: '事件',
    achievement: '成就',
    error: '错误',
    warning: '警告',
    info: '通知',
    offline: '离线',
    chapter_clear: '章节通关'
  }
  return titles[type] || '通知'
}

onMounted(() => {
  window.addEventListener('game-notification', handleGameNotification as EventListener)
  syncStoreNotifications()
})

onUnmounted(() => {
  window.removeEventListener('game-notification', handleGameNotification as EventListener)
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