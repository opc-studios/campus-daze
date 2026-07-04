import Phaser from 'phaser'

export type MonsterState = 'patrol' | 'alert' | 'chase' | 'combat' | 'cleared' | 'return'

export interface Monster {
  id: string
  nodeId: string
  monsterId: string
  state: MonsterState
  sprite: Phaser.GameObjects.Arc | Phaser.GameObjects.Image
  position: { x: number; y: number }
  patrolAnchor: { x: number; y: number }
  alertRadius: number
  leashRadius: number
  failCount: number
  actionInterval: number
  lastActionTime: number
}

export class MonsterAISystem {
  private scene: Phaser.Scene
  private monsters: Map<string, Monster> = new Map()
  private playerPosition: { x: number; y: number } = { x: 0, y: 0 }

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  /**
   * 添加怪物到地图
   * @param frameName 可选的 germs_atlas 帧名（blue1/green1/purple1/red1/ring 等）
   *                  传入且 germs_atlas 已加载时，使用精灵图替代粉红圆形
   * @param isBoss    是否 Boss（影响显示尺寸）
   */
  addMonster(
    id: string,
    nodeId: string,
    monsterId: string,
    x: number,
    y: number,
    alertRadius: number,
    leashRadius: number,
    actionInterval: number,
    frameName?: string,
    isBoss: boolean = false
  ) {
    let sprite: Phaser.GameObjects.Arc | Phaser.GameObjects.Image

    // 优先使用 germs_atlas 精灵图（替代粉红圆形）
    if (frameName && this.scene.textures.exists('germs_atlas')) {
      const image = this.scene.add.image(x, y, 'germs_atlas', frameName)
      // Boss 用 ring 帧 + 放大；普通怪物按帧原始尺寸缩放
      if (isBoss || frameName === 'ring') {
        image.setDisplaySize(48, 48)
        image.setTint(0xff6666) // Boss 偏红
      } else {
        image.setDisplaySize(36, 36)
      }
      sprite = image
    } else {
      // fallback：粉红圆形
      const circle = this.scene.add.circle(x, y, isBoss ? 18 : 12, isBoss ? 0xff0000 : 0xffb7c5)
      circle.setStrokeStyle(2, 0xffffff)
      sprite = circle
    }

    const monster: Monster = {
      id,
      nodeId,
      monsterId,
      state: 'patrol',
      sprite,
      position: { x, y },
      patrolAnchor: { x, y },
      alertRadius,
      leashRadius,
      failCount: 0,
      actionInterval,
      lastActionTime: 0
    }

    this.monsters.set(id, monster)
  }

  updatePlayerPosition(x: number, y: number) {
    this.playerPosition = { x, y }
  }

  update(deltaTime: number) {
    const currentTime = this.scene.time.now

    this.monsters.forEach(monster => {
      if (monster.state === 'cleared') return

      const distance = Phaser.Math.Distance.Between(
        this.playerPosition.x,
        this.playerPosition.y,
        monster.position.x,
        monster.position.y
      )

      switch (monster.state) {
        case 'patrol':
          if (distance <= monster.alertRadius) {
            monster.state = 'alert'
          }
          break

        case 'alert':
          if (distance > monster.alertRadius * 2) {
            monster.state = 'return'
          } else if (distance <= monster.alertRadius) {
            monster.state = 'chase'
          }
          break

        case 'chase':
          if (distance > monster.leashRadius) {
            monster.state = 'return'
          } else if (distance <= monster.alertRadius * 0.5) {
            // Z 修正：脱战距离按 alertRadius 缩放（原硬编码 30）
            // alertRadius 典型值 60-100，对应脱战触发距离 30-50
            monster.state = 'combat'
          } else {
            const angle = Phaser.Math.Angle.Between(
              monster.position.x,
              monster.position.y,
              this.playerPosition.x,
              this.playerPosition.y
            )
            const speed = 60
            monster.position.x += Math.cos(angle) * speed * deltaTime
            monster.position.y += Math.sin(angle) * speed * deltaTime
            monster.sprite.setPosition(monster.position.x, monster.position.y)
          }
          break

        case 'return':
          const returnAngle = Phaser.Math.Angle.Between(
            monster.position.x,
            monster.position.y,
            monster.patrolAnchor.x,
            monster.patrolAnchor.y
          )
          const returnSpeed = 40
          monster.position.x += Math.cos(returnAngle) * returnSpeed * deltaTime
          monster.position.y += Math.sin(returnAngle) * returnSpeed * deltaTime
          monster.sprite.setPosition(monster.position.x, monster.position.y)

          const returnDistance = Phaser.Math.Distance.Between(
            monster.position.x,
            monster.position.y,
            monster.patrolAnchor.x,
            monster.patrolAnchor.y
          )

          if (returnDistance < 5) {
            monster.position.x = monster.patrolAnchor.x
            monster.position.y = monster.patrolAnchor.y
            monster.sprite.setPosition(monster.position.x, monster.position.y)
            monster.state = 'patrol'
          }
          break

        case 'combat':
          if (currentTime - monster.lastActionTime >= monster.actionInterval * 1000) {
            monster.lastActionTime = currentTime
            this.scene.events.emit('monster-attack', monster.id)
          }
          break
      }
    })
  }

  setMonsterState(id: string, state: MonsterState) {
    const monster = this.monsters.get(id)
    if (monster) {
      monster.state = state
      if (state === 'cleared') {
        monster.sprite.setVisible(false)
      }
    }
  }

  getMonster(id: string): Monster | undefined {
    return this.monsters.get(id)
  }

  getMonsterAtPosition(x: number, y: number, radius: number = 20): Monster | undefined {
    for (const monster of this.monsters.values()) {
      if (monster.state === 'cleared') continue

      const distance = Phaser.Math.Distance.Between(x, y, monster.position.x, monster.position.y)
      if (distance <= radius) {
        return monster
      }
    }
    return undefined
  }

  incrementFailCount(id: string) {
    const monster = this.monsters.get(id)
    if (monster) {
      monster.failCount++
    }
  }

  resetFailCount(id: string) {
    const monster = this.monsters.get(id)
    if (monster) {
      monster.failCount = 0
    }
  }

  destroy() {
    this.monsters.forEach(monster => {
      monster.sprite.destroy()
    })
    this.monsters.clear()
  }
}
