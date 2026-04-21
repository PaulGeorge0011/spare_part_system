<template>
  <div class="user-manage-page">
    <h2>用户管理</h2>
    <p class="page-desc">管理用户账号、模块权限与角色。<strong>权限分配顺序</strong>：先配置模块权限（只读/可编辑），再分配角色。模块权限决定用户对数据的操作范围，角色决定用户可见的功能页面及用户管理能力。</p>

    <div class="toolbar">
      <n-button type="primary" :loading="batchUploading" @click="batchUploadInput?.click()">
        批量新增用户
      </n-button>
      <n-button type="success" :loading="createSaving" @click="openCreateUserDialog">
        新建用户
      </n-button>
      <input
        ref="batchUploadInput"
        type="file"
        accept=".xlsx"
        style="display: none"
        @change="handleBatchFileChange"
      />
    </div>
    <n-card class="table-card">
      <!-- 移动端：卡片列表 -->
      <n-spin :show="loading" v-if="isMobile">
        <div class="user-card-list">
          <div v-for="row in users" :key="row.id" class="user-card">
            <div class="user-card-header">
              <span class="user-card-name">{{ row.username }}</span>
              <n-tag :type="row.role === 'admin' ? 'error' : 'primary'" size="small">{{ roleLabel(row.role) }}</n-tag>
              <n-tag :type="row.status === 'approved' ? 'success' : 'warning'" size="small">{{ statusLabel(row.status) }}</n-tag>
            </div>
            <div v-if="row.real_name" class="user-card-real-name">真实姓名：{{ row.real_name }}</div>
            <div class="user-card-meta">
              <span v-if="row.wechat_name">企业微信: {{ row.wechat_name }}</span>
              <span class="user-card-time">{{ formatDateTime(row.created_at) || '—' }}</span>
            </div>
            <div class="user-card-actions">
              <template v-if="row.status === 'pending'">
                <template v-for="opt in approveRoleOptions" :key="opt.value">
                  <n-button
                    type="success"
                    size="small"
                    @click="opt.value === 'general_staff' ? openApproveGenStaffDialog(row) : handleApprove(row, opt.value)"
                  >{{ opt.label }}</n-button>
                </template>
                <n-popconfirm @positive-click="handleReject(row)">
                  <template #trigger>
                    <n-button type="error" size="small">拒绝</n-button>
                  </template>
                  确定拒绝？
                </n-popconfirm>
              </template>
              <template v-else-if="row.id !== currentUserId && row.username !== 'admin'">
                <!-- 通用人员：模块管理员只能配置权限 -->
                <template v-if="row.role === 'general_staff' && !isSuperAdmin">
                  <n-tag type="warning" size="small" style="margin-right: 8px">通用人员</n-tag>
                  <n-button
                    v-if="canConfigurePermForRow(row)"
                    type="primary"
                    size="small"
                    secondary
                    @click="openPermDialog(row)"
                  >
                    模块权限
                  </n-button>
                </template>
                <template v-else>
                  <n-select
                    v-model:value="roleMap[row.id]"
                    placeholder="修改角色"
                    size="small"
                    style="width: 100%; margin-bottom: 8px"
                    :options="editRoleSelectOptions"
                    @update:value="(v: string) => handleRoleChange(row, v)"
                  />
                  <n-button
                    v-if="canConfigurePermForRow(row)"
                    type="primary"
                    size="small"
                    secondary
                    style="margin-right: 8px; margin-bottom: 8px"
                    @click="openPermDialog(row)"
                  >
                    模块权限
                  </n-button>
                  <n-popconfirm v-if="canDeleteRow(row)" @positive-click="handleDelete(row)">
                    <template #trigger>
                      <n-button type="error" size="small">删除</n-button>
                    </template>
                    确定删除？
                  </n-popconfirm>
                </template>
              </template>
              <template v-else>
                <n-tag type="info" size="small">{{ row.id === currentUserId ? '当前用户（不可修改）' : 'admin（不可删除）' }}</n-tag>
              </template>
            </div>
          </div>
        </div>
      </n-spin>
      <!-- PC 端：表格 -->
      <n-spin :show="loading" v-else>
        <n-data-table
          :columns="tableColumns"
          :data="users"
          :bordered="true"
          :striped="true"
          :max-height="520"
        />
      </n-spin>
      <div class="total-tip">共 {{ users.length }} 个用户</div>
    </n-card>

    <!-- 模块权限配置弹窗 -->
    <n-modal
      v-model:show="permDialogVisible"
      preset="card"
      :title="`配置模块权限 — ${permTarget?.username ?? ''}`"
      :style="isMobile ? 'width: 95%' : 'width: 520px'"
      :mask-closable="false"
      class="perm-dialog"
      :class="{ 'perm-dialog--mobile': isMobile }"
    >
      <div v-if="permDialogModules.length === 0" class="perm-empty">
        <n-empty description="当前暂无可配置的模块" :size="80" />
      </div>
      <template v-else>
        <p class="perm-dialog-desc">
          为 <strong>{{ permTarget?.username }}</strong> 配置各模块的访问权限。
          <template v-if="!isSuperAdmin">
            <br /><span style="color: #E6A23C; font-size: 12px;">您作为模块管理员，可为本模块用户授予「只读」或「可编辑」权限。</span>
          </template>
        </p>
        <n-data-table :columns="permTableColumns" :data="permDialogModules" :bordered="true" size="small" />
        <div class="perm-level-legend">
          <span><strong>可编辑</strong>：可查看、查询、增删改所有数据（用户管理权限由角色决定）</span>
          <span><strong>只读</strong>：仅可查看、查询、导出，不可增删改</span>
        </div>
      </template>
      <template #footer>
        <n-button @click="permDialogVisible = false">取消</n-button>
        <n-button
          v-if="permDialogModules.length > 0"
          type="primary"
          :loading="permSaving"
          @click="savePermissions"
          style="margin-left: 8px"
        >
          保存
        </n-button>
      </template>
    </n-modal>

    <!-- 通用人员审批弹窗：同步分配初始模块权限 -->
    <n-modal
      v-model:show="approveGenStaffDialogVisible"
      preset="card"
      :title="`审批通过为通用人员 — ${approveGenStaffTarget?.wechat_name || approveGenStaffTarget?.username || ''}`"
      style="width: 520px"
      :mask-closable="false"
    >
      <div v-if="newModules.length === 0">
        <n-alert
          title="当前暂无可配置的扩展模块，通用人员审批后将无任何模块访问权限，后续可通过「模块权限」按钮进行配置。"
          type="warning"
          :closable="false"
          style="margin-bottom: 16px"
        />
      </div>
      <template v-else>
        <p class="perm-dialog-desc">
          将 <strong>{{ approveGenStaffTarget?.wechat_name || approveGenStaffTarget?.username }}</strong> 审批为通用人员，并设置初始模块权限。
          未选择权限的模块将无法访问（后续可修改）。
        </p>
        <n-data-table :columns="approvePermTableColumns" :data="newModules" :bordered="true" size="small" />
        <div class="perm-level-legend" style="margin-top: 12px">
          <span><strong>可编辑</strong>：可查看、查询、增删改所有数据</span>
          <span><strong>只读</strong>：仅可查看、查询、导出，不可增删改</span>
        </div>
      </template>
      <template #footer>
        <n-button @click="approveGenStaffDialogVisible = false">取消</n-button>
        <n-button type="success" :loading="approveGenStaffSaving" @click="confirmApproveGenStaff" style="margin-left: 8px">
          确认通过
        </n-button>
      </template>
    </n-modal>

    <!-- 新建用户弹窗 -->
    <n-modal
      v-model:show="createUserDialogVisible"
      preset="card"
      title="新建用户"
      :style="isMobile ? 'width: 95%' : 'width: 520px'"
      :mask-closable="false"
      class="perm-dialog"
      :class="{ 'perm-dialog--mobile': isMobile }"
      @after-leave="resetCreateForm"
    >
      <n-form ref="createFormRef" :model="createForm" :rules="createFormRules" label-placement="left" label-width="100">
        <n-form-item label="用户名" path="username">
          <n-input v-model:value="createForm.username" placeholder="字母、数字、下划线或中文" maxlength="64" show-count />
        </n-form-item>
        <n-form-item label="真实姓名" path="real_name">
          <n-input v-model:value="createForm.real_name" placeholder="选填" maxlength="100" show-count />
        </n-form-item>
        <n-form-item label="角色" path="role">
          <n-select v-model:value="createForm.role" placeholder="请选择角色" style="width: 100%" :options="createRoleSelectOptions" />
          <p v-if="!isSuperAdmin" class="create-role-tip">您作为模块管理员，仅可新建本模块领用员或通用人员。</p>
        </n-form-item>
        <template v-if="createPermModules.length > 0 && (createForm.role === 'general_staff' || ROLE_MODULE_REQUIREMENT[createForm.role])">
          <n-form-item label="模块权限">
            <span class="create-perm-desc">
              <template v-if="createForm.role === 'general_staff'">配置通用人员可访问的模块及级别（选填，后续可改）</template>
              <template v-else>为此角色预配置模块权限（角色分配需先有模块权限）</template>
            </span>
          </n-form-item>
          <n-data-table :columns="createPermTableColumns" :data="createPermModules" :bordered="true" size="small" />
        </template>
      </n-form>
      <template #footer>
        <n-button @click="createUserDialogVisible = false">取消</n-button>
        <n-button type="primary" :loading="createSaving" @click="submitCreateUser" style="margin-left: 8px">确定新建</n-button>
      </template>
    </n-modal>

    <!-- 新建用户成功：设置密码链接 -->
    <n-modal
      v-model:show="createResultVisible"
      preset="card"
      title="新建成功"
      style="width: 560px"
      :mask-closable="false"
    >
      <p class="batch-links-title">请将以下设置密码链接发给该用户（链接 7 天内有效）：</p>
      <div v-if="createResult" class="batch-link-row">
        <span class="batch-username">{{ createResult.username }}{{ createResult.real_name ? `（${createResult.real_name}）` : '' }}</span>
        <n-input
          :value="getSetupLink(createResult.token)"
          readonly
          size="small"
          class="batch-link-input"
        >
          <template #suffix>
            <n-button size="small" @click="copySetupLink(createResult!.token)">复制</n-button>
          </template>
        </n-input>
      </div>
      <template #footer>
        <n-button type="primary" @click="createResultVisible = false; fetchUsers()">关闭并刷新</n-button>
      </template>
    </n-modal>

    <!-- 批量新增结果弹窗 -->
    <n-modal
      v-model:show="batchResultVisible"
      preset="card"
      title="批量新增结果"
      style="width: 560px"
      :mask-closable="false"
    >
      <p v-if="batchResult">成功 {{ batchResult.created }} 个，失败 {{ batchResult.failed }} 个</p>
      <div v-if="batchResult?.items?.length" class="batch-links">
        <p class="batch-links-title">请将以下设置密码链接发给对应用户（链接 7 天内有效）：</p>
        <div v-for="item in batchResult.items" :key="item.username" class="batch-link-row">
          <span class="batch-username">{{ item.username }}{{ item.real_name ? `（${item.real_name}）` : '' }}</span>
          <n-input
            :value="getSetupLink(item.token)"
            readonly
            size="small"
            class="batch-link-input"
          >
            <template #suffix>
              <n-button size="small" @click="copySetupLink(item.token)">复制</n-button>
            </template>
          </n-input>
        </div>
      </div>
      <div v-if="batchResult?.errors?.length" class="batch-errors">
        <p class="batch-errors-title">失败行：</p>
        <ul>
          <li v-for="(err, i) in batchResult.errors" :key="i">第 {{ err.row }} 行 {{ err.username }}：{{ err.error }}</li>
        </ul>
      </div>
      <template #footer>
        <n-button type="primary" @click="batchResultVisible = false; fetchUsers()">关闭并刷新</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
