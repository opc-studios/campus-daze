import type { GameState, RoleId, FinalEndingType } from '../../types/game'
import archivesConfig from '../config/archives.json'
import endingsConfig from '../config/endings.json'

export interface FinalEnding {
  type: FinalEndingType
  title: string
  description: string
  epilogue: string
  factors: {
    archiveRate: number
    roleId: RoleId
    chapterEndings: number[]
    perfectChapters: number
  }
}

interface EndingConfig {
  roleId: RoleId
  type: FinalEndingType
  title: string
  description: string
  epilogue: string
}

/**
 * 计算校史图鉴收集率（0-100）
 */
export function calculateArchiveRate(archives: string[]): number {
  const total = archivesConfig.length
  if (total === 0) return 0
  return Math.min(100, (archives.length / total) * 100)
}

/**
 * 根据三因子判定最终结局类型（GDD §6.5）
 *
 * 三因子：
 * 1. 校史图鉴收集率
 * 2. 所选角色（影响文案分支，不影响类型判定）
 * 3. 章节事件汇总（chapterEndings 中达到 level 2 的章节数）
 *
 * 类型判定规则：
 * - perfect_memory: 图鉴 100% 且 ≥2 章达到 level 2
 * - memory_remaining: 图鉴 ≥50% 或 ≥1 章达到 level 2
 * - standard: 其他
 */
export function determineEndingType(state: GameState): FinalEndingType {
  const archiveRate = calculateArchiveRate(state.progress.archives || [])
  const chapterEndings = state.progress.chapterEndings || [0, 0, 0, 0]
  const perfectChapters = chapterEndings.filter(level => level >= 2).length

  if (archiveRate >= 100 && perfectChapters >= 2) {
    return 'perfect_memory'
  }
  if (archiveRate >= 50 || perfectChapters >= 1) {
    return 'memory_remaining'
  }
  return 'standard'
}

/**
 * 计算最终结局（含文案）
 */
export function calculateFinalEnding(state: GameState): FinalEnding {
  const type = determineEndingType(state)
  const roleId = state.player.roleId
  const chapterEndings = state.progress.chapterEndings || [0, 0, 0, 0]
  const archiveRate = calculateArchiveRate(state.progress.archives || [])
  const perfectChapters = chapterEndings.filter(level => level >= 2).length

  const config = (endingsConfig as EndingConfig[]).find(
    e => e.roleId === roleId && e.type === type
  )

  if (!config) {
    return {
      type,
      title: '未知结局',
      description: '一段尚未书写的结局。',
      epilogue: '',
      factors: {
        archiveRate,
        roleId,
        chapterEndings,
        perfectChapters
      }
    }
  }

  return {
    type,
    title: config.title,
    description: config.description,
    epilogue: config.epilogue,
    factors: {
      archiveRate,
      roleId,
      chapterEndings,
      perfectChapters
    }
  }
}
