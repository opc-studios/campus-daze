<template>
  <div class="border-2 rounded-game p-4 hover:scale-105 transition-all cursor-pointer"
       :class="[
         completed ? 'border-healing-green bg-healing-green/5' : 
         unlocked ? 'border-campus-blue bg-campus-blue/5' : 
         'border-gray-300 bg-gray-100 opacity-50 cursor-not-allowed'
       ]">
    <div class="flex justify-between items-start mb-2">
      <h3 class="font-bold text-lg">{{ stage.name }}</h3>
      <span v-if="completed" class="text-healing-green text-sm">✓ 已通关</span>
      <span v-else-if="!unlocked" class="text-alert-red text-sm">🔒 未解锁</span>
    </div>
    
    <p class="text-sm text-gray-600 mb-3">{{ stage.description }}</p>
    
    <div class="space-y-2">
      <div class="flex justify-between text-sm">
        <span>难度</span>
        <span class="font-semibold">{{ '★'.repeat(stage.difficulty || 1) }}</span>
      </div>
      
      <div v-if="progress" class="flex justify-between text-sm">
        <span>进度</span>
        <span class="font-semibold">{{ progress.current }}/{{ progress.total }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stage: {
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
  },
  unlocked: {
    type: Boolean,
    default: true
  }
})
</script>
