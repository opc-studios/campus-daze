<template>
  <div class="register-page relative min-h-screen overflow-hidden">
    <!-- Phaser 背景层 -->
    <div id="register-phaser-bg" class="absolute inset-0 z-0"></div>

    <!-- Vue 表单前景层 -->
    <div class="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
      <div class="w-full max-w-md">
        <div
          :class="['register-card bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 border-2 border-[#FFB7C5] game-card-neon', { 'shake': isShaking }]"
        >
          <div class="text-center mb-6">
            <div class="inline-block px-3 py-1 rounded-full bg-[#FFE5EC] text-[#1A3C6E] text-xs font-semibold mb-3 tracking-wider">
              新冒险者登记
            </div>
            <h2 class="text-2xl font-bold text-[#1A3C6E]">创建新账号</h2>
          </div>

          <form @submit.prevent="handleRegister" class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <span>👤</span> 用户名 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="username"
                type="text"
                required
                autocomplete="username"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FFB7C5] focus:border-[#FFB7C5] transition-all bg-white/80"
                placeholder="登录用户名"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <span>🏷️</span> 昵称 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="nickname"
                type="text"
                required
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FFB7C5] focus:border-[#FFB7C5] transition-all bg-white/80"
                placeholder="游戏内显示名"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <span>🔒</span> 密码 <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  autocomplete="new-password"
                  class="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FFB7C5] focus:border-[#FFB7C5] transition-all bg-white/80"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1A3C6E] text-lg"
                  :title="showPassword ? '隐藏密码' : '显示密码'"
                >
                  {{ showPassword ? '🙈' : '👁' }}
                </button>
              </div>
              <!-- 密码强度指示器 -->
              <div v-if="password" class="mt-2">
                <div class="flex gap-1">
                  <div
                    v-for="i in 3"
                    :key="i"
                    class="h-1.5 flex-1 rounded-full transition-all"
                    :class="i <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200'"
                  ></div>
                </div>
                <p class="text-xs mt-1" :class="passwordStrength.textColor">
                  强度：{{ passwordStrength.label }}
                </p>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <span>🔐</span> 确认密码 <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  v-model="confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  required
                  autocomplete="new-password"
                  class="w-full px-4 py-3 pr-12 border-2 rounded-lg focus:ring-2 focus:ring-[#FFB7C5] focus:border-[#FFB7C5] transition-all bg-white/80"
                  :class="confirmPassword && confirmPassword !== password ? 'border-red-300' : 'border-gray-200'"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  @click="showConfirmPassword = !showConfirmPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1A3C6E] text-lg"
                  :title="showConfirmPassword ? '隐藏密码' : '显示密码'"
                >
                  {{ showConfirmPassword ? '🙈' : '👁' }}
                </button>
              </div>
              <p v-if="confirmPassword && confirmPassword !== password" class="text-xs text-red-500 mt-1">
                ⚠ 两次输入的密码不一致
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <span>📧</span> 邮箱（可选）
              </label>
              <input
                v-model="email"
                type="email"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FFB7C5] focus:border-[#FFB7C5] transition-all bg-white/80"
                placeholder="your@email.com"
              />
            </div>

            <div v-if="error" class="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              ⚠️ {{ error }}
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="register-btn w-full py-3 rounded-lg font-bold text-white shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span v-if="loading">注册中...</span>
              <span v-else>📝 加入冒险</span>
            </button>
          </form>

          <p class="text-center text-gray-600 mt-6 text-sm">
            已有账号？
            <router-link to="/login" class="text-[#1A3C6E] font-semibold hover:underline">
              立即登录
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import Phaser from 'phaser'
import { registerPhaserConfig } from '../game/register-config'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const nickname = ref('')
const password = ref('')
const confirmPassword = ref('')
const email = ref('')
const error = ref('')
const loading = ref(false)
// 密码可见性 + shake 动画
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isShaking = ref(false)

let game: Phaser.Game | null = null

// 密码强度计算
const passwordStrength = computed(() => {
  const pwd = password.value
  if (!pwd) return { score: 0, label: '无', color: 'bg-gray-200', textColor: 'text-gray-500' }

  let score = 0
  if (pwd.length >= 6) score++
  if (pwd.length >= 10) score++
  const hasNumber = /\d/.test(pwd)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(pwd)
  if (hasNumber && hasSpecial) score++
  if (pwd.length >= 14 && hasNumber && hasSpecial) score = 3

  if (score <= 1) return { score: 1, label: '弱', color: 'bg-red-500', textColor: 'text-red-600' }
  if (score === 2) return { score: 2, label: '中', color: 'bg-yellow-500', textColor: 'text-yellow-600' }
  return { score: 3, label: '强', color: 'bg-green-500', textColor: 'text-green-600' }
})

onMounted(() => {
  const container = document.getElementById('register-phaser-bg')
  if (container && !game) {
    game = new Phaser.Game(registerPhaserConfig)
  }
})

onBeforeUnmount(() => {
  if (game) {
    game.destroy(true)
    game = null
  }
})

const handleRegister = async () => {
  error.value = ''

  // 前端校验：确认密码
  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    triggerShake()
    return
  }

  // 前端校验：密码长度
  if (password.value.length < 6) {
    error.value = '密码长度至少 6 位'
    triggerShake()
    return
  }

  loading.value = true

  try {
    await userStore.register(
      username.value,
      password.value,
      nickname.value,
      email.value || undefined
    )
    router.push('/char-select')
  } catch (err: any) {
    error.value = err.response?.data?.detail?.message || '注册失败，请重试'
    triggerShake()
  } finally {
    loading.value = false
  }
}

const triggerShake = () => {
  isShaking.value = true
  nextTick(() => setTimeout(() => { isShaking.value = false }, 1000))
}
</script>

<style scoped>
.register-card {
  animation: cardFadeIn 0.6s ease-out;
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 注册失败抖动 */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

.shake {
  animation: shake 0.4s ease-in-out !important;
}

.register-btn {
  background: linear-gradient(135deg, #1A3C6E 0%, #4ECDC4 100%);
  background-size: 200% 200%;
  animation: gradientShift 3s ease infinite;
}

.register-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(26, 60, 110, 0.4);
}

.register-btn:active:not(:disabled) {
  transform: translateY(0);
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* 确保 Phaser canvas 填满背景 */
:deep(#register-phaser-bg) {
  width: 100vw !important;
  height: 100vh !important;
}
:deep(#register-phaser-bg canvas) {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}
</style>
