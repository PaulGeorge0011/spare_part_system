<template>
  <div class="register-page">
    <div class="login-bg">
      <div class="login-bg-shape shape-1" />
      <div class="login-bg-shape shape-2" />
    </div>
    <div class="register-card">
      <div class="register-header">
        <div class="register-logo">
          <span class="logo-icon">◆</span>
        </div>
        <h1 class="register-title">用户注册</h1>
        <p class="register-subtitle">Create Account</p>
      </div>
      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="left"
        :show-label="false"
        class="register-form"
        @submit.prevent="handleSubmit"
      >
        <n-form-item path="username">
          <n-input
            v-model:value="form.username"
            placeholder="用户名（2-64 字符）"
            size="large"
            :maxlength="64"
            show-count
          >
            <template #prefix>
              <n-icon :size="16" color="#9CA3AF"><PersonOutline /></n-icon>
            </template>
          </n-input>
        </n-form-item>
        <n-form-item path="realName">
          <n-input
            v-model:value="form.realName"
            placeholder="真实姓名（必填）"
            size="large"
            :maxlength="100"
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
            placeholder="密码（至少 6 位）"
            size="large"
            show-password-on="click"
            :maxlength="72"
          >
            <template #prefix>
              <n-icon :size="16" color="#9CA3AF"><LockClosedOutline /></n-icon>
            </template>
          </n-input>
        </n-form-item>
        <n-form-item path="confirmPassword">
          <n-input
            v-model:value="form.confirmPassword"
            type="password"
            placeholder="确认密码"
            size="large"
            show-password-on="click"
            :maxlength="72"
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
            注 册
          </n-button>
        </n-form-item>
        <n-form-item class="link-row">
          <router-link to="/login" class="register-link">已有账号？去登录</router-link>
        </n-form-item>
      </n-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import {
  NForm, NFormItem, NInput, NButton, NIcon,
  type FormInst, type FormRules,
} from 'naive-ui'
import { PersonOutline, LockClosedOutline } from '@vicons/ionicons5'
import { authApi } from '@/api/auth'

const router = useRouter()
const formRef = ref<FormInst | null>(null)
const loading = ref(false)
const form = reactive({
  username: '',
  realName: '',
  password: '',
  confirmPassword: '',
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 64, message: '用户名 2-64 字符', trigger: 'blur' },
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 1, max: 100, message: '真实姓名 1-100 字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 72, message: '密码至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator(_rule: unknown, value: string) {
        if (value !== form.password) {
          return new Error('两次输入的密码不一致')
        }
        return true
      },
      trigger: 'blur',
    },
  ],
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
    await authApi.register(form.username.trim(), form.realName.trim(), form.password)
    window.$message?.success('注册成功，请等待管理员审核通过后再登录')
    router.replace('/login')
  } catch (e: any) {
    const msg = e?.response?.data?.detail || '注册失败'
    window.$message?.error(typeof msg === 'string' ? msg : '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
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

.register-card {
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

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.register-logo {
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

.register-title {
  margin: 0 0 6px;
  font-size: var(--sp-text-xl);
  font-weight: 700;
  color: var(--sp-text-primary);
  letter-spacing: -0.02em;
}

.register-subtitle {
  margin: 0;
  font-size: var(--sp-text-sm);
  color: var(--sp-text-muted);
  font-weight: 400;
  letter-spacing: 0.5px;
}

.register-form :deep(.n-form-item) {
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

.link-row {
  margin-bottom: 0;
  margin-top: 8px;
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

@media (max-width: 767px) {
  .register-card {
    max-width: calc(100vw - 32px);
    padding: 32px 20px 24px;
    border-radius: var(--sp-radius-xl);
  }
}
</style>
