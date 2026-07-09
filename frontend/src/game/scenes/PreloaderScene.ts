import Phaser from 'phaser'

const ROLE_IDS = ['lina', 'ayu', 'zhixia', 'jiangxun', 'laodeng']

export class PreloaderScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics
  private progressBox!: Phaser.GameObjects.Graphics
  private percentText!: Phaser.GameObjects.Text
  private loadingText!: Phaser.GameObjects.Text
  private spinner!: Phaser.GameObjects.Graphics
  private errorCount = 0
  private totalCount = 0

  constructor() {
    super({ key: 'PreloaderScene' })
  }

  preload() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    this.loadingText = this.add.text(width / 2, height / 2 - 60, '加载游戏资源...', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff'
    })
    this.loadingText.setOrigin(0.5, 0.5)

    // 阶段 3.7：旋转加载图标（Graphics 绘制弧线）
    this.spinner = this.add.graphics()
    const drawSpinner = (angle: number) => {
      this.spinner.clear()
      this.spinner.lineStyle(3, 0xFFB7C5, 1)
      this.spinner.beginPath()
      this.spinner.arc(width / 2, height / 2 - 110, 16, angle, angle + Math.PI * 1.5)
      this.spinner.strokePath()
    }
    drawSpinner(0)
    const spinnerTarget = { val: 0 }
    this.tweens.add({
      targets: spinnerTarget,
      val: Math.PI * 2,
      duration: 800,
      repeat: -1,
      onUpdate: () => drawSpinner(spinnerTarget.val)
    })

    this.progressBox = this.add.graphics()
    this.progressBox.fillStyle(0x222222, 0.8)
    this.progressBox.fillRect(width / 2 - 160, height / 2 - 20, 320, 40)

    this.progressBar = this.add.graphics()

    this.percentText = this.add.text(width / 2, height / 2, '0%', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff'
    })
    this.percentText.setOrigin(0.5, 0.5)

    // 阶段 3.7：平滑进度条 tween
    const progressTarget = { value: 0 }
    const updateProgressBar = () => {
      this.progressBar.clear()
      this.progressBar.fillStyle(0x4ECDC4, 1)
      this.progressBar.fillRect(width / 2 - 150, height / 2 - 10, 300 * progressTarget.value, 20)
      this.percentText.setText(`${Math.floor(progressTarget.value * 100)}%`)
    }

    this.load.on('progress', (value: number) => {
      this.tweens.add({
        targets: progressTarget,
        value: value,
        duration: 200,
        ease: 'Sine.easeOut',
        onUpdate: () => updateProgressBar()
      })
    })

    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      this.errorCount++
      console.warn(`[PreloaderScene] Failed to load: ${file.key} - ${file.url}`)
    })

    // 5 张主角立绘（参考 efv.tju2025mem3.me，使用 portraits 目录）
    ROLE_IDS.forEach(id => {
      this.load.image(`portrait_${id}`, `/assets/portraits/${id}.png`)
      this.totalCount++
    })

    // 5 张精灵图集
    ROLE_IDS.forEach(id => {
      this.load.image(`sprite_${id}`, `/assets/sprites/${id}.png`)
      this.totalCount++
    })

    // 地图底图
    this.load.image('map_ch1', '/assets/maps/ch1-zhonghe-plaza.png')
    this.totalCount++

    // 主海报
    this.load.image('poster', '/assets/poster/gdd-cover.png')
    this.totalCount++

    // === 新增素材（B3+D1）===

    // 3 种法杖精灵（紫晶/樱花/开题星，参考 efv.tju2025mem3.me 使用 -sprite-v3 版本）
    ;['amethyst', 'sakura', 'thesis'].forEach(wand => {
      this.load.image(`wand_lina_${wand}`, `/assets/weapons/lina-${wand}-wand-sprite-v3.png`)
      this.totalCount++
    })

    // 3 种攻击精灵图变体（莉娜 v15 攻击姿态）
    ;['amethyst', 'sakura', 'thesis'].forEach(variant => {
      this.load.image(`attack_lina_${variant}`, `/assets/sprites/lina-sprites-v15-attack-${variant}.png`)
      this.totalCount++
    })

    // 12 个分层地图分块（ch1 中和广场，每块 2500×2000，总 10000×6000）
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        this.load.image(
          `zhonghe-layered-map-r${r}-c${c}`,
          `/assets/maps/zhonghe-plaza-layered-chunks/chunk-r${r}-c${c}.png`
        )
        this.totalCount++
      }
    }

    // ch2 樱花季 / ch3 智械危机 / ch4 校庆 独立地图分块（每章 12 块）
    const chapterMaps = [
      { prefix: 'ch2-sakura', dir: 'ch2-sakura-layered-chunks' },
      { prefix: 'ch3-cyber', dir: 'ch3-cyber-layered-chunks' },
      { prefix: 'ch4-anniv', dir: 'ch4-anniv-layered-chunks' }
    ]
    chapterMaps.forEach(({ prefix, dir }) => {
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          this.load.image(
            `${prefix}-layered-map-r${r}-c${c}`,
            `/assets/maps/${dir}/chunk-r${r}-c${c}.png`
          )
          this.totalCount++
        }
      }
    })

    // 新弹射物图集 spritesheet（frameWidth 362，含 8 帧动画）
    this.load.spritesheet('lina_projectiles', '/assets/effects/lina-projectiles-atlas.png', {
      frameWidth: 362,
      frameHeight: 362
    })
    this.totalCount++

    // 道具图集（参考 efv.tju2025mem3.me，含宏物件图集）
    this.load.image('props_atlas', '/assets/maps/props/zhonghe-plaza-props-atlas-v1.png')
    this.load.image('macro_props_atlas', '/assets/maps/props/zhonghe-plaza-macro-props-v1.png')
    this.load.image('tileset_zhonghe', '/assets/maps/tilesets/zhonghe-plaza-ground-tileset-v1.png')
    this.totalCount += 3

    // 世界地图主图
    this.load.image('world_map', '/assets/maps/tongji-siping-core-overworld-v4.png')
    this.totalCount++

    // 新物件图集 v4
    this.load.image('props_atlas_v4', '/assets/maps/zhonghe-plaza-props-v4.png')
    this.totalCount++

    // 莉娜/阿宇新基础精灵图 v10（参考 efv.tju2025mem3.me 测试页，8×8 网格动画）
    this.load.image('sprite_lina_v10', '/assets/sprites/lina-sprites-v10-anchored-expanded.png')
    this.load.image('sprite_ayu_v10', '/assets/sprites/ayu-sprites-v10-imagegen-anchored-clean.png')
    this.totalCount += 2

    // === 怪物素材（资源整合）===
    // 怪人图集（16 帧 744×1039，CombatOverlayScene 显示怪物立绘）
    this.load.atlas('enemies_atlas', '/assets/monsters/enemies_atlas.png', '/assets/monsters/enemies_atlas.json')
    this.totalCount++

    // germs 图集（12 个小怪精灵 + ring/player/logo，MapExploreScene 替代粉红方块）
    this.load.atlas('germs_atlas', '/assets/monsters/germs.png', '/assets/monsters/germs.json')
    this.totalCount++

    // === 粒子素材（技能释放视觉）===
    // 关键粒子：explosion / fire1-3 / flame1-2 / smoke0 / sparkle1 / slime / star / coin / gold / muzzleflash1-3
    const particleNames = [
      'explosion', 'fire1', 'fire2', 'fire3', 'flame1', 'flame2', 'smoke0',
      'sparkle1', 'slime', 'star', 'coin', 'gold',
      'muzzleflash1', 'muzzleflash2', 'muzzleflash3',
      'white-flare', 'blue-flare'
    ]
    particleNames.forEach(name => {
      this.load.image(`particle_${name}`, `/assets/particles/${name}.png`)
      this.totalCount++
    })

    // === 海报背景（PepperTown splash04 + title）===
    this.load.image('poster_splash04', '/assets/poster/splash04.png')
    this.load.image('poster_title', '/assets/poster/title.png')
    this.totalCount += 2
  }

  create() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    if (this.errorCount > 0) {
      console.warn(`[PreloaderScene] ${this.errorCount}/${this.totalCount} assets failed to load, continuing anyway`)
    }

    const completeText = this.add.text(width / 2, height / 2 + 80, '资源加载完成', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#4ECDC4'
    })
    completeText.setOrigin(0.5, 0.5)

    // 阶段 3.7：淡出过渡遮罩
    const fadeOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x1A3C6E, 0)
    fadeOverlay.setDepth(100)

    this.time.delayedCall(300, () => {
      // 渐隐所有元素（含 spinner）
      this.tweens.add({
        targets: [this.progressBar, this.progressBox, this.loadingText, this.percentText, completeText, this.spinner],
        alpha: 0,
        duration: 400,
        ease: 'Power2'
      })
      // 同步淡入遮罩
      this.tweens.add({
        targets: fadeOverlay,
        alpha: 1,
        duration: 400,
        ease: 'Power2',
        onComplete: () => {
          this.scene.start('MapExploreScene')
        }
      })
    })
  }
}