// 定义组件名称，用于 keep-alive 缓存
defineOptions({
  name: 'UserManage'
})

import { ref, reactive, onMounted, computed, h } from 'vue'
import { useIsMobile } from '@/composables/useIsMobile'
import {
  NCard, NButton, NTag, NDataTable, NSpin, NModal,
  NForm, NFormItem, NInput, NSelect, NPopconfirm,
  NEmpty, NAlert,
} from 'naive-ui'
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import { userApi, type UserListItem, ROLE_LABELS, type UserRole, type BatchCreateUsersResult, type AdminCreateUserResult } from '@/api/user'
import { formatDateTime } from '@/utils/date'
import { ALL_MODULES, NEW_MODULES, PERM_LEVEL_OPTIONS, ROLE_MANAGED_MODULES } from '@/utils/modules'

const authStore = useAuthStore()
const { isMobile } = useIsMobile()
const currentUserId = computed(() => authStore.user?.id ?? null)
const isSuperAdmin = computed(() => authStore.isSuperAdmin)
const isElectricalAdmin = computed(() => authStore.isElectricalAdmin)
const isMechanicalAdmin = computed(() => authStore.isMechanicalAdmin)

/** 当前用户是否可删除该行：超级管理员可删非 admin 且非自己；电气管理员仅可删电气领用员；机械管理员仅可删机械领用员 */
function canDeleteRow(row: UserListItem): boolean {
  if (row.id === currentUserId.value) return false
  if (row.username === 'admin') return false
  if (authStore.user?.username === 'admin') return true
  if (isElectricalAdmin.value && row.role === 'electrical_requisition_clerk') return true
  if (isMechanicalAdmin.value && row.role === 'mechanical_requisition_clerk') return true
  return false
}

