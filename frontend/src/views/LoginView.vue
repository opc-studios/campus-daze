<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1A3C6E] to-[#4ECDC4] floating-particles">
    <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-md game-card-neon">
      <h1 class="text-3xl font-bold text-[#1A3C6E] mb-2 text-center">同舟喵济</h1>
      <p class="text-gray-600 text-center mb-8">登录你的账号</p>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">用户名</label>
          <input
            v-model="username"
            type="text"
            required
            autocomplete="username"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A3C6E] focus:border-transparent"
            placeholder="输入用户名"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">密码</label>
          <input
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A3C6E] focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>

        <button
          type="submit"
          :disabled="loading"
          class="game-button w-full"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <p class="text-center text-gray-600 mt-6">
        还没有账号？
        <router-link to="/register" class="text-[#1A3C6E] font-semibold hover:underline">
          立即注册
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  error.value = ''
  loading.value = true

  try {
    await userStore.login(username.value, password.value)
    router.push('/home')
  } catch (err: any) {
    error.value = err.response?.data?.detail?.message || '登录失败，请检查用户名和密码'
  } finally {
    loading.value = false
  }
}
</script>
