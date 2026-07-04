<template>
  <div class="w-full h-screen relative bg-[#1A3C6E]">
    <div id="game-container" class="w-full h-full"></div>

    <!-- 阶段 3.4：加载过渡蒙层 -->
    <transition name="fade-out">
      <div
        v-if="isLoading"
        class="absolute inset-0 z-40 bg-[#1A3C6E] flex items-center justify-center"
      >
        <div class="text-center">
          <div class="inline-block w-12 h-12 border-4 border-white/30 border-t-[#FFB7C5] rounded-full animate-spin mb-4"></div>
          <p class="text-white text-lg font-semibold">进入校园中...</p>
        </div>
      </div>
    </transition>

    <!-- 阶段 3.4：返回确认 Modal -->
    <transition name="modal-fade">
      <div
        v-if="showExitConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        @click.self="showExitConfirm = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 modal-content">
          <h3 class="text-xl font-bold text-[#1A3C6E] mb-3">返回主页</h3>
          <p class="text-sm text-gray-600 mb-6">确定要返回主页吗？当前探索进度将不会保存到服务端。</p>
          <div class="flex gap-3">
            <button
              @click="showExitConfirm = false"
              class="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold"
            >
              取消
            </button>
            <button
              @click="confirmGoHome"
              class="flex-1 px-4 py-2 rounded-lg bg-[#1A3C6E] text-white hover:bg-[#15305a] font-semibold"
            >
              确认返回
            </button>
          </div>
        </div>
      </div>
    </transition>

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

      <div class="flex gap-2 pointer-events-auto items-start">
        <!-- 步骤 10：章节 chip -->
        <span
          class="px-3 py-2 rounded-full text-xs font-semibold shadow"
          :class="chapterChipClass"
        >
          {{ chapterName }}
        </span>
        <button
          @click="toggleForm"
          :disabled="isInCombat"
          class="px-4 py-2 bg-white/90 rounded-lg shadow text-sm font-semibold text-[#1A3C6E] disabled:opacity-50"
        >
          {{ gameStore.player?.currentForm === 'human' ? '🐱 切换猫形态' : '👤 切换人形态' }}
        </button>
        <!-- 步骤 2 v2：包裹 B 按钮 -->
        <button
          @click="showBag = !showBag"
          class="px-4 py-2 bg-white/90 rounded-lg shadow text-sm font-semibold text-[#1A3C6E]"
          title="按 B 键切换包裹面板"
        >
          🎒 包裹 (B)
        </button>
        <!-- 步骤 2 v2：全屏按钮 -->
        <button
          @click="toggleFullscreen"
          class="px-4 py-2 bg-white/90 rounded-lg shadow text-sm font-semibold text-[#1A3C6E]"
          title="全屏切换"
        >
          {{ isFullscreen ? '🡿 退出全屏' : '⛶ 全屏' }}
        </button>
        <button
          @click="goHome"
          class="px-4 py-2 bg-white/90 rounded-lg shadow text-sm font-semibold text-[#1A3C6E]"
        >
          返回主页
        </button>
      </div>
    </div>

    <!-- 步骤 2 v2：朝向指示器（8 方向罗盘，监听 player-direction-change 事件） -->
    <div
      class="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-none z-20"
      v-if="currentDirection"
    >
      <div class="bg-black/60 backdrop-blur rounded-full p-2 shadow-lg border border-white/30">
        <svg width="56" height="56" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="26" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.4" />
          <circle cx="28" cy="28" r="3" fill="#FFD700" />
          <g
            v-for="dir in 8"
            :key="dir"
            :transform="`rotate(${(dir - 1) * 45} 28 28)`"
          >
            <polygon
              points="28,4 25,10 31,10"
              :fill="isDirectionActive((dir - 1) * 45) ? '#FF6B9D' : '#ffffff'"
              :opacity="isDirectionActive((dir - 1) * 45) ? 1 : 0.3"
            />
          </g>
          <text
            x="28"
            y="52"
            text-anchor="middle"
            font-family="Arial, sans-serif"
            font-size="9"
            fill="#ffffff"
            opacity="0.7"
          >
            {{ currentDirection }}
          </text>
        </svg>
      </div>
    </div>

    <!-- 步骤 2 v2：包裹面板（3 法杖卡片，点击切换法杖） -->
    <transition name="slide-up">
      <div
        v-if="showBag"
        class="absolute bottom-4 left-4 z-20 bg-black/70 backdrop-blur rounded-xl p-3 shadow-2xl border border-white/20"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold text-white">🎒 包裹 · 法杖</span>
          <button
            @click="showBag = false"
            class="text-white/60 hover:text-white text-xs ml-3"
          >
            ✕
          </button>
        </div>
        <div class="flex gap-2">
          <div
            v-for="(equip, idx) in equipmentList"
            :key="equip.id"
            @click="selectStaff(idx)"
            :class="[
              'cursor-pointer p-2 rounded-lg border-2 transition-all w-24',
              currentEquipIndex === idx
                ? 'bg-white/20 border-yellow-400 shadow-[0_0_12px_rgba(255,215,0,0.6)]'
                : 'bg-white/5 border-transparent hover:border-white/40'
            ]"
          >
            <div
              class="w-full h-12 rounded flex items-center justify-center mb-1 text-2xl font-bold"
              :style="{ background: equip.color + '33', color: equip.color }"
            >
              {{ equip.mark }}
            </div>
            <p class="text-[10px] text-white text-center truncate">{{ equip.name }}</p>
            <p class="text-[9px] text-white/50 text-center mt-0.5">
              射程 {{ equip.range }} · CD {{ equip.cooldown }}ms
            </p>
          </div>
        </div>
        <p class="text-[10px] text-white/50 mt-2">
          点击切换法杖 · 当前：{{ equipmentList[currentEquipIndex]?.name || '无' }}
        </p>
      </div>
    </transition>

    <EventModal />
    <PuzzleModal />

    <!-- C.3 移动端虚拟摇杆（仅移动端显示，固定左下角） -->
    <VirtualJoystick
      :visible="isMobile"
      :pos-x="joystickPos.x"
      :pos-y="joystickPos.y"
      :radius="60"
      @move="onJoystickMove"
      @stop="onJoystickStop"
    />

    <div
      v-if="showGameComplete"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-8 game-card-neon text-center border-4 border-yellow-400 shadow-[0_0_30px_rgba(255,215,0,0.5)]">
        <h2 class="text-3xl font-bold text-yellow-500 mb-4">🎉 恭喜通关！</h2>
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
import VirtualJoystick from '../components/VirtualJoystick.vue'
import chaptersConfig from '../game/config/chapters.json'
import equipmentConfig from '../game/config/equipment.json'

