<template>
  <div class="set-password-page">
    <div class="login-bg">
      <div class="login-bg-shape shape-1" />
      <div class="login-bg-shape shape-2" />
    </div>
    <div class="set-password-card">
      <h1 class="title">设置登录密码</h1>
      <p class="subtitle">请设置您的新密码，设置成功后请使用新密码登录</p>
      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="left"
        :show-label="false"
        class="form"
        @submit.prevent="handleSubmit"
      >
        <n-form-item path="newPassword">
          <n-input
            v-model:value="form.newPassword"
            type="password"
            placeholder="新密码（至少 6 位）"
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
        <n-form-item path="confirmPassword">
          <n-input
            v-model:value="form.confirmPassword"
            type="password"
            placeholder="再次输入新密码"
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
            确认设置
          </n-button>
        </n-form-item>
      </n-form>
      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NForm, NFormItem, NInput, NButton, NIcon,
  type FormInst, type FormRules,
} from 'naive-ui'
import { LockClosedOutline } from '@vicons/ionicons5'
import { authApi } from '@/api/auth'

const route = useRoute()
const router = useRouter()

const token = ref('')
const formRef = ref<FormInst | null>(null)
const loading = ref(false)
const errorMsg = ref('')

const form = reactive({
  newPassword: '',
  confirmPassword: '',
})

const rules: FormRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator(_rule: unknown, value: string) {
        if (value !== form.newPassword) {
          return new Error('两次输入的密码不一致')
        }
        return true
      },
      trigger: 'blur',
    },
  ],
}

onMounted(() => {
  const t = route.query.token
  token.value = typeof t === 'string' ? t : ''
  if (!token.value) {
    errorMsg.value = '缺少设置密码链接参数，请向管理员获取正确链接'
  }
})

async function handleSubmit() {
  if (!token.value || !formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    await authApi.setPasswordByToken(token.value, form.newPassword)
    window.$message?.success('密码设置成功，请使用新密码登录')
    router.replace({ path: '/login' })
  } catch (e: any) {
    const detail = e?.response?.data?.detail
    errorMsg.value = typeof detail === 'string' ? detail : '设置失败，链接可能已过期'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.set-password-page {
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

.set-password-card {
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

.title {
  margin: 0 0 8px;
  font-size: var(--sp-text-xl);
  color: var(--sp-text-primary);
  text-align: center;
  font-weight: 700;
}

.subtitle {
  margin: 0 0 28px;
  font-size: var(--sp-text-sm);
  color: var(--sp-text-muted);
  text-align: center;
}

.form :deep(.n-form-item) {
  margin-bottom: 18px;
}

.submit-item {
  margin-bottom: 0;
  margin-top: 24px;
}

.submit-btn {
  height: 44px;
  font-size: var(--sp-text-md);
  font-weight: 600;
  border-radius: var(--sp-radius-md) !important;
}

.error-msg {
  margin: 16px 0 0;
  font-size: var(--sp-text-base);
  color: var(--sp-danger);
  text-align: center;
}

@media (max-width: 767px) {
  .set-password-card {
    max-width: calc(100vw - 32px);
    padding: 32px 20px 24px;
    border-radius: var(--sp-radius-xl);
  }
}
</style>
