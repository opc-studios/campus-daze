<template>
  <div class="border-2 rounded-game p-4 hover:scale-105 transition-all cursor-pointer"
       :class="selected ? 'border-campus-blue bg-campus-blue/5' : 'border-gray-200'">
    <div class="flex justify-between items-start mb-3">
      <div>
        <h3 class="font-bold text-lg">{{ save.name }}</h3>
        <p class="text-sm text-gray-500">{{ formatDate(save.created_at) }}</p>
      </div>
      <div v-if="save.play_time" class="text-sm text-gray-600">
        {{ formatPlayTime(save.play_time) }}
      </div>
    </div>
    
    <div class="grid grid-cols-2 gap-2 text-sm mb-3">
      <div>
        <span class="text-gray-500">角色:</span>
        <span class="font-semibold ml-1">{{ save.character_name || '无' }}</span>
      </div>
      <div>
        <span class="text-gray-500">等级:</span>
        <span class="font-semibold ml-1">{{ save.character_level || 1 }}</span>
      </div>
      <div>
        <span class="text-gray-500">地图:</span>
        <span class="font-semibold ml-1">{{ save.current_area || '未知' }}</span>
      </div>
      <div>
        <span class="text-gray-500">章节:</span>
        <span class="font-semibold ml-1">{{ save.current_chapter || 1 }}</span>
      </div>
    </div>
    
    <div class="flex gap-2">
      <button 
        @click.stop="$emit('load', save.id)"
        class="flex-1 game-button game-button-primary text-sm"
      >
        加载
      </button>
      <button 
        @click.stop="$emit('delete', save.id)"
        class="game-button bg-alert-red text-white text-sm"
      >
        删除
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  save: {
    type: Object,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  }
})

defineEmits(['load', 'delete'])

const formatDate = (dateStr) => {
  if (!dateStr) return '未知'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const formatPlayTime = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  }
  return `${minutes}分钟`
}
</script>