/** 分配以下角色前，用户须先具备对应模块权限（先设模块权限，再分配角色） */
const ROLE_MODULE_REQUIREMENT: Record<string, { module: string; label: string }> = {
  electrical_admin:             { module: 'electrical', label: '电气备件' },
  electrical_requisition_clerk: { module: 'electrical', label: '电气备件' },
  mechanical_admin:             { module: 'mechanical', label: '机械备件' },
  mechanical_requisition_clerk: { module: 'mechanical', label: '机械备件' },
}

/** 检查目标用户是否已具备指定模块权限（通过 permissions JSON 或角色） */
function userHasModuleAccess(row: UserListItem, moduleId: string): boolean {
  if (row.permissions && moduleId in row.permissions) return true
  if (moduleId === 'electrical' && ['electrical_admin', 'electrical_requisition_clerk', 'requisition_clerk'].includes(row.role)) return true
  if (moduleId === 'mechanical' && ['mechanical_admin', 'mechanical_requisition_clerk'].includes(row.role)) return true
  return false
}

const loading = ref(false)
const users = ref<UserListItem[]>([])
const roleMap = reactive<Record<number, string>>({})

const batchUploadInput = ref<HTMLInputElement | null>(null)
const batchUploading = ref(false)
const batchResultVisible = ref(false)
const batchResult = ref<BatchCreateUsersResult | null>(null)

