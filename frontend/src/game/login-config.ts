import Phaser from 'phaser'
import { LoginScene } from './scenes/LoginScene'

/**
 * 登录页 Phaser 配置
 * 仅包含 LoginScene，作为 LoginView.vue 的背景层
 * 使用 FIT 模式保持 16:9 比例并居中
 */
export const loginPhaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'login-phaser-bg',
  backgroundColor: '#1A3C6E',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [LoginScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  }
}
