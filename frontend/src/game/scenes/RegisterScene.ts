import Phaser from 'phaser'

/**
 * 注册场景：海报背景 + 暗色覆盖 + 粒子特效 + 标题
 * 作为 RegisterView.vue 的 Phaser 背景层（简化版，无立绘轮播）
 */
export class RegisterScene extends Phaser.Scene {
  private titleText!: Phaser.GameObjects.Text
  private subTitleText!: Phaser.GameObjects.Text
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter

  constructor() {
    super({ key: 'RegisterScene' })
  }

  preload() {
    if (!this.textures.exists('poster')) {
      this.load.image('poster', '/assets/poster/gdd-cover.png')
    }
    if (!this.textures.exists('particle_dot')) {
      const g = this.add.graphics()
      g.fillStyle(0xffffff, 1)
      g.fillCircle(8, 8, 8)
      g.generateTexture('particle_dot', 16, 16)
      g.destroy()
    }
  }

  create() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    // 海报背景
    const bg = this.add.image(width / 2, height / 2, 'poster')
    bg.setAlpha(0.35)
    const tex = bg.texture.getSourceImage()
    const scale = Math.max(width / tex.width, height / tex.height)
    bg.setScale(scale)

    // 暗色渐变覆盖
    const overlay = this.add.graphics()
    overlay.fillGradientStyle(0x1A3C6E, 0x1A3C6E, 0x000000, 0x000000, 0.65)
    overlay.fillRect(0, 0, width, height)

    // 标题
    this.titleText = this.add.text(width / 2, 90, '创建新冒险者', {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: '56px',
      color: '#FFD700',
      stroke: '#1A3C6E',
      strokeThickness: 8,
      fontStyle: 'bold'
    })
    this.titleText.setOrigin(0.5, 0.5)
    this.titleText.setAlpha(0)
    this.titleText.setScale(0.3)
    this.tweens.add({
      targets: this.titleText,
      alpha: 1,
      scale: 1,
      duration: 800,
      ease: 'Back.out',
      delay: 200
    })

    // 副标题
    this.subTitleText = this.add.text(width / 2, 155, '加入同舟喵济 · 开启同济校园冒险', {
      fontFamily: '"Microsoft YaHei", sans-serif',
      fontSize: '20px',
      color: '#FFE5EC',
      stroke: '#1A3C6E',
      strokeThickness: 3
    })
    this.subTitleText.setOrigin(0.5, 0.5)
    this.subTitleText.setAlpha(0)
    this.tweens.add({
      targets: this.subTitleText,
      alpha: 1,
      duration: 600,
      delay: 700
    })

    // 粒子特效
    this.particles = this.add.particles(0, 0, 'particle_dot', {
      x: { min: 0, max: width },
      y: -10,
      lifespan: 6000,
      speedY: { min: 30, max: 80 },
      speedX: { min: -15, max: 15 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.8, end: 0 },
      frequency: 300,
      blendMode: 'ADD',
      tint: [0xFFD700, 0xFFE5EC, 0x4ECDC4, 0xFFFFFF]
    })
    this.particles.setDepth(10)
  }

  shutdown() {
    if (this.particles) this.particles.destroy()
  }
}
