<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="login-bg-shape shape-1" />
      <div class="login-bg-shape shape-2" />
    </div>
    <div class="login-card">
      <div class="login-header">
        <div class="login-logo">
          <span class="logo-icon">◆</span>
        </div>
        <h1 class="login-title">制丝二设备管理系统</h1>
        <p class="login-subtitle">Spare Parts Management</p>
      </div>
      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="left"
        :show-label="false"
        class="login-form"
        @submit.prevent="handleSubmit"
      >
        <n-form-item path="username">
          <n-input
            v-model:value="form.username"
            placeholder="用户名（字母、数字、下划线或中文）"
            size="large"
            :maxlength="64"
            show-count
            class="login-input"
          >
            <template #prefix>
              <n-icon :size="16" color="#9CA3AF"><PersonOutline /></n-icon>
            </template>
          </n-input>
        </n-form-item>
        <n-form-item path="password">
          <n-input
            v-model:value="form.password"
            type="password"
            placeholder="密码"
            size="large"
            show-password-on="click"
            :maxlength="72"
            class="login-input"
            @keyup.enter="handleSubmit"
          >
            <template #prefix>
              <n-icon :size="16" color="#9CA3AF"><LockClosedOutline /></n-icon>
            </template>
          </n-input>
        </n-form-item>
        <n-form-item class="submit-item">
          <n-button
            type="primary"
            size="large"
            :loading="loading"
            block
            class="submit-btn"
            attr-type="button"
            @click="handleSubmit"
          >
            登 录
          </n-button>
        </n-form-item>
        <!-- SSO -->
        <n-form-item v-if="ssoEnabled" class="wechat-row">
          <div class="login-divider"><span>或</span></div>
          <div class="wechat-section">
            <p class="wechat-scan-tip">
              点击下方按钮将<strong>跳转到企业统一认证</strong>，在企业微信内可<strong>免登录</strong>，PC 浏览器可使用<strong>企业微信扫码</strong>登录。
            </p>
            <n-button
              type="success"
              size="large"
              :loading="ssoLoading"
              block
              class="wechat-btn"
              @click="handleSsoLogin(true)"
            >
              企业微信登录
            </n-button>
            <n-button
              secondary
              size="large"
              :loading="ssoLoading"
              block
              class="sso-account-btn"
              @click="handleSsoLogin(false)"
            >
              统一认证账号登录
            </n-button>
            <p class="wechat-hint">首次登录将自动注册，需管理员审批通过后方可使用。</p>
          </div>
        </n-form-item>
        <!-- Legacy WeChat -->
        <n-form-item v-else-if="wechatAuthUrl" class="wechat-row">
          <div class="login-divider"><span>或</span></div>
          <div class="wechat-section">
            <p class="wechat-scan-tip">
              点击下方按钮将<strong>跳转到企业微信授权页面</strong>，在跳转后的页面使用<strong>手机企业微信</strong>扫描二维码或确认授权即可登录。
            </p>
            <n-button
              type="success"
              size="large"
              :loading="wechatLoading"
              block
              class="wechat-btn"
              @click="handleWechatLogin"
            >
              企业微信扫码登录
            </n-button>
            <p class="wechat-hint">新用户扫码将自动提交注册申请，需管理员审批通过后可登录。</p>
            <div class="wechat-register-link">
              <span class="wechat-register-text">首次使用？</span>
              <a href="javascript:void(0)" class="wechat-register-a" @click="handleWechatLogin">企业微信扫码注册</a>
            </div>
          </div>
        </n-form-item>
        <n-form-item v-else class="wechat-row wechat-unconfigured">
          <p class="wechat-unconfigured-tip">
            企业微信登录：需管理员在系统后台配置企业微信应用后，此处才会显示「企业微信扫码登录」入口。
          </p>
        </n-form-item>
        <n-form-item class="link-row">
          <a href="javascript:void(0)" class="register-link" @click="showChangePasswordDialog = true">修改密码</a>
          <span class="link-sep">|</span>
          <router-link to="/register" class="register-link">没有账号？账号密码注册</router-link>
        </n-form-item>

        <!-- Change Password Dialog -->
        <n-modal
          v-model:show="showChangePasswordDialog"
          preset="dialog"
          title="修改密码"
          :mask-closable="false"
          style="width: 400px;"
          positive-text="确认修改"
          negative-text="取消"
          :loading="changePwdLoading"
          @positive-click="handleChangePasswordSubmit"
          @negative-click="() => { showChangePasswordDialog = false }"
          @after-leave="onChangePasswordDialogClosed"
        >
          <n-form
            ref="changePwdFormRef"
            :model="changePwdForm"
            :rules="changePwdRules"
            label-placement="left"
            label-width="80"
            class="change-pwd-form"
          >
            <n-form-item label="账号" path="username">
              <n-input v-model:value="changePwdForm.username" placeholder="请输入账号" :maxlength="64" show-count clearable />
            </n-form-item>
            <n-form-item label="旧密码" path="old_password">
              <n-input v-model:value="changePwdForm.old_password" type="password" placeholder="请输入旧密码" :maxlength="72" show-password-on="click" clearable />
            </n-form-item>
            <n-form-item label="新密码" path="new_password">
              <n-input v-model:value="changePwdForm.new_password" type="password" placeholder="至少 6 位" :maxlength="72" show-password-on="click" clearable />
            </n-form-item>
            <n-form-item label="确认新密码" path="confirm_password">
              <n-input v-model:value="changePwdForm.confirm_password" type="password" placeholder="请再次输入新密码" :maxlength="72" show-password-on="click" clearable />
            </n-form-item>
          </n-form>
        </n-modal>
      </n-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  NForm, NFormItem, NInput, NButton, NIcon, NModal,
  type FormInst, type FormRules,
} from 'naive-ui'
import { PersonOutline, LockClosedOutline } from '@vicons/ionicons5'
import { useAuthStore } from '@/stores/auth'
import { defaultPathForUser } from '@/utils/defaultPath'
import { wechatApi } from '@/api/wechat'
import { ssoApi } from '@/api/sso.ts'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const formRef = ref<FormInst | null>(null)
const changePwdFormRef = ref<FormInst | null>(null)
const loading = ref(false)
const wechatLoading = ref(false)
const wechatAuthUrl = ref('')
const ssoEnabled = ref(false)
const ssoLoading = ref(false)
const showChangePasswordDialog = ref(false)
const changePwdLoading = ref(false)
const form = reactive({ username: '', password: '' })
const changePwdForm = reactive({
  username: '',
  old_password: '',
  new_password: '',
  confirm_password: '',
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { max: 64, message: '用户名不能超过 64 个字符', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/,
      message: '用户名仅允许字母、数字、下划线或中文',
      trigger: 'blur',
    },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { max: 72, message: '密码不能超过 72 个字符', trigger: 'blur' },
  ],
}