// 新建用户
const createUserDialogVisible = ref(false)
const createFormRef = ref<FormInst | null>(null)
const createForm = reactive({ username: '', real_name: '', role: '' as UserRole | '' })
const createFormRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
}
const createPermMap = reactive<Record<string, string>>({})
const createSaving = ref(false)
const createResultVisible = ref(false)
const createResult = ref<AdminCreateUserResult | null>(null)

/** 新建用户时可选角色：超级管理员任意；电气/机械管理员仅本模块领用员或通用人员 */
const createRoleOptions = computed(() => {
  if (authStore.user?.username === 'admin') {
    return [
      { label: '超级管理员', value: 'admin' },
      { label: '电气领用员', value: 'electrical_requisition_clerk' },
      { label: '机械领用员', value: 'mechanical_requisition_clerk' },
      { label: '电气管理员', value: 'electrical_admin' },
      { label: '机械管理员', value: 'mechanical_admin' },
      { label: '通用人员', value: 'general_staff' },
    ]
  }
  if (isElectricalAdmin.value) {
    return [
      { label: '电气领用员', value: 'electrical_requisition_clerk' },
      { label: '通用人员', value: 'general_staff' },
    ]
  }
  if (isMechanicalAdmin.value) {
    return [
      { label: '机械领用员', value: 'mechanical_requisition_clerk' },
      { label: '通用人员', value: 'general_staff' },
    ]
  }
  return []
})
const createRoleSelectOptions = computed(() => createRoleOptions.value)
const createPermModules = computed(() => permDialogModules.value)
const createPermLevelOptions = computed(() => permDialogLevelOptions.value)

// Create perm table columns (for n-data-table inside create user dialog)
const createPermTableColumns = computed<DataTableColumns<any>>(() => [
  { title: '模块', key: 'name', minWidth: 120 },
  {
    title: '权限级别', key: 'level', width: 180, align: 'center',
    render(row: any) {
      return h(NSelect, {
        value: createPermMap[row.id] || null,
        placeholder: '不授权',
        size: 'small',
        clearable: true,
        style: 'width: 130px',
        options: createPermLevelOptions.value.map(lv => ({ label: lv.label, value: lv.value })),
        'onUpdate:value': (v: string | null) => { createPermMap[row.id] = v || '' },
      })
    },
  },
])

function openCreateUserDialog() {
  createForm.username = ''
  createForm.real_name = ''
  createForm.role = ''
  ALL_MODULES.forEach((m) => { createPermMap[m.id] = '' })
  createUserDialogVisible.value = true
}

function resetCreateForm() {
  createForm.username = ''
  createForm.real_name = ''
  createForm.role = ''
  ALL_MODULES.forEach((m) => { createPermMap[m.id] = '' })
}

async function submitCreateUser() {
  if (!createFormRef.value) return
  try {
    await createFormRef.value.validate()
  } catch {
    return
  }
  if (!createForm.username.trim()) {
    window.$message?.warning('请输入用户名')
    return
  }
  if (!createForm.role) {
    window.$message?.warning('请选择角色')
    return
  }
  const permissions: Record<string, string> = {}
  if (createForm.role === 'general_staff') {
    // 通用人员：使用用户选择的模块权限
    createPermModules.value.forEach((m) => {
      if (createPermMap[m.id]) permissions[m.id] = createPermMap[m.id]
    })
  } else {
    // 模块角色（领用员/管理员）：若未配置对应模块权限，自动按角色级别预填
    const req = ROLE_MODULE_REQUIREMENT[createForm.role]
    if (req) {
      const autoLevel = ['electrical_admin', 'mechanical_admin'].includes(createForm.role) ? 'editor' : 'viewer'
      if (createPermMap[req.module]) {
        permissions[req.module] = createPermMap[req.module]
      } else {
        permissions[req.module] = autoLevel
      }
    }
  }
  createSaving.value = true
  try {
    const res = await userApi.createUser({
      username: createForm.username.trim(),
      real_name: createForm.real_name?.trim() || undefined,
      role: createForm.role as UserRole,
      permissions: Object.keys(permissions).length ? permissions : undefined,
    })
    createResult.value = res
    createResultVisible.value = true
    createUserDialogVisible.value = false
    window.$message?.success(`已新建用户 ${res.username}，请将设置密码链接发给该用户`)
  } catch (e: any) {
    window.$message?.error(e?.response?.data?.detail || '新建失败')
  } finally {
    createSaving.value = false
  }
}

