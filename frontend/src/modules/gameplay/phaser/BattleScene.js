import Phaser from 'phaser'
import { eventBus } from '@/engine/EventBus'

export class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' })
    this.player = null
    this.enemy = null
    this.playerHP = 100
    this.playerMaxHP = 100
    this.enemyHP = 100
    this.enemyMaxHP = 100
    this.playerTurn = true
    this.battleEnded = false
    this.actionButtons = []
  }

  init(data) {
    this.character = data.character || {}
    this.enemyData = data.enemy || {}
    this.battleId = data.battleId || null
    
    this.playerHP = this.character.hp || 100
    this.playerMaxHP = this.character.max_hp || 100
    this.enemyHP = this.enemyData.hp || 100
    this.enemyMaxHP = this.enemyData.max_hp || 100
  }

  preload() {
    this.createBattleGraphics()
  }

  create() {
    this.createBackground()
    this.createBattleArena()
    this.createSprites()
    this.createHPBars()
    this.createActionButtons()
    this.createBattleLog()
    this.setupInput()
    
    eventBus.emit('scene-ready', 'battle')
  }

  createBattleGraphics() {
    const playerGraphics = this.add.graphics()
    playerGraphics.fillStyle(0xFFB7C5, 1)
    playerGraphics.fillCircle(30, 30, 28)
    playerGraphics.lineStyle(3, 0x000000, 0.3)
    playerGraphics.strokeCircle(30, 30, 28)
    
    playerGraphics.fillStyle(0x000000, 1)
    playerGraphics.fillCircle(22, 25, 4)
    playerGraphics.fillCircle(38, 25, 4)
    
    playerGraphics.fillStyle(0xFF69B4, 1)
    playerGraphics.fillTriangle(24, 15, 30, 8, 36, 15)
    
    playerGraphics.generateTexture('battle_player', 60, 60)
    playerGraphics.destroy()

    const enemyGraphics = this.add.graphics()
    enemyGraphics.fillStyle(0xE74C3C, 1)
    enemyGraphics.fillCircle(30, 30, 28)
    enemyGraphics.lineStyle(3, 0x000000, 0.3)
    enemyGraphics.strokeCircle(30, 30, 28)
    
    enemyGraphics.fillStyle(0x000000, 1)
    enemyGraphics.fillCircle(22, 25, 4)
    enemyGraphics.fillCircle(38, 25, 4)
    
    enemyGraphics.fillStyle(0xFF0000, 1)
    enemyGraphics.fillTriangle(20, 15, 30, 5, 40, 15)
    
    enemyGraphics.generateTexture('battle_enemy', 60, 60)
    enemyGraphics.destroy()
  }

  createBackground() {
    this.add.rectangle(640, 360, 1280, 720, 0x2C3E50)
    
    this.add.particles(0, 0, 'battle_player', {
      x: { min: 0, max: 1280 },
      y: { min: 0, max: 720 },
      scale: { start: 0.1, end: 0 },
      alpha: { start: 0.3, end: 0 },
      speed: 20,
      lifespan: 4000,
      frequency: 300,
      blendMode: 'ADD'
    })
  }

  createBattleArena() {
    const arena = this.add.rectangle(640, 400, 1000, 400, 0x34495E)
    arena.setStrokeStyle(4, 0xFFFFFF, 0.3)
    
    this.add.rectangle(640, 600, 1000, 20, 0x1A252F)
  }

  createSprites() {
    this.playerSprite = this.add.sprite(300, 450, 'battle_player')
    this.playerSprite.setScale(3)
    this.playerSprite.setDepth(10)
    
    this.enemySprite = this.add.sprite(980, 450, 'battle_enemy')
    this.enemySprite.setScale(3)
    this.enemySprite.setDepth(10)
    this.enemySprite.flipX = true
  }

  createHPBars() {
    this.playerHPBar = this.createHPBar(200, 200, this.character.name || '玩家', 
      this.playerHP, this.playerMaxHP, 0x10B981)
    
    this.enemyHPBar = this.createHPBar(880, 200, this.enemyData.name || '敌人', 
      this.enemyHP, this.enemyMaxHP, 0xEF4444)
  }

  createHPBar(x, y, name, current, max, color) {
    const container = this.add.container(x, y)
    
    const nameText = this.add.text(0, -40, name, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    nameText.setOrigin(0.5)
    container.add(nameText)
    
    const bgBar = this.add.rectangle(0, 0, 200, 24, 0x000000)
    bgBar.setOrigin(0.5)
    container.add(bgBar)
    
    const hpBar = this.add.rectangle(-100, 0, 200, 20, color)
    hpBar.setOrigin(0, 0.5)
    container.add(hpBar)
    
    const hpText = this.add.text(0, 30, `${current} / ${max}`, {
      fontSize: '16px',
      color: '#ffffff'
    })
    hpText.setOrigin(0.5)
    container.add(hpText)
    
    return { container, hpBar, hpText, current, max, color }
  }

  createActionButtons() {
    const buttons = [
      { x: 440, y: 650, text: '普通攻击', action: 'attack', color: 0x4A90D9 },
      { x: 640, y: 650, text: '技能', action: 'skill', color: 0x8B5CF6 },
      { x: 840, y: 650, text: '切换形态', action: 'transform', color: 0xF59E0B }
    ]
    
    buttons.forEach(btn => {
      const button = this.add.rectangle(btn.x, btn.y, 160, 60, btn.color)
      button.setInteractive()
      button.setStrokeStyle(3, 0xFFFFFF, 0.5)
      button.setDepth(20)
      
      const text = this.add.text(btn.x, btn.y, btn.text, {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold'
      })
      text.setOrigin(0.5)
      text.setDepth(21)
      
      button.on('pointerdown', () => {
        if (this.playerTurn && !this.battleEnded) {
          this.performAction(btn.action)
        }
      })
      
      button.on('pointerover', () => {
        button.setScale(1.05)
        button.setFillStyle(Phaser.Display.Color.GetColor(
          btn.color + 0x111111
        ))
      })
      
      button.on('pointerout', () => {
        button.setScale(1)
        button.setFillStyle(btn.color)
      })
      
      this.actionButtons.push(button)
    })
  }

  createBattleLog() {
    this.battleLog = []
    this.battleLogText = this.add.text(20, 600, '', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000cc',
      padding: { x: 15, y: 10 },
      wordWrap: { width: 1240 }
    })
    this.battleLogText.setDepth(30)
  }

  setupInput() {
    this.input.keyboard.on('keydown-ONE', () => {
      if (this.playerTurn && !this.battleEnded) this.performAction('attack')
    })
    
    this.input.keyboard.on('keydown-TWO', () => {
      if (this.playerTurn && !this.battleEnded) this.performAction('skill')
    })
    
    this.input.keyboard.on('keydown-THREE', () => {
      if (this.playerTurn && !this.battleEnded) this.performAction('transform')
    })
  }

  performAction(action) {
    this.playerTurn = false
    this.disableActionButtons()
    
    eventBus.emit('battle-action', { action, battleId: this.battleId })
    
    if (action === 'attack') {
      this.addBattleLog('你发动了普通攻击！')
      this.animateAttack(this.playerSprite, this.enemySprite, () => {
        this.dealDamage('enemy', 15)
      })
    } else if (action === 'skill') {
      this.addBattleLog('你使用了技能！')
      this.animateSkill(this.playerSprite, this.enemySprite, () => {
        this.dealDamage('enemy', 25)
      })
    } else if (action === 'transform') {
      this.addBattleLog('切换形态！')
      this.animateTransform(this.playerSprite, () => {
        eventBus.emit('transform-request')
        this.time.delayedCall(1000, () => {
          this.enemyTurn()
        })
      })
    }
  }

  animateAttack(attacker, target, callback) {
    this.tweens.add({
      targets: attacker,
      x: target.x - 100,
      duration: 200,
      yoyo: true,
      ease: 'Power2',
      onComplete: callback
    })
  }

  animateSkill(attacker, target, callback) {
    this.tweens.add({
      targets: attacker,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 300,
      yoyo: true,
      onComplete: () => {
        this.animateAttack(attacker, target, callback)
      }
    })
    
    const effect = this.add.circle(target.x, target.y, 50, 0x8B5CF6, 0.5)
    this.tweens.add({
      targets: effect,
      scale: 2,
      alpha: 0,
      duration: 500,
      onComplete: () => effect.destroy()
    })
  }

  animateTransform(sprite, callback) {
    this.tweens.add({
      targets: sprite,
      scaleX: 0,
      duration: 300,
      onComplete: () => {
        this.tweens.add({
          targets: sprite,
          scaleX: 3,
          duration: 300,
          onComplete: callback
        })
      }
    })
  }

  dealDamage(target, damage) {
    if (target === 'enemy') {
      this.enemyHP = Math.max(0, this.enemyHP - damage)
      this.addBattleLog(`对敌人造成 ${damage} 点伤害`)
      this.updateHPBar(this.enemyHPBar, this.enemyHP, this.enemyMaxHP)
      
      this.tweens.add({
        targets: this.enemySprite,
        tint: 0xFF0000,
        duration: 100,
        yoyo: true,
        repeat: 2,
        onComplete: () => this.enemySprite.clearTint()
      })
      
      if (this.enemyHP <= 0) {
        this.time.delayedCall(500, () => {
          this.endBattle(true)
        })
        return
      }
    }
    
    this.time.delayedCall(1000, () => {
      this.enemyTurn()
    })
  }

  enemyTurn() {
    if (this.battleEnded) return
    
    this.addBattleLog('敌人发动攻击！')
    this.animateAttack(this.enemySprite, this.playerSprite, () => {
      const damage = 10 + Math.floor(Math.random() * 10)
      this.playerHP = Math.max(0, this.playerHP - damage)
      this.addBattleLog(`你受到 ${damage} 点伤害`)
      this.updateHPBar(this.playerHPBar, this.playerHP, this.playerMaxHP)
      
      this.tweens.add({
        targets: this.playerSprite,
        tint: 0xFF0000,
        duration: 100,
        yoyo: true,
        repeat: 2,
        onComplete: () => this.playerSprite.clearTint()
      })
      
      if (this.playerHP <= 0) {
        this.time.delayedCall(500, () => {
          this.endBattle(false)
        })
        return
      }
      
      this.time.delayedCall(500, () => {
        this.playerTurn = true
        this.enableActionButtons()
      })
    })
  }

  updateHPBar(hpBar, current, max) {
    const percent = current / max
    this.tweens.add({
      targets: hpBar.hpBar,
      displayWidth: 200 * percent,
      duration: 300,
      ease: 'Power2'
    })
    
    hpBar.hpText.setText(`${current} / ${max}`)
  }

  addBattleLog(message) {
    this.battleLog.push(message)
    if (this.battleLog.length > 4) {
      this.battleLog.shift()
    }
    this.battleLogText.setText(this.battleLog.join('\n'))
  }

  disableActionButtons() {
    this.actionButtons.forEach(btn => {
      btn.setAlpha(0.5)
      btn.disableInteractive()
    })
  }

  enableActionButtons() {
    this.actionButtons.forEach(btn => {
      btn.setAlpha(1)
      btn.setInteractive()
    })
  }

  endBattle(victory) {
    this.battleEnded = true
    const message = victory ? '战斗胜利！' : '战斗失败...'
    this.addBattleLog(message)
    
    const resultText = this.add.text(640, 360, message, {
      fontSize: '48px',
      color: victory ? '#10B981' : '#EF4444',
      fontStyle: 'bold',
      backgroundColor: '#000000cc',
      padding: { x: 30, y: 20 }
    })
    resultText.setOrigin(0.5)
    resultText.setDepth(100)
    
    this.tweens.add({
      targets: resultText,
      scale: 1.2,
      duration: 500,
      yoyo: true,
      repeat: 2
    })
    
    eventBus.emit('battle-end', { victory, battleId: this.battleId })
    
    this.time.delayedCall(3000, () => {
      eventBus.emit('return-to-plaza')
    })
  }
}
