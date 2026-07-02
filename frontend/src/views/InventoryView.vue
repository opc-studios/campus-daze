<template>
  <div class="min-h-screen bg-gradient-to-br from-[#FAFAF5] to-[#FFB7C5] p-6">
    <div class="max-w-4xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-[#1A3C6E]">背包</h1>
        <button @click="$router.push('/home')" class="px-4 py-2 bg-white rounded-lg shadow text-[#1A3C6E]">
          返回
        </button>
      </div>
      
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-xl font-bold text-[#1A3C6E] mb-4">携带槽</h2>
        <div class="grid grid-cols-3 gap-4">
          <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <p class="text-xs text-gray-500 mb-2">学习</p>
            <p class="text-sm font-bold text-[#1A3C6E]">{{ gameStore.equipped.study || '空' }}</p>
          </div>
          <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <p class="text-xs text-gray-500 mb-2">实习</p>
            <p class="text-sm font-bold text-[#1A3C6E]">{{ gameStore.equipped.intern || '空' }}</p>
          </div>
          <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <p class="text-xs text-gray-500 mb-2">探索</p>
            <p class="text-sm font-bold text-[#1A3C6E]">{{ gameStore.equipped.explore || '空' }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-xl font-bold text-[#1A3C6E] mb-4">道具</h2>
        <div v-if="Object.keys(gameStore.inventory).length === 0" class="text-center text-gray-400 py-8">
          背包空空如也
        </div>
        <div v-else class="grid grid-cols-4 gap-4">
          <div v-for="(count, itemId) in gameStore.inventory" :key="itemId"
            class="border rounded-lg p-3 text-center hover:shadow-md cursor-pointer"
            @click="useItem(itemId as string)"
          >
            <div class="w-12 h-12 mx-auto mb-2 rounded bg-gradient-to-br from-[#1A3C6E] to-[#4ECDC4] flex items-center justify-center text-white text-xl">
              📦
            </div>
            <p class="text-sm font-bold text-[#1A3C6E]">{{ getItemName(itemId as string) }}</p>
            <p class="text-xs text-gray-500">x{{ count }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '../stores/game'
import itemsConfig from '../game/config/items.json'

const gameStore = useGameStore()

const getItemName = (itemId: string) => {
  const item = itemsConfig.find(i => i.itemId === itemId)
  return item?.name || itemId
}

const useItem = (itemId: string) => {
  const item = itemsConfig.find(i => i.itemId === itemId)
  if (!item) return
  
  if (item.category === 'consumable') {
    if (gameStore.useItem(itemId)) {
      if (item.effect) {
        switch (item.effect.type) {
          case 'exp':
            gameStore.addExp(item.effect.amount ?? 0)
            break
          case 'credits':
            gameStore.addCredits(item.effect.amount ?? 0)
            break
        }
      }
      gameStore.saveSave()
    }
  }
}
</script>
