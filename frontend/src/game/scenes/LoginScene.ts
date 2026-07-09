import Phaser from 'phaser'

/**
 * 登录场景：海报背景 + 粒子特效 + 标题动画
 * 作为 LoginView.vue 的 Phaser 背景层（已移除角色立绘轮播，避免遮挡登录表单）
 */
export class LoginScene extends Phaser.Scene {
  private titleText!: Phaser.GameObjects.Text
  private subTitleText!: Phaser.GameObjects.Text
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter

  constructor() {
    super({ key: 'LoginScene' })
  }

  preload() {
    // 海报
    if (!this.textures.exists('poster')) {
      this.load.image('poster', '/assets/poster/gdd-cover.png')
    }
    // 生成粒子贴图（白色圆点）
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

    // 1. 海报背景（淡入 + 模糊感叠加）
    const bg = this.add.image(width / 2, height / 2, 'poster')
    bg.setAlpha(0.35)
    // 按比例铺满
    const tex = bg.texture.getSourceImage()
    const scaleX = width / tex.width
    const scaleY = height / tex.height
    const scale = Math.max(scaleX, scaleY)
    bg.setScale(scale)

    // 暗色渐变覆盖层（增强文字对比度）
    const overlay = this.add.graphics()
    overlay.fillGradientStyle(0x1A3C6E, 0x1A3C6E, 0x000000, 0x000000, 0.65)
    overlay.fillRect(0, 0, width, height)

    // 2. 标题（弹跳入场动画）
    this.titleText = this.add.text(width / 2, 90, '同舟喵济', {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: '64px',
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
    // 标题持续轻微浮动
    this.tweens.add({
      targets: this.titleText,
      y: this.titleText.y + 8,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
      delay: 1000
    })

    // 副标题
    this.subTitleText = this.add.text(width / 2, 155, '学术喵的奇幻之旅 · 同济校园冒险', {
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

    // 粒子特效（飘落的光点）
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

    // 6. 底部提示
    const hint = this.add.text(width / 2, height - 40, '登录或注册新冒险者', {
      fontFamily: '"Microsoft YaHei", sans-serif',
      fontSize: '16px',
      color: '#FFB7C5',
      stroke: '#1A3C6E',
      strokeThickness: 2
    })
    hint.setOrigin(0.5, 0.5)
    hint.setAlpha(0)
    this.tweens.add({
      targets: hint,
      alpha: 0.9,
      duration: 600,
      delay: 1300,
      yoyo: true,
      hold: 2000,
      repeat: -1,
      repeatDelay: 1500
    })
  }

  shutdown() {
    if (this.particles) this.particles.destroy()
  }
}
