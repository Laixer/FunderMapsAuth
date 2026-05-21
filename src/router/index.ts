import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import Login from '@/views/Login.vue'
import ForgotPassword from '@/views/ForgotPassword.vue'
import ResetPassword from '@/views/ResetPassword.vue'
import Home from '@/views/Home.vue'

import { getToken } from '@/services/auth'

const routes: RouteRecordRaw[] = [
  { name: 'login', path: '/login', component: Login },
  { name: 'forgot-password', path: '/forgot-password', component: ForgotPassword },
  { name: 'reset-password', path: '/reset-password', component: ResetPassword },
  { name: 'home', path: '/', component: Home },
  { path: '/:pathMatch(.*)*', redirect: { name: 'login' } },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  // The only protected page is the post-login landing screen.
  if (to.name === 'home' && !getToken()) {
    return { name: 'login' }
  }
})

export default router
