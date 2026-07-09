<template>
  <div class="relative w-full max-w-4xl mx-auto mb-8 overflow-hidden rounded-2xl shadow-2xl border-4 border-white">
    <div class="relative aspect-[16/9] bg-gradient-to-br from-[#1A3C6E] via-[#4ECDC4] to-[#FFB7C5]">
      <TransitionGroup name="carousel-fade">
        <div
          v-for="(role, index) in displayRoles"
          :key="role.roleId"
          v-show="currentIndex === index"
          class="absolute inset-0 flex items-center justify-center"
        >
          <div class="relative flex items-center gap-8 p-8">
            <div class="flex-shrink-0">
              <div class="w-48 h-72 rounded-xl overflow-hidden border-4 border-white shadow-lg bg-black/20">
                <img
                  :src="`/assets/portraits/${role.roleId}.png`"
                  :alt="role.name"
                  class="w-full h-full object-cover"
                  @error="onImageError"
                >
              </div>
            </div>
            <div class="text-white text-center">
              <h2 class="text-4xl font-bold mb-2 text-shadow">{{ role.name }}</h2>
              <p class="text-xl opacity-90 mb-4">{{ role.title }}</p>
              <span
                class="inline-block px-4 py-2 rounded-full text-sm font-semibold text-white shadow-lg"
                :class="combatRoleBadgeClass(role.combatRole)"
              >
                {{ combatRoleLabel(role.combatRole) }}
              </span>
            </div>
          </div>
        </div>
      </TransitionGroup>

      <button
        @click="prev"
        class="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-all shadow-lg"
        aria-label="上一个角色"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        @click="next"
        class="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-all shadow-lg"
        aria-label="下一个角色"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        <button
          v-for="(role, index) in displayRoles"
          :key="role.roleId"
          @click="goTo(index)"
          :class="[
            'w-3 h-3 rounded-full transition-all',
            currentIndex === index ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'
          ]"
          :aria-label="`切换到 ${role.name}`"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import rolesConfig from '../game/config/roles.json'
import type { RoleId } from '../types/game'

interface RoleConfig {
  roleId: RoleId
  name: string
  title: string
  combatRole: string
}

const displayRoles = rolesConfig as RoleConfig[]
const currentIndex = ref(0)
let autoPlayTimer: ReturnType<typeof setInterval> | null = null

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

const next = () => {
  currentIndex.value = (currentIndex.value + 1) % displayRoles.length
}

const prev = () => {
  currentIndex.value = (currentIndex.value - 1 + displayRoles.length) % displayRoles.length
}

const goTo = (index: number) => {
  currentIndex.value = index
}

const onImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}

const startAutoPlay = () => {
  if (autoPlayTimer) clearInterval(autoPlayTimer)
  autoPlayTimer = setInterval(next, 4000)
}

const stopAutoPlay = () => {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer)
    autoPlayTimer = null
  }
}

onMounted(() => {
  startAutoPlay()
})

onUnmounted(() => {
  stopAutoPlay()
})

watch(currentIndex, () => {
  stopAutoPlay()
  startAutoPlay()
})
</script>

<style scoped>
.text-shadow {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.carousel-fade-enter-active,
.carousel-fade-leave-active {
  transition: opacity 0.4s ease;
}

.carousel-fade-enter-from,
.carousel-fade-leave-to {
  opacity: 0;
}
</style>
