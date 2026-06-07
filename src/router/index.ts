import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/',            redirect: '/dashboard' },
    { path: '/dashboard',   name: 'dashboard',     component: () => import('@/pages/DashboardPage.vue')    },
    { path: '/projects',    name: 'projects',      component: () => import('@/pages/ProjectListPage.vue')  },
    { path: '/tickets',     name: 'tickets',       component: () => import('@/pages/TicketListPage.vue')   },
    { path: '/tickets/create', name: 'create-ticket', component: () => import('@/pages/CreateTicketPage.vue') },
    { path: '/tickets/:id', name: 'ticket-detail', component: () => import('@/pages/TicketDetailPage.vue') },
    { path: '/summaries',   name: 'summaries',     component: () => import('@/pages/DailySummaryPage.vue') },
    { path: '/settings',    name: 'settings',      component: () => import('@/pages/SettingsPage.vue')     },
  ],
})
