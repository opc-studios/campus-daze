<template>
  <div class="min-h-screen bg-gradient-to-br from-[#FAFAF5] to-[#FFB7C5] p-8">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-4xl font-bold text-[#1A3C6E] mb-4 text-center">选择你的角色</h1>
      <p class="text-gray-600 text-center mb-12">选定后不可更换，请慎重选择</p>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div
          v-for="(role, index) in roles"
          :key="role.roleId"
          class="card-enter"
          :style="{ animationDelay: (index * 0.08) + 's' }"
          :class="[
            'bg-white rounded-lg shadow-lg p-6 cursor-pointer transition-all duration-200',
            selectedRole === role.roleId ? 'ring-4 ring-[#1A3C6E] scale-105' : 'hover:scale-102'
          ]"
          @click="openDetail(role)"
        >
          <div class="text-center mb-4">
            <div class="w-32 h-32 mx-auto mb-4 rounded-lg overflow-hidden border-4 border-[#FFB7C5] shadow-md bg-gradient-to-br from-[#FFE5EC] to-[#FFB7C5]">
              <img
                :src="`/assets/characters/${role.roleId}.png`"
                :alt="role.name"
                class="w-full h-full object-cover"
                @error="onPortraitError"
              >
            </div>
            <h3 class="text-2xl font-bold text-[#1A3C6E] mb-2">{{ role.name }}</h3>
            <p class="text-sm text-gray-500">{{ role.title }}</p>
            <!-- 步骤 3：战斗定位徽章 chip -->
            <div class="mt-2">
              <span
                class="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm"
                :class="combatRoleBadgeClass(role.combatRole)"
              >
                {{ combatRoleLabel(role.combatRole) }}
              </span>
            </div>
          </div>

          <div class="mb-4">
            <p class="text-sm text-gray-600 mb-2">{{ role.description }}</p>
            <div class="text-xs text-gray-500">
              <span class="font-semibold">主属性：</span>{{ attrLabel(role.mainAttr) }}
            </div>
          </div>

          <div class="border-t pt-4">
            <div class="text-xs text-gray-500 mb-2">代表台词</div>
            <p class="text-sm italic text-[#1A3C6E]">"{{ role.quote }}"</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 步骤 3：双形态预览 Modal -->
    <transition name="modal-fade">
      <div
        v-if="detailRole"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        @click.self="closeDetail"
      >
        <div class="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden grid grid-cols-1 md:grid-cols-2 modal-content">
        <!-- 左侧：立绘 + 双形态切换 -->
        <div class="bg-gradient-to-br from-[#FFE5EC] to-[#FFB7C5] p-6 flex flex-col items-center justify-center">
          <img
            :key="detailForm + detailRole.roleId"
            :src="detailForm === 'human'
              ? `/assets/characters/${detailRole.roleId}.png`
              : `/assets/sprites/${detailRole.roleId}.png`"
            :alt="detailRole.name"
            class="detail-portrait w-64 h-64 object-cover rounded-lg border-4 border-white shadow-lg mb-4"
            @error="onPortraitError"
          >
          <div class="flex gap-2">
            <button
              @click="detailForm = 'human'"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-semibold transition',
                detailForm === 'human'
                  ? 'bg-[#1A3C6E] text-white shadow-md'
                  : 'bg-white/80 text-[#1A3C6E]'
              ]"
            >
              👤 人形
            </button>
            <button
              @click="detailForm = 'cat'"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-semibold transition',
                detailForm === 'cat'
                  ? 'bg-[#1A3C6E] text-white shadow-md'
                  : 'bg-white/80 text-[#1A3C6E]'
              ]"
            >
              🐱 猫形
            </button>
          </div>
        </div>

        <!-- 右侧：属性 + combatRole 描述 + 确认按钮 -->
        <div class="p-6 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-2xl font-bold text-[#1A3C6E]">{{ detailRole.name }}</h2>
              <p class="text-sm text-gray-500">{{ detailRole.title }}</p>
            </div>
            <span
              class="px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm"
              :class="combatRoleBadgeClass(detailRole.combatRole)"
            >
              {{ combatRoleLabel(detailRole.combatRole) }}
            </span>
          </div>

          <p class="text-sm text-gray-600 mb-4">{{ detailRole.description }}</p>

          <div class="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 class="text-sm font-bold text-[#1A3C6E] mb-2">基础属性</h3>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div>学识：{{ detailRole.baseAttrs.knowledge }}</div>
              <div>实践：{{ detailRole.baseAttrs.practice }}</div>
              <div>洞察：{{ detailRole.baseAttrs.insight }}</div>
              <div>韧性：{{ detailRole.baseAttrs.resilience }}</div>
            </div>
          </div>

          <div class="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 class="text-sm font-bold text-[#1A3C6E] mb-2">战斗属性</h3>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div>暴击率：{{ (detailRole.combatStats.critRate * 100).toFixed(1) }}%</div>
              <div>暴击伤害：{{ (detailRole.combatStats.critDamage * 100).toFixed(0) }}%</div>
              <div>闪避率：{{ (detailRole.combatStats.evasionRate * 100).toFixed(1) }}%</div>
              <div>命中率：{{ (detailRole.combatStats.accuracyRate * 100).toFixed(1) }}%</div>
            </div>
          </div>

          <p class="text-sm italic text-[#1A3C6E] mb-4">"{{ detailRole.quote }}"</p>

          <!-- 步骤 4 v2：战斗定位详细描述 -->
          <div class="bg-purple-50 border-l-4 border-purple-400 rounded-r-lg p-3 mb-3">
            <h3 class="text-xs font-bold text-purple-700 mb-1">⚔ 战斗定位</h3>
            <p class="text-xs text-gray-700 leading-relaxed">{{ detailRole.combat }}</p>
          </div>

          <!-- 步骤 4 v2：武器描述 -->
          <div class="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-3 mb-3">
            <h3 class="text-xs font-bold text-amber-700 mb-1">🗡 武器</h3>
            <p class="text-xs text-gray-700 leading-relaxed">{{ detailRole.weapon }}</p>
          </div>

          <!-- 步骤 4 v2：猫形态描述 -->
          <div class="bg-pink-50 border-l-4 border-pink-400 rounded-r-lg p-3 mb-4">
            <h3 class="text-xs font-bold text-pink-700 mb-1">🐱 猫形态</h3>
            <p class="text-xs text-gray-700 leading-relaxed">{{ detailRole.cat }}</p>
          </div>

          <!-- 步骤 4 v2：8 动作按钮（参考素材站 action-button） -->
          <div class="bg-gray-50 rounded-lg p-3 mb-4">
            <h3 class="text-xs font-bold text-[#1A3C6E] mb-2">🎮 8 动作帧预览</h3>
            <div class="grid grid-cols-4 gap-1.5 mb-2">
              <button
                v-for="action in actionsList"
                :key="action.id"
                @click="previewAction(action.id)"
                :class="[
                  'px-2 py-1.5 rounded text-[10px] font-semibold transition',
                  activeActionId === action.id
                    ? 'bg-[#1A3C6E] text-white shadow-md'
                    : 'bg-white text-[#1A3C6E] hover:bg-blue-50'
                ]"
                :title="action.hint"
              >
                {{ action.label }}
              </button>
            </div>
            <p v-if="activeActionDescription" class="text-[10px] text-gray-600 leading-relaxed">
              <span class="font-semibold">{{ activeActionLabel }}：</span>{{ activeActionDescription }}
            </p>
            <p v-else class="text-[10px] text-gray-400">点击任一动作按钮查看说明</p>
          </div>

          <div class="flex gap-2 mt-auto">
            <button
              @click="closeDetail"
              class="flex-1 px-4 py-3 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              返回
            </button>
            <button
              @click="confirmRole"
              :disabled="isConfirming"
              class="flex-1 px-4 py-3 rounded-lg font-semibold bg-[#1A3C6E] text-white hover:bg-[#15305a] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span v-if="isConfirming">创建中...</span>
              <span v-else>确认选择</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import rolesConfig from '../game/config/roles.json'
import actionsConfig from '../game/config/actions.json'
import type { RoleId } from '../types/game'

const router = useRouter()
const gameStore = useGameStore()

const selectedRole = ref<RoleId | null>(null)
// 步骤 3：双形态预览 Modal 状态
const detailRole = ref<RoleConfig | null>(null)
const detailForm = ref<'human' | 'cat'>('human')
// 步骤 4 v2：8 动作按钮状态
const activeActionId = ref<string>('')
// 确认按钮 loading 状态
const isConfirming = ref(false)

interface RoleConfig {
  roleId: RoleId
  name: string
  title: string
  combatRole: string
  mainAttr: string
  baseAttrs: { knowledge: number; practice: number; insight: number; resilience: number }
  combatStats: { critRate: number; critDamage: number; evasionRate: number; accuracyRate: number }
  description: string
  quote: string
  // 步骤 4 v2：扩展字段
  combat: string
  weapon: string
  cat: string
  actionGuide: string
}

interface ActionDef {
  id: string
  label: string
  hint: string
  row: number
  fps: number
  repeat: number
  frames: number[]
}

const roles = rolesConfig as RoleConfig[]
const actionsList = actionsConfig as ActionDef[]

// 步骤 4 v2：当前选中动作的描述（基于角色 actionGuide 解析）
const activeActionDescription = computed(() => {
  if (!activeActionId.value || !detailRole.value) return ''
  const action = actionsList.find(a => a.id === activeActionId.value)
  if (!action) return ''
  // 从 actionGuide 解析该动作的描述（格式："idle 站立 / walk 行走 / ..."）
  const guideMap: Record<string, string> = {}
  detailRole.value.actionGuide.split('/').forEach(pair => {
    const [id, ...rest] = pair.trim().split(/\s+/)
    if (id && rest.length > 0) {
      guideMap[id] = rest.join(' ')
    }
  })
  return guideMap[action.id] || action.hint || '该动作的描述暂无'
})

const activeActionLabel = computed(() => {
  if (!activeActionId.value) return ''
  const action = actionsList.find(a => a.id === activeActionId.value)
  return action?.label || activeActionId.value
})

// 步骤 4 v2：预览动作（仅高亮按钮 + 显示描述，实际动画在游戏中查看）
const previewAction = (actionId: string) => {
  activeActionId.value = actionId
}

const combatRoleLabel = (key: string): string => {
  const map: Record<string, string> = {
    summon_spirit: '召唤流',
    dps_strike: '连击流',
    dps_burst: '暴击流',
    dps_aoe: '穿透流',
    tank_heavy: '反震流'
  }
  return map[key] || key
}

// 步骤 3：5 战斗定位徽章颜色映射
const combatRoleBadgeClass = (key: string): string => {
  const map: Record<string, string> = {
    summon_spirit: 'bg-purple-500',
    dps_strike: 'bg-red-500',
    dps_burst: 'bg-orange-500',
    dps_aoe: 'bg-teal-500',
    tank_heavy: 'bg-blue-500'
  }
  return map[key] || 'bg-gray-500'
}

const attrLabel = (key: string): string => {
  const map: Record<string, string> = {
    knowledge: '学识',
    practice: '实践',
    insight: '洞察',
    resilience: '韧性'
  }
  return map[key] || key
}

const onPortraitError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}

// 步骤 3：点击卡片打开 Modal（不再直接 selectRole）
const openDetail = (role: RoleConfig) => {
  detailRole.value = role
  detailForm.value = 'human'
}

const closeDetail = () => {
  detailRole.value = null
}

// 步骤 3：确认选择
const confirmRole = async () => {
  if (!detailRole.value || isConfirming.value) return
  selectedRole.value = detailRole.value.roleId
  isConfirming.value = true
  try {
    await gameStore.initSave(detailRole.value.roleId)
    router.push('/home')
  } catch (err) {
    console.error('Failed to initialize save:', err)
    isConfirming.value = false
  }
}
</script>

<style scoped>
/* 步骤 3：立绘浮入动效 */
@keyframes floatIn {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.detail-portrait {
  animation: floatIn 0.5s ease-out;
}

/* 卡片错位入场 */
@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.card-enter {
  animation: cardEnter 0.4s ease-out backwards;
}

/* Modal 淡入淡出 */
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
