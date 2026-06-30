<template>
  <div class="page-container">
    <div class="max-w-2xl mx-auto">
      <router-link to="/plaza" class="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <span>←</span> 返回广场
      </router-link>

      <div class="text-center mb-10 animate-fade-in-up">
        <h2 class="text-3xl font-black text-white mb-2">🐱 创建角色</h2>
        <p class="text-gray-400">选择你的猫猫冒险者</p>
      </div>

      <!-- 猫咪模板选择 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div
          v-for="template in templates"
          :key="template.id"
          class="game-card p-6 cursor-pointer animate-fade-in-scale"
          :class="selectedTemplate?.id === template.id ? 'game-card-glow-blue ring-2 ring-blue-500/50' : ''"
          :style="{ animationDelay: (template.id * 0.1) + 's' }"
          @click="selectedTemplate = template"
        >
          <div class="flex items-center gap-4 mb-3">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-3xl">
              🐱
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">{{ template.name }}</h3>
              <p class="text-gray-500 text-sm">{{ template.cat_type }}</p>
            </div>
          </div>
          <p class="text-gray-400 text-sm mb-3">{{ template.personality }}</p>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="px-3 py-1.5 rounded-lg bg-white/5">
              <span class="text-gray-500">HP</span>
              <span class="text-green-400 ml-1 font-bold">{{ template.base_hp }}</span>
            </div>
            <div class="px-3 py-1.5 rounded-lg bg-white/5">
              <span class="text-gray-500">ATK</span>
              <span class="text-red-400 ml-1 font-bold">{{ template.base_attack }}</span>
            </div>
            <div class="px-3 py-1.5 rounded-lg bg-white/5">
              <span class="text-gray-500">DEF</span>
              <span class="text-blue-400 ml-1 font-bold">{{ template.base_defense }}</span>
            </div>
            <div class="px-3 py-1.5 rounded-lg bg-white/5">
              <span class="text-gray-500">INT</span>
              <span class="text-purple-400 ml-1 font-bold">{{ template.base_intelligence }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 角色名称 -->
      <div class="game-card p-6 mb-8 animate-fade-in-up">
        <label class="game-label">🎯 角色名称</label>
        <input v-model="characterName" class="game-input" placeholder="给你的猫猫起个名字" />
      </div>

      <!-- 职业选择 -->
      <div class="game-card p-6 mb-8 animate-fade-in-up" style="animation-delay: 0.2s">
        <label class="game-label">⚔️ 选择职业</label>
        <div class="grid grid-cols-2 gap-3 mt-3">
          <div
            v-for="profession in professions"
            :key="profession.id"
            class="p-4 rounded-xl cursor-pointer transition-all border"
            :class="selectedProfession?.id === profession.id ? 'bg-blue-500/10 border-blue-500/50' : 'bg-white/5 border-white/5 hover:border-white/20'"
            @click="selectedProfession = profession"
          >
            <h4 class="text-white font-bold">{{ profession.name }}</h4>
            <p class="text-gray-400 text-xs mt-1">{{ profession.description }}</p>
            <p class="text-blue-400 text-xs mt-1">{{ profession.skill_bonus }}</p>
          </div>
        </div>
      </div>

      <div v-if="error" class="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mb-6">
        <span>⚠️</span>
        <span>{{ error }}</span>
      </div>

      <div class="text-center">
        <button
          class="game-btn game-btn-gold px-12 py-4 text-lg"
          :disabled="!selectedTemplate || !characterName || !selectedProfession || loading"
          @click="createCharacter"
        >
          <template v-if="loading">
            <span class="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
            创建中...
          </template>
          <template v-else>
            ✨ 创建角色，开始冒险！
          </template>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { characterApi } from '@/api/character'

const router = useRouter()
const templates = ref([])
const professions = ref([])
const selectedTemplate = ref(null)
const selectedProfession = ref(null)
const characterName = ref('')
const loading = ref(false)
const error = ref('')

async function createCharacter() {
  error.value = ''
  loading.value = true
  try {
    await characterApi.createCharacter({
      name: characterName.value,
      template_id: selectedTemplate.value.id,
      profession_id: selectedProfession.value.id
    })
    router.push('/plaza')
  } catch (e) {
    error.value = e.response?.data?.error || '创建角色失败'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const [tRes, pRes] = await Promise.all([
      characterApi.listTemplates(),
      characterApi.listProfessions()
    ])
    templates.value = tRes
    professions.value = pRes
  } catch (e) {
    console.error('Failed to load:', e)
  }
})
</script>