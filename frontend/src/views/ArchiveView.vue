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
          <!-- 步骤 9：环形进度环 -->
          <div class="relative w-24 h-24">
            <svg width="96" height="96" viewBox="0 0 96 96" class="transform -rotate-90">
              <circle
                cx="48" cy="48" :r="ringRadius"
                fill="none"
                stroke="#E5E7EB"
                stroke-width="8"
              />
              <circle
                cx="48" cy="48" :r="ringRadius"
                fill="none"
                stroke="#4ECDC4"
                stroke-width="8"
                stroke-linecap="round"
                :stroke-dasharray="ringCircumference"
                :stroke-dashoffset="ringDashOffset"
                class="transition-all duration-500"
              />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-lg font-bold text-[#FFB7C5]">{{ Math.floor(collectionRate) }}%</span>
            </div>
          </div>
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
                  'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold',
                  ending.level === 2
                    ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-400'
                    : ending.level === 1
                    ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-400'
                    : 'bg-gray-100 text-gray-700'
                ]"
              >
                {{ endingIcon(ending.level) }} {{ ending.level === 2 ? '记忆完整' : ending.level === 1 ? '记忆未完整' : '标准' }}
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
        <!-- 阶段 3.6：章节筛选 tab -->
        <div class="flex gap-2 mb-4 flex-wrap">
          <button
            v-for="filter in chapterFilters"
            :key="filter.value"
            @click="selectedChapter = filter.value"
            :class="[
              'px-3 py-1.5 rounded-full text-xs font-semibold transition',
              selectedChapter === filter.value
                ? 'bg-[#1A3C6E] text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            ]"
          >
            {{ filter.label }}
          </button>
        </div>
        <div class="space-y-3">
          <div
            v-for="archive in filteredArchives"
            :key="archive.archiveId"
            :class="[
              'bg-white rounded-lg shadow p-4 border-l-4 transition-all archive-item',
              isUnlocked(archive.archiveId)
                ? 'border-[#4ECDC4] cursor-pointer hover:shadow-lg hover:translate-x-1'
                : 'border-gray-200 opacity-60'
            ]"
            @click="openDetail(archive)"
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

    <!-- 阶段 3.6：图鉴详情 Modal -->
    <transition name="modal-fade">
      <div
        v-if="detailArchive"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        @click.self="closeDetail"
      >
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 modal-content">
          <div class="flex items-center justify-between mb-4">
            <div>
              <span class="inline-block px-2 py-0.5 rounded-full bg-[#FFE5EC] text-[#1A3C6E] text-xs font-semibold mb-2">
                第 {{ detailArchive.chapter }} 章
              </span>
              <h2 class="text-2xl font-bold text-[#1A3C6E]">{{ detailArchive.title }}</h2>
            </div>
            <span class="text-2xl text-[#4ECDC4]">✓</span>
          </div>

          <p class="text-sm text-gray-700 mb-4 leading-relaxed">{{ detailArchive.description }}</p>

          <div class="bg-gray-50 rounded-lg p-3 mb-4">
            <p class="text-xs text-gray-500">解锁条件</p>
            <p class="text-sm font-semibold text-[#1A3C6E] mt-1">{{ detailArchive.unlockCondition }}</p>
          </div>

          <button
            @click="closeDetail"
            class="w-full px-4 py-2 rounded-lg bg-[#1A3C6E] text-white hover:bg-[#15305a] font-semibold"
          >
            关闭
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/game'
import archivesConfig from '../game/config/archives.json'
import chaptersConfig from '../game/config/chapters.json'

const gameStore = useGameStore()

const totalCount = archivesConfig.length
const collectedCount = computed(() => gameStore.progress?.archives?.length || 0)
const collectionRate = computed(() =>
  totalCount > 0 ? (collectedCount.value / totalCount) * 100 : 0
)

// 阶段 3.6：章节筛选状态（0 = 全部，1-4 = 对应章节）
const selectedChapter = ref<number>(0)

// 阶段 3.6：详情 Modal 状态
const detailArchive = ref<any | null>(null)

// 阶段 3.6：筛选后的图鉴列表
const filteredArchives = computed(() => {
  if (selectedChapter.value === 0) return archivesConfig
  return (archivesConfig as any[]).filter(a => a.chapter === selectedChapter.value)
})

// 阶段 3.6：章节筛选选项
const chapterFilters = [
  { value: 0, label: '全部' },
  { value: 1, label: '第 1 章' },
  { value: 2, label: '第 2 章' },
  { value: 3, label: '第 3 章' },
  { value: 4, label: '第 4 章' }
]

// 阶段 3.6：打开/关闭详情
const openDetail = (archive: any) => {
  if (!isUnlocked(archive.archiveId)) return
  detailArchive.value = archive
}
const closeDetail = () => {
  detailArchive.value = null
}

// 步骤 9：章节标题从 chapters.json 动态读取（对齐 GDD）
const chapterTitles = computed(() =>
  (chaptersConfig as any[]).filter(c => c.chapterId >= 1).map(c => c.name)
)

// 步骤 9：环形进度参数
const ringRadius = 40
const ringCircumference = 2 * Math.PI * ringRadius
const ringDashOffset = computed(() =>
  ringCircumference - (collectionRate.value / 100) * ringCircumference
)

// 步骤 9：结局等级图标
const endingIcon = (level: number): string => {
  if (level === 2) return '🏆'
  if (level === 1) return '📖'
  return '✓'
}

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

<style scoped>
/* 阶段 3.6：图鉴条目入场动画 */
@keyframes archiveUnlock {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}
.archive-item {
  animation: archiveUnlock 0.3s ease-out backwards;
}

/* 阶段 3.6：Modal 淡入 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-content {
  transition: transform 0.25s ease;
}
.modal-fade-enter-from .modal-content,
.modal-fade-leave-to .modal-content {
  transform: scale(0.95);
}
</style>
