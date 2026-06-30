import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useGameStore = defineStore('game', () => {
  const currentScene = ref('plaza')
  const battleState = ref(null)
  const tasks = ref([])
  const rewards = ref([])

  const isInGameplay = computed(() => {
    const gameScenes = ['plaza', 'explore', 'battle', 'dialogue']
    return gameScenes.includes(currentScene.value)
  })

  const setCurrentScene = (scene) => {
    currentScene.value = scene
  }

  const setBattleState = (state) => {
    battleState.value = state
  }

  const clearBattleState = () => {
    battleState.value = null
  }

  const getGameplayState = () => {
    return {
      scene: currentScene.value,
      battleState: battleState.value,
      savedAt: new Date().toISOString()
    }
  }

  return {
    currentScene,
    battleState,
    tasks,
    rewards,
    isInGameplay,
    setCurrentScene,
    setBattleState,
    clearBattleState,
    getGameplayState
  }
})