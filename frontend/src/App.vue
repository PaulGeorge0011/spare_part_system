<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-dialog-provider>
      <NaiveApiProvider>
        <div id="app" :class="{ 'app-logged-in': !isLoginPage }">
          <template v-if="!isLoginPage">
            <div class="app-layout">
              <!-- Desktop Sidebar -->
              <aside v-if="!isMobile" class="sidebar" :class="{ collapsed: sidebarCollapsed }">
                <div class="sidebar-logo">
                  <div class="logo-icon">
                    <n-icon :size="18"><SettingsOutline /></n-icon>
                  </div>
                  <transition name="sidebar-text">
                    <span v-show="!sidebarCollapsed" class="logo-text">设备管理系统</span>
                  </transition>
                </div>

                <nav class="sidebar-nav">
                  <div
                    class="nav-item"
                    :class="{ active: currentPath === '/home' }"
                    @click="router.push('/home')"
                  >
                    <n-icon :size="18"><HomeOutline /></n-icon>
                    <span v-show="!sidebarCollapsed" class="nav-label">首页</span>
                  </div>

                  <!-- Electrical Module -->
                  <template v-if="authStore.hasElectricalScope">
                    <div class="nav-group-title" v-show="!sidebarCollapsed">
                      <span class="group-dot" style="background: var(--sp-electrical)"></span>
                      电气备件
                    </div>
                    <div v-show="sidebarCollapsed" class="nav-divider"></div>

                    <div v-if="!authStore.isElectricalClerk"
                      class="nav-item" :class="{ active: currentPath === '/electrical/parts' }"
                      @click="router.push('/electrical/parts')"
                    >
                      <n-icon :size="18"><ListOutline /></n-icon>
                      <span v-show="!sidebarCollapsed" class="nav-label">设备列表</span>
                    </div>
                    <div
                      class="nav-item" :class="{ active: currentPath === '/electrical/requisition' }"
                      @click="router.push('/electrical/requisition')"
                    >
                      <n-icon :size="18"><DocumentTextOutline /></n-icon>
                      <span v-show="!sidebarCollapsed" class="nav-label">领用申请</span>
                    </div>
                    <div v-if="authStore.canManageElectrical || authStore.isElectricalClerk"
                      class="nav-item" :class="{ active: currentPath === '/electrical/inventory' }"
                      @click="router.push('/electrical/inventory')"
                    >
                      <n-icon :size="18"><CubeOutline /></n-icon>
                      <span v-show="!sidebarCollapsed" class="nav-label">库存管理</span>
                    </div>
                    <div v-if="!authStore.isElectricalClerk"
                      class="nav-item" :class="{ active: currentPath === '/electrical/operation-logs' }"
                      @click="router.push('/electrical/operation-logs')"
                    >
                      <n-icon :size="18"><TimeOutline /></n-icon>
                      <span v-show="!sidebarCollapsed" class="nav-label">记录查询</span>
                    </div>
                    <div v-if="authStore.canManageElectrical"
                      class="nav-item" :class="{ active: currentPath === '/electrical/users' }"
                      @click="router.push('/electrical/users')"
                    >
                      <n-icon :size="18"><PeopleOutline /></n-icon>
                      <span v-show="!sidebarCollapsed" class="nav-label">用户管理</span>
                    </div>
                    <div
                      class="nav-item" :class="{ active: currentPath === '/electrical/reports' }"
                      @click="router.push('/electrical/reports')"
                    >
                      <n-icon :size="18"><BarChartOutline /></n-icon>
                      <span v-show="!sidebarCollapsed" class="nav-label">报表统计</span>
                    </div>
                  </template>

                  <!-- Mechanical Module -->
                  <template v-if="authStore.hasMechanicalScope">
                    <div class="nav-group-title" v-show="!sidebarCollapsed">
                      <span class="group-dot" style="background: var(--sp-mechanical)"></span>
                      机械备件
                    </div>
                    <div v-show="sidebarCollapsed" class="nav-divider"></div>

                    <div v-if="!authStore.isMechanicalClerk"
                      class="nav-item" :class="{ active: currentPath === '/mechanical/parts' }"
                      @click="router.push('/mechanical/parts')"
                    >
                      <n-icon :size="18"><ListOutline /></n-icon>
                      <span v-show="!sidebarCollapsed" class="nav-label">设备列表</span>
                    </div>
                    <div
                      class="nav-item" :class="{ active: currentPath === '/mechanical/requisition' }"
                      @click="router.push('/mechanical/requisition')"
                    >
                      <n-icon :size="18"><DocumentTextOutline /></n-icon>
                      <span v-show="!sidebarCollapsed" class="nav-label">领用申请</span>
                    </div>
                    <div v-if="authStore.canManageMechanical || authStore.isMechanicalClerk"
                      class="nav-item" :class="{ active: currentPath === '/mechanical/inventory' }"
                      @click="router.push('/mechanical/inventory')"
                    >
                      <n-icon :size="18"><CubeOutline /></n-icon>
                      <span v-show="!sidebarCollapsed" class="nav-label">库存管理</span>
                    </div>
                    <div v-if="!authStore.isMechanicalClerk"
                      class="nav-item" :class="{ active: currentPath === '/mechanical/operation-logs' }"
                      @click="router.push('/mechanical/operation-logs')"
                    >
                      <n-icon :size="18"><TimeOutline /></n-icon>
                      <span v-show="!sidebarCollapsed" class="nav-label">记录查询</span>
                    </div>
                    <div v-if="authStore.canManageMechanical"
                      class="nav-item" :class="{ active: currentPath === '/mechanical/users' }"
                      @click="router.push('/mechanical/users')"
                    >
                      <n-icon :size="18"><PeopleOutline /></n-icon>
                      <span v-show="!sidebarCollapsed" class="nav-label">用户管理</span>
                    </div>
                    <div
                      class="nav-item" :class="{ active: currentPath === '/mechanical/reports' }"
                      @click="router.push('/mechanical/reports')"
                    >
                      <n-icon :size="18"><BarChartOutline /></n-icon>
                      <span v-show="!sidebarCollapsed" class="nav-label">报表统计</span>
                    </div>
                  </template>
                </nav>

                <div class="sidebar-footer">
                  <div class="nav-item collapse-toggle" @click="sidebarCollapsed = !sidebarCollapsed">
                    <n-icon :size="18">
                      <ChevronBackOutline v-if="!sidebarCollapsed" />
                      <ChevronForwardOutline v-else />
                    </n-icon>
                    <span v-show="!sidebarCollapsed" class="nav-label">收起菜单</span>
                  </div>
                </div>
              </aside>

              <!-- Main Area -->
              <div class="main-area">
                <!-- Top Bar -->
                <header class="topbar">
                  <div class="topbar-left">
                    <n-button
                      v-if="isMobile"
                      class="menu-btn"
                      quaternary
                      size="small"
                      @click="drawerVisible = true"
                    >
                      <template #icon>
                        <n-icon><MenuOutline /></n-icon>
                      </template>
                    </n-button>
                    <div class="breadcrumb">
                      <span class="breadcrumb-module">{{ currentModuleLabel }}</span>
                      <template v-if="currentPageLabel">
                        <n-icon class="breadcrumb-sep" :size="12"><ChevronForwardOutline /></n-icon>
                        <span class="breadcrumb-page">{{ currentPageLabel }}</span>
                      </template>
                    </div>
                  </div>
                  <div class="topbar-right">
                    <n-button
                      v-if="isMobile && showMobileSearch"
                      quaternary
                      circle
                      size="small"
                      @click="openMobileSearch = true"
                    >
                      <template #icon>
                        <n-icon><SearchOutline /></n-icon>
                      </template>
                    </n-button>
                    <div class="user-info">
                      <div class="user-avatar">
                        {{ (authStore.user?.username || '?').charAt(0).toUpperCase() }}
                      </div>
                      <div v-if="!isMobile" class="user-detail">
                        <span class="user-name">{{ authStore.user?.username }}</span>
                        <span class="user-role">{{ roleLabel }}</span>
                      </div>
                    </div>
                    <n-dropdown
                      trigger="click"
                      :options="dropdownOptions"
                      @select="handleDropdownSelect"
                    >
                      <n-button quaternary size="small" class="more-btn">
                        <template #icon>
                          <n-icon :size="18"><EllipsisVertical /></n-icon>
                        </template>
                      </n-button>
                    </n-dropdown>
                  </div>
                </header>

                <!-- Main Content -->
                <main class="content-area">
                  <router-view v-slot="{ Component, route: viewRoute }">
                    <Transition name="page-fade" mode="out-in">
                      <keep-alive :include="cachedLayouts" :max="3">
                        <component :is="Component" :key="viewRoute.matched[0]?.path || viewRoute.path" class="main-view" />
                      </keep-alive>
                    </Transition>
                  </router-view>
                </main>
              </div>
            </div>

            <!-- Mobile Drawer -->
            <n-drawer
              v-model:show="drawerVisible"
              placement="left"
              :width="280"
              :trap-focus="true"
              class="app-menu-drawer"
            >
              <n-drawer-content :body-content-style="{ padding: 0 }">
                <div class="mobile-drawer">
                  <div class="mobile-drawer-header">
                    <div class="logo-icon">
                      <n-icon :size="16"><SettingsOutline /></n-icon>
                    </div>
                    <span class="logo-text">设备管理系统</span>
                  </div>

                  <nav class="mobile-drawer-nav">
                    <div
                      class="nav-item"
                      :class="{ active: currentPath === '/home' }"
                      @click="navigateMobile('/home')"
                    >
                      <n-icon :size="18"><HomeOutline /></n-icon>
                      <span class="nav-label">首页</span>
                    </div>

                    <template v-if="authStore.hasElectricalScope">
                      <div class="nav-group-title">
                        <span class="group-dot" style="background: var(--sp-electrical)"></span>
                        电气备件
                      </div>
                      <div v-if="!authStore.isElectricalClerk" class="nav-item" :class="{ active: currentPath === '/electrical/parts' }" @click="navigateMobile('/electrical/parts')">
                        <n-icon :size="18"><ListOutline /></n-icon><span class="nav-label">设备列表</span>
                      </div>
                      <div class="nav-item" :class="{ active: currentPath === '/electrical/requisition' }" @click="navigateMobile('/electrical/requisition')">
                        <n-icon :size="18"><DocumentTextOutline /></n-icon><span class="nav-label">领用申请</span>
                      </div>
                      <div v-if="authStore.canManageElectrical || authStore.isElectricalClerk" class="nav-item" :class="{ active: currentPath === '/electrical/inventory' }" @click="navigateMobile('/electrical/inventory')">
                        <n-icon :size="18"><CubeOutline /></n-icon><span class="nav-label">库存管理</span>
                      </div>
                      <div v-if="!authStore.isElectricalClerk" class="nav-item" :class="{ active: currentPath === '/electrical/operation-logs' }" @click="navigateMobile('/electrical/operation-logs')">
                        <n-icon :size="18"><TimeOutline /></n-icon><span class="nav-label">记录查询</span>
                      </div>
                      <div v-if="authStore.canManageElectrical" class="nav-item" :class="{ active: currentPath === '/electrical/users' }" @click="navigateMobile('/electrical/users')">
                        <n-icon :size="18"><PeopleOutline /></n-icon><span class="nav-label">用户管理</span>
                      </div>
                      <div class="nav-item" :class="{ active: currentPath === '/electrical/reports' }" @click="navigateMobile('/electrical/reports')">
                        <n-icon :size="18"><BarChartOutline /></n-icon><span class="nav-label">报表统计</span>
                      </div>
                    </template>

                    <template v-if="authStore.hasMechanicalScope">
                      <div class="nav-group-title">
                        <span class="group-dot" style="background: var(--sp-mechanical)"></span>
                        机械备件
                      </div>
                      <div v-if="!authStore.isMechanicalClerk" class="nav-item" :class="{ active: currentPath === '/mechanical/parts' }" @click="navigateMobile('/mechanical/parts')">
                        <n-icon :size="18"><ListOutline /></n-icon><span class="nav-label">设备列表</span>
                      </div>
                      <div class="nav-item" :class="{ active: currentPath === '/mechanical/requisition' }" @click="navigateMobile('/mechanical/requisition')">
                        <n-icon :size="18"><DocumentTextOutline /></n-icon><span class="nav-label">领用申请</span>
                      </div>
                      <div v-if="authStore.canManageMechanical || authStore.isMechanicalClerk" class="nav-item" :class="{ active: currentPath === '/mechanical/inventory' }" @click="navigateMobile('/mechanical/inventory')">
                        <n-icon :size="18"><CubeOutline /></n-icon><span class="nav-label">库存管理</span>
                      </div>
                      <div v-if="!authStore.isMechanicalClerk" class="nav-item" :class="{ active: currentPath === '/mechanical/operation-logs' }" @click="navigateMobile('/mechanical/operation-logs')">
                        <n-icon :size="18"><TimeOutline /></n-icon><span class="nav-label">记录查询</span>
                      </div>
                      <div v-if="authStore.canManageMechanical" class="nav-item" :class="{ active: currentPath === '/mechanical/users' }" @click="navigateMobile('/mechanical/users')">
                        <n-icon :size="18"><PeopleOutline /></n-icon><span class="nav-label">用户管理</span>
                      </div>
                      <div class="nav-item" :class="{ active: currentPath === '/mechanical/reports' }" @click="navigateMobile('/mechanical/reports')">
                        <n-icon :size="18"><BarChartOutline /></n-icon><span class="nav-label">报表统计</span>
                      </div>
                    </template>
                  </nav>

                  <div class="mobile-drawer-footer">
                    <div class="user-info">
                      <div class="user-avatar">
                        {{ (authStore.user?.username || '?').charAt(0).toUpperCase() }}
                      </div>
                      <div class="user-detail">
                        <span class="user-name">{{ authStore.user?.username }}</span>
                        <span class="user-role">{{ roleLabel }}</span>
                      </div>
                    </div>
                    <n-button v-if="wechatBindAvailable" type="success" size="small" secondary @click="handleBindWechat">绑定企业微信</n-button>
                  </div>
                </div>
              </n-drawer-content>
            </n-drawer>
          </template>
          <template v-else>
            <router-view />
          </template>
        </div>
      </NaiveApiProvider>
    </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch, h } from 'vue'
