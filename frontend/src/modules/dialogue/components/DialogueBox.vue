<template>
  <div class="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-campus-blue shadow-2xl p-6">
    <div class="max-w-4xl mx-auto">
      <div class="flex items-start gap-4 mb-4">
        <div class="text-4xl">🐱</div>
        <div class="flex-1">
          <div class="font-bold text-lg mb-2">{{ npcName }}</div>
          <div class="text-gray-700 leading-relaxed">{{ dialogue }}</div>
        </div>
      </div>
      
      <div v-if="choices && choices.length > 0" class="space-y-2">
        <button
          v-for="(choice, index) in choices"
          :key="index"
          @click="$emit('choice', index)"
          class="w-full text-left p-3 border-2 rounded-game hover:bg-campus-blue/5 transition-all"
        >
          {{ choice.text }}
        </button>
      </div>
      
      <div v-else class="text-center">
        <button 
          @click="$emit('next')"
          class="game-button game-button-primary"
        >
          继续
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  npcName: {
    type: String,
    required: true
  },
  dialogue: {
    type: String,
    required: true
  },
  choices: {
    type: Array,
    default: () => []
  }
})

defineEmits(['next', 'choice'])
</script>
