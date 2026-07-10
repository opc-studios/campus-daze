import type { ActionDef } from '../types'

export const FRAME_SIZE = 128
export const COLS = 8
export const ROWS = 8

export interface SpriteFrameInfo {
  roleId: string
  actionId: string
  frameIndex: number
  imageWidth: number
  imageHeight: number
  frameWidth: number
  frameHeight: number
}

export class SpriteFrameExtractor {
  private image: HTMLImageElement | null = null
  private frameWidth: number = FRAME_SIZE
  private frameHeight: number = FRAME_SIZE
  private _ready: boolean = false

  get ready(): boolean {
    return this._ready && this.image !== null
  }

  async loadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        this.image = img
        this.calculateFrameSize()
        this._ready = true
        resolve()
      }
      img.onerror = () => {
        this._ready = false
        reject(new Error(`Failed to load sprite image: ${src}`))
      }
      img.src = src
    })
  }

  calculateFrameSize(): void {
    if (!this.image) return
    this.frameWidth = Math.floor(this.image.width / COLS)
    this.frameHeight = Math.floor(this.image.height / ROWS)
  }

  getFrameInfo(roleId: string, action: ActionDef, frameIndex: number): SpriteFrameInfo {
    return {
      roleId,
      actionId: action.id,
      frameIndex,
      imageWidth: this.image?.naturalWidth || 0,
      imageHeight: this.image?.naturalHeight || 0,
      frameWidth: this.frameWidth,
      frameHeight: this.frameHeight
    }
  }

  getFrameLabel(info: SpriteFrameInfo): string {
    return ` ${info.roleId} · ${info.actionId} · ${info.imageWidth} × ${info.imageHeight} · ${Math.round(info.frameWidth)} × ${Math.round(info.frameHeight)} `
  }

  drawFrame(
    ctx: CanvasRenderingContext2D,
    action: ActionDef,
    currentFrameIndex: number,
    targetWidth: number,
    targetHeight: number
  ): void {
    if (!this.image) return

    ctx.imageSmoothingEnabled = false

    ctx.clearRect(0, 0, targetWidth, targetHeight)

    const sx = currentFrameIndex * this.frameWidth
    const sy = action.row * this.frameHeight

    ctx.drawImage(
      this.image,
      sx, sy, this.frameWidth, this.frameHeight,
      0, 0, targetWidth, targetHeight
    )
  }

  extractFrame(
    action: ActionDef,
    frameIndex: number
  ): HTMLCanvasElement | null {
    if (!this.image) return null

    const canvas = document.createElement('canvas')
    canvas.width = this.frameWidth
    canvas.height = this.frameHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.imageSmoothingEnabled = false

    const sx = frameIndex * this.frameWidth
    const sy = action.row * this.frameHeight

    ctx.drawImage(
      this.image,
      sx, sy, this.frameWidth, this.frameHeight,
      0, 0, this.frameWidth, this.frameHeight
    )

    return canvas
  }

  getFrameDataURL(
    action: ActionDef,
    frameIndex: number,
    mimeType: string = 'image/png'
  ): string | null {
    const canvas = this.extractFrame(action, frameIndex)
    return canvas?.toDataURL(mimeType) || null
  }

  getTotalFrames(): number {
    return COLS * ROWS
  }

  getFramesPerRow(): number {
    return COLS
  }

  getRows(): number {
    return ROWS
  }

  getImageSize(): { width: number; height: number } {
    return {
      width: this.image?.naturalWidth || 0,
      height: this.image?.naturalHeight || 0
    }
  }

  static createFromImage(image: HTMLImageElement): SpriteFrameExtractor {
    const extractor = new SpriteFrameExtractor()
    extractor.image = image
    extractor.calculateFrameSize()
    extractor._ready = true
    return extractor
  }
}