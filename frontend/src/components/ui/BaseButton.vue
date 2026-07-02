<template>
  <button
    :class="[
      'px-6 py-3 rounded-lg font-semibold transition-all duration-200',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      variantClasses
    ]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}>()

defineEmits<{
  click: [event: MouseEvent]
}>()

const variantClasses = computed(() => {
  const variants = {
    primary: 'bg-[#1A3C6E] text-white hover:bg-[#15305a] active:bg-[#102545]',
    secondary: 'bg-[#FFB7C5] text-[#1A3C6E] hover:bg-[#ffa3b6] active:bg-[#ff8fa7]',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700'
  }
  return variants[props.variant || 'primary']
})

const props = defineProps<{
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}>()

import { computed } from 'vue'
</script>