// 模块权限弹窗
const permDialogVisible = ref(false)
const permTarget = ref<UserListItem | null>(null)
const permEditMap = reactive<Record<string, string>>({})
const permSaving = ref(false)

/** 当前操作者可在弹窗中配置的模块列表：超级管理员全部模块；模块管理员仅自己管辖的模块 */
const permDialogModules = computed(() => {
  if (authStore.isSuperAdmin) return ALL_MODULES
  const managed = ROLE_MANAGED_MODULES[authStore.user?.role ?? '']
  if (managed) return ALL_MODULES.filter((m) => managed.modules.includes(m.id))
  return []
})

/** 当前操作者可选的最高权限级别：超级管理员全部；模块管理员最高 editor */
const permDialogLevelOptions = computed(() => {
  if (authStore.isSuperAdmin) return PERM_LEVEL_OPTIONS
  const managed = ROLE_MANAGED_MODULES[authStore.user?.role ?? '']
  if (managed) return PERM_LEVEL_OPTIONS.filter((o) => o.value !== 'admin')
  return []
})

// Perm table columns
const permTableColumns = computed<DataTableColumns<any>>(() => [
  { title: '模块', key: 'name', minWidth: 130 },
  {
    title: '权限级别', key: 'level', width: 200, align: 'center',
    render(row: any) {
      return h(NSelect, {
        value: permEditMap[row.id] || null,
        placeholder: '不授权',
        size: 'small',
        clearable: true,
        style: 'width: 140px',
        options: permDialogLevelOptions.value.map(lv => ({ label: lv.label, value: lv.value })),
        'onUpdate:value': (v: string | null) => { permEditMap[row.id] = v || '' },
      })
    },
  },
])

// Approve perm table columns
const approvePermTableColumns = computed<DataTableColumns<any>>(() => [
  { title: '模块', key: 'name', minWidth: 120 },
  {
    title: '初始权限', key: 'level', width: 180, align: 'center',
    render(row: any) {
      return h(NSelect, {
        value: approveGenStaffPermMap[row.id] || null,
        placeholder: '不授权',
        size: 'small',
        clearable: true,
        style: 'width: 130px',
        options: PERM_LEVEL_OPTIONS.map(lv => ({ label: lv.label, value: lv.value })),
        'onUpdate:value': (v: string | null) => { approveGenStaffPermMap[row.id] = v || '' },
      })
    },
  },
])

/** 是否可以为某行用户配置模块权限 */
function canConfigurePermForRow(row: UserListItem): boolean {
  if (row.id === currentUserId.value) return false
  if (row.username === 'admin') return false
  if (authStore.isSuperAdmin) return true
  // 模块管理员可为本模块内任何非管理员角色的用户配置模块权限
  if (authStore.isElectricalAdmin || authStore.isMechanicalAdmin) {
    if (['electrical_admin', 'mechanical_admin'].includes(row.role)) return false
    return true
  }
  return false
}

/** 已弃用引用（保留供 approveGenStaffDialog 使用） */
const newModules = computed(() => NEW_MODULES)

// 通用人员审批弹窗
const approveGenStaffDialogVisible = ref(false)
const approveGenStaffTarget = ref<UserListItem | null>(null)
const approveGenStaffPermMap = reactive<Record<string, string>>({})
const approveGenStaffSaving = ref(false)

function openPermDialog(row: UserListItem) {
  permTarget.value = row
  // 初始化编辑映射：所有模块均填入（空字符串代表无权限）
  ALL_MODULES.forEach((m) => {
    permEditMap[m.id] = row.permissions?.[m.id] ?? ''
  })
  permDialogVisible.value = true
}

async function savePermissions() {
  if (!permTarget.value) return
  // 将当前可配置的模块发送给后端（含空值以便后端做删除合并）
  const payload: Record<string, string> = {}
  permDialogModules.value.forEach((m) => {
    payload[m.id] = permEditMap[m.id] || ''
  })
  permSaving.value = true
  try {
    const updated = await userApi.updatePermissions(permTarget.value.id, payload)
    const row = users.value.find((u) => u.id === permTarget.value!.id)
    if (row) row.permissions = updated.permissions
    window.$message?.success('模块权限已保存')
    permDialogVisible.value = false
  } catch (e: any) {
    window.$message?.error(e?.response?.data?.detail || '保存失败')
  } finally {
    permSaving.value = false
  }
}

function getSetupLink(token: string) {
  if (typeof window === 'undefined') return ''
  const base = import.meta.env.BASE_URL
  const path = base.endsWith('/') ? `${base}set-password` : `${base}/set-password`
  return `${window.location.origin}${path}?token=${encodeURIComponent(token)}`
}

