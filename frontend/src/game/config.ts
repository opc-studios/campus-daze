import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { PreloaderScene } from './scenes/PreloaderScene'
import { MapExploreScene } from './scenes/MapExploreScene'
import { CombatOverlayScene } from './scenes/CombatOverlayScene'

export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#1A3C6E',
  // F1: 像素艺术配置 - 解决 FIT 缩放亚像素采样抖动
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, PreloaderScene, MapExploreScene, CombatOverlayScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      // F4: 使用固定时间步长，确保不同帧率下移动一致
      fps: 60,
      timeScale: 1
    }
  }
}
