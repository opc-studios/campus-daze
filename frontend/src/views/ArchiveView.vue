<template>
  <div class="min-h-screen bg-gradient-to-br from-[#FAFAF5] to-[#FFB7C5] p-6">
    <div class="max-w-4xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-[#1A3C6E]">校史图鉴</h1>
        <button @click="$router.push('/home')" class="px-4 py-2 bg-white rounded-lg shadow text-[#1A3C6E]">
          返回
        </button>
      </div>

      <div class="bg-white rounded-lg shadow-lg p-6 mb-6 game-card-neon">
        <div class="flex justify-between items-center">
          <div>
            <p class="text-gray-600">收集进度</p>
            <p class="text-2xl font-bold text-[#4ECDC4]">{{ collectedCount }} / {{ totalCount }}</p>
          </div>
          <div class="text-right">
            <p class="text-gray-600">收集率</p>
            <p class="text-2xl font-bold text-[#FFB7C5]">{{ Math.floor(collectionRate) }}%</p>
          </div>
        </div>
        <div class="mt-3">
          <ProgressBar :percentage="collectionRate" color="green" />
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-xl font-bold text-[#1A3C6E] mb-4">章节结局</h2>
        <div class="space-y-3">
          <div
            v-for="(ending, idx) in chapterEndings"
            :key="idx"
            class="border rounded-lg p-4 flex items-center justify-between"
            :class="ending.cleared ? 'border-[#4ECDC4] bg-teal-50' : 'border-gray-200 bg-gray-50'"
          >
            <div>
              <p class="font-bold text-[#1A3C6E]">第 {{ idx + 1 }} 章 · {{ chapterTitles[idx] }}</p>
              <p class="text-xs text-gray-600 mt-1">
                {{ ending.cleared ? ending.title : '尚未通关' }}
              </p>
              <p v-if="ending.cleared" class="text-xs text-gray-500 mt-1">
                章节图鉴：{{ ending.archivesInChapter }} / {{ ending.totalInChapter }}
              </p>
            </div>
            <div class="text-right">
              <span
                v-if="ending.cleared"
                :class="[
                  'px-3 py-1 rounded-full text-xs font-semibold',
                  ending.level === 2
                    ? 'bg-yellow-100 text-yellow-700'
                    : ending.level === 1
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                ]"
              >
                {{ ending.level === 2 ? '记忆完整' : ending.level === 1 ? '记忆未完整' : '标准' }}
              </span>
              <span v-else class="px-3 py-1 rounded-full text-xs bg-gray-200 text-gray-500">未通关</span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-xl font-bold text-[#1A3C6E] mb-4">终局结局</h2>
        <div
          class="rounded-lg p-4"
          :class="finalEndingUnlocked ? 'bg-gradient-to-r from-[#FFB7C5] to-[#FF6B9D] text-white' : 'bg-gray-100 text-gray-500'"
        >
          <p class="font-bold text-lg">{{ finalEnding.title }}</p>
          <p class="text-sm mt-1 opacity-90">{{ finalEnding.description }}</p>
        </div>
      </div>

      <div v-if="gameCompleted" class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-xl font-bold text-[#1A3C6E] mb-4">通关统计</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div class="bg-blue-50 rounded-lg p-3 text-center">
            <p class="text-xs text-gray-600">最终等级</p>
            <p class="text-xl font-bold text-[#1A3C6E]">Lv.{{ gameStore.player?.level || 1 }}</p>
          </div>
          <div class="bg-green-50 rounded-lg p-3 text-center">
            <p class="text-xs text-gray-600">累计学分</p>
            <p class="text-xl font-bold text-[#4ECDC4]">{{ gameStore.resources?.credits || 0 }}</p>
          </div>
          <div class="bg-yellow-50 rounded-lg p-3 text-center">
            <p class="text-xs text-gray-600">校园币</p>
            <p class="text-xl font-bold text-yellow-600">{{ gameStore.resources?.coins || 0 }}</p>
          </div>
          <div class="bg-pink-50 rounded-lg p-3 text-center">
            <p class="text-xs text-gray-600">图鉴收集</p>
            <p class="text-xl font-bold text-[#FF6B9D]">{{ collectedCount }} / {{ totalCount }}</p>
          </div>
          <div class="bg-purple-50 rounded-lg p-3 text-center">
            <p class="text-xs text-gray-600">触发事件</p>
            <p class="text-xl font-bold text-purple-600">{{ gameStore.progress?.seenEvents?.length || 0 }}</p>
          </div>
          <div class="bg-orange-50 rounded-lg p-3 text-center">
            <p class="text-xs text-gray-600">完成节点</p>
            <p class="text-xl font-bold text-orange-600">{{ gameStore.progress?.clearedNodes?.length || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-xl font-bold text-[#1A3C6E] mb-4">图鉴列表</h2>
        <div class="space-y-3">
          <div
            v-for="archive in archivesConfig"
            :key="archive.archiveId"
            :class="[
              'bg-white rounded-lg shadow p-4 border-l-4 transition-all',
              isUnlocked(archive.archiveId)
                ? 'border-[#4ECDC4]'
                : 'border-gray-200 opacity-60'
            ]"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <h3 class="text-base font-bold text-[#1A3C6E] mb-1">
                  {{ isUnlocked(archive.archiveId) ? archive.title : '???' }}
                </h3>
                <p class="text-sm text-gray-600">
                  {{ isUnlocked(archive.archiveId) ? archive.description : '尚未解锁，继续探索校园以发现此条目' }}
                </p>
              </div>
              <div class="text-right ml-3">
                <span class="text-xs text-gray-400 block">第{{ archive.chapter }}章</span>
                <span v-if="isUnlocked(archive.archiveId)" class="text-xs text-[#4ECDC4]">✓ 已收集</span>
                <span v-else class="text-xs text-gray-400">未解锁</span>
              </div>
            </div>
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
const collectedCount = computed(() => gameStore.progress?.archives?.length || 0)
const collectionRate = computed(() =>
  totalCount > 0 ? (collectedCount.value / totalCount) * 100 : 0
)

const chapterTitles = ['入学启程', '李庄岁月', '改革开放', '同舟共济']

const isUnlocked = (archiveId?: string) => {
  if (!archiveId) return false
  return gameStore.progress?.archives?.includes(archiveId) ?? false
}

const chapterEndings = computed(() => {
  const endings = gameStore.progress?.chapterEndings || [0, 0, 0, 0]
  const cleared = gameStore.progress?.chapterCleared || [false, false, false, false]
  return [0, 1, 2, 3].map(idx => {
    const archivesInChapter = archivesConfig.filter(
      a => a.chapter === idx + 1 && isUnlocked(a.archiveId)
    ).length
    const totalInChapter = archivesConfig.filter(a => a.chapter === idx + 1).length
    const level = endings[idx] || 0
    const titles = ['标准结局', '记忆未完整', '记忆完整']
    return {
      cleared: cleared[idx] || false,
      level,
      title: titles[level] || '标准结局',
      archivesInChapter,
      totalInChapter
    }
  })
})

const finalEndingUnlocked = computed(() => {
  const cleared = gameStore.progress?.chapterCleared || []
  return cleared[3] === true
})

const finalEnding = computed(() => {
  const rate = collectionRate.value
  if (!finalEndingUnlocked.value) {
    return {
      title: '尚未解锁',
      description: '完成全部四章主线后解锁终局结局'
    }
  }
  if (rate >= 100) {
    return {
      title: '完整校史 · 记忆犹存',
      description: '你收集了全部校史图鉴，完整还原了同济百年记忆。同舟共济的精神将伴随你走向新的人生征程。'
    }
  }
  if (rate >= 50) {
    return {
      title: '记忆犹存',
      description: '你收集了过半的校史图鉴，记忆碎片逐渐完整。同济的故事，仍在续写。'
    }
  }
  return {
    title: '标准结局',
    description: '你完成了毕业答辩，踏上了新的征程。同济的故事，还有更多等待发掘。'
  }
})

const gameCompleted = computed(() => {
  const cleared = gameStore.progress?.chapterCleared || []
  return cleared[3] === true
})
</script>
