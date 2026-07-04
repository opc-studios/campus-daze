<template>
  <div :class="['min-h-screen bg-gradient-to-br p-6 ending-bg-transition', endingTheme]">
    <div class="max-w-5xl mx-auto relative z-10">
      <!-- 结局横幅 -->
      <div class="bg-white/90 backdrop-blur rounded-2xl shadow-2xl p-8 mb-6 text-center ending-card-enter">
        <div class="inline-block px-4 py-1 rounded-full bg-[#FFE5EC] text-[#1A3C6E] text-xs font-semibold mb-3">
          {{ endingTypeLabel }}
        </div>
        <h1 class="text-3xl sm:text-4xl font-bold text-[#1A3C6E] mb-3 ending-title-glow">
          {{ finalEnding?.title || '尚未解锁' }}
        </h1>
        <p class="text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed">
          {{ finalEnding?.description || '完成全部四章主线后解锁终局结局' }}
        </p>
      </div>

      <!-- 三因子卡片 -->
      <div v-if="finalEnding" class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <!-- 因子1：图鉴收集率 -->
        <div class="bg-white/90 backdrop-blur rounded-lg shadow-lg p-5 text-center factor-card">
          <p class="text-xs text-gray-500 mb-2">因子一 · 校史图鉴</p>
          <div class="relative w-20 h-20 mx-auto mb-2">
            <svg width="80" height="80" viewBox="0 0 80 80" class="transform -rotate-90">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#E5E7EB" stroke-width="6" />
              <circle
                cx="40" cy="40" r="34" fill="none" stroke="#4ECDC4" stroke-width="6"
                stroke-linecap="round"
                :stroke-dasharray="2 * Math.PI * 34"
                :stroke-dashoffset="2 * Math.PI * 34 - (finalEnding.factors.archiveRate / 100) * 2 * Math.PI * 34"
                class="transition-all duration-700"
              />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-sm font-bold text-[#FFB7C5]">{{ Math.floor(finalEnding.factors.archiveRate) }}%</span>
            </div>
          </div>
          <p class="text-xs text-gray-600">{{ collectedCount }} / {{ totalCount }}</p>
        </div>

        <!-- 因子2：所选角色 -->
        <div class="bg-white/90 backdrop-blur rounded-lg shadow-lg p-5 text-center factor-card">
          <p class="text-xs text-gray-500 mb-2">因子二 · 所选角色</p>
          <div class="w-20 h-20 mx-auto mb-2 rounded-full bg-gradient-to-br from-[#FFB7C5] to-[#4ECDC4] flex items-center justify-center text-3xl">
            {{ roleIcon }}
          </div>
          <p class="text-sm font-bold text-[#1A3C6E]">{{ roleName }}</p>
          <p class="text-xs text-gray-500 mt-1">{{ roleCombatName }}</p>
        </div>

        <!-- 因子3：章节结局汇总 -->
        <div class="bg-white/90 backdrop-blur rounded-lg shadow-lg p-5 text-center factor-card">
          <p class="text-xs text-gray-500 mb-2">因子三 · 章节结局</p>
          <div class="grid grid-cols-2 gap-1 mb-2">
            <div
              v-for="(level, idx) in finalEnding.factors.chapterEndings"
              :key="idx"
              :class="[
                'rounded px-2 py-1 text-xs',
                level >= 2 ? 'bg-yellow-100 text-yellow-700' :
                level === 1 ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-500'
              ]"
            >
              第{{ idx + 1 }}章 · {{ level >= 2 ? '完整' : level === 1 ? '未完整' : '标准' }}
            </div>
          </div>
          <p class="text-xs text-gray-600">{{ finalEnding.factors.perfectChapters }} 章记忆完整</p>
        </div>
      </div>

      <!-- 结局后日谈 -->
      <div v-if="finalEnding?.epilogue" class="bg-white/90 backdrop-blur rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-lg font-bold text-[#1A3C6E] mb-3">后日谈</h2>
        <p class="text-sm text-gray-700 leading-relaxed italic">"{{ finalEnding.epilogue }}"</p>
      </div>

      <!-- 通关统计（GDD §6.6） -->
      <div v-if="finalEnding" class="bg-white/90 backdrop-blur rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-lg font-bold text-[#1A3C6E] mb-4">通关统计</h2>
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
            <p class="text-xl font-bold text-purple-600">{{ gameStore.progress?.eventTriggerCount || gameStore.progress?.seenEvents?.length || 0 }}</p>
          </div>
          <div class="bg-orange-50 rounded-lg p-3 text-center">
            <p class="text-xs text-gray-600">完成节点</p>
            <p class="text-xl font-bold text-orange-600">{{ gameStore.progress?.exploreCount || gameStore.progress?.clearedNodes?.length || 0 }}</p>
          </div>
          <div class="bg-teal-50 rounded-lg p-3 text-center col-span-2 sm:col-span-3">
            <p class="text-xs text-gray-600">学习时长</p>
            <p class="text-xl font-bold text-teal-600">{{ formattedStudyTime }}</p>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex flex-wrap gap-3 justify-center">
        <button @click="router.push('/home')" class="game-button">
          返回主页
        </button>
        <button @click="router.push('/archive')" class="px-4 py-2 bg-white text-[#1A3C6E] rounded-lg shadow hover:shadow-lg font-semibold">
          查看图鉴
        </button>
        <button
          @click="onStartNewGamePlus"
          :disabled="ngPlusStarting"
          class="px-4 py-2 bg-gradient-to-r from-[#FFB7C5] to-[#4ECDC4] text-white rounded-lg shadow hover:shadow-lg font-semibold disabled:opacity-60 disabled:cursor-wait"
          title="开启二周目：保留图鉴、已解锁技能，部分资源按 50% 继承"
        >
          {{ ngPlusStarting ? '正在开启二周目…' : `开始二周目（第 ${(gameStore.progress?.ngPlusCount ?? 0) + 1} 周目）` }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import archivesConfig from '../game/config/archives.json'
import rolesConfig from '../game/config/roles.json'

const router = useRouter()
const gameStore = useGameStore()

// D.3 二周目继承：开启二周目按钮状态
const ngPlusStarting = ref(false)

async function onStartNewGamePlus() {
  if (ngPlusStarting.value) return
  if (!gameStore.progress?.gameCompleted) return
  ngPlusStarting.value = true
  try {
    const ok = await gameStore.startNewGamePlus()
    if (ok) {
      // 二周目存档已创建，跳转主页重新开始
      router.replace('/home')
    } else {
      console.warn('开启二周目失败：未通关或存档异常')
    }
  } catch (err) {
    console.error('开启二周目异常:', err)
  } finally {
    ngPlusStarting.value = false
  }
}

const totalCount = archivesConfig.length
const collectedCount = computed(() => gameStore.progress?.archives?.length || 0)

const finalEnding = computed(() => gameStore.getFinalEnding())

const endingTypeLabel = computed(() => {
  if (!finalEnding.value) return '未解锁'
  const labels: Record<string, string> = {
    perfect_memory: '完美记忆结局',
    memory_remaining: '记忆犹存结局',
    standard: '标准结局'
  }
  return labels[finalEnding.value.type] || '结局'
})

// 结局主题色（根据类型）
const endingTheme = computed(() => {
  if (!finalEnding.value) return 'from-[#FAFAF5] to-[#FFB7C5]'
  const themes: Record<string, string> = {
    perfect_memory: 'from-[#FFD700] via-[#FFA500] to-[#FF6347]',
    memory_remaining: 'from-[#FFF0F5] via-[#FFB7C5] to-[#FF6B9D]',
    standard: 'from-[#FAFAF5] via-[#E8F4FD] to-[#B0E0E6]'
  }
  return themes[finalEnding.value.type] || themes.standard
})

// 角色信息
const roleName = computed(() => {
  const roleId = gameStore.player?.roleId
  const role = (rolesConfig as any[]).find(r => r.roleId === roleId)
  return role?.name || '未知'
})

const roleIcon = computed(() => {
  const roleId = gameStore.player?.roleId
  const icons: Record<string, string> = {
    lina: '🐱',
    ayu: '⚡',
    zhixia: '🎯',
    jiangxun: '🗡️',
    laodeng: '🛡️'
  }
  return icons[roleId || ''] || '🐾'
})

const roleCombatName = computed(() => {
  const roleId = gameStore.player?.roleId
  const role = (rolesConfig as any[]).find(r => r.roleId === roleId)
  const combatNames: Record<string, string> = {
    summon_spirit: '召唤流',
    dps_strike: '连击流',
    dps_burst: '暴击流',
    dps_aoe: '穿透流',
    tank_heavy: '反震流'
  }
  return combatNames[role?.combatRole || ''] || ''
})

const formattedStudyTime = computed(() => {
  const seconds = gameStore.progress?.studyTimeSeconds || 0
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}小时${m}分钟${s}秒`
  if (m > 0) return `${m}分钟${s}秒`
  return `${s}秒`
})

onMounted(async () => {
  // 确保存档已加载
  if (!gameStore.loaded) {
    await gameStore.loadSave()
  }
  // 若未通关，重定向到主页
  if (!gameStore.progress?.gameCompleted) {
    router.replace('/home')
  }
})
</script>

<style scoped>
.ending-card-enter {
  animation: cardFadeIn 0.6s ease-out;
}
.factor-card {
  animation: cardFadeIn 0.5s ease-out backwards;
}
.factor-card:nth-child(1) { animation-delay: 0.1s; }
.factor-card:nth-child(2) { animation-delay: 0.2s; }
.factor-card:nth-child(3) { animation-delay: 0.3s; }

@keyframes cardFadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.ending-title-glow {
  text-shadow: 0 0 20px rgba(255, 183, 197, 0.6);
}

.ending-bg-transition {
  transition: background 0.8s ease;
}
</style>
