<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1A3C6E] to-[#4ECDC4]">
    <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
      <h1 class="text-3xl font-bold text-[#1A3C6E] mb-6 text-center">同舟喵济</h1>
      <p class="text-gray-600 text-center mb-8">创建新账号</p>
      
      <form @submit.prevent="handleRegister" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">昵称</label>
          <input
            v-model="nickname"
            type="text"
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A3C6E] focus:border-transparent"
            placeholder="你的昵称"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A3C6E] focus:border-transparent"
            placeholder="your@email.com"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">密码</label>
          <input
            v-model="password"
            type="password"
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A3C6E] focus:border-transparent"
            placeholder="••••••••"
          />
        </div>
        
        <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>
        
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-[#1A3C6E] text-white py-3 rounded-lg font-semibold hover:bg-[#15305a] disabled:opacity-50"
        >
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>
      
      <p class="text-center text-gray-600 mt-6">
        已有账号？
        <router-link to="/login" class="text-[#1A3C6E] font-semibold hover:underline">
          立即登录
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

const nickname = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleRegister = async () => {
  error.value = ''
  loading.value = true
  
  try {
    await userStore.register(email.value, password.value, nickname.value)
    router.push('/char-select')
  } catch (err: any) {
    error.value = err.response?.data?.detail?.message || '注册失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>