import {
  NConfigProvider, NMessageProvider, NDialogProvider,
  NButton, NIcon, NDrawer, NDrawerContent, NDropdown,
  useMessage, useDialog,
  type GlobalThemeOverrides,
} from 'naive-ui'
import {
  MenuOutline, SearchOutline, SettingsOutline, HomeOutline,
  ListOutline, DocumentTextOutline, CubeOutline, TimeOutline,
  PeopleOutline, BarChartOutline, ChevronBackOutline,
  ChevronForwardOutline, EllipsisVertical, LinkOutline,
  LogOutOutline,
} from '@vicons/ionicons5'
import { provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ROLE_LABELS } from '@/api/user'
import { wechatApi } from '@/api/wechat'
import { useIsMobile } from '@/composables/useIsMobile'
import NaiveApiProvider from '@/components/common/NaiveApiProvider.vue'

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#3B82F6',
    primaryColorHover: '#60A5FA',
    primaryColorPressed: '#2563EB',
    successColor: '#10B981',
    warningColor: '#F59E0B',
    errorColor: '#EF4444',
    borderRadius: '8px',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
    fontSize: '14px',
  },
  Button: {
    borderRadiusMedium: '8px',
    borderRadiusSmall: '6px',
    fontWeightStrong: '500',
  },
  Card: {
    borderRadius: '16px',
  },
  Input: {
    borderRadius: '8px',
  },
  Dialog: {
    borderRadius: '20px',
  },
  DataTable: {
    borderRadius: '12px',
  },
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const wechatBindAvailable = ref(false)
const { isMobile } = useIsMobile()
const drawerVisible = ref(false)
const sidebarCollapsed = ref(false)
const openMobileSearch = ref(false)
provide('openMobileSearch', openMobileSearch)

