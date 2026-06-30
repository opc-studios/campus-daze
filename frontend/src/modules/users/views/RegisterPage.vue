<template>
  <div class="page-container flex items-center justify-center">
    <div class="w-full max-w-md">
      <div class="text-center mb-8 animate-fade-in-up">
        <router-link to="/" class="inline-block">
          <h1 class="game-title text-4xl">学术喵的奇幻之旅</h1>
        </router-link>
        <p class="game-subtitle mt-3">🐱 创建你的猫猫冒险者</p>
      </div>

      <div class="game-card game-card-neon p-8 animate-fade-in-scale relative overflow-hidden" style="animation-delay: 0.2s">
        <div class="decorative-corner decorative-corner-tl"></div>
        <div class="decorative-corner decorative-corner-tr"></div>
        <div class="decorative-corner decorative-corner-bl"></div>
        <div class="decorative-corner decorative-corner-br"></div>
        <div class="floating-particles">
          <span class="particle"></span><span class="particle"></span><span class="particle"></span>
        </div>

        <div class="relative z-10">
        <h2 class="text-2xl font-bold text-center mb-8 text-white">
          ✨ 注册账号
        </h2>

        <form @submit.prevent="handleRegister" class="space-y-5">
          <div>
            <label class="game-label">用户名</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </span>
              <input v-model="form.username" type="text" class="game-input pl-10" placeholder="请输入用户名" required />
            </div>
          </div>
          <div>
            <label class="game-label">邮箱 <span class="text-gray-500 text-xs">(选填)</span></label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </span>
              <input v-model="form.email" type="email" class="game-input pl-10" placeholder="example@campus.com (选填)" />
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
              <input v-model="form.password" type="password" class="game-input pl-10" placeholder="请输入密码（至少8位）" required />
            </div>
          </div>
          <div>
            <label class="game-label">确认密码</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </span>
              <input v-model="form.confirmPassword" type="password" class="game-input pl-10" placeholder="请再次输入密码" required />
            </div>
          </div>

          <div v-if="error" class="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <span>⚠️</span>
            <span>{{ error }}</span>
          </div>

          <button type="submit" class="game-btn game-btn-purple w-full" :disabled="loading">
            <template v-if="loading">
              <span class="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
              注册中...
            </template>
            <template v-else>
              🎮 创建冒险者
            </template>
          </button>
        </form>

        <hr class="decorative-line my-6" />

        <p class="text-center text-gray-400 text-sm">
          已有账号？
          <router-link to="/login" class="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
            立即登录
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
const form = reactive({ username: '', email: '', password: '', confirmPassword: '' })
const loading = ref(false)
const error = ref('')

async function handleRegister() {
  error.value = ''
  if (form.password !== form.confirmPassword) {
    error.value = '两次输入的密码不一致'
    return
  }
  loading.value = true
  try {
    await userStore.register(form.username, form.password, form.email || undefined)
    router.push('/login')
  } catch (e) {
    error.value = e.response?.data?.detail || e.response?.data?.error || '注册失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>