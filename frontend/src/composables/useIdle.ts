import { ref, onUnmounted } from 'vue'
import { useGameStore } from '../stores/game'

export function useIdle() {
  const gameStore = useGameStore()
  const isIdling = ref(false)
  const elapsedTime = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null

  const startIdling = (task: 'study' | 'intern') => {
    if (isIdling.value) return

    if (gameStore.state) {
      gameStore.state.idle.task = task
      gameStore.state.idle.startedAt = Math.floor(Date.now() / 1000)
      gameStore.state.idle.lastClaimedAt = Math.floor(Date.now() / 1000)
    }

    isIdling.value = true
    elapsedTime.value = 0

    timer = setInterval(() => {
      elapsedTime.value++

      if (elapsedTime.value % 5 === 0) {
        if (task === 'study') {
          gameStore.addExp(10)
        } else {
          gameStore.addExp(6)
          gameStore.addCoins(8)
        }
      }

      if (elapsedTime.value % 600 === 0) {
        if (gameStore.state) {
          gameStore.state.idle.lastClaimedAt = Math.floor(Date.now() / 1000)
        }
        gameStore.saveSave()
      }
    }, 1000)
  }

  const stopIdling = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    isIdling.value = false
    elapsedTime.value = 0

    if (gameStore.state) {
      gameStore.state.idle.lastClaimedAt = Math.floor(Date.now() / 1000)
    }
    gameStore.saveSave()
  }

  onUnmounted(() => {
    if (timer) {
      clearInterval(timer)
    }
  })

  return {
    isIdling,
    elapsedTime,
    startIdling,
    stopIdling
  }
}
