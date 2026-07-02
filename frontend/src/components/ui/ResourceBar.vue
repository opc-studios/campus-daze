<template>
  <div class="flex items-center gap-6 bg-white/90 backdrop-blur px-6 py-3 rounded-lg shadow">
    <div class="flex items-center gap-2">
      <span class="text-sm text-gray-600">Lv.</span>
      <span class="text-xl font-bold text-[#1A3C6E]">{{ level }}</span>
    </div>
    
    <div class="flex items-center gap-2">
      <span class="text-sm text-gray-600">EXP</span>
      <div class="w-32">
        <ProgressBar :percentage="expPercentage" color="green" />
      </div>
      <span class="text-xs text-gray-500">{{ exp }}/{{ expToNext }}</span>
    </div>
    
    <div class="flex items-center gap-2">
      <span class="text-sm text-gray-600">学分</span>
      <span class="text-lg font-bold text-[#4ECDC4]">{{ credits }}</span>
    </div>
    
    <div class="flex items-center gap-2">
      <span class="text-sm text-gray-600">校园币</span>
      <span class="text-lg font-bold text-[#FFB7C5]">{{ coins }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProgressBar from './ProgressBar.vue'

const props = defineProps<{
  level: number
  exp: number
  expToNext: number
  credits: number
  coins: number
}>()

const expPercentage = computed(() => {
  return Math.min(100, (props.exp / props.expToNext) * 100)
})
</script>
