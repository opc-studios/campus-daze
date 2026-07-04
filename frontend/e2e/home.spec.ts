import { test, expect } from '@playwright/test'

/**
 * C.4.6 主页路由守卫测试
 */
test.describe('主页 (/home) 路由守卫', () => {
  test('未登录访问应被重定向到 /login', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    })

    await page.goto('/home')

    await expect(page).toHaveURL(/\/login/)
  })

  test('登录后（伪造 token）访问应能进入主页', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'fake.jwt.token')
      localStorage.setItem('refreshToken', 'fake.jwt.refresh')
      localStorage.setItem('userId', '1')
      localStorage.setItem('username', 'tester')
      localStorage.setItem('nickname', '测试员')
    })

    await page.goto('/home')

    // 不应被重定向到 /login
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page).toHaveURL(/\/home/)
  })

  test('根路径 / 应重定向到 /login（未登录）', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    })

    await page.goto('/')

    await expect(page).toHaveURL(/\/login/)
  })
})
