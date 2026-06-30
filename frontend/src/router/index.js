import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/modules/users/views/LoginPage.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/modules/users/views/RegisterPage.vue')
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/modules/users/views/ForgotPasswordPage.vue')
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/modules/users/views/ResetPasswordPage.vue')
  },
  {
    path: '/user-center',
    name: 'UserCenter',
    component: () => import('@/modules/users/views/UserCenter.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/create-character',
    name: 'CreateCharacter',
    component: () => import('@/modules/characters/views/CreateCharacter.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/plaza',
    name: 'Plaza',
    component: () => import('@/modules/maps/views/MapPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/explore',
    name: 'Explore',
    component: () => import('@/modules/maps/views/ExplorePage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/battle',
    name: 'Battle',
    component: () => import('@/modules/gameplay/views/BattlePage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: () => import('@/modules/gameplay/views/TasksPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/rewards',
    name: 'Rewards',
    component: () => import('@/modules/gameplay/views/RewardsPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/rest',
    name: 'Rest',
    component: () => import('@/modules/gameplay/views/RestPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dialogue/:npcId',
    name: 'Dialogue',
    component: () => import('@/modules/dialogue/views/DialoguePage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/chapters',
    name: 'Chapters',
    component: () => import('@/modules/chapters/views/ChaptersPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/stages',
    name: 'Stages',
    component: () => import('@/modules/stages/views/StagesPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/saves',
    name: 'Saves',
    component: () => import('@/modules/saves/views/SavesPage.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router