const changePwdRules: FormRules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { max: 64, message: '账号不能超过 64 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, message: '账号仅允许字母、数字、下划线或中文', trigger: 'blur' },
  ],
  old_password: [
    { required: true, message: '请输入旧密码', trigger: 'blur' },
    { max: 72, message: '密码不能超过 72 个字符', trigger: 'blur' },
  ],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码至少 6 位', trigger: 'blur' },
    { max: 72, message: '密码不能超过 72 个字符', trigger: 'blur' },
  ],
  confirm_password: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator(_rule: unknown, value: string) {
        if (value !== changePwdForm.new_password) {
          return new Error('两次输入的新密码不一致')
        }
        return true
      },
      trigger: 'blur',
    },
  ],
}

const wechatErrorMessages: Record<string, string> = {
  not_configured: '企业微信未配置，无法扫码登录',
  no_code: '企业微信授权未返回 code',
  token_fail: '获取企业微信 access_token 失败',
  userinfo_fail: '获取企业微信用户信息失败',
  no_userid: '企业微信未返回用户标识',
  exception: '企业微信登录异常，请稍后重试',
}

async function fetchSsoStatus() {
  try {
    const res = await ssoApi.getStatus()
    ssoEnabled.value = res?.sso_enabled === true
  } catch {
    ssoEnabled.value = false
  }
}

async function handleSsoLogin(wechat: boolean) {
  ssoLoading.value = true
  try {
    const res = await ssoApi.getSsoUrl(wechat)
    const url = (res?.url || '').trim()
    if (url) {
      window.location.href = url
      return
    }
    window.$message?.warning('SSO 未配置或不可用')
  } catch {
    window.$message?.error('获取 SSO 登录链接失败')
  } finally {
    ssoLoading.value = false
  }
}

