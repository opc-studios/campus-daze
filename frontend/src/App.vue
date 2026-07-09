<template>
  <div id="app">
    <router-view />
    <RewardNotification />
    <GameNotification />
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue'
import { useWebSocket } from './composables/useWebSocket'
import { useUserStore } from './stores/user'
import RewardNotification from './components/RewardNotification.vue'
import GameNotification from './components/GameNotification.vue'

const userStore = useUserStore()
const { isConnected, messages, connect, disconnect } = useWebSocket()

// 监听 WebSocket 消息
watch(messages, (newMessages) => {
  if (newMessages.length === 0) return
  
  const latest = newMessages[newMessages.length - 1]
  
  if (latest?.type === 'random_event') {
    // 派发自定义事件，由 EventModal 组件监听
    window.dispatchEvent(new CustomEvent('ws-random-event', { detail: latest.data }))
  } else if (latest?.type === 'reward') {
    // 派发自定义事件，由 RewardNotification 组件监听
    window.dispatchEvent(new CustomEvent('ws-reward', { detail: latest.data }))
  } else if (latest?.type === 'system') {
    // 派发自定义事件，可由全局通知组件监听
    window.dispatchEvent(new CustomEvent('ws-system', { detail: latest.data }))
  }
}, { deep: true })

// 监听用户登录状态，自动连接/断开 WebSocket
watch(() => userStore.token, (newToken) => {
  if (newToken && !isConnected.value) {
    connect()
  } else if (!newToken && isConnected.value) {
    disconnect()
  }
}, { immediate: true })

onMounted(() => {
  // 如果已登录，自动连接 WebSocket
  if (userStore.token) {
    connect()
  }
})

onUnmounted(() => {
  disconnect()
})
</script>

<style>
#app {
  width: 100%;
  height: 100vh;
}
</style>
