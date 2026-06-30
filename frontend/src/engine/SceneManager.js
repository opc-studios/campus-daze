/**
 * Scene manager for Phaser game
 */
import { eventBus } from './EventBus'

export class SceneManager {
  constructor(game) {
    this.game = game
    this.currentScene = null
  }

  start(sceneKey, data = {}) {
    this.game.scene.start(sceneKey, data)
    this.currentScene = sceneKey
    eventBus.emit('scene-changed', { scene: sceneKey, data })
  }

  getCurrentScene() {
    return this.currentScene
  }

  getScene(sceneKey) {
    return this.game.scene.getScene(sceneKey)
  }

  pause(sceneKey) {
    this.game.scene.pause(sceneKey)
  }

  resume(sceneKey) {
    this.game.scene.resume(sceneKey)
  }

  stop(sceneKey) {
    this.game.scene.stop(sceneKey)
  }
}
