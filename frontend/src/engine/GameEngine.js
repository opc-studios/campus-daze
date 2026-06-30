/**
 * Phaser game engine singleton
 */
import Phaser from 'phaser'
import { SceneManager } from './SceneManager'
import { eventBus } from './EventBus'
import { PlazaScene } from '@/modules/maps/phaser/PlazaScene'
import { ExploreScene } from '@/modules/maps/phaser/ExploreScene'
import { BattleScene } from '@/modules/gameplay/phaser/BattleScene'

class GameEngine {
  constructor() {
    this.game = null
    this.sceneManager = null
    this.initialized = false
  }

  init(config = {}) {
    if (this.initialized) {
      console.warn('GameEngine already initialized')
      return
    }

    const defaultConfig = {
      type: Phaser.AUTO,
      width: 1280,
      height: 720,
      parent: config.parent || 'game-container',
      backgroundColor: '#f0f0f0',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: [PlazaScene, ExploreScene, BattleScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    }

    this.game = new Phaser.Game({ ...defaultConfig, ...config })
    this.sceneManager = new SceneManager(this.game)
    this.initialized = true

    eventBus.emit('game-initialized', this.game)
  }

  getSceneManager() {
    return this.sceneManager
  }

  getGame() {
    return this.game
  }

  destroy() {
    if (this.game) {
      this.game.destroy(true)
      this.game = null
      this.sceneManager = null
      this.initialized = false
    }
  }
}

export const gameEngine = new GameEngine()
