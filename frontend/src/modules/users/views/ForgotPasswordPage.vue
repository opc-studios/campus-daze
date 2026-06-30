<template>
  <div class="page-container flex items-center justify-center">
    <div class="w-full max-w-md">
      <div class="text-center mb-8 animate-fade-in-up">
        <router-link to="/login" class="inline-block">
          <h1 class="game-title text-4xl">学术喵的奇幻之旅</h1>
        </router-link>
        <p class="game-subtitle mt-3">🔑 找回密码</p>
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
          <h2 class="text-2xl font-bold text-center mb-8 text-white">🔐 找回密码</h2>

          <!-- Step 1: 输入用户名 -->
          <div v-if="!resetToken">
            <form @submit.prevent="handleForgotPassword" class="space-y-5">
              <div>
                <label class="game-label">用户名</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </span>
                  <input v-model="username" type="text" class="game-input pl-10" placeholder="请输入用户名" required />
                </div>
              </div>

              <div v-if="error" class="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <span>⚠️</span>
                <span>{{ error }}</span>
              </div>

              <button type="submit" class="game-btn game-btn-primary w-full" :disabled="loading">
                <template v-if="loading">
                  <span class="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                  获取中...
                </template>
                <template v-else>
                  🔑 获取重置令牌
                </template>
              </button>
            </form>
          </div>

          <!-- Step 2: 显示重置令牌 -->
          <div v-else class="space-y-5">
            <div class="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              <p class="mb-2">✅ 重置令牌已生成！请保存以下令牌，然后在重置密码页面使用：</p>
              <div class="bg-black/30 rounded p-3 font-mono text-sm text-yellow-300 break-all select-all">
                {{ resetToken }}
              </div>
              <p class="mt-2 text-xs text-gray-500">令牌有效期 24 小时，请尽快重置密码</p>
            </div>

            <router-link to="/reset-password" class="game-btn game-btn-purple w-full block text-center">
              🔐 前往重置密码
            </router-link>

            <button @click="resetToken = ''" class="game-btn game-btn-secondary w-full">
              🔄 重新获取
            </button>
          </div>

          <hr class="decorative-line my-6" />

          <p class="text-center text-gray-400 text-sm">
            想起了密码？
            <router-link to="/login" class="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              返回登录
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const username = ref('')
const resetToken = ref('')
const loading = ref(false)
const error = ref('')

async function handleForgotPassword() {
  error.value = ''
  loading.value = true
  try {
    const token = await userStore.forgotPassword(username.value)
    resetToken.value = token
  } catch (e) {
    error.value = e.response?.data?.error || '获取重置令牌失败，请检查用户名'
  } finally {
    loading.value = false
  }
}
</script>