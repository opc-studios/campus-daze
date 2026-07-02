<template>
  <div class="min-h-screen bg-gradient-to-br from-[#FAFAF5] to-[#FFB7C5] p-6 floating-particles">
    <div class="max-w-4xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-[#1A3C6E]">角色成长</h1>
        <button @click="$router.push('/home')" class="game-button">
          返回
        </button>
      </div>
      
      <div class="game-card-neon p-6 mb-6">
        <h2 class="text-xl font-bold text-[#1A3C6E] mb-4">角色属性</h2>
        <div class="stat-panel">
          <div class="stat-item">
            <span class="stat-label">角色名</span>
            <span class="stat-value">{{ gameStore.player?.name }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">等级</span>
            <span class="stat-value">Lv.{{ gameStore.player?.level }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">知识</span>
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
      
      <div class="game-card-neon p-6">
        <h2 class="text-xl font-bold text-[#1A3C6E] mb-4">技能装配</h2>
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div v-for="(skillId, index) in gameStore.player?.equippedSkills" :key="index"
            class="game-card-neon p-4 text-center"
            :class="index === 0 ? 'border-[#1A3C6E]' : ''"
          >
            <p class="text-xs text-gray-500 mb-1">格位 {{ index + 1 }}</p>
            <p class="font-bold text-[#1A3C6E]">{{ getSkillName(skillId) }}</p>
            <p v-if="index === 0" class="text-xs text-gray-400 mt-1">固定</p>
            <select
              v-else
              :value="skillId || ''"
              @change="equipSkill(index as 1 | 2, ($event.target as HTMLSelectElement).value)"
              class="mt-2 w-full text-sm border rounded px-2 py-1"
            >
              <option value="">空置</option>
              <option v-for="skill in availableSkills" :key="skill.skillId" :value="skill.skillId">
                {{ skill.name }}
              </option>
            </select>
          </div>
        </div>
        
        <h3 class="text-lg font-bold text-[#1A3C6E] mb-3">已解锁技能</h3>
        <div class="grid grid-cols-2 gap-3">
          <div v-for="skillId in gameStore.unlockedSkills" :key="skillId"
            class="game-card-neon p-3 flex justify-between items-center"
          >
            <div>
              <p class="font-semibold text-[#1A3C6E]">{{ getSkillName(skillId) }}</p>
              <p class="text-xs text-gray-500">{{ getSkillDesc(skillId) }}</p>
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
import skillsConfig from '../game/config/skills.json'

const gameStore = useGameStore()

const availableSkills = computed(() => {
  if (!gameStore.player) return []
  const roleId = gameStore.player.roleId
  return skillsConfig.filter(s =>
    s.roleId === roleId &&
    s.type === 'active' &&
    gameStore.unlockedSkills.includes(s.skillId)
  )
})

const getSkillName = (skillId: string | null) => {
  if (!skillId) return '空置'
  const skill = skillsConfig.find(s => s.skillId === skillId)
  return skill?.name || skillId
}

const getSkillDesc = (skillId: string) => {
  const skill = skillsConfig.find(s => s.skillId === skillId)
  if (!skill) return ''
  return `倍率: ${skill.multiplier}x | CD: ${skill.cooldown}`
}

const equipSkill = (slotIndex: 1 | 2, skillId: string) => {
  gameStore.equipSkill(slotIndex, skillId || null)
  gameStore.saveSave()
}
</script>
