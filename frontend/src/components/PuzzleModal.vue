<template>
  <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 game-card-neon">
      <h3 class="text-xl font-bold text-[#1A3C6E] mb-2">{{ puzzle?.name }}</h3>
      <p class="text-gray-600 mb-4">{{ puzzle?.description }}</p>

      <div v-if="puzzle?.puzzleType === 'sort'" class="space-y-3">
        <p class="text-sm text-gray-500">点击项目按顺序排列：</p>
        <div class="flex flex-wrap gap-2 mb-3">
          <button
            v-for="(item, idx) in sortItems"
            :key="`${item}-${idx}`"
            @click="addToAnswer(item, idx)"
            :disabled="usedIndices.includes(idx)"
            class="px-3 py-2 border-2 rounded-lg transition-all"
            :class="usedIndices.includes(idx)
              ? 'opacity-30 cursor-not-allowed border-gray-200'
              : 'border-[#1A3C6E] hover:bg-blue-50 cursor-pointer'"
          >
            {{ item }}
          </button>
        </div>
        <div class="p-3 bg-gray-50 rounded-lg min-h-[48px]">
          <span class="text-xs text-gray-500">当前顺序：</span>
          <div class="flex flex-wrap gap-2 mt-1">
            <span
              v-for="(item, idx) in answerItems"
              :key="`ans-${idx}`"
              class="px-2 py-1 bg-[#1A3C6E] text-white rounded text-sm"
            >
              {{ idx + 1 }}. {{ item }}
            </span>
          </div>
        </div>
        <button
          v-if="answerItems.length > 0"
          @click="resetAnswer"
          class="text-sm text-gray-500 hover:text-gray-700"
        >
          重置
        </button>
      </div>

      <div v-else-if="puzzle?.puzzleType === 'code'" class="space-y-3">
        <p class="text-sm text-gray-500">输入答案：</p>
        <input
          v-model="codeAnswer"
          type="text"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A3C6E]"
          :placeholder="`提示：${puzzle.hint || ''}`"
        />
      </div>

      <div v-if="error" class="text-red-500 text-sm mt-3">{{ error }}</div>
      <div v-if="success" class="text-green-500 text-sm mt-3">{{ success }}</div>

      <div class="flex gap-3 mt-6">
        <button
          @click="handleSubmit"
          :disabled="isResolving"
          class="game-button flex-1"
        >
          提交
        </button>
        <button
          @click="handleClose"
          :disabled="isResolving"
          class="px-4 py-2 text-gray-500 hover:text-gray-700"
        >
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../stores/game'

interface Puzzle {
  puzzleId: string
  name: string
  description: string
  puzzleType: 'sort' | 'code'
  content: {
    items?: string[]
    correctOrder?: string[]
    answer?: string
    inputLength?: number
  }
  reward: { type: string; amount?: number; itemId?: string }
  hint?: string
}

const showModal = ref(false)
const puzzle = ref<Puzzle | null>(null)
const isResolving = ref(false)
const error = ref('')
const success = ref('')

const sortItems = ref<string[]>([])
const answerItems = ref<string[]>([])
const usedIndices = ref<number[]>([])
const codeAnswer = ref('')

const gameStore = useGameStore()

const handlePuzzleTrigger = (event: CustomEvent) => {
  puzzle.value = event.detail.puzzle
  error.value = ''
  success.value = ''
  answerItems.value = []
  usedIndices.value = []
  codeAnswer.value = ''

  if (puzzle.value?.content.items) {
    sortItems.value = [...puzzle.value.content.items]
  }

  showModal.value = true
}

const addToAnswer = (item: string, idx: number) => {
  if (usedIndices.value.includes(idx)) return
  answerItems.value.push(item)
  usedIndices.value.push(idx)
  error.value = ''
}

const resetAnswer = () => {
  answerItems.value = []
  usedIndices.value = []
  error.value = ''
}

const handleSubmit = async () => {
  if (!puzzle.value || isResolving.value) return
  isResolving.value = true
  error.value = ''
  success.value = ''

  let correct = false
  if (puzzle.value.puzzleType === 'sort') {
    correct =
      JSON.stringify(answerItems.value) ===
      JSON.stringify(puzzle.value.content.correctOrder)
  } else if (puzzle.value.puzzleType === 'code') {
    correct = codeAnswer.value.trim() === puzzle.value.content.answer
  }

  if (correct) {
    success.value = '解谜成功！'
    const reward = puzzle.value.reward
    if (reward.type === 'credits') {
      gameStore.addCredits(reward.amount || 0)
    } else if (reward.type === 'exp') {
      gameStore.addExp(reward.amount || 0)
    } else if (reward.type === 'coins') {
      gameStore.addCoins(reward.amount || 0)
    } else if (reward.type === 'item' || reward.type === 'archive') {
      if (reward.itemId) {
        gameStore.addItem(reward.itemId, reward.amount || 1)
        if (reward.type === 'archive') {
          gameStore.addArchive(reward.itemId)
        }
      }
    }
    gameStore.completeNode(`puzzle_${puzzle.value.puzzleId}`)
    await gameStore.saveSave()

    setTimeout(() => {
      showModal.value = false
    }, 1500)
  } else {
    error.value = '答案不正确，再试一次！'
  }

  isResolving.value = false
}

const handleClose = () => {
  if (isResolving.value) return
  showModal.value = false
  puzzle.value = null
}

onMounted(() => {
  window.addEventListener('puzzle-trigger', handlePuzzleTrigger as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('puzzle-trigger', handlePuzzleTrigger as EventListener)
})
</script>