const router = useRouter()
const gameStore = useGameStore()

let game: Phaser.Game | null = null

const showGameComplete = ref(false)
// 阶段 3.4：加载过渡状态 + 返回确认状态
const isLoading = ref(true)
const showExitConfirm = ref(false)
// 步骤 2 v2：包裹面板 + 朝向指示器 + 全屏
const showBag = ref(false)
const currentEquipIndex = ref(0)
const currentDirection = ref<'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'N' | 'NE' | ''>('')
const isFullscreen = ref(false)
const equipmentList = equipmentConfig as any[]

// C.3 移动端检测 + 虚拟摇杆位置（左下角，距边缘 80px / 100px）
const isMobile = ref(false)
const joystickPos = ref({ x: 100, y: 0 })

const detectMobile = () => {
  // 综合判定：触屏 + UA + 视口宽度
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const isMobileUA = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent)
  const isSmallScreen = window.innerWidth <= 900
  isMobile.value = (hasTouch && (isMobileUA || isSmallScreen))
  // 摇杆 Y 坐标：距底部 100px
  joystickPos.value = { x: 100, y: window.innerHeight - 100 }
}

const onJoystickMove = (vec: { x: number; y: number }) => {
  // 派发到 Phaser 场景
  const scene = (window as any).__phaserScene
  if (scene) {
    scene.events.emit('mobile-joystick-move', vec)
  }
}

const onJoystickStop = () => {
  const scene = (window as any).__phaserScene
  if (scene) {
    scene.events.emit('mobile-joystick-stop')
  }
}

// 步骤 2 v2：方向 → 旋转角度映射（北 = 0°，顺时针）
const directionAngles: Record<string, number> = {
  N: 0,
  NE: 45,
  E: 90,
  SE: 135,
  S: 180,
  SW: 225,
  W: 270,
  NW: 315
}

const isDirectionActive = (angle: number) => {
  if (!currentDirection.value) return false
  return directionAngles[currentDirection.value] === angle
}

// 步骤 10：章节 chip
const chapterName = computed(() => {
  const ch = gameStore.currentChapter || 0
  const chapter = (chaptersConfig as any[]).find(c => c.chapterId === ch)
  return chapter?.name || `第 ${ch} 章`
})

