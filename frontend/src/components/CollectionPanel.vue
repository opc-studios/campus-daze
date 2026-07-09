<template>
  <div class="bg-white rounded-lg shadow-lg p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-[#1A3C6E]">收集品</h2>
      <span class="text-sm text-gray-500">
        {{ completedCount }} / {{ totalCount }}
      </span>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-for="item in collections"
        :key="item.id"
        class="relative border rounded-lg p-3 text-center transition-all"
        :class="{
          'border-gray-300 bg-gray-50 opacity-50': !item.obtained,
          'border-[#FFB7C5] bg-pink-50 shadow-md': item.obtained
        }"
        @click="showDetail(item)"
      >
        <div
          class="w-12 h-12 mx-auto mb-2 rounded flex items-center justify-center text-white text-xl"
          :class="getRarityBg(item.rarity)"
        >
          {{ item.obtained ? '✨' : '❓' }}
        </div>
        <p class="text-sm font-bold text-[#1A3C6E] truncate">
          {{ item.obtained ? item.name : '???' }}
        </p>
        <p class="text-xs text-gray-500">{{ getCategoryLabel(item.category) }}</p>
        <span
          v-if="item.obtained"
          class="absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded"
          :class="getRarityClass(item.rarity)"
        >
          {{ getRarityLabel(item.rarity) }}
        </span>
      </div>
    </div>

    <div
      v-if="selectedItem"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="selectedItem = null"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
        <div class="flex items-start justify-between mb-4">
          <div>
            <div
              class="w-16 h-16 rounded-lg flex items-center justify-center text-white text-3xl mb-3"
              :class="getRarityBg(selectedItem.rarity)"
            >
              ✨
            </div>
            <h3 class="text-xl font-bold text-[#1A3C6E]">{{ selectedItem.name }}</h3>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs px-2 py-0.5 rounded" :class="getRarityClass(selectedItem.rarity)">
                {{ getRarityLabel(selectedItem.rarity) }}
              </span>
              <span class="text-xs text-gray-500">{{ getCategoryLabel(selectedItem.category) }}</span>
            </div>
          </div>
          <button
            @click="selectedItem = null"
            class="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>
        <p class="text-gray-600 mb-4">{{ selectedItem.description }}</p>
        <div v-if="selectedItem.obtainedAt" class="text-xs text-gray-500">
          获取时间：{{ formatDate(selectedItem.obtainedAt) }}
        </div>
        <div v-else class="text-xs text-gray-400 italic">
          尚未获取
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore, type CollectionItem } from '../stores/game'

const gameStore = useGameStore()
const collections = computed(() => gameStore.collections)
const selectedItem = ref<CollectionItem | null>(null)

const completedCount = computed(() => collections.value.filter((c: CollectionItem) => c.obtained).length)
const totalCount = computed(() => collections.value.length)

const getRarityBg = (rarity: string): string => {
  const classes: Record<string, string> = {
    common: 'bg-gradient-to-br from-gray-400 to-gray-600',
    uncommon: 'bg-gradient-to-br from-green-400 to-green-600',
    rare: 'bg-gradient-to-br from-blue-400 to-blue-600',
    epic: 'bg-gradient-to-br from-purple-400 to-purple-600',
    legendary: 'bg-gradient-to-br from-yellow-400 to-orange-600'
  }
  return classes[rarity] || classes.common
}

const getRarityClass = (rarity: string): string => {
  const classes: Record<string, string> = {
    common: 'bg-gray-200 text-gray-600',
    uncommon: 'bg-green-100 text-green-600',
    rare: 'bg-blue-100 text-blue-600',
    epic: 'bg-purple-100 text-purple-600',
    legendary: 'bg-yellow-100 text-yellow-700'
  }
  return classes[rarity] || classes.common
}

const getRarityLabel = (rarity: string): string => {
  const labels: Record<string, string> = {
    common: '普通',
    uncommon: '优秀',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  }
  return labels[rarity] || '普通'
}

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    archive: '校史',
    collection: '收集',
    special: '特殊',
    combat: '战斗',
    key: '钥匙',
    idle: '挂机'
  }
  return labels[category] || '其他'
}

const showDetail = (item: CollectionItem) => {
  selectedItem.value = item
}

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
</style>