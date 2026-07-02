import { ref, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '../stores/user'

export function useWebSocket() {
  const userStore = useUserStore()
  const isConnected = ref(false)
  const messages = ref<any[]>([])
  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null

  const connect = () => {
    if (!userStore.token) return

    const wsUrl = `ws://localhost:8000/ws/game?token=${userStore.token}`
    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      isConnected.value = true
      startHeartbeat()
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        messages.value.push(data)
        
        if (data.type === 'random_event') {
          window.dispatchEvent(new CustomEvent('ws-random-event', { detail: data.data }))
        } else if (data.type === 'reward') {
          window.dispatchEvent(new CustomEvent('ws-reward', { detail: data.data }))
        } else if (data.type === 'system') {
          window.dispatchEvent(new CustomEvent('ws-system', { detail: data.data }))
        }
      } catch (e) {
        console.error('WebSocket message parse error:', e)
      }
    }

    ws.onclose = () => {
      isConnected.value = false
      stopHeartbeat()
      scheduleReconnect()
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      ws?.close()
    }
  }

  const disconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    stopHeartbeat()
    if (ws) {
      ws.close()
      ws = null
    }
  }

  const startHeartbeat = () => {
    heartbeatTimer = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000)
  }

  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  const scheduleReconnect = () => {
    if (reconnectTimer) return
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      connect()
    }, 5000)
  }

  const send = (data: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data))
    }
  }

  onMounted(() => {
    connect()
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    isConnected,
    messages,
    send,
    connect,
    disconnect
  }
}
