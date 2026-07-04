import { test, expect } from '@playwright/test'

/**
 * C.4.3 登录页冒烟测试
 */
test.describe('登录页 (/login)', () => {
  test.beforeEach(async ({ page }) => {
    // 清理残留 token，确保路由守卫不会自动跳转
    await page.addInitScript(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    })
  })

  test('应正确渲染登录表单关键元素', async ({ page }) => {
    await page.goto('/login')

    // 标题
    await expect(page.getByRole('heading', { name: '登录你的账号' })).toBeVisible()

    // 用户名 + 密码输入框
    await expect(page.getByPlaceholder('输入用户名')).toBeVisible()
    await expect(page.getByPlaceholder('••••••••').first()).toBeVisible()

    // 提交按钮
    await expect(page.getByRole('button', { name: /进入冒险/ })).toBeVisible()

    // 跳转注册链接
    await expect(page.getByRole('link', { name: '立即注册' })).toBeVisible()
  })

  test('点击「立即注册」应跳转到 /register', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: '立即注册' }).click()
    await expect(page).toHaveURL(/\/register$/)
  })

  test('空表单提交应触发浏览器原生 required 校验', async ({ page }) => {
    await page.goto('/login')
    // 直接点提交，浏览器会拦截 required 字段
    await page.getByRole('button', { name: /进入冒险/ }).click()
    // 仍在 /login 页
    await expect(page).toHaveURL(/\/login$/)
  })
})
