import { test, expect } from '@playwright/test'

/**
 * C.4.4 注册页冒烟测试
 */
test.describe('注册页 (/register)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    })
  })

  test('应正确渲染注册表单关键元素', async ({ page }) => {
    await page.goto('/register')

    // 标题
    await expect(page.getByRole('heading', { name: '创建新账号' })).toBeVisible()

    // 5 个输入框
    await expect(page.getByPlaceholder('登录用户名')).toBeVisible()
    await expect(page.getByPlaceholder('游戏内显示名')).toBeVisible()
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible()
    // 密码 + 确认密码两个框都使用 •••••••• placeholder
    await expect(page.getByPlaceholder('••••••••').first()).toBeVisible()
    await expect(page.getByPlaceholder('••••••••').nth(1)).toBeVisible()

    // 提交按钮
    await expect(page.getByRole('button', { name: /加入冒险/ })).toBeVisible()

    // 跳转登录链接
    await expect(page.getByRole('link', { name: '立即登录' })).toBeVisible()
  })

  test('点击「立即登录」应跳转到 /login', async ({ page }) => {
    await page.goto('/register')
    await page.getByRole('link', { name: '立即登录' }).click()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('两次密码不一致应显示提示', async ({ page }) => {
    await page.goto('/register')

    await page.getByPlaceholder('登录用户名').fill('testuser')
    await page.getByPlaceholder('游戏内显示名').fill('测试员')
    const passwordInputs = page.getByPlaceholder('••••••••')
    await passwordInputs.first().fill('Password123')
    await passwordInputs.nth(1).fill('Different123')

    // 出现「两次输入的密码不一致」红色提示
    await expect(page.getByText('两次输入的密码不一致')).toBeVisible()
  })
})
