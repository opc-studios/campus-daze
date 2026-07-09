import Phaser from 'phaser'
import rolesConfig from '../config/roles.json'
import skillsConfig from '../config/skills.json'
import monstersConfig from '../config/monsters.json'
import chaptersConfig from '../config/chapters.json'
import mapNodesConfig from '../config/map-nodes.json'
import eventsConfig from '../config/events.json'
import itemsConfig from '../config/items.json'
import archivesConfig from '../config/archives.json'
import puzzlesConfig from '../config/puzzles.json'
import actionsConfig from '../config/actions.json'
import equipmentConfig from '../config/equipment.json'
import obstaclesConfig from '../config/obstacles.json'
import worldMapConfig from '../config/world-map.json'
import propsConfig from '../config/props.json'
import skillActionsConfig from '../config/skill-actions.json'

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

    // 加载分层地图 JSON 配置（key: zhongheMap，供 PreloaderScene/MapExploreScene 读取）
    // ch1 中和广场（保留原 key 兼容）
    this.load.json('zh1Map', '/assets/maps/zhonghe-plaza-layered-playtest.json')
    // ch2 樱花季 / ch3 智械危机 / ch4 校庆（独立地图素材）
    this.load.json('ch2Map', '/assets/maps/ch2-sakura-layered.json')
    this.load.json('ch3Map', '/assets/maps/ch3-cyber-layered.json')
    this.load.json('ch4Map', '/assets/maps/ch4-anniv-layered.json')
    // 兼容旧 key：zhongheMap 指向 ch1
    this.load.json('zhongheMap', '/assets/maps/zhonghe-plaza-layered-playtest.json')
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
    this.cache.json.add('puzzles', puzzlesConfig)
    this.cache.json.add('actions', actionsConfig)
    this.cache.json.add('equipment', equipmentConfig)
    this.cache.json.add('obstacles', obstaclesConfig)
    this.cache.json.add('worldMap', worldMapConfig)
    this.cache.json.add('props', propsConfig)
    this.cache.json.add('skillActions', skillActionsConfig)
    // zhongheMap 已通过 this.load.json 在 preload 中加载到 cache

    this.scene.start('PreloaderScene')
  }
}
