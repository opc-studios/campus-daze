<template>
  <div class="w-full h-screen relative bg-[#1A3C6E]">
    <div id="game-container" class="w-full h-full"></div>
    
    <div class="absolute top-4 left-4 right-4 flex justify-between items-start">
      <ResourceBar
        v-if="gameStore.player"
        :level="gameStore.player.level"
        :exp="gameStore.player.exp"
        :exp-to-next="100"
        :credits="gameStore.resources.credits"
        :coins="gameStore.resources.coins"
      />
      
      <div class="flex gap-2">
        <button
          @click="toggleForm"
          class="px-4 py-2 bg-white/90 rounded-lg shadow text-sm font-semibold text-[#1A3C6E]"
        >
          {{ gameStore.player?.currentForm === 'human' ? '切换猫形态' : '切换人形态' }}
        </button>
        <button
          @click="goHome"
          class="px-4 py-2 bg-white/90 rounded-lg shadow text-sm font-semibold text-[#1A3C6E]"
        >
          返回主页
        </button>
      </div>
    </div>
    
    <EventModal
      v-if="showEvent"
      :event="currentEvent"
      @close="showEvent = false"
      @select="handleEventChoice"
    />
    
    <CombatSettlement
      v-if="showSettlement"
      :result="combatResult"
      @continue="handleContinue"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Phaser from 'phaser'
import { phaserConfig } from '../game/config'
import { useGameStore } from '../stores/game'
import ResourceBar from '../components/ui/ResourceBar.vue'
import EventModal from '../components/EventModal.vue'
import CombatSettlement from '../components/CombatSettlement.vue'

const router = useRouter()
const gameStore = useGameStore()

let game: Phaser.Game | null = null

const showEvent = ref(false)
const currentEvent = ref<any>(null)
const showSettlement = ref(false)
const combatResult = ref<any>(null)

onMounted(() => {
  game = new Phaser.Game({
    ...phaserConfig,
    parent: 'game-container'
  })
})

onUnmounted(() => {
  game?.destroy(true)
})

const toggleForm = () => {
  gameStore.switchForm()
}

const goHome = () => {
  router.push('/home')
}

const handleEventChoice = (_option: any) => {
  showEvent.value = false
}

const handleContinue = () => {
  showSettlement.value = false
}
</script>
