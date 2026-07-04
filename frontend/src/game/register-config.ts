import Phaser from 'phaser'
import { RegisterScene } from './scenes/RegisterScene'

/**
 * 注册页 Phaser 配置
 * 仅包含 RegisterScene，作为 RegisterView.vue 的背景层
 */
export const registerPhaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'register-phaser-bg',
  backgroundColor: '#1A3C6E',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [RegisterScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  }
}
