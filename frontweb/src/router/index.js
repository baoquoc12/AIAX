import { createRouter, createWebHistory } from 'vue-router'
import { applyLanguage, translateText } from '@/i18n/runtime'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'list',
      component: () => import('@/views/FilmList.vue'),
      meta: { title: '项目列表' }
    },
    {
      path: '/drama/:id',
      name: 'drama-detail',
      component: () => import('@/views/DramaDetail.vue'),
      meta: { title: '剧集管理' }
    },
    {
      path: '/film/:id',
      name: 'film',
      component: () => import('@/views/FilmCreate.vue'),
      meta: { title: 'AI 视频生成' }
    },
    {
      path: '/ai-config',
      name: 'ai-config',
      component: () => import('@/views/AiConfig.vue'),
      meta: { title: 'AI 配置' }
    },
    {
      path: '/workflow',
      name: 'workflow',
      component: () => import('@/views/ProductionWorkflow.vue'),
      meta: { title: 'Quy trình sản xuất AIAX' }
    },
    {
      path: '/pipeline/:id',
      name: 'pipeline',
      component: () => import('@/views/PipelinePage.vue'),
      meta: { title: 'Pipeline sản xuất AIAX' }
    },
    {
      path: '/prompt-engine/:id',
      name: 'prompt-engine',
      component: () => import('@/views/PromptEnginePage.vue'),
      meta: { title: 'Prompt Engine AIAX' }
    },
    {
      path: '/free-create',
      name: 'free-create',
      component: () => import('@/views/FreeCreate.vue'),
      meta: { title: '自由创作' }
    },
    {
      path: '/media-library',
      name: 'media-library',
      component: () => import('@/views/MediaLibrary.vue'),
      meta: { title: '媒体素材库' }
    }
  ]
})

router.beforeEach((to) => {
  if (to.meta.title) {
    document.title = translateText(`${to.meta.title} - LocalMiniDrama`)
  }
  return true
})

router.afterEach(() => {
  queueMicrotask(applyLanguage)
})

export default router
