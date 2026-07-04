import Phaser from 'phaser'
import { useGameStore } from '../../stores/game'
import { MonsterAISystem } from '../systems/MonsterAISystem'

const COLS = 8
const ROWS = 8
const ANIMATION_SPEED_FACTOR = 0.68

interface ActionDef {
  id: string
  label: string
  row: number
  fps: number
  repeat: number
  frames: number[]
}

interface EquipmentDef {
  id: string
  name: string
  color: string
  colorHex: number
  textureKey: string
  attackTextureKey: string
  projectileFrame: number
  impactFrame: number
  projectileScale: number
  speed: number
  size: number
  range: number
  cooldown: number
}

interface ProjectileData {
  sprite: Phaser.GameObjects.Sprite
  trail: { x: number; y: number }[]
  trailGraphics: Phaser.GameObjects.Graphics
}

export class MapExploreScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private mapNodes: any[] = []
  private fogRects: Map<string, Phaser.GameObjects.Rectangle> = new Map()
  private nodeSprites: Phaser.GameObjects.Arc[] = []
  private monsterAI!: MonsterAISystem
  private chapterTitleText!: Phaser.GameObjects.Text
  private creditsText!: Phaser.GameObjects.Text
  private currentChapter = 1
  private playerRoleId = 'lina'
  // 步骤 2 新增字段
  private obstaclesGroup!: Phaser.Physics.Arcade.StaticGroup
  private projectilesGroup!: Phaser.GameObjects.Group
  private currentForm: 'human' | 'cat' = 'cat'
  private actionsList: ActionDef[] = []
  private equipmentList: EquipmentDef[] = []
  private formText!: Phaser.GameObjects.Text
  private jKey!: Phaser.Input.Keyboard.Key
  private lKey!: Phaser.Input.Keyboard.Key
  private attackCooldown = 0
  // 步骤 1 v2 新增字段
  private staffSprite!: Phaser.GameObjects.Image
  private isActionLocked = false
  private collisionGraphicsList: Phaser.GameObjects.Graphics[] = []
  private activeProjectiles: ProjectileData[] = []
  private currentEquipIndex = 0
  private preferredSpriteKey = ''
  private lastDirection: 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'N' | 'NE' = 'S'
  // F5/F6: 抖动修复新增字段
  // P0: 删除 isTweening —— velocity steering 不再需要锁定键盘
  private lastSaveTime = 0
  private readonly SAVE_INTERVAL_MS = 200
  // P0: 点击移动目标（velocity steering）
  private moveTarget: { x: number; y: number } | null = null
  // P1: 玩家脚下阴影
  private playerShadow!: Phaser.GameObjects.Ellipse
  // P2: 移动尘埃粒子计时器
  private dustTimer = 0
  private readonly DUST_INTERVAL_MS = 200
  // C.3 移动端虚拟摇杆方向向量（-1~1, -1~1），null 表示摇杆未激活
  private joystickDir: { x: number; y: number } | null = null

  constructor() {
    super({ key: 'MapExploreScene' })
  }

  /**
   * 按 currentChapter 返回对应章节的地图配置
   * - ch0/1 → ch1 中和广场（zhongheMap / zh1Map，夜色图书馆复用 ch1 地图）
   * - ch2 → ch2 樱花季
   * - ch3 → ch3 智械危机
   * - ch4 → ch4 校庆
   */
  private getChapterMap(): any {
    const ch = this.currentChapter || 1
    const keyMap: Record<number, string> = {
      0: 'zhongheMap',
      1: 'zhongheMap',
      2: 'ch2Map',
      3: 'ch3Map',
      4: 'ch4Map'
    }
    const key = keyMap[ch] || 'zhongheMap'
    return this.cache.json.get(key)
  }

  create() {
    const gameStore = useGameStore()
    const mapNodesConfig = this.cache.json.get('mapNodes') || []
    const puzzlesConfig = this.cache.json.get('puzzles') || []
    const monstersConfig = this.cache.json.get('monsters') || []
    const chaptersConfig = this.cache.json.get('chapters') || []
    // 先确定章节，再按章节读取对应地图配置
    this.currentChapter = gameStore.currentChapter || 1
    if (this.currentChapter < 1) this.currentChapter = 1
    if (this.currentChapter > 4) this.currentChapter = 4
    const zhongheMap = this.getChapterMap()
    // 步骤 2：读取 actions/equipment/obstacles 配置
    this.actionsList = this.cache.json.get('actions') || []
    this.equipmentList = (this.cache.json.get('equipment') || []).map((e: any) => ({
      ...e,
      colorHex: parseInt(e.color.replace('#', ''), 16)
    }))

    // W 地图风格差异化：按章节切换背景色调/雾气颜色（GDD §3.1）
    const chapterStyles: Record<number, { bg: number; fog: number; fogAlpha: number; accent: string }> = {
      0: { bg: 0x1a2a4a, fog: 0x0a0a1a, fogAlpha: 0.85, accent: '#B0B0B0' }, // 序章：深蓝（夜色图书馆）
      1: { bg: 0x2a4a7a, fog: 0x000000, fogAlpha: 0.75, accent: '#FFD700' }, // 第一章：标准蓝（课程楼层）
      2: { bg: 0x4a2a4a, fog: 0x2a0a2a, fogAlpha: 0.70, accent: '#FFB7C5' }, // 第二章：紫粉（樱花季）
      3: { bg: 0x2a2a4a, fog: 0x1a0a1a, fogAlpha: 0.80, accent: '#9D4EDD' }, // 第三章：暗紫（智械危机）
      4: { bg: 0x4a3a1a, fog: 0x2a1a0a, fogAlpha: 0.65, accent: '#FFA500' }  // 终章：金棕（校庆）
    }
    const style = chapterStyles[this.currentChapter] || chapterStyles[1]

    // 相机边界：分层地图 10000×6000，fallback 旧 1280×720
    const mapWidth = zhongheMap?.pixelWidth || 1280
    const mapHeight = zhongheMap?.pixelHeight || 720
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight)

    // P1: 相机缩放 —— 像素艺术质感（对齐 Phaser 官方 topdown RPG 示例）
    this.cameras.main.setZoom(1.5)

    // P0: 物理 world bounds —— 替代手动 Clamp，避免与 arcade body 冲突
    if (zhongheMap) {
      this.physics.world.setBounds(520, 1220, 9480 - 520, 5280 - 1220)
    } else {
      this.physics.world.setBounds(0, 0, mapWidth, mapHeight)
    }

    // 真实分层地图底图（12 块拼接）；fallback 单色背景
    if (zhongheMap?.chunks && Array.isArray(zhongheMap.chunks)) {
      zhongheMap.chunks.forEach((chunk: any) => {
        if (this.textures.exists(chunk.key)) {
          // 每块 2500×2000，中心点偏移 1250×1000
          this.add.image(chunk.x + 1250, chunk.y + 1000, chunk.key)
        }
      })
    } else {
      this.add.rectangle(mapWidth / 2, mapHeight / 2, mapWidth, mapHeight, style.bg)
    }

    this.mapNodes = mapNodesConfig.filter((n: any) => n.chapter === this.currentChapter)

    // 分层地图激活时，节点坐标按 10x 缩放（原 100-600 → 1000-6000）
    const nodeScale = zhongheMap ? 10 : 1
    this.mapNodes.forEach((node: any) => {
      node.position = {
        x: node.position.x * nodeScale,
        y: node.position.y * nodeScale
      }
    })

    this.monsterAI = new MonsterAISystem(this)
    this.nodeSprites = []

    this.mapNodes.forEach((node: any) => {
      const color = this.getNodeColor(node.type)
      const circle = this.add.circle(node.position.x, node.position.y, 24, color)
      circle.setStrokeStyle(3, 0xffffff)
      // P1: 节点 Y-sort —— 越靠下的节点深度越大，被玩家遮挡时正确
      circle.setDepth(node.position.y)

      const text = this.add.text(node.position.x, node.position.y + 36, node.name, {
        fontFamily: '"Microsoft YaHei", Arial, sans-serif',
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
      })
      text.setOrigin(0.5, 0)

      const isBossLocked =
        node.type === 'boss' &&
        node.creditRequirement &&
        (gameStore.progress?.chapterCredits || 0) < node.creditRequirement

      const isNodeCleared =
        node.type !== 'boss' && gameStore.state?.map.completedNodes.includes(node.nodeId)

      if (isBossLocked) {
        circle.setAlpha(0.5)
        const lockText = this.add.text(
          node.position.x,
          node.position.y - 36,
          `需 ${node.creditRequirement} 学分`,
          {
            fontFamily: '"Microsoft YaHei", Arial, sans-serif',
            fontSize: '12px',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 2
          }
        )
        lockText.setOrigin(0.5, 1)
      } else if (isNodeCleared) {
        circle.setAlpha(0.4)
        const clearedText = this.add.text(node.position.x, node.position.y - 36, '已完成', {
          fontFamily: '"Microsoft YaHei", Arial, sans-serif',
          fontSize: '12px',
          color: '#888888'
        })
        clearedText.setOrigin(0.5, 1)
      } else {
        circle.setInteractive()
        circle.on('pointerdown', () => {
          this.handleNodeClick(node, puzzlesConfig)
        })
      }

      this.nodeSprites.push(circle)

      if (!isNodeCleared && !isBossLocked) {
        this.spawnNodeMonsters(node, monstersConfig)
      }
    })

    this.playerRoleId = gameStore.player?.roleId || 'lina'

    // 步骤 2：绘制 23 障碍物碰撞区（仅分层地图激活时）
    if (zhongheMap) {
      this.drawObstacles()
      this.projectilesGroup = this.add.group()
    }

    // spawn 点：分层地图用当前章节 start 节点位置（已缩放），fallback 旧 (100, 300)
    const startNode = this.mapNodes.find((n: any) => n.type === 'start')
    const defaultSpawn = startNode
      ? { x: startNode.position.x, y: startNode.position.y }
      : (zhongheMap ? { x: 5000, y: 3300 } : { x: 100, y: 300 })
    const startPos = gameStore.mapState?.playerPosition || defaultSpawn

    // 优先用 v10 新精灵图，fallback 旧精灵图，再 fallback 立绘
    const v10Key = `sprite_${this.playerRoleId}_v10`
    const spriteKey = `sprite_${this.playerRoleId}`
    const portraitKey = `portrait_${this.playerRoleId}`
    this.preferredSpriteKey = this.textures.exists(v10Key) ? v10Key : spriteKey

    if (this.textures.exists(this.preferredSpriteKey)) {
      this.player = this.physics.add.sprite(startPos.x, startPos.y, this.preferredSpriteKey, 0)
      // P1: 80×80 替代 120×120，对齐 Phaser 官方 topdown RPG 角色尺寸
      this.player.setDisplaySize(80, 80)
      // body size 34×42、offset (56, 92)，参考 app.js showCharacter
      const body = this.player.body as Phaser.Physics.Arcade.Body
      if (body) {
        body.setSize(34, 42)
        body.setOffset(56, 92)
        // P0: setCollideWorldBounds 配合 physics.world.setBounds，替代手动 Clamp
        body.setCollideWorldBounds(true)
      }
      // 步骤 2：8 动作帧动画（仅 v10/sprite 精灵图）
      this.preparePlayerAnimations(this.playerRoleId, this.preferredSpriteKey)
    } else if (this.textures.exists(portraitKey)) {
      this.player = this.add.sprite(startPos.x, startPos.y, portraitKey)
      // P1: 80×80 替代 120×120
      this.player.setDisplaySize(80, 80)
    } else {
      // 最终 fallback：几何占位
      const placeholder = this.add.circle(startPos.x, startPos.y, 18, 0xFFB7C5)
      this.player = placeholder as any
      placeholder.setStrokeStyle(3, 0xffffff)
    }
    // P1: Y-sort 深度排序 —— 玩家深度按 Y 坐标动态计算
    this.player.setDepth(this.player.y)

    // 步骤 1 v2：法杖精灵绘制（仅人形显示，猫形隐藏）
    if (this.equipmentList.length > 0 && this.textures.exists(this.equipmentList[0].textureKey)) {
      this.staffSprite = this.add.image(startPos.x + 30, startPos.y - 20, this.equipmentList[0].textureKey)
      this.staffSprite.setDepth(11)
      this.staffSprite.setVisible(false) // 默认猫形隐藏
    }

    // 步骤 2：玩家与障碍物组碰撞
    if (this.obstaclesGroup && this.player.body) {
      this.physics.add.collider(this.player, this.obstaclesGroup)
    }

    // P1: 玩家脚下 soft shadow —— 对齐 Phaser 官方 topdown RPG 示例
    this.playerShadow = this.add.ellipse(
      this.player.x,
      this.player.y + 24,
      56,
      14,
      0x000000,
      0.35
    )
    // 阴影深度比玩家低 0.5，确保始终被玩家遮挡
    this.playerShadow.setDepth(this.player.y - 0.5)

    // 步骤 2：默认猫形态，播放 idle/catRun
    this.currentForm = 'cat'
    if (this.anims.exists(`catRun_${this.playerRoleId}`)) {
      this.player.play(`catRun_${this.playerRoleId}`, true)
    } else if (this.anims.exists(`walk_${this.preferredSpriteKey}`)) {
      this.player.play(`walk_${this.preferredSpriteKey}`, true)
    }

    // 雾气：每个未揭示节点用半透明黑色覆盖；分层地图用更大雾气
    const revealedRegions = gameStore.mapState?.revealedRegions || ['entrance']
    const fogSize = zhongheMap ? 400 : 160
    this.mapNodes.forEach((node: any) => {
      if (!revealedRegions.includes(node.nodeId)) {
        const fog = this.add.rectangle(
          node.position.x,
          node.position.y,
          fogSize,
          fogSize,
          style.fog,
          style.fogAlpha
        )
        fog.setDepth(5)
        this.fogRects.set(node.nodeId, fog)
      }
    })
    revealedRegions.forEach((regionId: string) => {
      this.revealRegion(regionId)
    })

    // P0: 相机跟随 —— 对齐 Phaser 官方 topdown RPG 示例
    // 第3参 roundPixels=true 避免亚像素采样抖动；lerp 0.08 平滑但不滞后
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)

    this.cursors = this.input.keyboard!.createCursorKeys()

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        const worldX = pointer.x + this.cameras.main.scrollX
        const worldY = pointer.y + this.cameras.main.scrollY
        this.movePlayerTo(worldX, worldY)
      }
    })

    // 章节标题（从 chapters.json 查询 GDD 标题）
    const chapterInfo = chaptersConfig.find((c: any) => c.chapterId === this.currentChapter)
    const chapterTitleStr = chapterInfo?.name || `第 ${this.currentChapter} 章`

    this.chapterTitleText = this.add.text(20, 20, chapterTitleStr, {
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      fontSize: '20px',
      color: '#FFD700',
      stroke: '#1A3C6E',
      strokeThickness: 4,
      fontStyle: 'bold'
    })
    this.chapterTitleText.setScrollFactor(0)

    this.creditsText = this.add.text(
      20,
      50,
      `累计学分: ${gameStore.resources?.credits || 0}  章节学分: ${gameStore.progress?.chapterCredits || 0}`,
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 3
      }
    )
    this.creditsText.setScrollFactor(0)

    // 步骤 2：形态显示文本 + J/L 键注册
    this.formText = this.add.text(20, 80, '形态: 🐱 猫形（按 L 切换 / 按 J 攻击）', {
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      fontSize: '13px',
      color: '#4ECDC4',
      stroke: '#000000',
      strokeThickness: 3
    })
    this.formText.setScrollFactor(0)

    if (this.input.keyboard) {
      this.jKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J)
      this.lKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L)
      this.jKey.on('down', () => this.castProjectile())
      this.lKey.on('down', () => this.transformForm())
      // 步骤 1 v2：C 键碰撞区 toggle + R 键镜头归位
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C).on('down', () => {
        this.collisionGraphicsList.forEach(g => g.setVisible(!g.visible))
      })
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R).on('down', () => {
        this.cameras.main.pan(this.player.x, this.player.y, 280, 'Sine.easeInOut')
      })
    }

    // 步骤 1 v2：监听法杖切换事件（来自 MapView 包裹面板）
    window.addEventListener('staff-switch', this.handleStaffSwitch as EventListener)

    this.events.on('monster-attack', (monsterId: string) => {
      this.handleMonsterAttack(monsterId)
    })

    // C.3 移动端适配：多指针支持 + 暴露场景实例给 MapView + 摇杆事件监听
    this.input.addPointer(2)
    ;(window as any).__phaserScene = this
    this.events.on('mobile-joystick-move', (vec: { x: number; y: number }) => {
      this.joystickDir = vec
      // 摇杆激活时清除点击移动目标，避免冲突
      this.moveTarget = null
    })
    this.events.on('mobile-joystick-stop', () => {
      this.joystickDir = null
      const body = this.player.body as Phaser.Physics.Arcade.Body
      if (body) body.setVelocity(0, 0)
    })

    // V 序章独立引导：currentChapter===0 时显示教学提示（GDD §3.1 序章）
    if ((gameStore.currentChapter || 0) === 0) {
      this.showPrologueTutorial()
    }
  }

  /**
   * V 序章独立引导：双形态/挂机/背包教学
   * 显示 4 张教学卡片，点击"开始冒险"后推进到第一章
   */
  private showPrologueTutorial() {
    const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.88).setDepth(100)
    const panel = this.add.rectangle(640, 360, 820, 520, 0x1A3C6E, 0.96).setDepth(101)
    panel.setStrokeStyle(3, 0xFFD700)

    const title = this.add.text(640, 150, '序章：初入同济', {
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      fontSize: '32px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(102)

    const subtitle = this.add.text(640, 188, '欢迎来到同济校园，学术喵。先了解一下基本操作吧。', {
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      fontSize: '14px',
      color: '#B0B0B0'
    }).setOrigin(0.5).setDepth(102)

    const tutorials = [
      { icon: '🐱', title: '双形态切换（L 键）', desc: '猫形移动快、人形攻击强。探索时建议保持猫形。' },
      { icon: '⚔️', title: '法杖攻击（J 键）', desc: '人形按 J 释放法杖弹射物，击败怪物获得经验与学分。' },
      { icon: '🎒', title: '背包系统（B 键）', desc: '打开背包使用道具、切换法杖。携带槽影响挂机收益。' },
      { icon: '📚', title: '挂机学习（主页）', desc: '在主页选择挂机学习/实习，离线也可累积经验与校园币。' }
    ]

    tutorials.forEach((t, i) => {
      const y = 240 + i * 72
      this.add.text(330, y, t.icon, {
        fontSize: '32px'
      }).setOrigin(0.5).setDepth(102)

      this.add.text(380, y - 12, t.title, {
        fontFamily: '"Microsoft YaHei", Arial, sans-serif',
        fontSize: '17px',
        color: '#4ECDC4',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5).setDepth(102)

      this.add.text(380, y + 12, t.desc, {
        fontFamily: '"Microsoft YaHei", Arial, sans-serif',
        fontSize: '13px',
        color: '#ffffff'
      }).setOrigin(0, 0.5).setDepth(102)
    })

    const startBtn = this.add.rectangle(640, 570, 260, 52, 0xFFD700).setDepth(102)
    startBtn.setInteractive({ useHandCursor: true })
    const startText = this.add.text(640, 570, '开始冒险 →', {
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      fontSize: '20px',
      color: '#1A3C6E',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(103)

    startBtn.on('pointerover', () => startBtn.setFillStyle(0xFFE55C))
    startBtn.on('pointerout', () => startBtn.setFillStyle(0xFFD700))
    startBtn.on('pointerdown', () => {
      overlay.destroy()
      panel.destroy()
      title.destroy()
      subtitle.destroy()
      startBtn.destroy()
      startText.destroy()
      // 通知 Vue 层推进到第一章
      window.dispatchEvent(new CustomEvent('prologue-complete'))
    })

    // 入场动画
    panel.setAlpha(0)
    title.setAlpha(0)
    subtitle.setAlpha(0)
    this.tweens.add({
      targets: [panel, title, subtitle],
      alpha: 1,
      duration: 400,
      ease: 'Sine.easeOut'
    })
  }

  /** 步骤 1 v2：法杖切换事件处理 */
  private handleStaffSwitch = (e: Event) => {
    const detail = (e as CustomEvent).detail
    const idx = detail?.equipIndex
    if (typeof idx === 'number' && idx >= 0 && idx < this.equipmentList.length) {
      this.currentEquipIndex = idx
      const equip = this.equipmentList[idx]
      if (this.staffSprite && this.textures.exists(equip.textureKey)) {
        this.staffSprite.setTexture(equip.textureKey)
      }
    }
  }

  update(_time: number, deltaMs: number) {
    // 步骤 1 v2：动作锁定期间跳过移动逻辑，仅更新法杖位置和弹射物
    if (this.isActionLocked) {
      this.updateStaffPosition()
      this.updateProjectiles()
      // P1: 即使锁定也保持阴影 + Y-sort 跟随
      this.updatePlayerDepthAndShadow()
      return
    }

    // P0: 速度统一为 pixels/sec，arcade physics 自动按 delta 推进
    const speed = 240
    let isMoving = false
    let dx = 0
    let dy = 0

    // 键盘输入
    if (this.cursors.left?.isDown) {
      isMoving = true
      dx = -1
    } else if (this.cursors.right?.isDown) {
      isMoving = true
      dx = 1
    }
    if (this.cursors.up?.isDown) {
      isMoving = true
      dy = -1
    } else if (this.cursors.down?.isDown) {
      isMoving = true
      dy = 1
    }

    const body = this.player.body as Phaser.Physics.Arcade.Body

    // C.3 移动端虚拟摇杆优先级最高（覆盖键盘/点击移动）
    if (this.joystickDir && body) {
      const jx = this.joystickDir.x
      const jy = this.joystickDir.y
      const mag = Math.sqrt(jx * jx + jy * jy)
      if (mag < 0.08) {
        // 死区：极小输入视为停止
        body.setVelocity(0, 0)
        isMoving = false
        dx = 0
        dy = 0
      } else {
        body.setVelocity(jx * speed, jy * speed)
        isMoving = true
        dx = jx > 0 ? 1 : (jx < 0 ? -1 : 0)
        dy = jy > 0 ? 1 : (jy < 0 ? -1 : 0)
      }
    } else if (this.moveTarget && body) {
      // P0: 点击移动 velocity steering —— 优先级高于键盘
      // 每帧朝目标设 velocity，到达后归零并清除目标（对齐 Phaser 官方示例模式）
      const tdx = this.moveTarget.x - this.player.x
      const tdy = this.moveTarget.y - this.player.y
      const dist = Math.sqrt(tdx * tdx + tdy * tdy)
      if (dist < 8) {
        // 到达目标点
        this.moveTarget = null
        body.setVelocity(0, 0)
      } else {
        // 朝目标转向
        body.setVelocity((tdx / dist) * speed, (tdy / dist) * speed)
        isMoving = true
        dx = tdx > 0 ? 1 : (tdx < 0 ? -1 : 0)
        dy = tdy > 0 ? 1 : (tdy < 0 ? -1 : 0)
      }
    } else if (body) {
      // 键盘移动
      body.setVelocity(dx * speed, dy * speed)
    }

    // P0: 边界已由 physics.world.setBounds + setCollideWorldBounds 处理，删除手动 Clamp

    // 步骤 1 v2：8 方向计算与朝向 event dispatch
    if (isMoving && (dx !== 0 || dy !== 0)) {
      const newDir = this.computeDirection(dx, dy)
      if (newDir !== this.lastDirection) {
        this.lastDirection = newDir
        window.dispatchEvent(new CustomEvent('player-direction-change', { detail: newDir }))
      }
    }

    // 步骤 2：形态动画（cat → catRun / human → walk；停止时 idle）
    const moveAnimKey = this.currentForm === 'cat'
      ? `catRun_${this.playerRoleId}`
      : `walk_${this.playerRoleId}`
    const idleAnimKey = `idle_${this.playerRoleId}`
    if (isMoving && this.player.play) {
      if (this.player.anims && !this.player.anims.isPlaying && this.anims.exists(moveAnimKey)) {
        this.player.play(moveAnimKey, true)
      }
      if (dx !== 0 && this.player.setFlipX) {
        this.player.setFlipX(dx < 0)
      }
    } else if (!isMoving && this.player.anims) {
      // 步骤 1 v2：猫形静止时显示 transform-7 帧（参考 app.js showCatIdleFrame）
      if (this.currentForm === 'cat' && this.preferredSpriteKey) {
        const transformAnim = this.actionsList.find(a => a.id === 'transform')
        if (transformAnim) {
          const catIdleFrame = transformAnim.row * COLS + 7
          if (this.player.anims.isPlaying) this.player.anims.pause()
          this.player.setFrame(catIdleFrame)
        }
      } else {
        // 人形：切到 idle 动画
        if (this.anims.exists(idleAnimKey) && this.player.anims.currentAnim?.key !== idleAnimKey) {
          this.player.play(idleAnimKey, true)
        } else if (!this.anims.exists(idleAnimKey) && this.player.anims.isPlaying) {
          this.player.anims.pause()
        }
      }
    }

    // 步骤 1 v2：法杖位置跟随玩家
    this.updateStaffPosition()

    // 步骤 1 v2：弹射物拖尾更新
    this.updateProjectiles()

    // P1: 玩家 Y-sort 深度 + 阴影跟随
    this.updatePlayerDepthAndShadow()

    // P2: 移动尘埃粒子
    if (isMoving) {
      this.dustTimer += deltaMs
      if (this.dustTimer >= this.DUST_INTERVAL_MS) {
        this.dustTimer = 0
        this.spawnDustParticle(this.player.x, this.player.y + 20)
      }
    } else {
      this.dustTimer = 0
    }

    // 步骤 2：攻击冷却递减
    if (this.attackCooldown > 0) {
      this.attackCooldown = Math.max(0, this.attackCooldown - deltaMs)
    }

    const gameStore = useGameStore()
    // F6: store 写入节流，每 200ms 写一次，避免每帧触发响应式
    this.lastSaveTime += deltaMs
    if (this.lastSaveTime >= this.SAVE_INTERVAL_MS && gameStore.state) {
      this.lastSaveTime = 0
      gameStore.state.map.playerPosition = { x: this.player.x, y: this.player.y }
    }

    if (this.monsterAI) {
      this.monsterAI.updatePlayerPosition(this.player.x, this.player.y)
      this.monsterAI.update(deltaMs / 1000)
    }

    if (this.creditsText && gameStore.progress) {
      this.creditsText.setText(
        `累计学分: ${gameStore.resources?.credits || 0}  章节学分: ${gameStore.progress?.chapterCredits || 0}`
      )
    }
  }

  /**
   * P1: 玩家 Y-sort 深度 + 阴影位置/深度跟随
   * 对齐 Phaser 官方 topdown RPG 示例的 depth sorting 模式
   */
  private updatePlayerDepthAndShadow() {
    if (!this.player) return
    this.player.setDepth(this.player.y)
    if (this.playerShadow) {
      this.playerShadow.setPosition(this.player.x, this.player.y + 24)
      this.playerShadow.setDepth(this.player.y - 0.5)
    }
  }

  /**
   * P2: 移动尘埃粒子 —— 对齐 Phaser 官方示例的 movement feedback
   * 创建一个小白圆，缩放+淡出 400ms 销毁
   */
  private spawnDustParticle(x: number, y: number) {
    const dust = this.add.circle(x, y, 5, 0xffffff, 0.5)
    dust.setDepth(this.player.y - 0.3)
    this.tweens.add({
      targets: dust,
      scale: 0.3,
      alpha: 0,
      duration: 400,
      ease: 'Sine.easeOut',
      onComplete: () => dust.destroy()
    })
  }

  /** 步骤 1 v2：计算 8 方向朝向 */
  private computeDirection(dx: number, dy: number): 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'N' | 'NE' {
    if (dx > 0 && dy === 0) return 'E'
    if (dx > 0 && dy > 0) return 'SE'
    if (dx === 0 && dy > 0) return 'S'
    if (dx < 0 && dy > 0) return 'SW'
    if (dx < 0 && dy === 0) return 'W'
    if (dx < 0 && dy < 0) return 'NW'
    if (dx === 0 && dy < 0) return 'N'
    if (dx > 0 && dy < 0) return 'NE'
    return 'S'
  }

  /** 步骤 1 v2：法杖位置跟随玩家 */
  private updateStaffPosition() {
    if (!this.staffSprite) return
    const offset = this.player.flipX ? -30 : 30
    this.staffSprite.x = this.player.x + offset
    this.staffSprite.y = this.player.y - 20
    this.staffSprite.setFlipX(this.player.flipX)
  }

  /** 步骤 1 v2：弹射物 7 点拖尾更新 */
  private updateProjectiles() {
    this.activeProjectiles.forEach(p => {
      p.trail.push({ x: p.sprite.x, y: p.sprite.y })
      if (p.trail.length > 7) p.trail.shift()
      p.trailGraphics.clear()
      p.trail.forEach((point, idx) => {
        const alpha = 0.18 * ((idx + 1) / p.trail.length)
        p.trailGraphics.fillStyle(0xffffff, alpha)
        p.trailGraphics.fillCircle(point.x, point.y, 4)
      })
    })
  }

  private spawnNodeMonsters(node: any, monstersConfig: any[]) {
    if (!node.monsters || node.monsters.length === 0) return
    const zhongheMap = this.getChapterMap()
    const offsetScale = zhongheMap ? 10 : 1

    if (node.type === 'boss') {
      const monster = monstersConfig.find((m: any) => m.monsterId === node.monsterId)
      if (monster) {
        const alertRadius = (monster.alertRadius || 120) * offsetScale
        // 资源整合：传入 mapIcon（germs_atlas 帧名）+ isBoss=true
        this.monsterAI.addMonster(
          `monster_${node.nodeId}`,
          node.nodeId,
          monster.monsterId,
          node.position.x,
          node.position.y,
          alertRadius,
          monster.leashRadius || 999,
          monster.actionInterval || 2.0,
          monster.mapIcon || 'ring',
          true
        )
        const monsterData = this.monsterAI.getMonster(`monster_${node.nodeId}`)
        if (monsterData) {
          // 资源整合：sprite 可能是 Image 或 Arc，仅 Arc 才有 setFillStyle/setRadius
          if ('setFillStyle' in monsterData.sprite) {
            ;(monsterData.sprite as Phaser.GameObjects.Arc).setFillStyle(0xff0000)
            ;(monsterData.sprite as Phaser.GameObjects.Arc).setRadius(24)
          }
          monsterData.sprite.setDepth(3)
        }
        // Boss 警戒圈（半透明红色）
        const alertCircle = this.add.circle(
          node.position.x,
          node.position.y,
          alertRadius,
          0xff0000,
          0.15
        )
        alertCircle.setDepth(2)
      }
      return
    }

    node.monsters.forEach((monsterId: string, idx: number) => {
      const monster = monstersConfig.find((m: any) => m.monsterId === monsterId)
      if (!monster) return
      const offsetX = (idx - (node.monsters.length - 1) / 2) * 40 * offsetScale
      const offsetY = -50 * offsetScale
      const monsterX = node.position.x + offsetX
      const monsterY = node.position.y + offsetY
      const alertRadius = (monster.alertRadius || 80) * offsetScale
      // 资源整合：传入 mapIcon（germs_atlas 帧名）
      this.monsterAI.addMonster(
        `monster_${node.nodeId}_${idx}`,
        node.nodeId,
        monsterId,
        monsterX,
        monsterY,
        alertRadius,
        (monster.leashRadius || 200) * offsetScale,
        monster.actionInterval || 2.0,
        monster.mapIcon,
        false
      )
      // 怪物警戒圈（半透明红色）
      const alertCircle = this.add.circle(
        monsterX,
        monsterY,
        alertRadius,
        0xff0000,
        0.15
      )
      alertCircle.setDepth(2)
      const monsterData = this.monsterAI.getMonster(`monster_${node.nodeId}_${idx}`)
      if (monsterData) {
        monsterData.sprite.setDepth(3)
      }
    })
  }

  private handleMonsterAttack(monsterInstanceId: string) {
    const monster = this.monsterAI.getMonster(monsterInstanceId)
    if (!monster) return
    if (this.isInCombat()) return

    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      monster.position.x,
      monster.position.y
    )
    // 分层地图战斗触发距离放大
    const zhongheMap = this.getChapterMap()
    const combatDistance = zhongheMap ? 160 : 40
    if (distance > combatDistance) {
      this.monsterAI.setMonsterState(monsterInstanceId, 'chase')
      return
    }

    const gameStore = useGameStore()
    if (gameStore.state?.map.completedNodes.includes(monster.nodeId)) {
      this.monsterAI.setMonsterState(monsterInstanceId, 'cleared')
      return
    }

    this.monsterAI.setMonsterState(monsterInstanceId, 'combat')
    this.startCombat(monster.monsterId, monster.nodeId, false)
  }

  private isInCombat(): boolean {
    const gameStore = useGameStore()
    return (
      gameStore.combatState?.state === 'running' ||
      gameStore.combatState?.state === 'init'
    )
  }

  private getNodeColor(type: string): number {
    const colors: Record<string, number> = {
      start: 0x4ECDC4,
      normal: 0x1A3C6E,
      event: 0xFFB7C5,
      puzzle: 0xFFD700,
      resource: 0x00FF00,
      boss: 0xFF0000
    }
    return colors[type] || 0x808080
  }

  private handleNodeClick(node: any, puzzlesConfig: any[]) {
    const gameStore = useGameStore()

    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      node.position.x,
      node.position.y
    )

    // 分层地图距离阈值放大（坐标 10x 缩放）
    const zhongheMap = this.getChapterMap()
    const interactDistance = zhongheMap ? 200 : 50

    if (distance > interactDistance) {
      this.movePlayerTo(node.position.x, node.position.y)
      return
    }

    if (gameStore.state?.map.completedNodes.includes(node.nodeId) && node.type !== 'boss') {
      this.showFloatingText(node, '已完成', '#888888')
      return
    }

    switch (node.type) {
      case 'boss':
        if (
          node.creditRequirement &&
          (gameStore.progress?.chapterCredits || 0) < node.creditRequirement
        ) {
          this.showFloatingText(
            node,
            `需要 ${node.creditRequirement} 章节学分才能挑战 Boss`,
            '#FFD700'
          )
          return
        }
        this.startCombat(node.monsterId, node.nodeId, true)
        break
      case 'event':
        this.triggerEvent(node.eventId)
        break
      case 'puzzle':
        this.triggerPuzzle(node.puzzleId, puzzlesConfig)
        break
      case 'resource':
        this.collectResource(node)
        break
      case 'normal':
        if (node.monsters && node.monsters.length > 0) {
          const randomMonster = Phaser.Utils.Array.GetRandom(node.monsters) as string
          this.startCombat(randomMonster, node.nodeId, false)
        }
        break
    }

    gameStore.revealRegion(node.nodeId)
  }

  /**
   * P0: 点击移动 —— velocity steering 模式（对齐 Phaser 官方 topdown RPG 示例）
   * 不再用 tween 直接改 player.x/y（与 arcade body 冲突导致抖动）
   * 改为设置 moveTarget，update() 中每帧朝目标设 velocity，到达后归零
   */
  private movePlayerTo(x: number, y: number) {
    this.moveTarget = { x, y }
  }

  private revealRegion(regionId: string) {
    const fog = this.fogRects.get(regionId)
    if (fog) {
      fog.destroy()
      this.fogRects.delete(regionId)
    }
  }

  /**
   * 步骤 2：8 动作帧动画创建（8×8 网格切分，参考 app.js prepareSheetFrames）
   * 仅 lina/ayu 有 v10 精灵图，其他角色保留 fallback（无动画）
   */
  private preparePlayerAnimations(roleId: string, spriteKey: string) {
    if (!this.actionsList || this.actionsList.length === 0) {
      // fallback：旧 walk 动画（64×64 切分）
      this.createLegacyWalkAnimation(spriteKey)
      return
    }
    try {
      const texture = this.textures.get(spriteKey)
      const source = texture.getSourceImage() as HTMLImageElement
      const frameWidth = Math.floor(source.width / COLS)
      const frameHeight = Math.floor(source.height / ROWS)
      if (frameWidth < 8 || frameHeight < 8) {
        this.createLegacyWalkAnimation(spriteKey)
        return
      }

      this.actionsList.forEach((action: ActionDef) => {
        const animKey = `${action.id}_${roleId}`
        if (this.anims.exists(animKey)) return
        const frames = action.frames.map((colIdx: number) => ({
          key: spriteKey,
          frame: action.row * COLS + colIdx
        }))
        this.anims.create({
          key: animKey,
          frames,
          frameRate: Math.max(1, Math.floor(action.fps * ANIMATION_SPEED_FACTOR)),
          repeat: action.repeat
        })
      })
    } catch (e) {
      console.warn(`[MapExploreScene] Failed to create 8-action animations for ${roleId}:`, e)
      this.createLegacyWalkAnimation(spriteKey)
    }
  }

  // fallback：旧 64×64 walk 动画（保留兼容 zhixia/jiangxun/laodeng）
  private createLegacyWalkAnimation(spriteKey: string) {
    const animKey = `walk_${spriteKey}`
    if (this.anims.exists(animKey)) return
    try {
      const texture = this.textures.get(spriteKey)
      const source = texture.getSourceImage() as HTMLImageElement
      const cols = Math.max(1, Math.floor(source.width / 64))
      const totalFrames = cols * Math.max(1, Math.floor(source.height / 64))
      const framesToUse = Math.min(4, totalFrames)
      const frameNumbers = Array.from({ length: framesToUse }, (_, i) => i)
      this.anims.create({
        key: animKey,
        frames: this.anims.generateFrameNumbers(spriteKey, { frames: frameNumbers }),
        frameRate: 8,
        repeat: -1
      })
    } catch (e) {
      console.warn(`[MapExploreScene] Failed to create walk animation for ${spriteKey}:`, e)
    }
  }

  /**
   * 步骤 2：绘制 23 障碍物碰撞区（参考 app.js drawObstacles）
   * 坐标系 10000×6000，与分层地图一致
   * 步骤 1 v2：graphics 存入 collisionGraphicsList，默认隐藏，C 键 toggle
   */
  private drawObstacles() {
    // 优先使用章节地图配置内的 obstacles 字段（ch2/ch3/ch4 独立配置），
    // fallback 到全局 obstacles.json（ch1 兼容）
    const chapterMap = this.getChapterMap()
    const obstaclesConfig = (chapterMap?.obstacles && chapterMap.obstacles.length)
      ? chapterMap.obstacles
      : (this.cache.json.get('obstacles') || [])
    if (!obstaclesConfig.length) return
    this.obstaclesGroup = this.physics.add.staticGroup()
    const colors: Record<string, number> = {
      building: 0x6b7280,
      edge: 0x4b5563,
      green: 0x10b981,
      water: 0x3b82f6,
      planter: 0x92400e,
      lamp: 0xfbbf24,
      // 资源整合：ch2/ch3/ch4 新增障碍物类型
      tree: 0xffb7c5,    // 樱花树
      bench: 0x8b6b5a,   // 实验室桌椅
      rack: 0x4a6a9a,    // 机柜
      cable: 0x6a6a8a,   // 电缆堆
      pillar: 0xe0d0b0,  // 纪念柱
      flag: 0xc8102e     // 彩旗
    }
    obstaclesConfig.forEach((obs: any) => {
      // 可视化边框（半透明）
      const g = this.add.graphics()
      const color = colors[obs.type] || 0x808080
      g.fillStyle(color, 0.18)
      g.lineStyle(2, color, 0.5)
      g.fillRect(obs.x, obs.y, obs.w, obs.h)
      g.strokeRect(obs.x, obs.y, obs.w, obs.h)
      g.setDepth(1)
      g.setVisible(false) // 步骤 1 v2：默认隐藏
      this.collisionGraphicsList.push(g)
      // 物理碰撞 zone
      const zone = this.add.zone(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w, obs.h) as any
      this.physics.add.existing(zone, true)
      this.obstaclesGroup.add(zone)
    })
  }

  /**
   * 步骤 2 v2：J 键飞射物（仅视觉演示，800ms 销毁，无伤害）
   * 步骤 1 v2：使用 ProjectileData + 7 点拖尾 + isActionLocked 动作锁定
   * 参考 app.js castProjectile + CombatOverlayScene 实现
   */
  private castProjectile() {
    if (this.attackCooldown > 0) return
    if (this.isActionLocked) return
    if (!this.projectilesGroup) return
    if (!this.anims.exists(`attack_${this.playerRoleId}`)) return

    // 步骤 1 v2：动作锁定，attack 动画期间禁止移动
    this.isActionLocked = true
    this.player.play(`attack_${this.playerRoleId}`)
    this.player.once('animationcomplete', () => {
      this.isActionLocked = false
      const idleKey = this.currentForm === 'cat'
        ? `catRun_${this.playerRoleId}`
        : `idle_${this.playerRoleId}`
      if (this.anims.exists(idleKey)) this.player.play(idleKey, true)
    })

    // 取当前装备作为弹射物来源（受 currentEquipIndex 控制）
    const equip = this.equipmentList[this.currentEquipIndex] || this.equipmentList[0]
    if (!equip || !this.textures.exists('lina_projectiles')) {
      this.attackCooldown = 400
      return
    }
    const direction = this.player.flipX ? -1 : 1
    const startX = this.player.x + direction * 40
    const startY = this.player.y - 20
    const projectile = this.add.sprite(startX, startY, 'lina_projectiles', equip.projectileFrame)
    projectile.setDisplaySize(40, 40)
    projectile.setDepth(15)
    projectile.setFlipX(direction < 0)
    this.projectilesGroup.add(projectile)

    // 步骤 1 v2：创建 7 点拖尾 graphics + ProjectileData
    const trailGraphics = this.add.graphics()
    trailGraphics.setDepth(14)
    const projData: ProjectileData = {
      sprite: projectile,
      trail: [],
      trailGraphics
    }
    this.activeProjectiles.push(projData)

    // 弹道 tween + impact 爆炸
    this.tweens.add({
      targets: projectile,
      x: startX + direction * equip.range * 0.3,
      duration: 600,
      ease: 'Power1',
      onComplete: () => {
        // impact 爆炸：8 粒子散射
        const impact = this.add.sprite(projectile.x, projectile.y, 'lina_projectiles', equip.impactFrame)
        impact.setDisplaySize(60, 60)
        impact.setDepth(16)
        this.tweens.add({
          targets: impact,
          scale: 1.6,
          alpha: 0,
          duration: 300,
          onComplete: () => impact.destroy()
        })
        // 8 粒子散射
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2
          const particle = this.add.circle(projectile.x, projectile.y, 4, equip.colorHex)
          particle.setDepth(16)
          this.tweens.add({
            targets: particle,
            x: projectile.x + Math.cos(angle) * 40,
            y: projectile.y + Math.sin(angle) * 40,
            alpha: 0,
            duration: 400,
            onComplete: () => particle.destroy()
          })
        }
        // 步骤 1 v2：销毁拖尾 graphics 并从 activeProjectiles 移除
        trailGraphics.destroy()
        const idx = this.activeProjectiles.indexOf(projData)
        if (idx >= 0) this.activeProjectiles.splice(idx, 1)
        projectile.destroy()
      }
    })

    this.attackCooldown = equip.cooldown || 400
  }

  /**
   * 步骤 2 v2：L 键双形态切换（猫 ↔ 人）
   * 步骤 1 v2：动作锁定 + 法杖可见性切换
   */
  private transformForm() {
    if (this.isActionLocked) return
    // 步骤 1 v2：无 transform 动画时直接切换（含法杖可见性）
    if (!this.anims.exists(`transform_${this.playerRoleId}`)) {
      this.currentForm = this.currentForm === 'cat' ? 'human' : 'cat'
      if (this.staffSprite) {
        this.staffSprite.setVisible(this.currentForm === 'human')
      }
      this.updateFormText()
      return
    }
    // 步骤 1 v2：transform 动画期间动作锁定
    this.isActionLocked = true
    this.player.play(`transform_${this.playerRoleId}`)
    this.player.once('animationcomplete', () => {
      this.isActionLocked = false
      this.currentForm = this.currentForm === 'cat' ? 'human' : 'cat'
      // 步骤 1 v2：法杖仅人形可见
      if (this.staffSprite) {
        this.staffSprite.setVisible(this.currentForm === 'human')
      }
      const idleKey = this.currentForm === 'cat'
        ? `catRun_${this.playerRoleId}`
        : `idle_${this.playerRoleId}`
      if (this.anims.exists(idleKey)) this.player.play(idleKey, true)
      this.updateFormText()
    })
  }

  private updateFormText() {
    if (this.formText) {
      this.formText.setText(
        `形态: ${this.currentForm === 'cat' ? '🐱 猫形' : '👤 人形'}（按 L 切换 / 按 J 攻击）`
      )
    }
  }

  private startCombat(monsterId: string, nodeId: string, isBoss: boolean) {
    const gameStore = useGameStore()
    if (this.isInCombat()) return

    if (gameStore.state) {
      if (!gameStore.state.monsters[nodeId]) {
        gameStore.state.monsters[nodeId] = {
          state: 'patrol',
          failCount: 0
        }
      }
      gameStore.setCombatState({
        state: 'init',
        activeCombatId: nodeId,
        monsterId
      })
    }
    this.scene.launch('CombatOverlayScene', { monsterId, nodeId, isBoss })
  }

  private triggerEvent(eventId: string) {
    window.dispatchEvent(
      new CustomEvent('map-event-trigger', {
        detail: { eventId, source: 'map' }
      })
    )
  }

  private triggerPuzzle(puzzleId: string, puzzlesConfig: any[]) {
    const puzzle = puzzlesConfig.find(p => p.puzzleId === puzzleId)
    if (!puzzle) {
      this.showFloatingText({ position: { x: this.player.x, y: this.player.y } }, '谜题配置缺失', '#FF0000')
      return
    }

    window.dispatchEvent(
      new CustomEvent('puzzle-trigger', {
        detail: { puzzle }
      })
    )
  }

  private collectResource(node: any) {
    const gameStore = useGameStore()
    if (gameStore.state?.map.completedNodes.includes(node.nodeId)) {
      this.showFloatingText(node, '已收集过', '#888888')
      return
    }

    // 节点冷却检查（资源点 30 分钟）
    const now = Date.now()
    const cooldowns = gameStore.state?.map.nodeCooldowns || {}
    const cdEnd = cooldowns[node.nodeId] || 0
    if (now < cdEnd) {
      const remainMin = Math.ceil((cdEnd - now) / 60000)
      this.showFloatingText(node, `冷却中 ${remainMin} 分钟`, '#FF6B6B')
      return
    }

    if (node.rewards) {
      if (node.rewards.coins) {
        gameStore.addCoins(node.rewards.coins)
      }
      if (node.rewards.itemId) {
        gameStore.addItem(node.rewards.itemId, 1)
      }
    }
    gameStore.completeNode(node.nodeId)

    // 写入冷却（30 分钟）
    if (gameStore.state) {
      if (!gameStore.state.map.nodeCooldowns) {
        gameStore.state.map.nodeCooldowns = {}
      }
      gameStore.state.map.nodeCooldowns[node.nodeId] = now + 30 * 60 * 1000
    }

    this.showFloatingText(node, '获得奖励!', '#00FF00')
    gameStore.saveSave()
  }

  private showFloatingText(node: any, text: string, color: string) {
    const floatingText = this.add.text(node.position.x, node.position.y - 30, text, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: color
    })
    floatingText.setOrigin(0.5)
    floatingText.setDepth(20)
    this.tweens.add({
      targets: floatingText,
      y: node.position.y - 60,
      alpha: 0,
      duration: 1500,
      onComplete: () => floatingText.destroy()
    })
  }

  shutdown() {
    if (this.monsterAI) {
      this.monsterAI.destroy()
    }
    this.events.off('monster-attack')
    // 步骤 1 v2：移除 window 事件监听，防止内存泄漏
    window.removeEventListener('staff-switch', this.handleStaffSwitch as EventListener)
    // C.3 移动端适配：移除摇杆事件监听 + 清理 window 引用
    this.events.off('mobile-joystick-move')
    this.events.off('mobile-joystick-stop')
    if ((window as any).__phaserScene === this) {
      ;(window as any).__phaserScene = undefined
    }
    this.joystickDir = null
    // 步骤 1 v2：清理残留弹射物拖尾
    this.activeProjectiles.forEach(p => {
      if (p.trailGraphics) p.trailGraphics.destroy()
      if (p.sprite && p.sprite.active) p.sprite.destroy()
    })
    this.activeProjectiles = []
    // P0/P1: 清理新增资源 —— 阴影、moveTarget、tween
    if (this.playerShadow) {
      this.playerShadow.destroy()
      this.playerShadow = null as any
    }
    this.moveTarget = null
    this.dustTimer = 0
    // F7: 补充清理 - 停止所有 tween、复位标志位
    this.tweens.killTweensOf(this.player)
    // P0: isTweening 已删除，不再复位
    this.isActionLocked = false
    this.lastSaveTime = 0
  }
}