async function fetchWechatAuthUrl() {
  try {
    const res = await wechatApi.getAuthUrl()
    wechatAuthUrl.value = (res?.url || '').trim()
  } catch {
    wechatAuthUrl.value = ''
  }
}

async function handleWechatLogin() {
  if (!wechatAuthUrl.value) {
    window.$message?.warning('企业微信未配置或不可用')
    return
  }
  wechatLoading.value = true
  try {
    const res = await wechatApi.getAuthUrl()
    const url = (res?.url || '').trim()
    if (url) {
      window.location.href = url
      return
    }
    window.$message?.warning(res?.message || '企业微信未配置或不可用')
  } catch {
    window.$message?.error('获取企业微信登录链接失败')
  } finally {
    wechatLoading.value = false
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  loading.value = true
  try {
    const username = String(form.username ?? '').trim()
    const password = String(form.password ?? '')
    await authStore.login(username, password)
    const redirectPath = route.query.redirect as string
    const defaultPath = defaultPathForUser(authStore)
    window.$message?.success('登录成功')
    navigateAfterLogin(redirectPath && redirectPath.startsWith('/') && !redirectPath.startsWith('/login') ? redirectPath : defaultPath)
  } catch (e: any) {
    const data = e?.response?.data
    let msg = '登录失败'
    if (data?.detail != null) {
      msg = Array.isArray(data.detail) ? (data.detail[0]?.msg || String(data.detail)) : String(data.detail)
    } else if (e?.message) {
      msg = e.message
    }
    window.$message?.error(msg)
  } finally {
    loading.value = false
  }
}

function onChangePasswordDialogClosed() {
  changePwdForm.username = ''
  changePwdForm.old_password = ''
  changePwdForm.new_password = ''
  changePwdForm.confirm_password = ''
  changePwdFormRef.value?.restoreValidation()
}

async function handleChangePasswordSubmit() {
  if (!changePwdFormRef.value) return false
  try {
    await changePwdFormRef.value.validate()
  } catch {
    return false
  }
  changePwdLoading.value = true
  try {
    const { authApi } = await import('@/api/auth')
    await authApi.changePasswordFromLogin(
      changePwdForm.username.trim(),
      changePwdForm.old_password,
      changePwdForm.new_password
    )
    window.$message?.success('密码已修改，请使用新密码登录')
    showChangePasswordDialog.value = false
    onChangePasswordDialogClosed()
    return true
  } catch (e: any) {
    const data = e?.response?.data
    const msg = data?.detail != null
      ? (Array.isArray(data.detail) ? (data.detail[0]?.msg || String(data.detail)) : String(data.detail))
      : (e?.message || '修改失败')
    window.$message?.error(msg)
    return false
  } finally {
    changePwdLoading.value = false
  }
}

function isWechatWorkBrowser(): boolean {
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('wxwork')
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
  await Promise.all([fetchSsoStatus(), fetchWechatAuthUrl()])

  const q = route.query as Record<string, string>
  const token = q.token
  const pending = q.pending
  const wechatError = q.wechat_error

  if (
    !token &&
    !pending &&
    !wechatError &&
    !q.no_auto_sso &&
    ssoEnabled.value &&
    isWechatWorkBrowser() &&
    !localStorage.getItem('access_token')
  ) {
    handleSsoLogin(true)
    return
  }

  if (token) {
    loading.value = true
    try {
      await authStore.loginWithToken(token)
      const redirectPath = route.query.redirect as string
      const defaultPath = defaultPathForUser(authStore)
      window.$message?.success('登录成功')
      navigateAfterLogin(redirectPath && redirectPath.startsWith('/') && !redirectPath.startsWith('/login') ? redirectPath : defaultPath)
    } catch (e: any) {
      window.$message?.error(e?.message || e?.response?.data?.detail || '登录失败')
      router.replace('/login')
    } finally {
      loading.value = false
    }
    return
  }

  if (pending) {
    window.$message?.info('您的注册申请待管理员审批，请等待审批通过后再登录。')
    router.replace('/login')
    return
  }

  if (wechatError) {
    const msg = wechatErrorMessages[wechatError] || `企业微信登录失败：${wechatError}`
    window.$message?.error(msg)
    router.replace('/login')
  }
})
</script>