const chapterChipClass = computed(() => {
  const ch = gameStore.currentChapter || 0
  const classes: Record<number, string> = {
    0: 'bg-gray-100 text-gray-700',
    1: 'bg-blue-100 text-blue-700',
    2: 'bg-pink-100 text-pink-700',
    3: 'bg-amber-100 text-amber-700',
    4: 'bg-yellow-100 text-yellow-700'
  }
  return classes[ch] || classes[0]
})

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
  // 阶段 3.4：800ms 后隐藏加载蒙层（等待 Phaser 首帧渲染）
  setTimeout(() => {
    isLoading.value = false
  }, 800)

  // C.3 移动端检测 + 窗口尺寸监听
  detectMobile()
  window.addEventListener('resize', detectMobile)

  window.addEventListener('game-complete', handleGameComplete as EventListener)
  // GDD §6.5 监听终章通关跳转事件
  window.addEventListener('navigate-ending', handleNavigateEnding as EventListener)
  // V 序章完成 → 推进到第一章
  window.addEventListener('prologue-complete', handlePrologueComplete as EventListener)
  // Y 战斗结算页 3 按钮导航
  window.addEventListener('navigate-home', handleNavigateHome as EventListener)
  window.addEventListener('navigate-inventory', handleNavigateInventory as EventListener)
  // 步骤 2 v2：监听 Phaser 朝向变化事件
  window.addEventListener('player-direction-change', handleDirectionChange as EventListener)
  // 步骤 2 v2：B 键切换包裹
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  game?.destroy(true)
  // C.3 清理 resize 监听 + 暴露的 phaserScene 引用
  window.removeEventListener('resize', detectMobile)
  ;(window as any).__phaserScene = undefined
  window.removeEventListener('game-complete', handleGameComplete as EventListener)
  window.removeEventListener('navigate-ending', handleNavigateEnding as EventListener)
  window.removeEventListener('prologue-complete', handlePrologueComplete as EventListener)
  window.removeEventListener('navigate-home', handleNavigateHome as EventListener)
  window.removeEventListener('navigate-inventory', handleNavigateInventory as EventListener)
  window.removeEventListener('player-direction-change', handleDirectionChange as EventListener)
  window.removeEventListener('keydown', handleKeydown)
  // 步骤 2 v2：退出全屏
  if (isFullscreen.value && document.fullscreenElement) {
    document.exitFullscreen().catch(() => {})
  }
})

const handleGameComplete = () => {
  showGameComplete.value = true
}

// GDD §6.5 终章通关跳转 /ending 结算页面
const handleNavigateEnding = () => {
  showGameComplete.value = false
  router.push('/ending')
}

// V 序章完成：推进到第一章并重启场景
const handlePrologueComplete = () => {
  gameStore.clearChapter(0)
  // 重启 Phaser 场景以加载第一章节点
  const scene = (window as any).__phaserScene
  if (scene) {
    scene.scene.restart()
  }
}

// Y 战斗结算页：返回主页
const handleNavigateHome = () => {
  router.push('/home')
}

// Y 战斗结算页：查看背包
const handleNavigateInventory = () => {
  router.push('/inventory')
}

// 步骤 2 v2：朝向变化处理
const handleDirectionChange = (e: Event) => {
  const detail = (e as CustomEvent).detail
  if (detail) {
    currentDirection.value = detail
  }
}

// 步骤 2 v2：B 键切换包裹面板
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'b' || e.key === 'B') {
    // 避免在输入框中触发
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
    showBag.value = !showBag.value
  }
}

// 步骤 2 v2：选择法杖，派发 staff-switch 事件给 Phaser
const selectStaff = (idx: number) => {
  if (idx < 0 || idx >= equipmentList.length) return
  currentEquipIndex.value = idx
  window.dispatchEvent(
    new CustomEvent('staff-switch', { detail: { equipIndex: idx } })
  )
}

// 步骤 2 v2：全屏切换
const toggleFullscreen = () => {
  const el = document.documentElement
  if (!document.fullscreenElement) {
    el.requestFullscreen().then(() => {
      isFullscreen.value = true
    }).catch(() => {
      // 全屏被拒绝，忽略
    })
  } else {
    document.exitFullscreen().then(() => {
      isFullscreen.value = false
    }).catch(() => {})
  }
}

const toggleForm = () => {
  gameStore.switchForm()
}

const goHome = () => {
  // 阶段 3.4：通关 Modal 关闭时直接返回
  if (showGameComplete.value) {
    showGameComplete.value = false
    router.push('/home')
    return
  }
  // 普通返回：弹出确认
  showExitConfirm.value = true
}

// 阶段 3.4：确认返回
const confirmGoHome = () => {
  showExitConfirm.value = false
  router.push('/home')
}
</script>

<style scoped>
/* 步骤 2 v2：包裹面板滑入动效 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

/* 阶段 3.4：加载蒙层淡出 */
.fade-out-leave-active {
  transition: opacity 0.4s ease;
}
.fade-out-leave-to {
  opacity: 0;
}

/* 阶段 3.4：Modal 淡入 */
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