const SEARCH_ROUTES = [
  '/electrical/requisition', '/electrical/parts', '/electrical/inventory', '/electrical/operation-logs',
  '/mechanical/requisition', '/mechanical/parts', '/mechanical/inventory', '/mechanical/operation-logs'
]
const showMobileSearch = computed(() => isMobile.value && SEARCH_ROUTES.some(p => route.path === p))

const isLoginPage = computed(
  () =>
    route.path === '/login' ||
    route.path === '/register' ||
    route.path === '/set-password' ||
    route.path === '/sso/callback',
)

const cachedLayouts = ['ElectricalLayout', 'MechanicalLayout']

const currentPath = computed(() => route.path)

const PAGE_LABELS: Record<string, string> = {
  '/home': '',
  '/electrical/parts': '设备列表',
  '/electrical/requisition': '领用申请',
  '/electrical/inventory': '库存管理',
  '/electrical/operation-logs': '记录查询',
  '/electrical/users': '用户管理',
  '/electrical/reports': '报表统计',
  '/mechanical/parts': '设备列表',
  '/mechanical/requisition': '领用申请',
  '/mechanical/inventory': '库存管理',
  '/mechanical/operation-logs': '记录查询',
  '/mechanical/users': '用户管理',
  '/mechanical/reports': '报表统计',
}

