<template>
  <div class="min-h-screen bg-gradient-to-br from-[#FAFAF5] to-[#FFB7C5] p-8">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-4xl font-bold text-[#1A3C6E] mb-4 text-center">选择你的角色</h1>
      <p class="text-gray-600 text-center mb-12">选定后不可更换，请慎重选择</p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div
          v-for="role in roles"
          :key="role.id"
          :class="[
            'bg-white rounded-lg shadow-lg p-6 cursor-pointer transition-all duration-200',
            selectedRole === role.id ? 'ring-4 ring-[#1A3C6E] scale-105' : 'hover:scale-102'
          ]"
          @click="selectRole(role.id)"
        >
          <div class="text-center mb-4">
            <div class="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#1A3C6E] to-[#4ECDC4] flex items-center justify-center text-white text-4xl">
              {{ role.icon }}
            </div>
            <h3 class="text-2xl font-bold text-[#1A3C6E] mb-2">{{ role.name }}</h3>
            <p class="text-sm text-gray-500">{{ role.title }}</p>
          </div>
          
          <div class="mb-4">
            <p class="text-sm text-gray-600 mb-2">{{ role.description }}</p>
            <div class="text-xs text-gray-500">
              <span class="font-semibold">战斗定位：</span>{{ role.combatRole }}
            </div>
          </div>
          
          <div class="border-t pt-4">
            <div class="text-xs text-gray-500 mb-2">代表台词</div>
            <p class="text-sm italic text-[#1A3C6E]">"{{ role.quote }}"</p>
          </div>
        </div>
      </div>
      
      <div class="text-center">
        <button
          @click="confirmSelection"
          :disabled="!selectedRole"
          class="px-12 py-4 bg-[#1A3C6E] text-white rounded-lg font-semibold text-lg hover:bg-[#15305a] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          确认选择
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import type { RoleId } from '../types/game'

const router = useRouter()
const gameStore = useGameStore()

const selectedRole = ref<RoleId | null>(null)

const roles = [
  {
    id: 'lina' as RoleId,
    name: '莉娜',
    title: '学风精灵',
    icon: '📚',
    description: '温柔而坚定的学术新星，擅长召唤精灵协战',
    combatRole: '召唤流',
    quote: '知识是最强大的魔法'
  },
  {
    id: 'ayu' as RoleId,
    name: '阿宇',
    title: '愈战愈勇',
    icon: '⚔️',
    description: '热血少年，越战越勇，连击伤害递增',
    combatRole: '连击流',
    quote: '战斗让我更强大'
  },
  {
    id: 'zhixia' as RoleId,
    name: '知夏',
    title: '学术专注',
    icon: '🎯',
    description: '冷静理性，暴击率极高，一击必杀',
    combatRole: '暴击流',
    quote: '专注是成功的钥匙'
  },
  {
    id: 'jiangxun' as RoleId,
    name: '江寻',
    title: '穿透打击',
    icon: '💎',
    description: '敏捷刺客，对高防敌人造成额外伤害',
    combatRole: '穿透流',
    quote: '没有我突破不了的防御'
  },
  {
    id: 'laodeng' as RoleId,
    name: '老登',
    title: '混凝土反震',
    icon: '🛡️',
    description: '坚韧坦克，反弹伤害，越打越硬',
    combatRole: '反震流',
    quote: '来吧，让我看看你的实力'
  }
]

const selectRole = (roleId: RoleId) => {
  selectedRole.value = roleId
}

const confirmSelection = async () => {
  if (!selectedRole.value) return
  
  try {
    await gameStore.initSave(selectedRole.value)
    router.push('/home')
  } catch (err) {
    console.error('Failed to initialize save:', err)
  }
}
</script>
