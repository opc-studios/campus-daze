<template>
  <div class="login-page relative min-h-screen overflow-hidden">
    <!-- Phaser 背景层 -->
    <div id="login-phaser-bg" class="absolute inset-0 z-0"></div>

    <!-- Vue 表单前景层 -->
    <div class="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
      <!-- 左侧占位（让 Phaser 立绘在右侧可见） -->
      <div class="hidden lg:block lg:w-1/2"></div>

      <!-- 登录表单卡片 -->
      <div class="w-full max-w-md lg:mr-8">
        <div
          ref="loginCardRef"
          :class="['login-card bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 border-2 border-[#FFB7C5] game-card-neon', { 'shake': isShaking }]"
        >
          <div class="text-center mb-6">
            <div class="inline-block px-3 py-1 rounded-full bg-[#FFE5EC] text-[#1A3C6E] text-xs font-semibold mb-3 tracking-wider">
              冒险者通行证
            </div>
            <h2 class="text-2xl font-bold text-[#1A3C6E]">登录你的账号</h2>
          </div>

          <form @submit.prevent="handleLogin" class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <span>👤</span> 用户名
              </label>
              <input
                v-model="username"
                type="text"
                required
                autocomplete="username"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FFB7C5] focus:border-[#FFB7C5] transition-all bg-white/80"
                placeholder="输入用户名"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <span>🔒</span> 密码
              </label>
              <div class="relative">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  autocomplete="current-password"
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
            </div>

            <div class="flex items-center justify-between">
              <label class="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input
                  v-model="rememberMe"
                  type="checkbox"
                  class="w-4 h-4 rounded border-gray-300 text-[#FFB7C5] focus:ring-[#FFB7C5]"
                >
                <span>记住我</span>
              </label>
            </div>

            <div v-if="error" class="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              ⚠️ {{ error }}
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="login-btn relative overflow-hidden w-full py-3 rounded-lg font-bold text-white shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              @click="addRipple"
            >
              <span v-if="loading">登录中...</span>
              <span v-else>⚔️ 进入冒险</span>
            </button>
          </form>

          <p class="text-center text-gray-600 mt-6 text-sm">
            还没有账号？
            <router-link to="/register" class="text-[#1A3C6E] font-semibold hover:underline">
              立即注册
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import Phaser from 'phaser'
import { loginPhaserConfig } from '../game/login-config'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
// 记住我 + 密码可见性
const rememberMe = ref(localStorage.getItem('rememberedUsername') !== null)
const showPassword = ref(false)

// 步骤 5：动效状态
const loginCardRef = ref<HTMLElement | null>(null)
const isShaking = ref(false)

let game: Phaser.Game | null = null

// 步骤 5：按钮波纹动效
const addRipple = (event: MouseEvent) => {
  const button = event.currentTarget as HTMLButtonElement
  if (!button) return
  const rect = button.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const x = event.clientX - rect.left - size / 2
  const y = event.clientY - rect.top - size / 2
  const ripple = document.createElement('span')
  ripple.className = 'ripple-span'
  ripple.style.width = `${size}px`
  ripple.style.height = `${size}px`
  ripple.style.left = `${x}px`
  ripple.style.top = `${y}px`
  button.appendChild(ripple)
  setTimeout(() => ripple.remove(), 600)
}

onMounted(() => {
  // 用户主动访问 /login = 想重新登录，清理残留 token，确保进入干净的登录页
  if (userStore.token) {
    userStore.logout()
  }

  // 记住我：预填上次登录的用户名
  const remembered = localStorage.getItem('rememberedUsername')
  if (remembered) {
    username.value = remembered
  }

  // 启动 Phaser 登录背景
  const container = document.getElementById('login-phaser-bg')
  if (container && !game) {
    game = new Phaser.Game(loginPhaserConfig)
  }
})

onBeforeUnmount(() => {
  // 离开页面时销毁 Phaser 实例，释放资源
  if (game) {
    game.destroy(true)
    game = null
  }
})

const handleLogin = async () => {
  error.value = ''
  loading.value = true

  try {
    await userStore.login(username.value, password.value)
    // 记住我：保存或清除用户名
    if (rememberMe.value) {
      localStorage.setItem('rememberedUsername', username.value)
    } else {
      localStorage.removeItem('rememberedUsername')
    }
    // redirect query 处理：路由守卫拦截后回跳目标
    const redirect = route.query.redirect as string
    router.push(redirect || '/home')
  } catch (err: any) {
    error.value = err.response?.data?.detail?.message || '登录失败，请检查用户名和密码'
    // 步骤 5：登录失败触发抖动
    isShaking.value = true
    nextTick(() => setTimeout(() => { isShaking.value = false }, 1000))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-card {
  animation: cardFadeIn 0.6s ease-out, cardBreath 3s ease-in-out infinite 0.6s;
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

/* 步骤 5：卡片呼吸动效 */
@keyframes cardBreath {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

/* 步骤 5：登录失败抖动 */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

.shake {
  animation: shake 0.4s ease-in-out !important;
}

/* 步骤 5：按钮波纹 */
@keyframes ripple {
  0% { transform: scale(0); opacity: 1; }
  100% { transform: scale(4); opacity: 0; }
}

.ripple-span {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  transform: scale(0);
  animation: ripple 0.6s linear;
  pointer-events: none;
}

.login-btn {
  background: linear-gradient(135deg, #1A3C6E 0%, #4ECDC4 100%);
  background-size: 200% 200%;
  animation: gradientShift 3s ease infinite;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(26, 60, 110, 0.4);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* 确保 Phaser canvas 填满背景（全局样式，避免 scoped 失效） */
:deep(#login-phaser-bg) {
  width: 100vw !important;
  height: 100vh !important;
}
:deep(#login-phaser-bg canvas) {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}
</style>