const currentModuleLabel = computed(() => {
  if (route.path === '/home' || route.path === '/') return '首页'
  if (route.path.startsWith('/electrical')) return '电气备件'
  if (route.path.startsWith('/mechanical')) return '机械备件'
  return '首页'
})

const currentPageLabel = computed(() => PAGE_LABELS[route.path] || '')

const roleLabel = computed(() => ROLE_LABELS[authStore.user?.role ?? ''] ?? authStore.user?.role ?? '')

const dropdownOptions = computed(() => {
  const options: Array<{ label: string; key: string; icon?: () => any }> = []
  if (wechatBindAvailable.value) {
    options.push({
      label: '绑定企业微信',
      key: 'bind-wechat',
      icon: () => h(NIcon, null, { default: () => h(LinkOutline) }),
    })
  }
  options.push({
    label: '退出登录',
    key: 'logout',
    icon: () => h(NIcon, null, { default: () => h(LogOutOutline) }),
  })
  return options
})

function handleDropdownSelect(key: string) {
  if (key === 'logout') handleLogout()
  else if (key === 'bind-wechat') handleBindWechat()
}

function navigateMobile(path: string) {
  drawerVisible.value = false
  router.push(path)
}

async function fetchWechatBindAvailable() {
  try {
    const res = await wechatApi.getBindAuthUrl()
    wechatBindAvailable.value = !!(res?.url && res.url.trim())
  } catch {
    wechatBindAvailable.value = false
  }
}

