<template>
  <div class="w-full">
    <div class="flex justify-between text-sm mb-1">
      <span class="font-semibold">{{ label }}</span>
      <span>{{ current }} / {{ max }}</span>
    </div>
    <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
      <div 
        class="h-full rounded-full transition-all duration-300"
        :class="barColor"
        :style="{ width: percentage + '%' }"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: {
    type: String,
    default: 'HP'
  },
  current: {
    type: Number,
    required: true
  },
  max: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    default: 'hp',
    validator: (value) => ['hp', 'mp', 'exp'].includes(value)
  }
})

const percentage = computed(() => {
  return Math.max(0, Math.min(100, (props.current / props.max) * 100))
})

const barColor = computed(() => {
  const colors = {
    hp: 'bg-healing-green',
    mp: 'bg-campus-blue',
    exp: 'bg-academic-purple'
  }
  return colors[props.type] || 'bg-healing-green'
})
</script>