function copySetupLink(token: string) {
  const link = getSetupLink(token)
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(link).then(() => window.$message?.success('已复制到剪贴板')).catch(() => fallbackCopy(link))
  } else {
    fallbackCopy(link)
  }
}
function fallbackCopy(text: string) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  try {
    document.execCommand('copy')
    window.$message?.success('已复制到剪贴板')
  } finally {
    document.body.removeChild(ta)
  }
}

async function handleBatchFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    window.$message?.warning('批量导入仅支持 .xlsx 文件，请先另存为 xlsx 后再上传')
    return
  }
  batchUploading.value = true
  batchResult.value = null
  try {
    const res = await userApi.batchCreateUsers(file)
    batchResult.value = res
    batchResultVisible.value = true
    if (res.created > 0) window.$message?.success(`成功创建 ${res.created} 个用户，请将设置密码链接发给对应用户`)
    if (res.failed > 0) window.$message?.warning(`${res.failed} 行导入失败`)
  } catch (err: any) {
    const detail = err?.response?.data?.detail
    window.$message?.error(typeof detail === 'string' ? detail : '批量导入失败')
  } finally {
    batchUploading.value = false
  }
}

function roleLabel(r: string) {
  return ROLE_LABELS[r] || r || '—'
}

/** 审批时可选的角色：超级管理员任意（含通用人员）；电气管理员仅电气领用员；机械管理员仅机械领用员 */
const approveRoleOptions = computed(() => {
  if (authStore.user?.username === 'admin') {
    return [
      { label: '通过为电气领用员', value: 'electrical_requisition_clerk' as UserRole },
      { label: '通过为机械领用员', value: 'mechanical_requisition_clerk' as UserRole },
      { label: '通过为电气管理员', value: 'electrical_admin' as UserRole },
      { label: '通过为机械管理员', value: 'mechanical_admin' as UserRole },
      { label: '通过为通用人员', value: 'general_staff' as UserRole },
      { label: '通过为超级管理员', value: 'admin' as UserRole },
    ]
  }
  if (isElectricalAdmin.value) return [{ label: '通过为电气领用员', value: 'electrical_requisition_clerk' as UserRole }]
  if (isMechanicalAdmin.value) return [{ label: '通过为机械领用员', value: 'mechanical_requisition_clerk' as UserRole }]
  return []
})

/** 修改角色时的下拉选项 */
const editRoleOptions = computed(() => {
  if (authStore.user?.username === 'admin') {
    return [
      { label: '超级管理员', value: 'admin' },
      { label: '电气领用员', value: 'electrical_requisition_clerk' },
      { label: '机械领用员', value: 'mechanical_requisition_clerk' },
      { label: '电气管理员', value: 'electrical_admin' },
      { label: '机械管理员', value: 'mechanical_admin' },
      { label: '通用人员', value: 'general_staff' },
    ]
  }
  if (isElectricalAdmin.value) return [{ label: '电气领用员', value: 'electrical_requisition_clerk' }]
  if (isMechanicalAdmin.value) return [{ label: '机械领用员', value: 'mechanical_requisition_clerk' }]
  return []
})
const editRoleSelectOptions = computed(() => editRoleOptions.value)

function statusLabel(s: string) {
  if (s === 'approved') return '已审批'
  if (s === 'pending') return '待审批'
  return s || '—'
}