async function handleBindWechat() {
  drawerVisible.value = false
  try {
    const res = await wechatApi.getBindAuthUrl()
    const url = (res?.url || '').trim()
    if (url) {
      window.location.href = url
      return
    }
    window.$message?.warning('企业微信未配置或不可用')
  } catch (e: any) {
    if (e?.response?.status === 401) {
      authStore.clearAuth()
      router.replace('/login')
      return
    }
    window.$message?.error('获取绑定链接失败')
  }
}

function handleLogout() {
  window.$dialog?.warning({
    title: '提示',
    content: '确定退出登录吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      authStore.logout()
      router.replace('/login')
    },
  })
}

function checkWechatBindQuery() {
  const q = route.query as Record<string, string>
  const bind = q.wechat_bind
  if (bind === 'success') {
    window.$message?.success('企业微信绑定成功')
    router.replace({ path: route.path, query: {} })
  } else if (bind === 'already_used') {
    window.$message?.warning('该企业微信已绑定其他账号，无法重复绑定')
    router.replace({ path: route.path, query: {} })
  } else if (bind === 'expired') {
    window.$message?.warning('绑定链接已过期，请重新点击「绑定企业微信」')
    router.replace({ path: route.path, query: {} })
  }
}

onMounted(() => {
  if (!isLoginPage.value) fetchWechatBindAvailable()
  checkWechatBindQuery()
})

watch(() => route.query, () => checkWechatBindQuery(), { deep: true })

watch(() => route.path, () => {
  drawerVisible.value = false
})
</script>

<style scoped>
/* -- Layout Shell -- */
.app-layout {
  display: flex;
  height: 100vh;
  max-height: 100dvh;
  overflow: hidden;
  background: var(--sp-content-bg);
}

/* -- Sidebar (Light & Minimal) -- */
.sidebar {
  width: var(--sp-sidebar-width);
  background: var(--sp-sidebar-bg);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width var(--sp-transition-slow);
  overflow: hidden;
  z-index: 10;
  border-right: 1px solid var(--sp-sidebar-border);
}

