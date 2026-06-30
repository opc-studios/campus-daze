/**
 * WebSocket utility
 */
export class WebSocketClient {
  constructor(url) {
    this.url = url
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
    this.listeners = {}
  }

  connect() {
    const token = localStorage.getItem('accessToken')
    this.ws = new WebSocket(`${this.url}?token=${token}`)

    this.ws.onopen = () => {
      this.reconnectAttempts = 0
      this.emit('open')
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.emit('message', data)
      } catch (e) {
        this.emit('message', event.data)
      }
    }

    this.ws.onerror = (error) => {
      this.emit('error', error)
    }

    this.ws.onclose = () => {
      this.emit('close')
      this.attemptReconnect()
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  off(event, callback) {
    if (!this.listeners[event]) return
    if (callback) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
    } else {
      delete this.listeners[event]
    }
  }

  emit(event, data) {
    if (!this.listeners[event]) return
    this.listeners[event].forEach(callback => callback(data))
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return
    this.reconnectAttempts++
    setTimeout(() => {
      this.connect()
    }, this.reconnectDelay * this.reconnectAttempts)
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}
