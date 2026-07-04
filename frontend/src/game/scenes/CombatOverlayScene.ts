import Phaser from 'phaser'
import { CombatSimulator } from '../combat/simulator'
import { useGameStore } from '../../stores/game'
import type { ActiveSkill, CombatLog } from '../combat/types'

interface CombatInitData {
  monsterId: string
  nodeId: string
  isBoss: boolean
}

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
  colorHex: string
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

// 步骤 3 v2：弹射物拖尾数据结构（7 点轨迹）
interface ProjectileData {
  sprite: Phaser.GameObjects.Sprite
  trail: { x: number; y: number }[]
  trailGraphics: Phaser.GameObjects.Graphics
}

const COLS = 8
const ROWS = 8
const ANIMATION_SPEED_FACTOR = 0.68

export class CombatOverlayScene extends Phaser.Scene {
  private simulator!: CombatSimulator
  private playerHpBar!: Phaser.GameObjects.Graphics
  private enemyHpBar!: Phaser.GameObjects.Graphics
  private playerAtbBar!: Phaser.GameObjects.Graphics
  private enemyAtbBar!: Phaser.GameObjects.Graphics
  private speedText!: Phaser.GameObjects.Text
  private logText!: Phaser.GameObjects.Text
  private isRunning = false
  private monsterId = ''
  private nodeId = ''
  private isBoss = false
  // 资源整合：怪物立绘帧名（来自 monsters.json.spriteFrame，对应 enemies_atlas 帧）
  private monsterSpriteFrame = ''
  private monsterName = ''
  private playerSprite!: Phaser.GameObjects.Sprite
  private enemySprite!: Phaser.GameObjects.Container
  private lastLogCount = 0
  private playerRoleId = 'lina'
  private equipmentList: EquipmentDef[] = []
  private actionsList: ActionDef[] = []
  private displayedPlayerHp = 1.0
  private displayedEnemyHp = 1.0
  private projectilesGroup!: Phaser.GameObjects.Group
  // 步骤 3 v2：法杖切换 + 弹射物拖尾 + 死亡 toggle
  private currentEquipIndex = 0
  private activeProjectiles: ProjectileData[] = []
  private isDeadToggled = false
  private staffSwitcherButtons: Phaser.GameObjects.Text[] = []

  constructor() {
    super({ key: 'CombatOverlayScene' })
  }

  init(data: CombatInitData) {
    const gameStore = useGameStore()
    const monstersConfig = this.cache.json.get('monsters') || []
    const skillsConfig = this.cache.json.get('skills') || []
    const rolesConfig = this.cache.json.get('roles') || []
    this.actionsList = this.cache.json.get('actions') || []
    this.equipmentList = this.cache.json.get('equipment') || []

    this.monsterId = data.monsterId
    this.nodeId = data.nodeId
    this.isBoss = data.isBoss || false

    const monster = monstersConfig.find((m: any) => m.monsterId === data.monsterId)
    if (!monster) {
      this.scene.stop()
      return
    }

    // 资源整合：保存怪物立绘帧名 + 怪物名（供 create() 使用）
    this.monsterSpriteFrame = monster.spriteFrame || ''
    this.monsterName = monster.name || 'M'

    const playerState = gameStore.player
    if (!playerState) {
      this.scene.stop()
      return
    }

    if (gameStore.state) {
      gameStore.setForm('human')
      gameStore.setCombatState({
        state: 'init',
        activeCombatId: data.nodeId,
        monsterId: data.monsterId
      })
    }

    const role = rolesConfig.find((r: any) => r.roleId === playerState.roleId)
    const mainAttr = role?.mainAttr || 'knowledge'
    this.playerRoleId = playerState.roleId

    const equippedSkills: ActiveSkill[] = playerState.equippedSkills
      .filter((skillId): skillId is string => skillId !== null)
      .map(skillId => {
        const skillConfig = skillsConfig.find((s: any) => s.skillId === skillId)
        if (!skillConfig) {
          return {
            skillId,
            name: skillId,
            cooldown: 0,
            currentCd: 0,
            multiplier: 1.0,
            target: 'enemy' as const,
            unavoidable: false
          }
        }
        return {
          skillId: skillConfig.skillId,
          name: skillConfig.name,
          cooldown: skillConfig.cooldown,
          currentCd: 0,
          multiplier: skillConfig.multiplier,
          target: 'enemy' as const,
          unavoidable: skillConfig.unavoidable || false,
          effect: skillConfig.effect || undefined
        }
      })

    let initialShield = 0
    if (gameStore.state?.monsters[this.nodeId]) {
      const monsterInfo = gameStore.state.monsters[this.nodeId]
      if (monsterInfo.failCount >= 3 && !this.isBoss) {
        initialShield = 50
      } else if (monsterInfo.failCount >= 2 && this.isBoss) {
        initialShield = Math.floor(
          (100 + playerState.level * 18 + playerState.attrs.resilience * 12) * 0.3
        )
      }
    }

    // GDD §4.4 注入玩家被动技能（5 角色 × 2 = 10 条，按 roleId 过滤）
    const passives = skillsConfig.filter(
      (s: any) => s.type === 'passive' && s.roleId === playerState.roleId
    )

    this.simulator = new CombatSimulator({
      playerState: {
        name: playerState.name,
        level: playerState.level,
        attrs: playerState.attrs,
        combatStats: playerState.combatStats,
        combatRole: playerState.combatRole,
        mainAttr,
        initialShield
      },
      enemyConfig: {
        monsterId: monster.monsterId,
        name: monster.name,
        hp: monster.hp,
        atk: monster.atk,
        def: monster.def,
        actionInterval: monster.actionInterval,
        evasionRate: monster.evasionRate,
        skills: monster.skills,
        phases: monster.phases
      },
      equippedSkills,
      passives,
      // GDD §5.3 怪物技能循环
      skillCycle: monster.skillCycle,
      // GDD §4.4 Boss 阶段专属技能详细参数
      phaseSkills: monster.phaseSkills
    })
  }

