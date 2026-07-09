<template>
  <div class="min-h-screen bg-gradient-to-br from-[#FAFAF5] to-[#FFB7C5] p-6 floating-particles">
    <div class="max-w-5xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-[#1A3C6E]">角色成长</h1>
        <button @click="$router.push('/home')" class="game-button">
          返回
        </button>
      </div>

      <!-- 步骤 4：左立绘 + 右属性 双栏布局 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- 左侧：立绘 + 双形态切换 -->
        <div class="game-card-neon p-6 flex flex-col items-center">
          <div class="w-64 h-64 mb-4 rounded-lg overflow-hidden border-4 border-[#FFB7C5] shadow-md bg-gradient-to-br from-[#FFE5EC] to-[#FFB7C5]">
            <img
              :key="currentForm + roleId"
              :src="currentForm === 'human'
                ? `/assets/portraits/${roleId}.png`
                : `/assets/sprites/${roleId}.png`"
              :alt="gameStore.player?.name"
              class="w-full h-full object-cover portrait-fade"
              @error="onPortraitError"
            >
          </div>
          <h2 class="text-2xl font-bold text-[#1A3C6E]">{{ gameStore.player?.name }}</h2>
          <p class="text-sm text-gray-500 mb-4">{{ roleTitle }}</p>

          <!-- 步骤 4：双形态切换按钮 -->
          <div class="flex gap-2">
            <button
              @click="currentForm = 'human'"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-semibold transition',
                currentForm === 'human'
                  ? 'bg-[#1A3C6E] text-white shadow-md'
                  : 'bg-white/80 text-[#1A3C6E]'
              ]"
            >
              👤 人形
            </button>
            <button
              @click="currentForm = 'cat'"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-semibold transition',
                currentForm === 'cat'
                  ? 'bg-[#1A3C6E] text-white shadow-md'
                  : 'bg-white/80 text-[#1A3C6E]'
              ]"
            >
              🐱 猫形
            </button>
          </div>
        </div>

        <!-- 右侧：属性表 -->
        <div class="game-card-neon p-6">
          <h2 class="text-xl font-bold text-[#1A3C6E] mb-4">角色属性</h2>
          <div class="stat-panel">
            <div class="stat-item">
              <span class="stat-label">等级</span>
              <span class="stat-value">Lv.{{ gameStore.player?.level }}</span>
            </div>
            <!-- 阶段 3.5：EXP 进度条 -->
            <div class="stat-item flex-col items-stretch">
              <div class="flex justify-between mb-1">
                <span class="stat-label">经验值</span>
                <span class="text-xs text-gray-500">{{ currentExp }} / {{ expToNext }}</span>
              </div>
              <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-[#4ECDC4] to-[#FFB7C5] rounded-full transition-all duration-500"
                  :style="{ width: expPercent + '%' }"
                ></div>
              </div>
            </div>
            <div class="stat-item">
              <span class="stat-label">学识</span>
              <span class="stat-value">{{ gameStore.player?.attrs.knowledge }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">实践</span>
              <span class="stat-value">{{ gameStore.player?.attrs.practice }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">灵感</span>
              <span class="stat-value">{{ gameStore.player?.attrs.insight }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">韧性</span>
              <span class="stat-value">{{ gameStore.player?.attrs.resilience }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤 4：技能装配（Modal 选择） -->
      <div class="game-card-neon p-6 mb-6">
        <h2 class="text-xl font-bold text-[#1A3C6E] mb-4">技能装配</h2>
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div v-for="(skillId, index) in gameStore.player?.equippedSkills" :key="index"
            class="game-card-neon p-4 text-center cursor-pointer hover:scale-102 transition"
            :class="index === 0 ? 'border-[#1A3C6E]' : ''"
            @click="index !== 0 && openSkillModal(index as 1 | 2)"
          >
            <p class="text-xs text-gray-500 mb-1">格位 {{ index + 1 }}</p>
            <p class="font-bold text-[#1A3C6E]">{{ getSkillName(skillId) }}</p>
            <p v-if="index === 0" class="text-xs text-gray-400 mt-1">固定</p>
            <p v-else class="text-xs text-[#FFB7C5] mt-1">点击切换</p>
          </div>
        </div>

        <!-- 步骤 4：特性展示槽（2 个，从 effect.type 筛选） -->
        <h3 class="text-lg font-bold text-[#1A3C6E] mb-3">特性展示</h3>
        <div class="grid grid-cols-2 gap-3 mb-6">
          <div v-for="(skill, idx) in featureSkills" :key="idx"
            class="game-card-neon p-3 flex items-center gap-3"
          >
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
              :class="featureBadgeClass(skill.effect?.type)"
            >
              {{ featureLabel(skill.effect?.type) }}
            </div>
            <div>
              <p class="font-semibold text-[#1A3C6E]">{{ skill.name }}</p>
              <p class="text-xs text-gray-500">{{ getSkillDesc(skill.skillId) }}</p>
            </div>
          </div>
          <template v-if="featureSkills.length < 2">
            <div
              v-for="i in (2 - featureSkills.length)"
              :key="`empty-${i}`"
              class="game-card-neon p-3 flex items-center gap-3 opacity-50"
            >
              <div class="w-10 h-10 rounded-full bg-gray-300"></div>
              <div>
                <p class="font-semibold text-gray-500">空槽</p>
                <p class="text-xs text-gray-400">解锁更多技能以激活</p>
              </div>
            </div>
          </template>
        </div>

        <h3 class="text-lg font-bold text-[#1A3C6E] mb-3">已解锁技能</h3>
        <div class="grid grid-cols-2 gap-3">
          <div v-for="skillId in gameStore.unlockedSkills" :key="skillId"
            class="game-card-neon p-3 flex justify-between items-center cursor-pointer hover:scale-102 transition"
            @click="openSkillDetail(findSkillById(skillId))"
          >
            <div>
              <p class="font-semibold text-[#1A3C6E]">{{ getSkillName(skillId) }}</p>
              <p class="text-xs text-gray-500">{{ getSkillDesc(skillId) }}</p>
            </div>
            <span class="text-xs text-[#FFB7C5]">查看详情 →</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 步骤 4：技能选择 Modal -->
    <transition name="modal-fade">
      <div
        v-if="skillModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        @click.self="closeSkillModal"
      >
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 modal-content">
          <h2 class="text-xl font-bold text-[#1A3C6E] mb-4">选择技能（格位 {{ modalSlotIndex + 1 }}）</h2>
          <div class="space-y-2 max-h-80 overflow-y-auto">
            <button
              @click="unequipSkill()"
              class="w-full p-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-left"
            >
              <p class="font-semibold text-gray-700">空置</p>
              <p class="text-xs text-gray-500">卸下当前槽位</p>
            </button>
            <button
              v-for="skill in availableSkills"
              :key="skill.skillId"
              @click="selectSkillInModal(skill.skillId)"
              class="w-full p-3 rounded-lg bg-gray-50 hover:bg-[#FFE5EC] text-left transition"
            >
              <p class="font-semibold text-[#1A3C6E]">{{ skill.name }}</p>
              <p class="text-xs text-gray-500">{{ getSkillDesc(skill.skillId) }}</p>
            </button>
          </div>
          <button
            @click="closeSkillModal"
            class="mt-4 w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            关闭
          </button>
        </div>
      </div>
    </transition>

    <!-- 阶段 3.5：技能详情 Modal -->
    <transition name="modal-fade">
      <div
        v-if="detailSkill"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        @click.self="closeSkillDetail"
      >
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 modal-content">
          <h2 class="text-xl font-bold text-[#1A3C6E] mb-2">{{ detailSkill.name }}</h2>
          <p class="text-xs text-gray-500 mb-4">技能 ID：{{ detailSkill.skillId }}</p>

          <div class="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">类型</span>
              <span class="font-semibold">{{ detailSkill.type === 'active' ? '主动' : '被动' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">倍率</span>
              <span class="font-semibold">{{ detailSkill.multiplier }}x</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">冷却</span>
              <span class="font-semibold">{{ detailSkill.cooldown }} 回合</span>
            </div>
            <div v-if="detailSkill.effect" class="flex justify-between">
              <span class="text-gray-600">效果类型</span>
              <span class="font-semibold">{{ detailSkill.effect.type }}</span>
            </div>
          </div>

          <p v-if="detailSkill.description" class="text-sm text-gray-700 mb-4">{{ detailSkill.description }}</p>

          <button
            @click="closeSkillDetail"
            class="w-full px-4 py-2 rounded-lg bg-[#1A3C6E] text-white hover:bg-[#15305a] font-semibold"
          >
            关闭
          </button>
        </div>
      </div>
    </transition>

    <!-- 阶段 3.5：升级动效浮层 -->
    <transition name="level-up">
      <div
        v-if="showLevelUp"
        class="fixed top-1/3 left-1/2 z-50 pointer-events-none level-up-wrap"
      >
        <div class="text-center level-up-text">
          <p class="text-4xl font-bold text-yellow-400 drop-shadow-lg">⭐ LEVEL UP! ⭐</p>
          <p class="text-xl text-white mt-2">Lv.{{ currentLevel }}</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGameStore } from '../stores/game'
import skillsConfig from '../game/config/skills.json'
import rolesConfig from '../game/config/roles.json'

const gameStore = useGameStore()

// 步骤 4：双形态切换状态
const currentForm = ref<'human' | 'cat'>('human')
const roleId = computed(() => gameStore.player?.roleId || 'lina')
const roleTitle = computed(() => {
  const role = (rolesConfig as any[]).find(r => r.roleId === roleId.value)
  return role?.title || ''
})

// 阶段 3.5：EXP 进度条计算
const currentExp = computed(() => gameStore.player?.exp ?? 0)
const currentLevel = computed(() => gameStore.player?.level ?? 1)
const expToNext = computed(() => currentLevel.value * 100)
const expPercent = computed(() => {
  if (expToNext.value <= 0) return 0
  return Math.min(100, (currentExp.value / expToNext.value) * 100)
})

// 阶段 3.5：升级动效状态
const showLevelUp = ref(false)
watch(currentLevel, (newLv, oldLv) => {
  if (newLv > oldLv) {
    showLevelUp.value = true
    setTimeout(() => { showLevelUp.value = false }, 2000)
  }
})

// 阶段 3.5：技能详情 Modal 状态
const detailSkill = ref<any | null>(null)
const openSkillDetail = (skill: any) => {
  detailSkill.value = skill
}
const closeSkillDetail = () => {
  detailSkill.value = null
}

// 阶段 3.5：技能详情辅助函数（用于已解锁技能列表点击）
const findSkillById = (skillId: string) => {
  return (skillsConfig as any[]).find(s => s.skillId === skillId)
}

const availableSkills = computed(() => {
  if (!gameStore.player) return []
  const rid = gameStore.player.roleId
  return (skillsConfig as any[]).filter(s =>
    s.roleId === rid &&
    s.type === 'active' &&
    gameStore.unlockedSkills.includes(s.skillId)
  )
})

// 步骤 4：特性展示槽 — 筛选 effect.type ∈ {buff, summon, armor_pen, reflect, multi_hit}
const featureSkills = computed(() => {
  if (!gameStore.player) return []
  const rid = gameStore.player.roleId
  const featureTypes = ['buff', 'summon', 'armor_pen', 'reflect', 'multi_hit']
  return (skillsConfig as any[]).filter(s =>
    s.roleId === rid &&
    s.effect &&
    featureTypes.includes(s.effect.type) &&
    gameStore.unlockedSkills.includes(s.skillId)
  ).slice(0, 2)
})

const getSkillName = (skillId: string | null) => {
  if (!skillId) return '空置'
  const skill = (skillsConfig as any[]).find(s => s.skillId === skillId)
  return skill?.name || skillId
}

const getSkillDesc = (skillId: string) => {
  const skill = (skillsConfig as any[]).find(s => s.skillId === skillId)
  if (!skill) return ''
  return `倍率: ${skill.multiplier}x | CD: ${skill.cooldown}`
}

// 步骤 4：特性展示辅助函数
const featureLabel = (type?: string): string => {
  const map: Record<string, string> = {
    buff: '增',
    summon: '召',
    armor_pen: '穿',
    reflect: '反',
    multi_hit: '连'
  }
  return map[type || ''] || '技'
}

const featureBadgeClass = (type?: string): string => {
  const map: Record<string, string> = {
    buff: 'bg-orange-500',
    summon: 'bg-purple-500',
    armor_pen: 'bg-teal-500',
    reflect: 'bg-blue-500',
    multi_hit: 'bg-red-500'
  }
  return map[type || ''] || 'bg-gray-500'
}

// 步骤 4：技能 Modal 状态
const skillModalOpen = ref(false)
const modalSlotIndex = ref<1 | 2>(1)

const openSkillModal = (slot: 1 | 2) => {
  modalSlotIndex.value = slot
  skillModalOpen.value = true
}

const closeSkillModal = () => {
  skillModalOpen.value = false
}

const selectSkillInModal = (skillId: string) => {
  gameStore.equipSkill(modalSlotIndex.value, skillId)
  gameStore.saveSave()
  closeSkillModal()
}

const unequipSkill = () => {
  gameStore.equipSkill(modalSlotIndex.value, null)
  gameStore.saveSave()
  closeSkillModal()
}

const onPortraitError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}
</script>

<style scoped>
/* 步骤 4：立绘淡入淡出 */
@keyframes portraitFade {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.portrait-fade {
  animation: portraitFade 0.4s ease-out;
}

/* 阶段 3.5：升级动效 */
@keyframes levelUpFloat {
  0% { opacity: 0; transform: translate(-50%, 20px) scale(0.5); }
  20% { opacity: 1; transform: translate(-50%, 0) scale(1.1); }
  40% { transform: translate(-50%, 0) scale(1); }
  80% { opacity: 1; transform: translate(-50%, -10px) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -40px) scale(0.9); }
}
.level-up-wrap {
  left: 50%;
}
.level-up-text {
  animation: levelUpFloat 2s ease-out forwards;
}
.level-up-enter-active, .level-up-leave-active {
  transition: opacity 0.3s ease;
}
.level-up-enter-from, .level-up-leave-to {
  opacity: 0;
}

/* 阶段 3.5：Modal 淡入 */
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
