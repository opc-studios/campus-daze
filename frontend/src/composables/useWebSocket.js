import { ref, onUnmounted } from 'vue'

export function useWebSocket(url) {
  const ws = ref(null)
  const isConnected = ref(false)
  const lastMessage = ref(null)
  const error = ref(null)

  const connect = () => {
    const token = localStorage.getItem('accessToken')
    const wsUrl = `${url}?token=${token}`
    ws.value = new WebSocket(wsUrl)

    ws.value.onopen = () => {
      isConnected.value = true
      error.value = null
    }

    ws.value.onmessage = (event) => {
      try {
        lastMessage.value = JSON.parse(event.data)
      } catch (e) {
        lastMessage.value = event.data
      }
    }

    ws.value.onerror = (e) => {
      error.value = e
    }

    ws.value.onclose = () => {
      isConnected.value = false
    }
  }

  const send = (data) => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(data))
    }
  }

  const disconnect = () => {
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    isConnected,
    lastMessage,
    error,
    connect,
    send,
    disconnect
  }
}
