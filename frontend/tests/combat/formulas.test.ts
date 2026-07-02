import { describe, it, expect } from 'vitest'
import {
  calcMaxHp,
  calcAttack,
  calcDefense,
  calcActionInterval,
  calcBaseDamage,
  calcSkillDamage,
  calcOfflineRewards
} from '../../src/game/combat/formulas'

describe('Combat Formulas', () => {
  describe('calcMaxHp', () => {
    it('should calculate max HP correctly', () => {
      expect(calcMaxHp(1, 4)).toBe(100 + 1 * 18 + 4 * 12)
      expect(calcMaxHp(5, 8)).toBe(100 + 5 * 18 + 8 * 12)
      expect(calcMaxHp(10, 10)).toBe(100 + 10 * 18 + 10 * 12)
    })
  })

  describe('calcAttack', () => {
    it('should calculate attack correctly', () => {
      expect(calcAttack(1, 8)).toBe(1 * 4 + 8 * 6)
      expect(calcAttack(5, 5)).toBe(5 * 4 + 5 * 6)
    })
  })

  describe('calcDefense', () => {
    it('should calculate defense correctly', () => {
      expect(calcDefense(4, 5)).toBe(4 * 2 + 5 * 1)
      expect(calcDefense(10, 10)).toBe(10 * 2 + 10 * 1)
    })
  })

  describe('calcActionInterval', () => {
    it('should calculate action interval with minimum cap', () => {
      expect(calcActionInterval(0)).toBe(2.0)
      expect(calcActionInterval(10)).toBe(Math.max(0.8, 2.0 - 10 * 0.03))
      expect(calcActionInterval(100)).toBe(0.8)
    })
  })

  describe('calcBaseDamage', () => {
    it('should calculate base damage with minimum 1', () => {
      expect(calcBaseDamage(10, 5)).toBe(Math.max(1, 10 - 5 * 0.5))
      expect(calcBaseDamage(1, 100)).toBe(1)
    })
  })

  describe('calcSkillDamage', () => {
    it('should calculate skill damage with multiplier', () => {
      expect(calcSkillDamage(10, 1.5)).toBe(15)
      expect(calcSkillDamage(20, 2.0)).toBe(40)
    })
  })

  describe('calcOfflineRewards', () => {
    it('should calculate offline rewards for study task', () => {
      const result = calcOfflineRewards('study', 300)
      expect(result.exp).toBe(60 * 10)
      expect(result.coins).toBe(0)
    })

    it('should calculate offline rewards for intern task', () => {
      const result = calcOfflineRewards('intern', 300)
      expect(result.exp).toBe(60 * 6)
      expect(result.coins).toBe(60 * 8)
    })

    it('should cap offline rewards at 8 hours', () => {
      const eightHours = 8 * 60 * 60
      const result = calcOfflineRewards('study', eightHours + 1000)
      const maxTicks = Math.floor(eightHours / 5)
      expect(result.exp).toBe(maxTicks * 10)
    })
  })
})
