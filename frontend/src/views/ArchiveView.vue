<template>
  <div class="min-h-screen bg-gradient-to-br from-[#FAFAF5] to-[#FFB7C5] p-6">
    <div class="max-w-4xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-[#1A3C6E]">校史图鉴</h1>
        <button @click="$router.push('/home')" class="px-4 py-2 bg-white rounded-lg shadow text-[#1A3C6E]">
          返回
        </button>
      </div>
      
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div class="flex justify-between items-center">
          <p class="text-gray-600">收集进度</p>
          <p class="text-2xl font-bold text-[#4ECDC4]">{{ collectedCount }} / {{ totalCount }}</p>
        </div>
        <div class="mt-3">
          <ProgressBar :percentage="collectionRate" color="green" />
        </div>
        <p class="text-sm text-gray-500 mt-2">收集率: {{ Math.floor(collectionRate) }}%</p>
      </div>
      
      <div class="space-y-4">
        <div v-for="archive in archivesConfig" :key="archive.archiveId || archive.archive_id"
          :class="[
            'bg-white rounded-lg shadow p-6',
            isUnlocked(archive.archiveId || archive.archive_id) ? '' : 'opacity-50'
          ]"
        >
          <div class="flex justify-between items-start">
            <div>
              <h3 class="text-xl font-bold text-[#1A3C6E] mb-2">
                {{ isUnlocked(archive.archiveId || archive.archive_id) ? archive.title : '???' }}
              </h3>
              <p class="text-gray-600">
                {{ isUnlocked(archive.archiveId || archive.archive_id) ? archive.description : '尚未解锁' }}
              </p>
            </div>
            <span class="text-xs text-gray-400">第{{ archive.chapter }}章</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import ProgressBar from '../components/ui/ProgressBar.vue'
import archivesConfig from '../game/config/archives.json'

const gameStore = useGameStore()

const totalCount = archivesConfig.length
const collectedCount = computed(() => gameStore.progress?.archives.length || 0)
const collectionRate = computed(() => (collectedCount.value / totalCount) * 100)

const isUnlocked = (archiveId?: string) => {
  if (!archiveId) return false
  return gameStore.progress?.archives.includes(archiveId) ?? false
}
</script>
