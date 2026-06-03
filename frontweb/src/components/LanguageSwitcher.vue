<template>
  <div class="language-switcher" aria-label="Language">
    <button
      v-for="lang in SUPPORTED_LANGUAGES"
      :key="lang.value"
      class="language-option"
      :class="{ active: currentLanguage === lang.value }"
      type="button"
      @click="changeLanguage(lang.value)"
    >
      {{ lang.label }}
    </button>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import request from '@/utils/request'
import { currentLanguage, setLanguage, SUPPORTED_LANGUAGES } from '@/i18n/runtime'

async function changeLanguage(language) {
  setLanguage(language)
  try {
    await request.put('/settings/language', { language })
  } catch {
    // The UI switch should keep working even if the backend is not running yet.
  }
}

onMounted(() => {
  changeLanguage(currentLanguage.value)
})
</script>

<style scoped>
.language-switcher {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 3000;
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-card);
  box-shadow: var(--shadow-sm);
}

.language-option {
  min-width: 82px;
  height: 30px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}

.language-option.active {
  background: var(--primary-color);
  color: #fff;
}

@media (max-width: 640px) {
  .language-switcher {
    right: 10px;
    bottom: 10px;
  }

  .language-option {
    min-width: 72px;
  }
}
</style>
