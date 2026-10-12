import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import Login from '@/views/Login.vue'
import ForgotPassword from '@/views/ForgotPassword.vue'
import ResetPassword from '@/views/ResetPassword.vue'
import Home from '@/views/Home.vue'

import { getSession, safeRedirect } from '@/services/auth'

declare module 'vue-router' {
  interface RouteMeta {
    /** Name of the page in the browser tab. */
    title?: string
  }
}

const routes: RouteRecordRaw[] = [
  { name: 'login', path: '/login', component: Login, meta: { title: 'Inloggen' } },
  { name: 'forgot-password', path: '/forgot-password', component: ForgotPassword, meta: { title: 'Wachtwoord vergeten' } },
  { name: 'reset-password', path: '/reset-password', component: ResetPassword, meta: { title: 'Nieuw wachtwoord' } },
  { name: 'home', path: '/', component: Home, meta: { title: 'Account' } },
  { path: '/:pathMatch(.*)*', redirect: { name: 'login' } },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

/**
 * An app sends its visitors here when ITS session check fails. When this site
 * then finds a session after all (a failing API call over there, a session
 * that is still cached), sending them straight back would bounce them between
 * the two for ever. So a tab is handed back to an app once; when it returns
 * within the minute it gets the login form, as it did before.
 */
const FORWARDED_KEY = 'fundermaps-auth:forwarded'
const FORWARD_AGAIN_AFTER_MS = 60_000

function forwardOnce(target: string): boolean {
  try {
    const { origin } = new URL(target)
    const last = JSON.parse(sessionStorage.getItem(FORWARDED_KEY) ?? 'null') as { origin?: string; at?: number } | null
    if (last?.origin === origin && Date.now() - (last.at ?? 0) < FORWARD_AGAIN_AFTER_MS) return false
    sessionStorage.setItem(FORWARDED_KEY, JSON.stringify({ origin, at: Date.now() }))
    return true
  } catch {
    // No storage, so no way to notice a bounce: the form.
    return false
  }
}

/**
 * The login form does not wait on a slow API: no answer within a few seconds
 * counts as "no session", which shows the form.
 */
const SESSION_WAIT_MS = 4000

function sessionInTime() {
  return Promise.race([getSession(), new Promise<null>((resolve) => setTimeout(resolve, SESSION_WAIT_MS, null))])
}

router.beforeEach(async (to, from) => {
  // The only protected page is the account screen; the session is the cookie.
  if (to.name === 'home' && !(await getSession())) {
    return { name: 'login', query: to.query }
  }

  // Someone who is logged in already is not asked to log in again: on to the
  // app that sent them here, else to the account page. Not when the account
  // page is where they come from: it sends them here itself (signed out, no
  // session, or the API wants a new login), and Back from it must stay Back.
  const fromAccountPage = from.name === 'home' || to.redirectedFrom?.name === 'home'
  if (to.name === 'login' && !fromAccountPage && (await sessionInTime())) {
    const redirect = Array.isArray(to.query.redirect) ? to.query.redirect[0] : to.query.redirect
    const target = safeRedirect(redirect)
    if (!target) return { name: 'home' }
    if (forwardOnce(target)) {
      // replace, not assign: Back from the app must not land on this page again.
      window.location.replace(target)
      return false
    }
  }
})

router.afterEach((to, _from, failure) => {
  if (!failure && to.meta.title) document.title = `${to.meta.title} — FunderMaps`
})

export default router
