<template>
  <div class="bg-white rounded-lg shadow-lg p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-[#1A3C6E]">任务</h2>
      <div class="flex gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="selectedTab = tab.key"
          :class="[
            'px-3 py-1 rounded-full text-xs font-semibold transition-all',
            selectedTab === tab.key
              ? 'bg-[#1A3C6E] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div v-if="filteredTasks.length === 0" class="text-center text-gray-400 py-8">
      <p class="text-3xl mb-2">📋</p>
      <p class="text-sm">暂无{{ tabs.find(t => t.key === selectedTab)?.label }}任务</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="border rounded-lg p-4 transition-all hover:shadow-md"
        :class="{
          'border-green-400 bg-green-50': task.completed && task.claimed,
          'border-[#FFB7C5] bg-pink-50': task.completed && !task.claimed,
          'border-gray-200': !task.completed
        }"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-lg">{{ getTypeIcon(task.type) }}</span>
              <h3 class="font-bold text-[#1A3C6E]">{{ task.name }}</h3>
              <span
                v-if="task.completed && !task.claimed"
                class="text-xs px-2 py-0.5 bg-[#FFB7C5] text-white rounded-full animate-pulse"
              >
                可领取
              </span>
              <span
                v-if="task.completed && task.claimed"
                class="text-xs px-2 py-0.5 bg-green-500 text-white rounded-full"
              >
                已完成
              </span>
            </div>
            <p class="text-sm text-gray-600 mb-2">{{ task.description }}</p>
            <div class="flex items-center gap-3">
              <div class="flex-1">
                <div class="flex justify-between text-xs text-gray-500 mb-1">
                  <span>进度</span>
                  <span>{{ task.progress }} / {{ task.target }}</span>
                </div>
                <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    class="h-full transition-all duration-300"
                    :class="task.completed ? 'bg-green-500' : 'bg-[#4ECDC4]'"
                    :style="{ width: `${Math.min(100, (task.progress / task.target) * 100)}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <div class="ml-4">
            <div class="text-xs text-gray-500 mb-2">奖励</div>
            <div class="flex flex-wrap gap-1">
              <span
                v-if="task.rewards.exp"
                class="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded"
              >
                EXP +{{ task.rewards.exp }}
              </span>
              <span
                v-if="task.rewards.coins"
                class="text-xs px-2 py-1 bg-yellow-100 text-yellow-600 rounded"
              >
                🪙 +{{ task.rewards.coins }}
              </span>
              <span
                v-if="task.rewards.credits"
                class="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded"
              >
                📜 +{{ task.rewards.credits }}
              </span>
              <span
                v-if="task.rewards.items?.length"
                class="text-xs px-2 py-1 bg-pink-100 text-pink-600 rounded"
              >
                🎁 ×{{ task.rewards.items.length }}
              </span>
            </div>
            <button
              v-if="task.completed && !task.claimed"
              @click="claimReward(task.id)"
              class="mt-2 w-full px-3 py-1.5 bg-[#FFB7C5] text-white text-xs font-semibold rounded hover:bg-[#FF6B9D] transition-colors"
            >
              领取奖励
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/game'

const gameStore = useGameStore()
const tasks = computed(() => gameStore.tasks)
const selectedTab = ref<'all' | 'main' | 'side' | 'daily'>('all')

const tabs = [
  { key: 'all' as const, label: '全部' },
  { key: 'main' as const, label: '主线' },
  { key: 'side' as const, label: '支线' },
  { key: 'daily' as const, label: '日常' }
]

const filteredTasks = computed(() => {
  if (selectedTab.value === 'all') return tasks.value
  return tasks.value.filter((t: any) => t.type === selectedTab.value)
})

const getTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    main: '⭐',
    side: '📌',
    daily: '📅'
  }
  return icons[type] || '📋'
}

const claimReward = (taskId: string) => {
  const success = gameStore.claimTaskReward(taskId)
  if (success) {
    window.dispatchEvent(new CustomEvent('game-notification', {
      detail: {
        type: 'task',
        title: '任务奖励',
        message: '成功领取任务奖励！'
      }
    }))
  }
}
</script>

<style scoped>
</style>