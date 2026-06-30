<template>
  <div class="flex items-center gap-3">
    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-sakura-pink to-campus-blue flex items-center justify-center text-white font-bold">
      {{ user?.username?.charAt(0)?.toUpperCase() || 'U' }}
    </div>
    <div>
      <div class="font-semibold">{{ user?.username || 'Unknown' }}</div>
      <div class="text-sm text-gray-500">{{ user?.email }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  user: {
    type: Object,
    default: () => ({})
  }
})
</script>
