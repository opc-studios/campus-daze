import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { MapExploreScene } from './scenes/MapExploreScene'
import { CombatOverlayScene } from './scenes/CombatOverlayScene'

export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#1A3C6E',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MapExploreScene, CombatOverlayScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  }
}
