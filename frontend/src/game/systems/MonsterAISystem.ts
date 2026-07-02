import Phaser from 'phaser'

export type MonsterState = 'patrol' | 'alert' | 'chase' | 'combat' | 'cleared' | 'return'

export interface Monster {
  id: string
  nodeId: string
  monsterId: string
  state: MonsterState
  sprite: Phaser.GameObjects.Arc
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

  addMonster(
    id: string,
    nodeId: string,
    monsterId: string,
    x: number,
    y: number,
    alertRadius: number,
    leashRadius: number,
    actionInterval: number
  ) {
    const sprite = this.scene.add.circle(x, y, 12, 0xff0000)
    sprite.setStrokeStyle(2, 0xffffff)

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
          } else if (distance <= 30) {
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
