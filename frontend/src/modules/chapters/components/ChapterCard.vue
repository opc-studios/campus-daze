<template>
  <div class="border-2 rounded-game p-4 hover:scale-105 transition-all cursor-pointer"
       :class="completed ? 'border-healing-green bg-healing-green/5' : 'border-gray-200'">
    <div class="flex justify-between items-start mb-2">
      <h3 class="font-bold text-lg">{{ chapter.title }}</h3>
      <span v-if="completed" class="text-healing-green text-sm">✓ 已完成</span>
    </div>
    
    <p class="text-sm text-gray-600 mb-3">{{ chapter.description }}</p>
    
    <div class="flex justify-between items-center text-sm">
      <span class="text-gray-500">场景数: {{ chapter.scene_count || 0 }}</span>
      <span v-if="progress" class="font-semibold">进度: {{ progress.percent }}%</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  chapter: {
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
</script>
