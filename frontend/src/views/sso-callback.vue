<template>
  <div class="sso-callback-page">
    <div class="login-bg">
      <div class="login-bg-shape shape-1" />
      <div class="login-bg-shape shape-2" />
    </div>
    <div class="sso-callback-card">
      <div v-if="error" class="sso-error">
        <n-icon :size="48" color="#EF4444"><CloseCircleOutline /></n-icon>
        <h2>登录失败</h2>
        <p class="error-msg">{{ error }}</p>
        <n-button type="primary" size="large" @click="goLogin">返回登录</n-button>
      </div>
      <div v-else class="sso-loading">
        <n-spin :size="48" />
        <h2>正在登录...</h2>
        <p>正在通过单点登录系统验证身份，请稍候</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NIcon, NButton, NSpin } from 'naive-ui'
import { CloseCircleOutline } from '@vicons/ionicons5'
import { useAuthStore } from '@/stores/auth'
import { defaultPathForUser } from '@/utils/defaultPath'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const error = ref('')

function goLogin() {
  router.replace('/login?no_auto_sso=1')
}

function navigateAfterLogin(targetPath: string) {
  const path = String(targetPath || '').trim()
  if (!path.startsWith('/')) {
    router.replace('/home')
    return
  }
  if (typeof window !== 'undefined' && window.self !== window.top) {
    const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '')
    window.location.replace(`${base}${path}`)
    return
  }
  router.replace(path)
}

onMounted(async () => {
  const code = route.query.code as string
  const sessionState = route.query.session_state as string

  if (!code) {
    error.value = 'SSO 授权未返回 code 参数'
    return
  }

  try {
    await authStore.ssoLogin(code, sessionState || '')
    const redirectPath = route.query.redirect as string
    const defaultPath = defaultPathForUser(authStore)
    window.$message?.success('登录成功')
    navigateAfterLogin(
      redirectPath && redirectPath.startsWith('/') && !redirectPath.startsWith('/login') && !redirectPath.startsWith('/sso')
        ? redirectPath
        : defaultPath
    )
  } catch (e: any) {
    const data = e?.response?.data
    let msg = 'SSO 登录失败'
    if (data?.detail != null) {
      msg = Array.isArray(data.detail) ? (data.detail[0]?.msg || String(data.detail)) : String(data.detail)
    } else if (e?.message) {
      msg = e.message
    }
    error.value = msg
    window.$message?.error(msg)
  }
})
</script>

<style scoped>
.sso-callback-page {
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

.sso-callback-card {
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

.sso-loading h2,
.sso-error h2 {
  margin: 20px 0 8px;
  font-size: var(--sp-text-xl);
  color: var(--sp-text-primary);
  font-weight: 700;
}

.sso-loading p,
.sso-error p {
  margin: 0 0 24px;
  font-size: var(--sp-text-base);
  color: var(--sp-text-muted);
}

.error-msg {
  color: var(--sp-danger) !important;
  font-weight: 500;
}
</style>
