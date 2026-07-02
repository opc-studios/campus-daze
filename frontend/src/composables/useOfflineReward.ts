import { ref, computed } from 'vue'
import { useGameStore } from '../stores/game'
import { calcOfflineRewards } from '../game/combat/formulas'

export function useOfflineReward() {
  const gameStore = useGameStore()
  const show = ref(false)
  const offlineSeconds = ref(0)
  
  const rewards = computed(() => {
    const task = gameStore.state?.idle.task || 'study'
    return calcOfflineRewards(task, offlineSeconds.value)
  })

  const checkOfflineReward = () => {
    const lastClaimedAt = gameStore.state?.idle.lastClaimedAt
    if (!lastClaimedAt || lastClaimedAt === 0) return

    const now = Math.floor(Date.now() / 1000)
    const elapsed = now - lastClaimedAt

    if (elapsed < 60) return

    offlineSeconds.value = elapsed
    const r = rewards.value

    if (r.exp > 0 || r.coins > 0) {
      show.value = true
    }
  }

  const claim = () => {
    const r = rewards.value
    if (r.exp > 0) gameStore.addExp(r.exp)
    if (r.coins > 0) gameStore.addCoins(r.coins)

    if (gameStore.state) {
      gameStore.state.idle.lastClaimedAt = Math.floor(Date.now() / 1000)
    }

    gameStore.saveSave()
    show.value = false
  }

  return {
    show,
    offlineSeconds,
    rewards,
    checkOfflineReward,
    claim
  }
}
