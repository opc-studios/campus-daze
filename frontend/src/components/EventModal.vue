<template>
  <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
      <h3 class="text-xl font-bold text-[#1A3C6E] mb-2">{{ currentEvent?.name }}</h3>
      <p class="text-gray-600 mb-6">{{ currentEvent?.description }}</p>
      
      <div class="space-y-3">
        <button
          v-for="(option, index) in currentEvent?.options"
          :key="index"
          @click="handleSelect(index)"
          :disabled="isResolving"
          class="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-[#1A3C6E] hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <p class="font-semibold text-[#1A3C6E]">{{ option.text }}</p>
          <p class="text-xs text-gray-500 mt-1">
            {{ formatRewards(option.rewards) }}
          </p>
        </button>
      </div>
      
      <button @click="handleClose" :disabled="isResolving" class="mt-4 w-full py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50">
        关闭
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { eventApi } from '../api/event'

interface EventOption {
  text: string
  rewards: Array<{ type: string; amount?: number; itemId?: string; stat?: string; value?: number; duration?: number }>
}

interface GameEvent {
  eventId: string
  name: string
  description: string
  options: EventOption[]
}

const showModal = ref(false)
const currentEvent = ref<GameEvent | null>(null)
const isResolving = ref(false)

const emit = defineEmits<{
  close: []
  select: [option: EventOption]
  resolved: [eventId: string, optionIndex: number, rewards: any]
}>()

const handleWebSocketEvent = (event: CustomEvent) => {
  console.log('Received WebSocket event:', event.detail)
  currentEvent.value = event.detail
  showModal.value = true
}

const handleMapEvent = (event: CustomEvent) => {
  const { eventId } = event.detail
  const eventsConfig = (window as any).__gameConfigs?.events || []
  const evt = eventsConfig.find((e: any) => e.eventId === eventId)
  if (evt) {
    currentEvent.value = evt
    showModal.value = true
  }
}

const handleSelect = async (optionIndex: number) => {
  if (!currentEvent.value || isResolving.value) return
  
  isResolving.value = true
  
  try {
    const result = await eventApi.resolveEvent({ eventId: currentEvent.value.eventId, optionIndex })
    console.log('Event resolved:', result)
    
    emit('select', currentEvent.value.options[optionIndex])
    emit('resolved', currentEvent.value.eventId, optionIndex, result.rewards)
    
    showModal.value = false
    currentEvent.value = null
  } catch (error) {
    console.error('Failed to resolve event:', error)
  } finally {
    isResolving.value = false
  }
}

const handleClose = () => {
  if (isResolving.value) return
  
  showModal.value = false
  currentEvent.value = null
  emit('close')
}

const formatRewards = (rewards: EventOption['rewards']) => {
  return rewards.map(r => {
    switch (r.type) {
      case 'exp': return `EXP +${r.amount}`
      case 'credits': return `学分 +${r.amount}`
      case 'coins': return `校园币 +${r.amount}`
      case 'item': return `道具 x${r.amount}`
      case 'buff': return `增益效果`
      case 'archive': return `图鉴 +1`
      default: return r.type
    }
  }).join(', ')
}

onMounted(() => {
  window.addEventListener('ws-random-event', handleWebSocketEvent as EventListener)
  window.addEventListener('map-event-trigger', handleMapEvent as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('ws-random-event', handleWebSocketEvent as EventListener)
  window.removeEventListener('map-event-trigger', handleMapEvent as EventListener)
})
</script>