// PC table columns
const tableColumns = computed<DataTableColumns<UserListItem>>(() => [
  { title: 'ID', key: 'id', width: 80, align: 'center', sorter: 'default' },
  { title: '用户名', key: 'username', minWidth: 140, sorter: 'default' },
  {
    title: '真实姓名', key: 'real_name', minWidth: 100, sorter: 'default', ellipsis: { tooltip: true },
    render(row) { return row.real_name || '—' },
  },
  {
    title: '企业微信名', key: 'wechat_name', minWidth: 120, sorter: 'default',
    render(row) { return row.wechat_name || '—' },
  },
  {
    title: '角色', key: 'role', width: 140, align: 'center', sorter: 'default',
    render(row) {
      return h(NTag, { type: row.role === 'admin' ? 'error' : 'primary', size: 'small' }, { default: () => roleLabel(row.role) })
    },
  },
  {
    title: '状态', key: 'status', width: 100, align: 'center', sorter: 'default',
    render(row) {
      return h(NTag, { type: row.status === 'approved' ? 'success' : 'warning', size: 'small' }, { default: () => statusLabel(row.status) })
    },
  },
  {
    title: '创建时间', key: 'created_at', width: 180, align: 'center', sorter: 'default',
    render(row) { return formatDateTime(row.created_at) || '—' },
  },
  {
    title: '操作', key: 'actions', width: 400, fixed: 'right', align: 'center',
    render(row) {
      const children: any[] = []
      if (row.status === 'pending') {
        children.push(h('span', { class: 'op-pending-label' }, '待审核'))
        approveRoleOptions.value.forEach((opt) => {
          children.push(
            h(NButton, {
              type: 'success', size: 'small', style: 'margin-right: 4px',
              onClick: () => opt.value === 'general_staff' ? openApproveGenStaffDialog(row) : handleApprove(row, opt.value),
            }, { default: () => opt.label })
          )
        })
        children.push(
          h(NPopconfirm, {
            onPositiveClick: () => handleReject(row),
          }, {
            trigger: () => h(NButton, { type: 'error', size: 'small' }, { default: () => '拒绝' }),
            default: () => '确定拒绝此注册申请？拒绝将删除该用户记录。',
          })
        )
      } else if (row.id === currentUserId.value) {
        children.push(h(NTag, { type: 'error', size: 'small' }, { default: () => '当前用户（不可修改）' }))
      } else if (row.username === 'admin') {
        children.push(h(NTag, { type: 'info', size: 'small' }, { default: () => 'admin（不可删除）' }))
      } else if (row.role === 'general_staff' && !isSuperAdmin.value) {
        children.push(h(NTag, { type: 'warning', size: 'small', style: 'margin-right: 8px' }, { default: () => '通用人员' }))
        if (canConfigurePermForRow(row)) {
          children.push(
            h(NButton, { type: 'primary', size: 'small', secondary: true, onClick: () => openPermDialog(row) }, { default: () => '模块权限' })
          )
        }
      } else {
        children.push(
          h(NSelect, {
            value: roleMap[row.id],
            placeholder: '修改角色',
            size: 'small',
            style: 'width: 140px; display: inline-flex; vertical-align: middle;',
            options: editRoleSelectOptions.value,
            'onUpdate:value': (v: string) => handleRoleChange(row, v),
          })
        )
        if (canConfigurePermForRow(row)) {
          children.push(
            h(NButton, {
              type: 'primary', size: 'small', secondary: true,
              style: 'margin-left: 8px',
              onClick: () => openPermDialog(row),
            }, { default: () => '模块权限' })
          )
        }
        if (canDeleteRow(row)) {
          children.push(
            h(NPopconfirm, {
              onPositiveClick: () => handleDelete(row),
            }, {
              trigger: () => h(NButton, { type: 'error', size: 'small', style: 'margin-left: 8px' }, { default: () => '删除' }),
              default: () => '确定删除该用户？删除后不可恢复。',
            })
          )
        }
      }
      return h('div', { style: 'display: flex; align-items: center; gap: 4px; flex-wrap: wrap; justify-content: center;' }, children)
    },
  },
])

async function fetchUsers() {
  loading.value = true
  try {
    const res = await userApi.list()
    users.value = Array.isArray(res) ? res : []
    users.value.forEach((u) => {
      roleMap[u.id] = u.role
    })
  } catch {
    window.$message?.error('获取用户列表失败')
    users.value = []
  } finally {
    loading.value = false
  }
}

async function handleRoleChange(row: UserListItem, newRole: string) {
  if (newRole === row.role) return
  // 模块权限先行：分配模块角色前校验用户是否已有对应模块权限
  const req = ROLE_MODULE_REQUIREMENT[newRole]
  if (req && !userHasModuleAccess(row, req.module)) {
    roleMap[row.id] = row.role
    window.$message?.warning(`请先为 ${row.username} 配置「${req.label}」模块权限（只读或可编辑），再分配此角色`)
    return
  }
  try {
    await userApi.updateRole(row.id, newRole as UserRole)
    row.role = newRole
    window.$message?.success(`已更新 ${row.username} 为 ${roleLabel(newRole)}`)
  } catch (e: any) {
    roleMap[row.id] = row.role
    window.$message?.error(e?.response?.data?.detail || '更新角色失败')
  }
}

function openApproveGenStaffDialog(row: UserListItem) {
  approveGenStaffTarget.value = row
  NEW_MODULES.forEach((m) => {
    approveGenStaffPermMap[m.id] = ''
  })
  approveGenStaffDialogVisible.value = true
}

async function confirmApproveGenStaff() {
  if (!approveGenStaffTarget.value) return
  const perms: Record<string, string> = {}
  NEW_MODULES.forEach((m) => {
    if (approveGenStaffPermMap[m.id]) perms[m.id] = approveGenStaffPermMap[m.id]
  })
  approveGenStaffSaving.value = true
  try {
    await userApi.approve(approveGenStaffTarget.value.id, 'general_staff', perms)
    window.$message?.success(`已通过 ${approveGenStaffTarget.value.wechat_name || approveGenStaffTarget.value.username} 的注册申请，并设为通用人员`)
    approveGenStaffDialogVisible.value = false
    await fetchUsers()
  } catch (e: any) {
    window.$message?.error(e?.response?.data?.detail || '审批失败')
  } finally {
    approveGenStaffSaving.value = false
  }
}

