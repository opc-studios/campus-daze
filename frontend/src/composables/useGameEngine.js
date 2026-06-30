import { ref, onMounted, onUnmounted } from 'vue'
import { gameEngine } from '@/engine/GameEngine'
import { eventBus } from '@/engine/EventBus'

export function useGameEngine() {
  const isReady = ref(false)
  const currentScene = ref(null)

  onMounted(() => {
    eventBus.on('game-initialized', () => {
      isReady.value = true
    })

    eventBus.on('scene-changed', (data) => {
      currentScene.value = data.scene
    })
  })

  onUnmounted(() => {
    eventBus.off('game-initialized')
    eventBus.off('scene-changed')
  })

  const init = (config = {}) => {
    gameEngine.init(config)
  }

  const startScene = (sceneKey, data = {}) => {
    const sceneManager = gameEngine.getSceneManager()
    if (sceneManager) {
      sceneManager.start(sceneKey, data)
    }
  }

  const destroy = () => {
    gameEngine.destroy()
    isReady.value = false
  }

  return {
    isReady,
    currentScene,
    init,
    startScene,
    destroy,
    gameEngine
  }
}
