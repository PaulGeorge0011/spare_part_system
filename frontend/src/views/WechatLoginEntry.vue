<template>
  <div class="wechat-entry-page">
    <div class="login-bg">
      <div class="login-bg-shape shape-1" />
      <div class="login-bg-shape shape-2" />
    </div>
    <div class="wechat-entry-card">
      <div v-if="error" class="wechat-entry-error">
        <n-icon :size="48" color="#EF4444"><CloseCircleOutline /></n-icon>
        <h2>无法跳转</h2>
        <p class="error-msg">{{ error }}</p>
        <n-button type="primary" @click="goLogin">前往登录页</n-button>
      </div>
      <div v-else class="wechat-entry-loading">
        <n-spin :size="48" />
        <h2>正在跳转到企业微信授权</h2>
        <p>请稍候，即将进入统一认证...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NIcon, NButton, NSpin } from 'naive-ui'
import { CloseCircleOutline } from '@vicons/ionicons5'
import { ssoApi } from '@/api/sso'
import { useAuthStore } from '@/stores/auth'
import { defaultPathForUser } from '@/utils/defaultPath'

const router = useRouter()
const authStore = useAuthStore()
const error = ref('')

function goLogin() {
  router.replace('/login')
}

onMounted(async () => {
  const token = authStore.token ?? localStorage.getItem('access_token')
  if (token && authStore.user) {
    router.replace(defaultPathForUser(authStore))
    return
  }
  if (token && !authStore.user) {
    try {
      await authStore.fetchUser()
      if (authStore.user) {
        router.replace(defaultPathForUser(authStore))
        return
      }
    } catch {
      // token invalid, continue SSO flow
    }
  }

  try {
    const statusRes = await ssoApi.getStatus()
    if (!statusRes?.sso_enabled) {
      error.value = '当前未启用企业微信登录，请使用账号密码登录。'
      return
    }
    const urlRes = await ssoApi.getSsoUrl(true)
    if (urlRes?.url) {
      window.location.href = urlRes.url
      return
    }
    error.value = '获取授权链接失败，请稍后重试或前往登录页。'
  } catch (e: any) {
    const detail = e?.response?.data?.detail
    error.value = typeof detail === 'string' ? detail : '网络异常，请检查配置后重试或前往登录页。'
  }
})
</script>

<style scoped>
.wechat-entry-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: #F8FAFC;
}

.login-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.login-bg-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(150px);
  opacity: 0.15;
}

.login-bg-shape.shape-1 {
  width: 500px;
  height: 500px;
  background: var(--sp-primary-light);
  top: -200px;
  right: -100px;
}

.login-bg-shape.shape-2 {
  width: 400px;
  height: 400px;
  background: var(--sp-success);
  bottom: -150px;
  left: -150px;
}

.wechat-entry-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  padding: 48px 40px;
  background: var(--sp-surface);
  border-radius: var(--sp-radius-2xl);
  box-shadow: var(--sp-shadow-lg);
  border: 1px solid var(--sp-border-light);
  text-align: center;
}

.wechat-entry-loading h2,
.wechat-entry-error h2 {
  margin: 20px 0 8px;
  font-size: var(--sp-text-xl);
  color: var(--sp-text-primary);
  font-weight: 700;
}

.wechat-entry-loading p,
.wechat-entry-error p {
  margin: 0 0 24px;
  font-size: var(--sp-text-base);
  color: var(--sp-text-muted);
}

.error-msg {
  color: var(--sp-danger) !important;
  font-weight: 500;
}
</style>
