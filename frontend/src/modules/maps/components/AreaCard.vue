<template>
  <div 
    class="p-6 border-2 rounded-game cursor-pointer transition-all hover:scale-105"
    :class="[
      area.unlocked 
        ? 'border-campus-blue bg-campus-blue/5' 
        : 'border-gray-300 bg-gray-100 opacity-50 cursor-not-allowed'
    ]"
    @click="area.unlocked && $emit('select', area)"
  >
    <div class="flex justify-between items-start mb-3">
      <h3 class="text-xl font-bold">{{ area.name }}</h3>
      <span v-if="!area.unlocked" class="text-sm text-alert-red font-semibold">未解锁</span>
    </div>
    
    <p class="text-sm text-gray-600 mb-4">{{ area.description }}</p>
    
    <div class="flex justify-between items-center">
      <div class="flex-1 mr-4">
        <div class="text-xs text-gray-500 mb-1">探索进度</div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="bg-healing-green h-2 rounded-full transition-all"
            :style="{ width: area.exploration_percent + '%' }"
          ></div>
        </div>
      </div>
      <span class="text-sm font-semibold">{{ area.exploration_percent }}%</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  area: {
    type: Object,
    required: true
  }
})

defineEmits(['select'])
</script>
