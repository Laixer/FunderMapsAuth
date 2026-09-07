import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import Login from '@/views/Login.vue'
import ForgotPassword from '@/views/ForgotPassword.vue'
import ResetPassword from '@/views/ResetPassword.vue'
import Home from '@/views/Home.vue'

import { getSession } from '@/services/auth'

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

router.beforeEach(async (to) => {
  // The only protected page is the account screen; the session is the cookie.
  if (to.name === 'home' && !(await getSession())) {
    return { name: 'login', query: to.query }
  }
})

export default router