<style scoped>
.login-page {
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

.login-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
  padding: 40px 36px 32px;
  background: var(--sp-surface);
  border-radius: var(--sp-radius-2xl);
  box-shadow: var(--sp-shadow-lg);
  border: 1px solid var(--sp-border-light);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-logo {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--sp-primary) 0%, #2563EB 100%);
  border-radius: var(--sp-radius-md);
}

.logo-icon {
  font-size: 22px;
  color: #fff;
  font-weight: 300;
}

.login-title {
  margin: 0 0 6px;
  font-size: var(--sp-text-xl);
  font-weight: 700;
  color: var(--sp-text-primary);
  letter-spacing: -0.02em;
}

.login-subtitle {
  margin: 0;
  font-size: var(--sp-text-sm);
  color: var(--sp-text-muted);
  font-weight: 400;
  letter-spacing: 0.5px;
}

.login-form :deep(.n-form-item) {
  margin-bottom: 18px;
}

.submit-item {
  margin-top: 24px;
  margin-bottom: 16px;
}

.submit-btn {
  height: 44px;
  font-size: var(--sp-text-md);
  font-weight: 600;
  letter-spacing: 2px;
  border-radius: var(--sp-radius-md) !important;
  transition: transform var(--sp-transition-fast), box-shadow var(--sp-transition-fast);
}

.submit-btn:hover {
  transform: translateY(-1px);
}

.submit-btn:active {
  transform: translateY(0) scale(0.98);
}

.login-divider {
  width: 100%;
  display: flex;
  align-items: center;
  margin: 4px 0 16px;
  color: var(--sp-text-muted);
  font-size: var(--sp-text-sm);
}

.login-divider::before,
.login-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--sp-border);
}

.login-divider span {
  padding: 0 14px;
}

.wechat-row {
  margin-bottom: 0;
}

.wechat-section {
  width: 100%;
}

.wechat-scan-tip {
  margin: 0 0 12px;
  padding: 10px 12px;
  font-size: var(--sp-text-sm);
  color: var(--sp-text-secondary);
  line-height: 1.55;
  background: var(--sp-success-bg);
  border-radius: var(--sp-radius-sm);
  border: 1px solid rgba(16, 185, 129, 0.12);
}

.wechat-scan-tip strong {
  color: #065f46;
}

.wechat-btn {
  height: 44px;
  border-radius: var(--sp-radius-md) !important;
  font-weight: 500;
}

.sso-account-btn {
  height: 44px;
  border-radius: var(--sp-radius-md) !important;
  font-weight: 500;
  margin-top: 10px;
}

.wechat-hint {
  margin: 8px 0 4px;
  font-size: var(--sp-text-xs);
  color: var(--sp-text-muted);
  line-height: 1.45;
}

.wechat-unconfigured-tip {
  margin: 0;
  padding: 10px 12px;
  font-size: var(--sp-text-xs);
  color: var(--sp-text-muted);
  line-height: 1.55;
  background: var(--sp-content-bg);
  border-radius: var(--sp-radius-sm);
  border: 1px dashed var(--sp-border);
}

.wechat-register-link {
  font-size: var(--sp-text-sm);
  color: var(--sp-text-secondary);
}

.wechat-register-a {
  color: var(--sp-primary);
  text-decoration: none;
  margin-left: 6px;
  font-weight: 500;
}

.wechat-register-a:hover {
  text-decoration: underline;
  color: var(--sp-primary-dark);
}

.link-row {
  margin-bottom: 0;
  margin-top: 16px;
  text-align: center;
}

.link-row .register-link {
  color: var(--sp-primary);
  text-decoration: none;
  font-size: var(--sp-text-base);
  font-weight: 500;
}

.link-row .register-link:hover {
  color: var(--sp-primary-dark);
  text-decoration: underline;
}

.link-sep {
  margin: 0 10px;
  color: var(--sp-border);
  font-size: var(--sp-text-sm);
}

.change-pwd-form :deep(.n-form-item) {
  margin-bottom: 16px;
}

@media (max-width: 767px) {
  .login-card {
    max-width: calc(100vw - 32px);
    padding: 32px 20px 24px;
    border-radius: var(--sp-radius-xl);
  }
}
</style>
