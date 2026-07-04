import Phaser from 'phaser'

const ROLE_IDS = ['lina', 'ayu', 'zhixia', 'jiangxun', 'laodeng']
const ROLE_NAMES: Record<string, string> = {
  lina: '莉娜',
  ayu: '阿宇',
  zhixia: '知夏',
  jiangxun: '江寻',
  laodeng: '老登'
}

/**
 * 登录场景：海报背景 + 角色立绘轮播 + 粒子特效 + 标题动画
 * 作为 LoginView.vue 的 Phaser 背景层
 */
export class LoginScene extends Phaser.Scene {
  private portrait!: Phaser.GameObjects.Image
  private portraitFrame!: Phaser.GameObjects.Graphics
  private nameText!: Phaser.GameObjects.Text
  private titleText!: Phaser.GameObjects.Text
  private subTitleText!: Phaser.GameObjects.Text
  private currentIndex = 0
  private switchTimer!: Phaser.Time.TimerEvent
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter

  constructor() {
    super({ key: 'LoginScene' })
  }

  preload() {
    // 海报
    if (!this.textures.exists('poster')) {
      this.load.image('poster', '/assets/poster/gdd-cover.png')
    }
    // 5 立绘
    ROLE_IDS.forEach(id => {
      const key = `portrait_${id}`
      if (!this.textures.exists(key)) {
        this.load.image(key, `/assets/characters/${id}.png`)
      }
    })
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

    // 3. 角色立绘展示框（右侧）
    const portraitX = width - 280
    const portraitY = height / 2 + 30

    // 立绘背景框（霓虹边框）
    this.portraitFrame = this.add.graphics()
    this.drawPortraitFrame(portraitX, portraitY, 240, 360)
    this.portraitFrame.setAlpha(0)
    this.tweens.add({
      targets: this.portraitFrame,
      alpha: 1,
      duration: 500,
      delay: 900
    })

    // 立绘本体
    this.portrait = this.add.image(portraitX, portraitY, `portrait_${ROLE_IDS[0]}`)
    this.portrait.setAlpha(0)
    this.scalePortrait(this.portrait, 240, 360)
    this.tweens.add({
      targets: this.portrait,
      alpha: 1,
      duration: 600,
      delay: 1000
    })

    // 角色名
    this.nameText = this.add.text(portraitX, portraitY + 200, ROLE_NAMES[ROLE_IDS[0]], {
      fontFamily: '"Microsoft YaHei", sans-serif',
      fontSize: '28px',
      color: '#FFFFFF',
      stroke: '#1A3C6E',
      strokeThickness: 4,
      fontStyle: 'bold'
    })
    this.nameText.setOrigin(0.5, 0.5)
    this.nameText.setAlpha(0)
    this.tweens.add({
      targets: this.nameText,
      alpha: 1,
      duration: 600,
      delay: 1100
    })

    // 4. 立绘轮播（每 3.5 秒切换）
    this.switchTimer = this.time.addEvent({
      delay: 3500,
      loop: true,
      callback: () => this.switchPortrait()
    })

    // 5. 粒子特效（飘落的光点）
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
    const hint = this.add.text(width / 2, height - 40, '在右侧表单登录 · 或注册新冒险者', {
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

  /** 绘制立绘霓虹边框 */
  private drawPortraitFrame(x: number, y: number, w: number, h: number) {
    this.portraitFrame.clear()
    // 外发光
    this.portraitFrame.fillStyle(0x000000, 0.4)
    this.portraitFrame.fillRoundedRect(x - w / 2 - 6, y - h / 2 - 6, w + 12, h + 12, 12)
    // 边框
    this.portraitFrame.lineStyle(3, 0xFFB7C5, 1)
    this.portraitFrame.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8)
    // 内边框
    this.portraitFrame.lineStyle(1, 0xFFFFFF, 0.5)
    this.portraitFrame.strokeRoundedRect(x - w / 2 + 4, y - h / 2 + 4, w - 8, h - 8, 6)
  }

  /** 按比例缩放立绘到框内 */
  private scalePortrait(img: Phaser.GameObjects.Image, maxW: number, maxH: number) {
    const tex = img.texture.getSourceImage()
    const scaleX = maxW / tex.width
    const scaleY = maxH / tex.height
    img.setScale(Math.min(scaleX, scaleY))
  }

  /** 切换角色立绘（淡出 → 换图 → 淡入） */
  private switchPortrait() {
    this.currentIndex = (this.currentIndex + 1) % ROLE_IDS.length
    const nextId = ROLE_IDS[this.currentIndex]

    this.tweens.add({
      targets: [this.portrait, this.nameText],
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.portrait.setTexture(`portrait_${nextId}`)
        this.scalePortrait(this.portrait, 240, 360)
        this.nameText.setText(ROLE_NAMES[nextId])
        this.tweens.add({
          targets: [this.portrait, this.nameText],
          alpha: 1,
          duration: 400,
          ease: 'Power2'
        })
      }
    })
  }

  shutdown() {
    if (this.switchTimer) this.switchTimer.remove()
    if (this.particles) this.particles.destroy()
  }
}