async function handleApprove(row: UserListItem, role: UserRole) {
  // 模块权限先行：审批为模块角色前校验用户是否已有对应模块权限
  const req = ROLE_MODULE_REQUIREMENT[role]
  if (req && !userHasModuleAccess(row, req.module)) {
    window.$message?.warning(`请先为该用户配置「${req.label}」模块权限（只读或可编辑），再审批为此角色`)
    return
  }
  try {
    await userApi.approve(row.id, role)
    window.$message?.success(`已通过 ${row.wechat_name || row.username} 的注册申请，并设为 ${roleLabel(role)}`)
    await fetchUsers()
  } catch (e: any) {
    window.$message?.error(e?.response?.data?.detail || '审批失败')
  }
}

async function handleReject(row: UserListItem) {
  try {
    await userApi.reject(row.id)
    window.$message?.success(`已拒绝 ${row.wechat_name || row.username} 的注册申请`)
    await fetchUsers()
  } catch (e: any) {
    window.$message?.error(e?.response?.data?.detail || '拒绝失败')
  }
}

async function handleDelete(row: UserListItem) {
  try {
    await userApi.delete(row.id)
    window.$message?.success(`已删除用户 ${row.wechat_name || row.username}`)
    await fetchUsers()
  } catch (e: any) {
    const detail = e?.response?.data?.detail
    const msg = Array.isArray(detail) ? detail[0]?.msg : (detail ?? '删除失败')
    window.$message?.error(typeof msg === 'string' ? msg : '删除失败')
  }
}

onMounted(fetchUsers)
</script>

<style scoped lang="scss">
.user-manage-page {
  padding: 0 20px 20px;
}

h2 {
  margin: 0 0 8px;
  font-size: var(--sp-text-xl);
  color: var(--sp-text-primary);
}

.page-desc {
  margin: 0 0 20px;
  font-size: 14px;
  color: var(--sp-text-secondary);
}

.toolbar {
  margin-bottom: 16px;
}

.batch-links-title,
.batch-errors-title {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--sp-text-primary);
}

.batch-link-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.batch-username {
  flex-shrink: 0;
  width: 140px;
  font-size: 13px;
}

.batch-link-input {
  flex: 1;
  min-width: 0;
}

.batch-errors ul {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: var(--sp-text-secondary);
}

.batch-errors li {
  margin-bottom: 4px;
}

.total-tip {
  text-align: center;
  padding: 16px;
  font-size: 14px;
  color: var(--sp-text-secondary);
}

.op-pending-label {
  display: inline-block;
  margin-right: 8px;
  padding: 2px 8px;
  font-size: 12px;
  color: var(--sp-warning);
  background: var(--sp-warning-bg);
  border-radius: 4px;
}

/* 移动端用户卡片 */
.user-card-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.user-card {
  padding: 16px;
  background: var(--sp-surface);
  border-radius: var(--sp-radius-lg);
  border: 1px solid var(--n-border-color, #e0e0e6);
  box-shadow: var(--sp-shadow-sm);
  border-left: 4px solid var(--sp-primary, #409eff);
}

.user-card-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.user-card-name {
  font-weight: 600;
  font-size: 15px;
  color: var(--sp-text-primary);
}

.user-card-real-name {
  font-size: 13px;
  color: var(--sp-text-primary);
  margin-bottom: 6px;
}

.user-card-meta {
  font-size: 12px;
  color: var(--sp-text-muted);
  margin-bottom: 10px;
}

.user-card-time {
  display: block;
  margin-top: 4px;
}

.user-card-actions {
  padding-top: 12px;
  border-top: 1px dashed var(--n-border-color, #e0e0e6);
}

.user-card-actions .n-button {
  margin-right: 8px;
  margin-bottom: 4px;
}

.perm-dialog-desc {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--sp-text-secondary);
  line-height: 1.6;
}

.perm-level-legend {
  margin-top: 12px;
  padding: 10px 12px;
  background: var(--sp-content-bg);
  border-radius: 6px;
  font-size: 12px;
  color: var(--sp-text-secondary);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.perm-empty {
  text-align: center;
  padding: 8px 0;
}

.perm-empty-hint {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--sp-text-muted);
  line-height: 1.6;
  text-align: left;
  padding: 0 12px;
}

.create-role-tip {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--sp-warning);
}

.create-perm-desc {
  font-size: 12px;
  color: var(--sp-text-secondary);
  display: block;
  margin-top: -8px;
  margin-bottom: 8px;
}

@media (max-width: 767px) {
  .user-manage-page {
    padding: 0 0 16px;
  }
  .user-manage-page h2 {
    font-size: 18px;
  }
  .user-manage-page .page-desc {
    font-size: 13px;
  }
  .table-card {
    border-radius: 8px;
    overflow: hidden;
  }
}
</style>
