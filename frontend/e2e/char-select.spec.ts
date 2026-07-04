import { test, expect } from '@playwright/test'

/**
 * C.4.5 角色选择页路由守卫测试
 */
test.describe('角色选择页 (/char-select) 路由守卫', () => {
  test('未登录访问应被重定向到 /login', async ({ page }) => {
    // 清理 token，确保未登录
    await page.addInitScript(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    })

    await page.goto('/char-select')

    // 路由守卫应拦截，跳转到 /login
    await expect(page).toHaveURL(/\/login/)
  })

  test('登录后（伪造 token）访问应能进入页面', async ({ page }) => {
    // 注入伪造 token，绕过前端守卫（不调用后端 API 也会因 Phaser 场景加载失败但路由可通过）
    await page.addInitScript(() => {
      localStorage.setItem('token', 'fake.jwt.token')
      localStorage.setItem('refreshToken', 'fake.jwt.refresh')
      localStorage.setItem('userId', '1')
      localStorage.setItem('username', 'tester')
      localStorage.setItem('nickname', '测试员')
    })

    await page.goto('/char-select')

    // 不应被重定向到 /login
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page).toHaveURL(/\/char-select/)
  })
})