.sidebar.collapsed {
  width: var(--sp-sidebar-collapsed-width);
}

.sidebar-logo {
  height: var(--sp-sidebar-logo-height);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
  border-bottom: 1px solid var(--sp-sidebar-border);
  flex-shrink: 0;
}

.logo-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--sp-radius-sm);
  background: linear-gradient(135deg, var(--sp-primary) 0%, #2563EB 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.logo-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--sp-text-primary);
  white-space: nowrap;
  overflow: hidden;
  letter-spacing: -0.01em;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 8px;
}

.sidebar-nav::-webkit-scrollbar {
  width: 0;
}

.nav-group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px 12px 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--sp-text-muted);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}

.group-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.nav-divider {
  height: 1px;
  background: var(--sp-border-light);
  margin: 12px 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--sp-radius-sm);
  color: var(--sp-sidebar-text);
  cursor: pointer;
  transition: all var(--sp-transition-fast);
  white-space: nowrap;
  position: relative;
  font-size: 13.5px;
}

.nav-item:hover {
  background: var(--sp-sidebar-hover-bg);
  color: var(--sp-text-primary);
}

.nav-item.active {
  background: var(--sp-sidebar-active-bg);
  color: var(--sp-sidebar-text-active);
  font-weight: 500;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--sp-sidebar-active-border);
}

.nav-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-footer {
  padding: 8px;
  border-top: 1px solid var(--sp-sidebar-border);
  flex-shrink: 0;
}

.collapse-toggle {
  justify-content: center;
}

.sidebar:not(.collapsed) .collapse-toggle {
  justify-content: flex-start;
}

/* -- Main Area -- */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

/* -- Top Bar -- */
.topbar {
  height: var(--sp-topbar-height);
  background: var(--sp-topbar-bg);
  border-bottom: 1px solid var(--sp-topbar-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
  gap: 16px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--sp-text-base);
  min-width: 0;
}

.breadcrumb-module {
  font-weight: 600;
  color: var(--sp-text-primary);
  white-space: nowrap;
}

.breadcrumb-sep {
  color: var(--sp-text-disabled);
}

.breadcrumb-page {
  color: var(--sp-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--sp-radius-sm);
  background: var(--sp-primary-bg);
  color: var(--sp-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-detail {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.user-name {
  font-size: var(--sp-text-sm);
  font-weight: 500;
  color: var(--sp-text-primary);
}

.user-role {
  font-size: 11px;
  color: var(--sp-text-muted);
}

.more-btn {
  color: var(--sp-text-muted);
}

/* -- Content Area -- */
.content-area {
  flex: 1;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  padding: var(--sp-space-lg);
  position: relative;
}

/* -- Page Transitions -- */
.page-fade-enter-active {
  transition: opacity var(--sp-transition-base), transform var(--sp-transition-base);
}
.page-fade-leave-active {
  transition: opacity var(--sp-transition-fast), transform var(--sp-transition-fast);
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-2px);
}

.sidebar-text-enter-active,
.sidebar-text-leave-active {
  transition: opacity var(--sp-transition-base);
}
.sidebar-text-enter-from,
.sidebar-text-leave-to {
  opacity: 0;
}

/* -- Mobile Drawer -- */
.mobile-drawer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--sp-surface);
}

.mobile-drawer-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--sp-border-light);
}

.mobile-drawer .logo-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--sp-text-primary);
}

.mobile-drawer-nav {
  flex: 1;
  overflow-y: auto;
  padding: 12px 8px;
}

.mobile-drawer-footer {
  padding: 16px;
  border-top: 1px solid var(--sp-border-light);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-drawer-footer .user-avatar {
  background: var(--sp-primary-bg);
  color: var(--sp-primary);
}

.mobile-drawer-footer .user-name {
  color: var(--sp-text-primary);
}

.mobile-drawer-footer .user-role {
  color: var(--sp-text-muted);
}

/* -- Mobile Responsive -- */
@media (max-width: 767px) {
  .app-layout {
    flex-direction: column;
  }

  .content-area {
    padding: var(--sp-space-md);
  }

  .topbar {
    padding: 0 12px;
  }
}
</style>
