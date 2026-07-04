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

      // GDD §6.6 通关统计：每秒累加学习时长
      gameStore.recordStudyTime(1)

      if (elapsedTime.value % 5 === 0) {
        // GDD §4.1 道具效果应用：应用挂机装备/临时 buff 乘数
        const { expRate, coinRate } = gameStore.getIdleMultiplier(task)
        if (task === 'study') {
          // 学习：EXP +10 × expRate
          gameStore.addExp(Math.floor(10 * expRate))
        } else {
          // 实习：EXP +6 × expRate，校园币 +8 × coinRate
          gameStore.addExp(Math.floor(6 * expRate))
          gameStore.addCoins(Math.floor(8 * coinRate))
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
