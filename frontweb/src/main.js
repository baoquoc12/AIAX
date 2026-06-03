import { computed, createApp, h, nextTick, watch } from 'vue'
import './styles/theme.css'
// 初始化主题（必须在挂载前执行）
import './composables/useTheme.js'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import { ElConfigProvider } from 'element-plus'
import 'element-plus/dist/index.css'
import en from 'element-plus/dist/locale/en.mjs'
import vi from 'element-plus/dist/locale/vi.mjs'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import { applyLanguage, currentLanguage, startRuntimeI18n } from './i18n/runtime'

const app = createApp({
  name: 'RootProvider',
  setup() {
    const elementLocale = computed(() => currentLanguage.value === 'vi' ? vi : en)
    watch(currentLanguage, () => nextTick(applyLanguage))

    return () => h(
      ElConfigProvider,
      {
        locale: elementLocale.value,
        message: {
          duration: 5000,
          showClose: true,
          offset: 28,
        },
      },
      () => h(App)
    )
  },
})
const pinia = createPinia()

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)
app.use(router)
app.use(ElementPlus)
app.mount('#app')
startRuntimeI18n()
