import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue')
    },
    {
      path: '/char-select',
      name: 'char-select',
      component: () => import('../views/CharSelectView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/home',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/growth',
      name: 'growth',
      component: () => import('../views/GrowthView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: () => import('../views/InventoryView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/archive',
      name: 'archive',
      component: () => import('../views/ArchiveView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/map',
      name: 'map',
      component: () => import('../views/MapView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/ending',
      name: 'ending',
      component: () => import('../views/EndingView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/sprite-viewer',
      name: 'sprite-viewer',
      component: () => import('../components/SpriteFrameViewer.vue')
    }
  ]
})

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else {
    // 允许已登录用户访问 /login（用户主动访问登录页 = 想重新登录）
    // LoginView.vue onMounted 会清理残留 token
    next()
  }
})

export default router
