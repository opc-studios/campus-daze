<template>
  <div class="page-container flex items-center justify-center">
    <div class="w-full max-w-md">
      <!-- 游戏标题 -->
      <div class="text-center mb-10 animate-fade-in-up">
        <div class="inline-block relative">
          <div class="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-xl animate-pulse"></div>
          <h1 class="game-title relative text-5xl">
            学术喵的奇幻之旅
          </h1>
        </div>
        <p class="game-subtitle mt-4 text-base">🐱 猫猫校园冒险 RPG</p>
      </div>

      <!-- 登录卡片 -->
      <div class="game-card game-card-neon p-8 animate-fade-in-scale relative overflow-hidden" style="animation-delay: 0.2s">
        <div class="decorative-corner decorative-corner-tl"></div>
        <div class="decorative-corner decorative-corner-tr"></div>
        <div class="decorative-corner decorative-corner-bl"></div>
        <div class="decorative-corner decorative-corner-br"></div>
        <div class="floating-particles">
          <span class="particle"></span><span class="particle"></span><span class="particle"></span><span class="particle"></span>
        </div>

        <div class="relative z-10">
        <h2 class="text-2xl font-bold text-center mb-8 text-white">
          ⚔️ 冒险开始
        </h2>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="game-label">用户名</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </span>
              <input
                v-model="form.username"
                type="text"
                class="game-input pl-10"
                placeholder="请输入用户名"
                required
              />
            </div>
          </div>
          <div>
            <label class="game-label">密码</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </span>
              <input
                v-model="form.password"
                type="password"
                class="game-input pl-10"
                placeholder="请输入密码"
                required
              />
            </div>
          </div>

          <div class="flex justify-end">
            <router-link to="/forgot-password" class="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              忘记密码？
            </router-link>
          </div>

          <div v-if="error" class="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <span>⚠️</span>
            <span>{{ error }}</span>
          </div>

          <button
            type="submit"
            class="game-btn game-btn-primary w-full"
            :disabled="loading"
          >
            <template v-if="loading">
              <span class="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
              加载中...
            </template>
            <template v-else>
              🎮 开始游戏
            </template>
          </button>
        </form>

        <hr class="decorative-line my-6" />

        <p class="text-center text-gray-400 text-sm">
          还没有账号？
          <router-link to="/register" class="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
            立即注册
          </router-link>
        </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const form = reactive({
  username: '',
  password: ''
})

const loading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await userStore.login(form.username, form.password)
    router.push('/plaza')
  } catch (e) {
    error.value = e.response?.data?.detail || e.response?.data?.error || '登录失败，请检查账号密码'
  } finally {
    loading.value = false
  }
}
</script>