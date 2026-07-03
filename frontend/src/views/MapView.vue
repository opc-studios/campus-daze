<template>
  <div class="w-full h-screen relative bg-[#1A3C6E]">
    <div id="game-container" class="w-full h-full"></div>

    <div class="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
      <ResourceBar
        v-if="gameStore.player"
        :level="gameStore.player.level"
        :exp="gameStore.player.exp"
        :exp-to-next="100"
        :credits="gameStore.resources.credits"
        :coins="gameStore.resources.coins"
        class="pointer-events-auto"
      />

      <div class="flex gap-2 pointer-events-auto">
        <button
          @click="toggleForm"
          :disabled="isInCombat"
          class="px-4 py-2 bg-white/90 rounded-lg shadow text-sm font-semibold text-[#1A3C6E] disabled:opacity-50"
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

    <EventModal />
    <PuzzleModal />
    <CombatSettlement
      v-if="showSettlement"
      :result="combatResult"
      @continue="handleContinue"
    />

    <div
      v-if="showGameComplete"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-8 game-card-neon text-center">
        <h2 class="text-3xl font-bold text-[#1A3C6E] mb-4">恭喜通关！</h2>
        <p class="text-gray-600 mb-6">你完成了《同舟喵济》的全部四章主线</p>

        <div class="stat-panel mb-6 text-left">
          <div class="flex justify-between mb-2">
            <span class="text-gray-600">最终等级</span>
            <span class="font-semibold">Lv.{{ gameStore.player?.level }}</span>
          </div>
          <div class="flex justify-between mb-2">
            <span class="text-gray-600">累计学分</span>
            <span class="font-semibold">{{ gameStore.resources?.credits }}</span>
          </div>
          <div class="flex justify-between mb-2">
            <span class="text-gray-600">校园币</span>
            <span class="font-semibold">{{ gameStore.resources?.coins }}</span>
          </div>
          <div class="flex justify-between mb-2">
            <span class="text-gray-600">校史图鉴</span>
            <span class="font-semibold">{{ gameStore.progress?.archives?.length || 0 }} 件</span>
          </div>
          <div class="flex justify-between mb-2">
            <span class="text-gray-600">触发事件</span>
            <span class="font-semibold">{{ gameStore.progress?.seenEvents?.length || 0 }} 次</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">完成节点</span>
            <span class="font-semibold">{{ gameStore.progress?.clearedNodes?.length || 0 }} 个</span>
          </div>
        </div>

        <div class="mb-4 p-3 bg-gradient-to-r from-[#FFB7C5] to-[#FF6B9D] text-white rounded-lg">
          <p class="font-semibold">{{ endingTitle }}</p>
          <p class="text-sm mt-1 opacity-90">{{ endingDescription }}</p>
        </div>

        <button @click="goHome" class="game-button w-full">
          返回主页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Phaser from 'phaser'
import { phaserConfig } from '../game/config'
import { useGameStore } from '../stores/game'
import ResourceBar from '../components/ui/ResourceBar.vue'
import EventModal from '../components/EventModal.vue'
import PuzzleModal from '../components/PuzzleModal.vue'
import CombatSettlement from '../components/CombatSettlement.vue'

const router = useRouter()
const gameStore = useGameStore()

let game: Phaser.Game | null = null

const showSettlement = ref(false)
const combatResult = ref<any>(null)
const showGameComplete = ref(false)

const isInCombat = computed(
  () => gameStore.combatState?.state === 'running' || gameStore.combatState?.state === 'init'
)

const endingTitle = computed(() => {
  const archives = gameStore.progress?.archives?.length || 0
  if (archives >= 8) return '完整校史 · 记忆犹存'
  if (archives >= 4) return '记忆犹存'
  return '标准结局'
})

const endingDescription = computed(() => {
  const archives = gameStore.progress?.archives?.length || 0
  if (archives >= 8) return '你收集了全部校史图鉴，完整还原了同济百年记忆。'
  if (archives >= 4) return '你收集了过半的校史图鉴，记忆碎片逐渐完整。'
  return '你完成了毕业答辩，踏上了新的征程。'
})

onMounted(() => {
  game = new Phaser.Game({
    ...phaserConfig,
    parent: 'game-container'
  })

  window.addEventListener('game-complete', handleGameComplete as EventListener)
})

onUnmounted(() => {
  game?.destroy(true)
  window.removeEventListener('game-complete', handleGameComplete as EventListener)
})

const handleGameComplete = () => {
  showGameComplete.value = true
}

const toggleForm = () => {
  gameStore.switchForm()
}

const goHome = () => {
  showGameComplete.value = false
  router.push('/home')
}

const handleContinue = () => {
  showSettlement.value = false
}
</script>
