<template>
  <div class="page-container flex items-center justify-center">
    <div class="w-full max-w-md">
      <div class="text-center mb-8 animate-fade-in-up">
        <router-link to="/login" class="inline-block">
          <h1 class="game-title text-4xl">学术喵的奇幻之旅</h1>
        </router-link>
        <p class="game-subtitle mt-3">🔐 重置密码</p>
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
          <h2 class="text-2xl font-bold text-center mb-8 text-white">🔐 重置密码</h2>

          <div v-if="!success">
            <form @submit.prevent="handleResetPassword" class="space-y-5">
              <div>
                <label class="game-label">重置令牌</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                    </svg>
                  </span>
                  <input v-model="form.resetToken" type="text" class="game-input pl-10" placeholder="请输入重置令牌" required />
                </div>
              </div>
              <div>
                <label class="game-label">新密码</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                  </span>
                  <input v-model="form.newPassword" type="password" class="game-input pl-10" placeholder="至少8位" required />
                </div>
              </div>
              <div>
                <label class="game-label">确认新密码</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                  </span>
                  <input v-model="form.confirmPassword" type="password" class="game-input pl-10" placeholder="请再次输入" required />
                </div>
              </div>

              <div v-if="error" class="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <span>⚠️</span>
                <span>{{ error }}</span>
              </div>

              <button type="submit" class="game-btn game-btn-purple w-full" :disabled="loading">
                <template v-if="loading">
                  <span class="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                  重置中...
                </template>
                <template v-else>
                  🔐 重置密码
                </template>
              </button>
            </form>
          </div>

          <!-- 成功提示 -->
          <div v-else class="space-y-5">
            <div class="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
              <p class="text-lg mb-2">✅ 密码已重置成功！</p>
              <p>请使用新密码登录</p>
            </div>
            <router-link to="/login" class="game-btn game-btn-primary w-full block text-center">
              🎮 前往登录
            </router-link>
          </div>

          <hr class="decorative-line my-6" />

          <p class="text-center text-gray-400 text-sm">
            <router-link to="/forgot-password" class="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              🔑 重新获取令牌
            </router-link>
            <span class="mx-2">|</span>
            <router-link to="/login" class="text-gray-400 hover:text-white transition-colors">
              返回登录
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
const form = reactive({ resetToken: '', newPassword: '', confirmPassword: '' })
const loading = ref(false)
const error = ref('')
const success = ref(false)

async function handleResetPassword() {
  error.value = ''
  if (form.newPassword !== form.confirmPassword) {
    error.value = '两次输入的密码不一致'
    return
  }
  loading.value = true
  try {
    await userStore.resetPassword(form.resetToken, form.newPassword)
    success.value = true
    form.resetToken = ''
    form.newPassword = ''
    form.confirmPassword = ''
  } catch (e) {
    error.value = e.response?.data?.error || '重置密码失败，请检查令牌是否正确'
  } finally {
    loading.value = false
  }
}
</script>