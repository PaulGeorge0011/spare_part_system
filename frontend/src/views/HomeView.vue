<template>
  <div class="home-page">
    <div class="welcome-banner">
      <div class="welcome-text">
        <p class="welcome-greeting">您好，{{ displayName }}</p>
        <p class="welcome-sub">请选择要进入的管理模块</p>
      </div>
      <div class="welcome-role">
        <n-tag :type="roleTagType" size="large">{{ roleLabel }}</n-tag>
      </div>
    </div>

    <div v-if="accessibleModules.length > 0" class="module-grid">
      <div
        v-for="mod in accessibleModules"
        :key="mod.id"
        class="module-card"
        :style="{ '--accent': mod.accentColor }"
        @click="router.push(mod.path)"
      >
        <div class="card-accent-bar" />
        <div class="card-body">
          <span class="card-icon">{{ mod.iconEmoji }}</span>
          <div class="card-info">
            <h3 class="card-name">{{ mod.name }}</h3>
            <p class="card-desc">{{ mod.description }}</p>
          </div>
        </div>
        <div class="card-footer">
          <n-button type="primary" size="small" secondary>进入 →</n-button>
        </div>
      </div>
    </div>

    <n-empty
      v-else
      description="您暂无任何模块的访问权限，请联系管理员分配权限"
      size="large"
      class="no-module"
    />
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'HomeView' })

import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { NTag, NButton, NEmpty } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import { ALL_MODULES } from '@/utils/modules'
import { ROLE_LABELS } from '@/api/user'

const router = useRouter()
const authStore = useAuthStore()

const displayName = computed(
  () => authStore.user?.real_name || authStore.user?.username || '',
)

const roleLabel = computed(
  () => ROLE_LABELS[authStore.user?.role ?? ''] ?? authStore.user?.role ?? '',
)

const roleTagType = computed(() => {
  const r = authStore.user?.role ?? ''
  if (r === 'admin') return 'error'
  if (r.endsWith('_admin')) return 'warning'
  return 'info'
})

const accessibleModules = computed(() =>
  ALL_MODULES.filter((m) => authStore.canAccessModule(m.id)),
)
</script>

<style scoped>
.home-page {
  padding: var(--sp-space-xl) var(--sp-space-lg) var(--sp-space-2xl);
  max-width: 960px;
  margin: 0 auto;
}

.welcome-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--sp-space-xl);
  padding: var(--sp-space-lg) var(--sp-space-xl);
  background: var(--sp-surface);
  border-radius: var(--sp-radius-xl);
  border: 1px solid var(--sp-border-light);
  box-shadow: var(--sp-shadow-sm);
  position: relative;
  overflow: hidden;
}

.welcome-banner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--sp-electrical) 0%, var(--sp-mechanical) 100%);
}

.welcome-greeting {
  margin: 0 0 4px;
  font-size: var(--sp-text-2xl);
  font-weight: 700;
  color: var(--sp-text-primary);
  letter-spacing: -0.02em;
}

.welcome-sub {
  margin: 0;
  font-size: var(--sp-text-base);
  color: var(--sp-text-muted);
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--sp-space-lg);
}

.module-card {
  position: relative;
  background: var(--sp-surface);
  border-radius: var(--sp-radius-xl);
  border: 1px solid var(--sp-border-light);
  box-shadow: var(--sp-shadow-sm);
  cursor: pointer;
  overflow: hidden;
  transition: transform var(--sp-transition-base), box-shadow var(--sp-transition-base), border-color var(--sp-transition-base);
  display: flex;
  flex-direction: column;
}

.module-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--sp-shadow-lg), 0 0 0 1px var(--accent);
  border-color: transparent;
}

.module-card:active {
  transform: translateY(-2px) scale(0.99);
}

.module-card:hover .card-footer :deep(.n-button) {
  background-color: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.card-accent-bar {
  height: 3px;
  background: var(--accent, var(--sp-primary));
  transition: height var(--sp-transition-fast);
}

.module-card:hover .card-accent-bar {
  height: 4px;
}

.card-body {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: var(--sp-space-lg) var(--sp-space-lg) var(--sp-space-md);
  flex: 1;
}

.card-icon {
  font-size: 36px;
  line-height: 1;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.card-name {
  margin: 0 0 6px;
  font-size: var(--sp-text-lg);
  font-weight: 600;
  color: var(--sp-text-primary);
  letter-spacing: -0.01em;
}

.card-desc {
  margin: 0;
  font-size: var(--sp-text-sm);
  color: var(--sp-text-muted);
  line-height: 1.55;
}

.card-footer {
  padding: var(--sp-space-sm) var(--sp-space-lg) var(--sp-space-lg);
  display: flex;
  justify-content: flex-end;
}

.card-footer :deep(.n-button) {
  transition: all var(--sp-transition-fast);
}

.no-module {
  margin-top: var(--sp-space-3xl);
}

@media (max-width: 767px) {
  .home-page {
    padding: var(--sp-space-md) var(--sp-space-sm) var(--sp-space-lg);
  }

  .welcome-banner {
    padding: var(--sp-space-md) var(--sp-space-md);
    margin-bottom: var(--sp-space-lg);
    border-radius: var(--sp-radius-lg);
  }

  .welcome-greeting {
    font-size: var(--sp-text-lg);
  }

  .module-grid {
    grid-template-columns: 1fr;
    gap: var(--sp-space-md);
  }

  .module-card {
    border-radius: var(--sp-radius-lg);
  }
}
</style>
