import Phaser from 'phaser'
import rolesConfig from '../config/roles.json'
import skillsConfig from '../config/skills.json'
import monstersConfig from '../config/monsters.json'
import chaptersConfig from '../config/chapters.json'
import mapNodesConfig from '../config/map-nodes.json'
import eventsConfig from '../config/events.json'
import itemsConfig from '../config/items.json'
import archivesConfig from '../config/archives.json'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    const progressBar = this.add.graphics()
    const progressBox = this.add.graphics()
    progressBox.fillStyle(0x222222, 0.8)
    progressBox.fillRect(490, 330, 300, 40)

    const width = this.cameras.main.width
    const height = this.cameras.main.height

    const loadingText = this.add.text(width / 2, height / 2 - 50, '加载中...', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff'
    })
    loadingText.setOrigin(0.5, 0.5)

    const percentText = this.add.text(width / 2, height / 2 + 10, '0%', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff'
    })
    percentText.setOrigin(0.5, 0.5)

    this.load.on('progress', (value: number) => {
      percentText.setText(`${Math.floor(value * 100)}%`)
      progressBar.clear()
      progressBar.fillStyle(0x4ECDC4, 1)
      progressBar.fillRect(500, 340, 280 * value, 20)
    })

    this.load.on('complete', () => {
      progressBar.destroy()
      progressBox.destroy()
      loadingText.destroy()
      percentText.destroy()
    })
  }

  create() {
    this.cache.json.add('roles', rolesConfig)
    this.cache.json.add('skills', skillsConfig)
    this.cache.json.add('monsters', monstersConfig)
    this.cache.json.add('chapters', chaptersConfig)
    this.cache.json.add('mapNodes', mapNodesConfig)
    this.cache.json.add('events', eventsConfig)
    this.cache.json.add('items', itemsConfig)
    this.cache.json.add('archives', archivesConfig)

    this.scene.start('MapExploreScene')
  }
}
