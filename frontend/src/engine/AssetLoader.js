/**
 * Asset loader for Phaser game
 */
export class AssetLoader {
  constructor(scene) {
    this.scene = scene
    this.loadingProgress = 0
  }

  preload(assets) {
    assets.forEach(asset => {
      switch (asset.type) {
        case 'image':
          this.scene.load.image(asset.key, asset.url)
          break
        case 'spritesheet':
          this.scene.load.spritesheet(asset.key, asset.url, asset.config)
          break
        case 'tilemap':
          this.scene.load.tilemapTiledJSON(asset.key, asset.url)
          break
        case 'audio':
          this.scene.load.audio(asset.key, asset.url)
          break
      }
    })

    this.scene.load.on('progress', (progress) => {
      this.loadingProgress = progress
      this.scene.emit('loading-progress', progress)
    })

    this.scene.load.on('complete', () => {
      this.scene.emit('loading-complete')
    })
  }

  getProgress() {
    return this.loadingProgress
  }
}
