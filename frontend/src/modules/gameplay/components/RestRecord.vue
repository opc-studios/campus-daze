<template>
  <div class="border-2 rounded-game p-4 hover:scale-105 transition-all">
    <div class="flex justify-between items-start mb-3">
      <h3 class="font-bold text-lg">{{ restRecord.location }}</h3>
      <span class="text-sm text-gray-500">{{ formatDate(restRecord.rest_time) }}</span>
    </div>
    
    <div class="space-y-2 text-sm">
      <div class="flex justify-between">
        <span>恢复HP</span>
        <span class="font-semibold text-healing-green">+{{ restRecord.hp_recovered }}</span>
      </div>
      <div class="flex justify-between">
        <span>恢复MP</span>
        <span class="font-semibold text-campus-blue">+{{ restRecord.mp_recovered }}</span>
      </div>
      <div v-if="restRecord.bonus_exp" class="flex justify-between">
        <span>额外经验</span>
        <span class="font-semibold text-academic-purple">+{{ restRecord.bonus_exp }}</span>
      </div>
    </div>
    
    <div v-if="restRecord.notes" class="mt-3 pt-3 border-t text-sm text-gray-600">
      {{ restRecord.notes }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  restRecord: {
    type: Object,
    required: true
  }
})

const formatDate = (dateStr) => {
  if (!dateStr) return '未知'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}
</script>
