import Phaser from 'phaser'

export class MapFogSystem {
  private fogGraphics: Phaser.GameObjects.Graphics
  private revealedRegions: Set<string> = new Set()

  constructor(scene: Phaser.Scene) {
    this.fogGraphics = scene.add.graphics()
    this.fogGraphics.setDepth(10)
  }

  initialize(mapWidth: number, mapHeight: number) {
    this.fogGraphics.clear()
    this.fogGraphics.fillStyle(0x000000, 0.7)
    this.fogGraphics.fillRect(0, 0, mapWidth, mapHeight)
    this.revealedRegions.clear()
  }

  revealRegion(regionId: string, x: number, y: number, radius: number = 80) {
    if (this.revealedRegions.has(regionId)) return

    this.revealedRegions.add(regionId)
    this.fogGraphics.fillStyle(0x000000, 0)
    this.fogGraphics.fillCircle(x, y, radius)
  }

  revealArea(x: number, y: number, width: number, height: number) {
    this.fogGraphics.fillStyle(0x000000, 0)
    this.fogGraphics.fillRect(x - width / 2, y - height / 2, width, height)
  }

  isRegionRevealed(regionId: string): boolean {
    return this.revealedRegions.has(regionId)
  }

  getRevealedRegions(): string[] {
    return Array.from(this.revealedRegions)
  }

  destroy() {
    this.fogGraphics.destroy()
  }
}