  create() {
    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.85)

    this.add.text(640, 50, this.isBoss ? 'Boss 战!' : '战斗开始!', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: this.isBoss ? '#FFD700' : '#ffffff'
    }).setOrigin(0.5)

    const roleId = this.playerRoleId

    // 为玩家角色创建 8 动作动画（8×8 精灵表切分）
    this.preparePlayerAnimations(roleId)

    // 玩家精灵（左侧）—— 优先用 v10 精灵表播放 idle 动画，fallback 立绘
    const v10Key = `sprite_${roleId}_v10`
    const spriteKey = `sprite_${roleId}`
    const portraitKey = `portrait_${roleId}`
    const preferredKey = this.textures.exists(v10Key) ? v10Key : spriteKey

    if (this.textures.exists(preferredKey)) {
      this.playerSprite = this.add.sprite(150, 280, preferredKey, 0)
      this.playerSprite.setDisplaySize(180, 180)
      const idleAnimKey = `${roleId}_combat_idle`
      if (this.anims.exists(idleAnimKey)) {
        this.playerSprite.play(idleAnimKey, true)
      }
    } else if (this.textures.exists(portraitKey)) {
      this.playerSprite = this.add.sprite(150, 280, portraitKey)
      this.playerSprite.setDisplaySize(180, 180)
    } else {
      this.playerSprite = this.add.sprite(150, 280, portraitKey)
      this.add.circle(150, 280, 50, 0x4ECDC4).setStrokeStyle(3, 0xffffff)
    }

    this.add.text(200, 150, this.simulator.getState().player.name, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#4ECDC4'
    }).setOrigin(0.5)

    // 玩家 HP 条 + ATB 行动条
    this.playerHpBar = this.add.graphics()
    this.drawHpBar(this.playerHpBar, 100, 180, 200, 16, 1.0, 0x4ECDC4)
    this.playerAtbBar = this.add.graphics()
    this.drawAtbBar(this.playerAtbBar, 100, 200, 200, 6, 0.0, 0xFFD700)

    // 怪物侧（右侧）- Container 包裹便于受击抖动 + idle 呼吸
    const enemyState = this.simulator.getState().enemy
    // 资源整合：优先使用 enemies_atlas 立绘，fallback 粉红方块 + 首字母
    let enemyDisplay: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle
    const hasAtlas = this.monsterSpriteFrame && this.textures.exists('enemies_atlas')
    if (hasAtlas) {
      // 立绘显示尺寸：Boss 240×320，普通怪物 200×280（原图 744×1039，按比例缩放）
      const displayW = this.isBoss ? 240 : 200
      const displayH = this.isBoss ? 320 : 280
      enemyDisplay = this.add.image(0, 0, 'enemies_atlas', this.monsterSpriteFrame)
      enemyDisplay.setDisplaySize(displayW, displayH)
      // Boss 加红色 tint 提升区分度
      if (this.isBoss) enemyDisplay.setTint(0xffaaaa)
    } else {
      enemyDisplay = this.add.rectangle(0, 0, 100, 100, 0xFFB7C5).setStrokeStyle(3, 0xffffff)
    }
    const enemyLabel = this.add.text(0, hasAtlas ? 160 : 0, enemyState.name.charAt(0) || 'M', {
      fontFamily: 'Arial',
      fontSize: '40px',
      color: '#ffffff'
    }).setOrigin(0.5)
    // 立绘存在时隐藏首字母标签
    if (hasAtlas) enemyLabel.setVisible(false)
    this.enemySprite = this.add.container(1130, 280, [enemyDisplay, enemyLabel])
    // idle 呼吸动画
    this.tweens.add({
      targets: this.enemySprite,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    this.add.text(1080, 150, enemyState.name, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#FFB7C5'
    }).setOrigin(0.5)

    this.enemyHpBar = this.add.graphics()
    this.drawHpBar(this.enemyHpBar, 980, 180, 200, 16, 1.0, 0xFFB7C5)
    this.enemyAtbBar = this.add.graphics()
    this.drawAtbBar(this.enemyAtbBar, 980, 200, 200, 6, 0.0, 0xFFD700)

    // 战斗日志面板（最近 5 条）
    this.logText = this.add.text(440, 540, '', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.4)',
      padding: { x: 8, y: 6 },
      wordWrap: { width: 400 }
    }).setOrigin(0.5, 1)

    // 弹射物组
    this.projectilesGroup = this.add.group()

    // 步骤 3 v2：法杖切换 UI（3 个按钮，仅 lina 有装备变体）
    if (this.playerRoleId === 'lina' && this.equipmentList.length > 0) {
      this.add.text(150, 410, '法杖:', {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#ffffff'
      }).setOrigin(0, 0.5)

      this.equipmentList.forEach((equip, idx) => {
        const btn = this.add.text(200 + idx * 70, 410, equip.id === 'amethyst-staff' ? '紫晶' : equip.id === 'sakura-staff' ? '樱花' : '开题', {
          fontFamily: 'Arial',
          fontSize: '13px',
          color: '#ffffff',
          backgroundColor: idx === this.currentEquipIndex ? equip.color : '#1A3C6E',
          padding: { x: 8, y: 4 }
        }).setOrigin(0, 0.5).setInteractive()

        btn.on('pointerdown', () => {
          this.switchStaff(idx)
        })
        this.staffSwitcherButtons.push(btn)
      })

      // 标签提示
      this.add.text(150, 435, '点击切换弹射物法杖（影响 projectileFrame/impactFrame）', {
        fontFamily: 'Arial',
        fontSize: '11px',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5)
    }

    // 步骤 3 v2：D 键死亡 toggle（测试 death 动作帧动画）
    if (this.input.keyboard) {
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D).on('down', () => {
        this.toggleDeathAnimation()
      })
    }

    // 步骤 3 v2：监听外部法杖切换事件（与 MapView 包裹面板联动）
    window.addEventListener('staff-switch', this.handleStaffSwitch as EventListener)

    // 速度控制按钮
    this.speedText = this.add.text(640, 650, '速度: 1x', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5)

    const btn1x = this.add.text(500, 650, '1x', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#1A3C6E',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive()

    btn1x.on('pointerdown', () => {
      this.simulator.setSpeed(1)
      this.speedText.setText('速度: 1x')
    })

    const btn2x = this.add.text(640, 680, '2x', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#1A3C6E',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive()

    btn2x.on('pointerdown', () => {
      this.simulator.setSpeed(2)
      this.speedText.setText('速度: 2x')
    })

    const btnSkip = this.add.text(780, 650, '跳过', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#FFB7C5',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive()

    btnSkip.on('pointerdown', () => {
      this.simulator.skip()
      this.isRunning = false
      this.endCombat()
    })

    this.displayedPlayerHp = 1.0
    this.displayedEnemyHp = 1.0
    this.lastLogCount = 0
    this.isRunning = true
  }

  update(_time: number, delta: number) {
    if (!this.isRunning) return

    this.simulator.step(delta / 1000)

    const state = this.simulator.getState()
    const playerHpPercent = state.player.hp / state.player.maxHp
    const enemyHpPercent = state.enemy.hp / state.enemy.maxHp

    // HP 条平滑过渡（tween 200ms）
    this.displayedPlayerHp = Phaser.Math.Linear(this.displayedPlayerHp, playerHpPercent, 0.15)
    this.displayedEnemyHp = Phaser.Math.Linear(this.displayedEnemyHp, enemyHpPercent, 0.15)
    this.drawHpBar(this.playerHpBar, 100, 180, 200, 16, this.displayedPlayerHp, 0x4ECDC4)
    this.drawHpBar(this.enemyHpBar, 980, 180, 200, 16, this.displayedEnemyHp, 0xFFB7C5)

    // ATB 行动条
    const playerAtbPercent = state.player.actionInterval > 0
      ? Math.min(1, state.player.currentActionGauge / state.player.actionInterval)
      : 0
    const enemyAtbPercent = state.enemy.actionInterval > 0
      ? Math.min(1, state.enemy.currentActionGauge / state.enemy.actionInterval)
      : 0
    this.drawAtbBar(this.playerAtbBar, 100, 200, 200, 6, playerAtbPercent, 0xFFD700)
    this.drawAtbBar(this.enemyAtbBar, 980, 200, 200, 6, enemyAtbPercent, 0xFFD700)

    // 步骤 3 v2：弹射物拖尾更新
    this.updateProjectilesTrail()

    // 战斗日志更新 + 动作帧动画触发
    const newLogs = state.log.slice(this.lastLogCount)
    if (newLogs.length > 0) {
      newLogs.forEach(log => this.handleCombatLog(log))
      this.lastLogCount = state.log.length
      this.updateLogPanel(state.log)
    }

    if (state.isFinished) {
      this.isRunning = false
      this.endCombat()
    }
  }

  /**
   * 步骤 3 v2：场景关闭时清理资源，防止内存泄漏
   */
  shutdown() {
    window.removeEventListener('staff-switch', this.handleStaffSwitch as EventListener)
    // 清理残留弹射物拖尾
    this.activeProjectiles.forEach(p => {
      if (p.trailGraphics) p.trailGraphics.destroy()
      if (p.sprite && p.sprite.active) p.sprite.destroy()
    })
    this.activeProjectiles = []
    this.staffSwitcherButtons = []
  }

  /**
   * 为玩家角色创建 8 动作动画（8×8 精灵表切分，参考素材站 app.js prepareSheetFrames）
   */
  private preparePlayerAnimations(roleId: string) {
    const v10Key = `sprite_${roleId}_v10`
    const spriteKey = `sprite_${roleId}`
    const textureKey = this.textures.exists(v10Key) ? v10Key : spriteKey

    if (!this.textures.exists(textureKey)) return
    if (this.actionsList.length === 0) return

    const texture = this.textures.get(textureKey)
    const source = texture.getSourceImage() as HTMLImageElement
    const frameWidth = source.width / COLS
    const frameHeight = source.height / ROWS

    this.actionsList.forEach((action: ActionDef) => {
      const y0 = action.row * frameHeight
      // 注册 8 帧到 texture（如果尚未注册）
      for (let col = 0; col < COLS; col++) {
        const frameName = `${roleId}_combat_${action.id}-${col}`
        const x0 = col * frameWidth
        if (!texture.has(frameName)) {
          texture.add(frameName, 0, x0, y0, frameWidth, frameHeight)
        }
      }
      // 创建循环动画
      const loopKey = `${roleId}_combat_${action.id}`
      if (!this.anims.exists(loopKey)) {
        const frames = action.frames.map(col => ({
          key: textureKey,
          frame: `${roleId}_combat_${action.id}-${col}`
        }))
        this.anims.create({
          key: loopKey,
          frames,
          frameRate: Math.max(1, action.fps * ANIMATION_SPEED_FACTOR),
          repeat: action.repeat
        })
      }
      // 创建单次播放变体（once）
      const onceKey = `${roleId}_combat_${action.id}-once`
      if (!this.anims.exists(onceKey)) {
        const frames = action.frames.map(col => ({
          key: textureKey,
          frame: `${roleId}_combat_${action.id}-${col}`
        }))
        this.anims.create({
          key: onceKey,
          frames,
          frameRate: Math.max(1, action.fps * ANIMATION_SPEED_FACTOR),
          repeat: 0
        })
      }
    })

    // 为 lina 创建 3 种装备的 attack 动画变体
    if (roleId === 'lina' && this.equipmentList.length > 0) {
      this.equipmentList.forEach((equip: EquipmentDef) => {
        if (!this.textures.exists(equip.attackTextureKey)) return
        const attackTexture = this.textures.get(equip.attackTextureKey)
        const attackSource = attackTexture.getSourceImage() as HTMLImageElement
        const aFrameWidth = attackSource.width / COLS
        const aFrameHeight = attackSource.height / ROWS
        const attackAction = this.actionsList.find((a: ActionDef) => a.id === 'attack')
        if (!attackAction) return

        const y0 = attackAction.row * aFrameHeight
        for (let col = 0; col < COLS; col++) {
          const frameName = `${roleId}_combat_attack_${equip.id}-${col}`
          const x0 = col * aFrameWidth
          if (!attackTexture.has(frameName)) {
            attackTexture.add(frameName, 0, x0, y0, aFrameWidth, aFrameHeight)
          }
        }
        const attackOnceKey = `${roleId}_combat_attack_${equip.id}-once`
        if (!this.anims.exists(attackOnceKey)) {
          const frames = attackAction.frames.map(col => ({
            key: equip.attackTextureKey,
            frame: `${roleId}_combat_attack_${equip.id}-${col}`
          }))
          this.anims.create({
            key: attackOnceKey,
            frames,
            frameRate: Math.max(1, attackAction.fps * ANIMATION_SPEED_FACTOR),
            repeat: 0
          })
        }
      })
    }
  }

  /**
   * 处理战斗日志：触发动作帧动画/弹射物/5 定位特效
   */
  private handleCombatLog(log: CombatLog) {
    if (!this.playerSprite) return

    const isPlayerAction = log.actorId === 'player'
    const targetIsPlayer = log.targetId === 'player'

    if (isPlayerAction && log.action === 'attack') {
      // 玩家攻击：播放 attack 动作帧动画 + 发射弹射物
      const attackKey = `${this.playerRoleId}_combat_attack-once`
      const equipAttackKey = this.playerRoleId === 'lina' && this.equipmentList.length > 0
        ? `${this.playerRoleId}_combat_attack_${this.equipmentList[0].id}-once`
        : attackKey
      const finalKey = this.anims.exists(equipAttackKey) ? equipAttackKey : attackKey
      if (this.anims.exists(finalKey)) {
        this.playerSprite.play(finalKey, true)
        this.playerSprite.once('animationcomplete', () => {
          const idleKey = `${this.playerRoleId}_combat_idle`
          if (this.anims.exists(idleKey)) this.playerSprite.play(idleKey, true)
        })
      }
      this.castProjectile()
      // 玩家普攻命中：怪物受击反馈 + 伤害数字
      if (log.damage && log.damage > 0) {
        this.flashEnemyDamage()
        this.showFloatingDamage(1130 + Phaser.Math.Between(-20, 20), 240, `${log.damage}`, '#ffffff')
      }
    } else if (targetIsPlayer && log.damage && log.damage > 0) {
      // 玩家受击：播放 hit 动作帧动画 + 闪红
      const hitKey = `${this.playerRoleId}_combat_hit-once`
      if (this.anims.exists(hitKey)) {
        this.playerSprite.play(hitKey, true)
        this.playerSprite.once('animationcomplete', () => {
          const idleKey = `${this.playerRoleId}_combat_idle`
          if (this.anims.exists(idleKey)) this.playerSprite.play(idleKey, true)
        })
      }
      this.flashDamage()
    }

    // 5 战斗定位特效（基于 isCrit/effect.type）
    if (log.isCrit) {
      this.showCritEffect()
    }
    if (log.isEvaded) {
      this.showEvadeEffect(targetIsPlayer ? 150 : 1130)
    }
    // 检测 effect.type（从 action 字段推断）
    if (log.action.includes('summon')) this.showSummonEffect()
    if (log.action.includes('multi_hit')) this.showMultiHitEffect(log.damage || 0)
    if (log.action.includes('armor_pen')) this.showArmorPenEffect()
    if (log.action.includes('reflect')) this.showReflectEffect(targetIsPlayer ? 150 : 1130)
  }

  /**
   * 发射弹射物（参考素材站 app.js castProjectile）
   * 步骤 3 v2：使用 ProjectileData + 7 点拖尾 + currentEquipIndex 切换法杖
   */
  private castProjectile() {
    if (!this.textures.exists('lina_projectiles')) return
    const startX = 220
    const startY = 280
    const endX = 1080
    const endY = 280
    // 步骤 3 v2：使用当前选中的法杖（受 currentEquipIndex 控制）
    const equip = this.equipmentList[this.currentEquipIndex] || this.equipmentList[0]
    const frame = equip ? equip.projectileFrame : 0
    const equipColorHex = equip ? (parseInt(equip.color.replace('#', ''), 16) || 0xd98ad7) : 0xd98ad7

    const projectile = this.add.sprite(startX, startY, 'lina_projectiles', frame)
    projectile.setOrigin(0.5)
    projectile.setScale(equip ? equip.projectileScale : 0.15)
    projectile.setDepth(50)
    projectile.setRotation(Math.atan2(endY - startY, endX - startX))
    if (this.projectilesGroup) this.projectilesGroup.add(projectile)

    // 步骤 3 v2：创建 7 点拖尾 graphics + ProjectileData
    const trailGraphics = this.add.graphics()
    trailGraphics.setDepth(49)
    const projData: ProjectileData = {
      sprite: projectile,
      trail: [],
      trailGraphics
    }
    this.activeProjectiles.push(projData)

    this.tweens.add({
      targets: projectile,
      x: endX,
      y: endY,
      duration: 280,
      ease: 'Sine.easeOut',
      onComplete: () => {
        // impact 爆炸
        const impactFrame = equip ? equip.impactFrame : 3
        const impact = this.add.sprite(endX, endY, 'lina_projectiles', impactFrame)
          .setOrigin(0.5)
          .setScale((equip ? equip.projectileScale : 0.15) * 1.3)
          .setDepth(52)
        this.tweens.add({
          targets: impact,
          scale: (equip ? equip.projectileScale : 0.15) * 1.6,
          alpha: 0,
          duration: 260,
          ease: 'Sine.easeOut',
          onComplete: () => impact.destroy()
        })
        // 步骤 3 v2：8 个粒子散射（使用法杖专属颜色）
        for (let i = 0; i < 8; i++) {
          const angle = i * Math.PI / 4
          const dot = this.add.circle(endX, endY, 3, equipColorHex, 0.75).setDepth(51)
          this.tweens.add({
            targets: dot,
            x: endX + Math.cos(angle) * 26,
            y: endY + Math.sin(angle) * 26,
            alpha: 0,
            duration: 260,
            ease: 'Sine.easeOut',
            onComplete: () => dot.destroy()
          })
        }
        // 步骤 3 v2：销毁拖尾 graphics 并从 activeProjectiles 移除
        trailGraphics.destroy()
        const idx = this.activeProjectiles.indexOf(projData)
        if (idx >= 0) this.activeProjectiles.splice(idx, 1)
        projectile.destroy()
      }
    })

    // 步骤 3 v2：法杖闪光环（使用法杖专属颜色）
    const ring = this.add.circle(startX, startY, 8, equipColorHex, 0.44).setDepth(49)
    this.tweens.add({
      targets: ring,
      radius: 28,
      alpha: 0,
      duration: 220,
      ease: 'Sine.easeOut',
      onComplete: () => ring.destroy()
    })
  }

  /**
   * 步骤 3 v2：弹射物拖尾更新（在 update() 中调用）
   * 每个弹射物记录最近 7 个位置点，绘制渐变 alpha 的圆形拖尾
   */
  private updateProjectilesTrail() {
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

  /**
   * 步骤 3 v2：法杖切换（UI 按钮调用）
   */
  private switchStaff(idx: number) {
    if (idx < 0 || idx >= this.equipmentList.length) return
    this.currentEquipIndex = idx
    // 更新按钮背景色高亮
    this.staffSwitcherButtons.forEach((btn, i) => {
      const equip = this.equipmentList[i]
      btn.setBackgroundColor(i === idx ? equip.color : '#1A3C6E')
    })
  }

  /**
   * 步骤 3 v2：外部 staff-switch 事件处理（与 MapView 包裹面板联动）
   */
  private handleStaffSwitch = (e: Event) => {
    const detail = (e as CustomEvent).detail
    const idx = detail?.equipIndex
    if (typeof idx === 'number' && idx >= 0 && idx < this.equipmentList.length) {
      this.switchStaff(idx)
    }
  }

  /**
   * 步骤 3 v2：D 键死亡 toggle（测试 death 动作帧动画）
   * 再次按 D 切回 idle
   */
  private toggleDeathAnimation() {
    if (!this.playerSprite) return
    if (this.isDeadToggled) {
      // 切回 idle
      const idleKey = `${this.playerRoleId}_combat_idle`
      if (this.anims.exists(idleKey)) this.playerSprite.play(idleKey, true)
      this.isDeadToggled = false
    } else {
      // 播放 death 动作帧（不循环）
      const deathOnceKey = `${this.playerRoleId}_combat_death-once`
      if (this.anims.exists(deathOnceKey)) {
        this.playerSprite.play(deathOnceKey, true)
        this.isDeadToggled = true
        this.playerSprite.once('animationcomplete', () => {
          // 死亡动画播完保持在最后一帧
          if (this.isDeadToggled) this.playerSprite.anims.pause()
        })
      }
    }
  }

  /** 暴击特效：屏幕震动 + 红色闪光 */
  private showCritEffect() {
    this.cameras.main.shake(180, 0.008)
    const flash = this.add.rectangle(640, 360, 1280, 720, 0xff0000, 0.25).setDepth(60)
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 220,
      onComplete: () => flash.destroy()
    })
    this.showFloatingDamage(1130, 240, '暴击!', '#FF4500')
  }

  /** 闪避特效：目标位置显示 MISS */
  private showEvadeEffect(x: number) {
    this.showFloatingDamage(x, 240, 'MISS', '#888888')
  }

  /** 召唤流特效：召唤物图标淡入 */
  private showSummonEffect() {
    const summon = this.add.text(300, 280, '✦ 召唤', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#9b59b6'
    }).setOrigin(0.5).setAlpha(0).setDepth(55)
    this.tweens.add({
      targets: summon,
      alpha: 1,
      y: 240,
      duration: 400,
      yoyo: true,
      onComplete: () => summon.destroy()
    })
  }

  /** 连击流特效：多次伤害数字弹出 */
  private showMultiHitEffect(baseDamage: number) {
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 120, () => {
        const dmg = Math.floor(baseDamage * 0.4)
        this.showFloatingDamage(1130 + Phaser.Math.Between(-30, 30), 260 + i * 20, `${dmg}`, '#FFA500')
      })
    }
  }

  /** 穿透流特效：紫色破甲粒子 */
  private showArmorPenEffect() {
    for (let i = 0; i < 6; i++) {
      const particle = this.add.circle(1100, 280, 4, 0x9b59b6, 1).setDepth(55)
      this.tweens.add({
        targets: particle,
        x: 1160,
        y: 280 + Phaser.Math.Between(-20, 20),
        alpha: 0,
        duration: 400,
        onComplete: () => particle.destroy()
      })
    }
  }

  /** 反震流特效：橙色反伤光环 */
  private showReflectEffect(x: number) {
    const ring = this.add.circle(x, 280, 50, 0xff8c00, 0).setDepth(55)
    this.tweens.add({
      targets: ring,
      alpha: 0.5,
      scale: 1.4,
      duration: 300,
      yoyo: true,
      onComplete: () => ring.destroy()
    })
  }

  /** 玩家受击闪红 */
  private flashDamage() {
    const flash = this.add.rectangle(150, 280, 180, 180, 0xff0000, 0.35).setDepth(45)
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy()
    })
  }

  /** 怪物受击闪白 + 抖动 */
  private flashEnemyDamage() {
    if (!this.enemySprite) return
    // 资源整合：闪白覆盖层尺寸适配立绘（atlas 200×280 / fallback 100×100）
    const hasAtlas = this.monsterSpriteFrame && this.textures.exists('enemies_atlas')
    const flashW = hasAtlas ? (this.isBoss ? 260 : 220) : 100
    const flashH = hasAtlas ? (this.isBoss ? 340 : 300) : 100
    const flash = this.add.rectangle(1130, 280, flashW, flashH, 0xffffff, 0.5).setDepth(45)
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy()
    })
    // 水平抖动
    this.tweens.add({
      targets: this.enemySprite,
      x: 1135,
      duration: 50,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        if (this.enemySprite) this.enemySprite.x = 1130
      }
    })
  }

  /** 浮动伤害数字 */
  private showFloatingDamage(x: number, y: number, text: string, color: string) {
    const damageText = this.add.text(x, y, text, {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(58)

    this.tweens.add({
      targets: damageText,
      y: y - 40,
      alpha: 0,
      duration: 800,
      ease: 'Sine.easeOut',
      onComplete: () => damageText.destroy()
    })
  }

  /** 更新战斗日志面板（最近 5 条） */
  private updateLogPanel(logs: CombatLog[]) {
    const recent = logs.slice(-5)
    const lines = recent.map(log => {
      const actor = log.actorId === 'player' ? '玩家' : '敌人'
      const target = log.targetId === 'player' ? '玩家' : '敌人'
      let line = `${actor}`
      if (log.damage && log.damage > 0) {
        line += ` → ${target} ${log.damage} 伤害`
        if (log.isCrit) line += ' [暴击]'
        if (log.isEvaded) line = `${actor} → ${target} MISS`
      } else if (log.healing && log.healing > 0) {
        line += ` 治疗 ${log.healing}`
      } else {
        line += ` ${log.action}`
      }
      return line
    })
    this.logText.setText(lines.join('\n'))
  }

  private drawHpBar(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, percent: number, color: number) {
    g.clear()
    g.fillStyle(0x333333, 1)
    g.fillRect(x, y, width, height)
    g.fillStyle(color, 1)
    g.fillRect(x, y, width * Phaser.Math.Clamp(percent, 0, 1), height)
    // 边框
    g.lineStyle(1, 0xffffff, 0.5)
    g.strokeRect(x, y, width, height)
  }

  private drawAtbBar(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, percent: number, color: number) {
    g.clear()
    g.fillStyle(0x222222, 0.8)
    g.fillRect(x, y, width, height)
    g.fillStyle(color, 0.9)
    g.fillRect(x, y, width * Phaser.Math.Clamp(percent, 0, 1), height)
  }

  private endCombat() {
    const result = this.simulator.getResult()
    if (!result) return

    const gameStore = useGameStore()

    // 死亡/胜利动作帧动画
    if (this.playerSprite) {
      if (result.winner === 'player') {
        // 玩家胜利：继续 idle
      } else {
        // 玩家失败：播放 death 动作帧动画
        const deathKey = `${this.playerRoleId}_combat_death-once`
        if (this.anims.exists(deathKey)) {
          this.playerSprite.play(deathKey, true)
        }
      }
    }

    let rewards: { exp?: number; credits?: number; coins?: number } = {}
    let isBossClear = false
    let chapterCleared = -1

    if (result.winner === 'player') {
      const monstersConfig = this.cache.json.get('monsters') || []
      const enemyId = this.simulator.getState().enemy.id
      const monster = monstersConfig.find((m: any) => m.monsterId === enemyId)

      if (monster?.rewards) {
        rewards = { ...monster.rewards }
        gameStore.addExp(monster.rewards.exp || 0)
        gameStore.addCredits(monster.rewards.credits || 0)
        gameStore.addCoins(monster.rewards.coins || 0)
      }

      if (gameStore.state) {
        if (gameStore.state.monsters[this.nodeId]) {
          gameStore.setMonsterState(this.nodeId, {
            state: 'cleared',
            failCount: 0
          })
        }
        gameStore.setCombatState({
          state: 'settlement',
          result: 'win',
          lastResult: {
            resultId: `${this.nodeId}_${Date.now()}`,
            monsterId: enemyId,
            outcome: 'win',
            rewards: monster?.rewards || [],
            createdAt: Date.now()
          }
        })
      }

      gameStore.completeNode(this.nodeId)

      if (this.isBoss) {
        const chapterIndex = (gameStore.currentChapter || 1) - 1
        if (chapterIndex >= 0 && chapterIndex < 4) {
          const archivesInChapter = this.countArchivesInChapter(chapterIndex + 1)
          let endingLevel = 0
          if (archivesInChapter >= 2) endingLevel = 2
          else if (archivesInChapter >= 1) endingLevel = 1
          gameStore.setChapterEnding(chapterIndex, endingLevel)

          gameStore.clearChapter(chapterIndex)
          isBossClear = true
          chapterCleared = chapterIndex
        }
      }
    } else {
      if (gameStore.state) {
        if (gameStore.state.monsters[this.nodeId]) {
          const currentFailCount = gameStore.state.monsters[this.nodeId].failCount || 0
          gameStore.setMonsterState(this.nodeId, {
            state: 'patrol',
            failCount: currentFailCount + 1
          })
        }

        const playerMaxHp =
          100 + (gameStore.player?.level || 1) * 18 + (gameStore.player?.attrs.resilience || 0) * 12
        const consolationExp = Math.floor(playerMaxHp * 0.2 * 0.1)
        if (consolationExp > 0) {
          gameStore.addExp(consolationExp)
          rewards = { exp: consolationExp }
        }

        if (this.isBoss && gameStore.state.monsters[this.nodeId]) {
          const failCount = gameStore.state.monsters[this.nodeId].failCount || 0
          if (failCount >= 2) {
            gameStore.addExp(30)
            rewards = { ...(rewards as any), bonusExp: 30 }
          }
        }

        gameStore.setCombatState({
          state: 'settlement',
          result: 'lose',
          lastResult: {
            resultId: `${this.nodeId}_${Date.now()}`,
            monsterId: this.monsterId,
            outcome: 'lose',
            rewards: [],
            createdAt: Date.now()
          }
        })
      }
    }

    gameStore.saveSave()

    // GDD §3.2.2 战斗结算页：3 按钮 [继续探索] [回到主页] [查看背包]
    this.showSettlementPanel(result.winner === 'player', rewards, isBossClear, chapterCleared)
  }

  /**
   * GDD §3.2.2 战斗结算页
   * 显示怪物图标、胜负状态、战利品，3 按钮：继续探索/回到主页/查看背包
   * Boss 通关且为终章时显示 [查看结局] 替代 [继续探索]
   */
  private showSettlementPanel(
    isWin: boolean,
    rewards: { exp?: number; credits?: number; coins?: number; bonusExp?: number },
    isBossClear: boolean,
    chapterCleared: number
  ) {
    // 遮罩
    const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.85).setDepth(80)

    // 面板背景
    const panelBg = this.add.rectangle(640, 360, 560, 420, 0x1A3C6E, 0.95).setDepth(81)
    panelBg.setStrokeStyle(3, isWin ? 0xFFD700 : 0xFF6B6B)

    // 怪物图标占位（首字母圆形）
    const monsterIcon = this.add.circle(640, 240, 36, isWin ? 0x4ECDC4 : 0xFF6B6B, 0.8).setDepth(82)
    monsterIcon.setStrokeStyle(3, 0xffffff)
    const enemyName = this.simulator.getState().enemy.name
    this.add.text(640, 240, enemyName.charAt(0) || 'M', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(83)

    // 胜负标题
    let titleText = isWin ? '战斗胜利' : '战斗失败'
    let titleColor = isWin ? '#FFD700' : '#FF6B6B'
    if (isBossClear) {
      titleText = chapterCleared + 1 >= 4 ? '终章通关！' : 'Boss 通关！章节解锁！'
      titleColor = '#FFD700'
    }
    this.add.text(640, 310, titleText, {
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      fontSize: '28px',
      color: titleColor,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(82)

    // 战利品行
    const rewardLines: string[] = []
    if (isWin) {
      if (rewards.exp) rewardLines.push(`EXP +${rewards.exp}`)
      if (rewards.credits) rewardLines.push(`学分 +${rewards.credits}`)
      if (rewards.coins) rewardLines.push(`校园币 +${rewards.coins}`)
    } else {
      if (rewards.exp) rewardLines.push(`安慰 EXP +${rewards.exp}`)
      if ((rewards as any).bonusExp) rewardLines.push(`Boss 重试 EXP +${(rewards as any).bonusExp}`)
    }
    const rewardText = rewardLines.length > 0 ? rewardLines.join('  /  ') : '无战利品'
    this.add.text(640, 360, rewardText, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(82)

    // 3 按钮：[继续探索] [回到主页] [查看背包]
    const btnY = 430
    const btnColor = isWin ? '#FFD700' : '#4ECDC4'
    const isEnding = isBossClear && chapterCleared + 1 >= 4

    // 按钮 1：继续探索 / 查看结局
    const btn1Text = isEnding ? '查看结局' : '继续探索'
    const btn1 = this.add.text(640, btnY, btn1Text, {
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      fontSize: '18px',
      color: '#1A3C6E',
      backgroundColor: btnColor,
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setDepth(82).setInteractive({ useHandCursor: true })

    btn1.on('pointerdown', () => {
      this.scene.stop()
      if (isEnding) {
        // GDD §6.5 终章通关：跳转 /ending 结算页面
        window.dispatchEvent(new CustomEvent('navigate-ending'))
      }
    })

    // 按钮 2：回到主页
    const btn2 = this.add.text(420, btnY, '回到主页', {
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#1A3C6E',
      padding: { x: 16, y: 10 }
    }).setOrigin(0.5).setDepth(82).setInteractive({ useHandCursor: true })

    btn2.on('pointerdown', () => {
      this.scene.stop()
      window.dispatchEvent(new CustomEvent('navigate-home'))
    })

    // 按钮 3：查看背包
    const btn3 = this.add.text(860, btnY, '查看背包', {
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#1A3C6E',
      padding: { x: 16, y: 10 }
    }).setOrigin(0.5).setDepth(82).setInteractive({ useHandCursor: true })

    btn3.on('pointerdown', () => {
      this.scene.stop()
      window.dispatchEvent(new CustomEvent('navigate-inventory'))
    })

    // 入场动画
    overlay.setAlpha(0)
    panelBg.setAlpha(0)
    this.tweens.add({
      targets: [overlay, panelBg],
      alpha: 1,
      duration: 300,
      ease: 'Sine.easeOut'
    })
  }

  private countArchivesInChapter(chapter: number): number {
    const archivesConfig = this.cache.json.get('archives') || []
    const gameStore = useGameStore()
    const collected = gameStore.progress?.archives || []
    return archivesConfig.filter(
      (a: any) => a.chapter === chapter && collected.includes(a.archiveId || a.archive_id)
    ).length
  }

  private showVictoryText(text: string, color: string) {
    this.add.text(640, 360, text, {
      fontFamily: 'Arial',
      fontSize: '48px',
      color: color
    }).setOrigin(0.5)
  }
}
