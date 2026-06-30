<template>
  <div class="border-2 rounded-game p-4 hover:scale-105 transition-all"
       :class="completed ? 'border-healing-green bg-healing-green/5' : 'border-gray-200'">
    <div class="flex justify-between items-start mb-2">
      <h3 class="font-bold text-lg">{{ task.name }}</h3>
      <span v-if="completed" class="text-healing-green text-sm">✓ 已完成</span>
    </div>
    
    <p class="text-sm text-gray-600 mb-3">{{ task.description }}</p>
    
    <div class="space-y-2">
      <div class="flex justify-between text-sm">
        <span>任务类型</span>
        <span class="font-semibold">{{ taskTypeLabel }}</span>
      </div>
      
      <div v-if="task.rewards" class="flex justify-between text-sm">
        <span>奖励</span>
        <span class="font-semibold text-healing-green">
          {{ task.rewards.exp || 0 }}经验 / {{ task.rewards.coins || 0 }}喵币
        </span>
      </div>
      
      <div v-if="progress" class="flex justify-between text-sm">
        <span>进度</span>
        <span class="font-semibold">{{ progress.current }}/{{ progress.target }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  progress: {
    type: Object,
    default: null
  },
  completed: {
    type: Boolean,
    default: false
  }
})

const taskTypeLabel = computed(() => {
  const types = {
    'daily': '日常任务',
    'main': '主线任务',
    'side': '支线任务',
    'achievement': '成就'
  }
  return types[props.task.task_type] || props.task.task_type
})
</script>
