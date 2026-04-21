<template>
  <div class="oplog-page">
    <h2>记录查询</h2>
    <p class="page-desc">查看系统中对数据执行的关键操作记录（修复件新增/修改/删除、领用、批量导入、用户管理权限变更等）。</p>

    <!-- PC 端：筛选卡片 -->
    <n-card v-if="!isMobile" class="filter-card">
      <div class="filter-row">
        <span class="filter-label">时间范围：</span>
        <n-radio-group v-model:value="timeRange" @update:value="onTimeRangeChange">
          <n-radio-button value="today">固定日期</n-radio-button>
          <n-radio-button value="7d">7天内</n-radio-button>
          <n-radio-button value="30d">30天内</n-radio-button>
          <n-radio-button value="6m">半年内</n-radio-button>
          <n-radio-button value="1y">一年内</n-radio-button>
          <n-radio-button value="custom">自定义</n-radio-button>
        </n-radio-group>
      </div>
      <div v-if="timeRange === 'today'" class="filter-row date-row">
        <span class="filter-label">选择日期：</span>
        <n-date-picker v-model:value="singleDateTs" type="date" placeholder="选择日期" style="width: 200px" />
      </div>
      <div v-if="timeRange === 'custom'" class="filter-row date-row">
        <span class="filter-label">开始日期：</span>
        <n-date-picker v-model:value="customStartTs" type="date" placeholder="开始日期" style="width: 200px" />
        <span class="filter-label" style="margin-left: 16px">结束日期：</span>
        <n-date-picker v-model:value="customEndTs" type="date" placeholder="结束日期" style="width: 200px" />
      </div>
      <div class="filter-row">
        <span class="filter-label">操作人：</span>
        <n-select
          v-model:value="username"
          placeholder="选择操作人"
          clearable
          filterable
          style="width: 160px"
          :options="operatorSelectOptions"
          @update:value="onSearch"
        />
        <span class="filter-label">模块：</span>
        <n-select
          v-model:value="module"
          placeholder="全部"
          clearable
          style="width: 160px"
          :options="moduleSelectOptions"
        />
        <span class="filter-label">操作类型：</span>
        <n-select
          v-model:value="action"
          placeholder="全部"
          clearable
          style="width: 160px"
          :options="actionSelectOptions"
        />
      </div>
      <div class="filter-row">
        <span class="filter-label">每页条数：</span>
        <n-select
          v-model:value="pageSize"
          placeholder="条数"
          style="width: 100px"
          :options="pageSizeSelectOptions"
          @update:value="onPageSizeChange"
        />
        <span class="filter-label">关键字：</span>
        <n-input v-model:value="keyword" placeholder="搜索摘要..." clearable style="width: 260px" @keyup.enter="fetchLogs" />
        <n-button type="primary" :loading="loading" @click="onSearch">查询</n-button>
        <n-dropdown trigger="click" :options="excelDropdownOptions" @select="(cmd: string) => handleExportExcel(cmd as 'selected' | 'current' | 'all')">
          <n-button type="info" :disabled="logs.length === 0 && selectedRowKeys.length === 0">
            导出 Excel
            <template #icon><n-icon><ChevronDownOutline /></n-icon></template>
          </n-button>
        </n-dropdown>
        <n-dropdown trigger="click" :options="csvDropdownOptions" @select="(cmd: string) => handleExportCSV(cmd as 'selected' | 'current' | 'all')">
          <n-button type="info" :disabled="logs.length === 0 && selectedRowKeys.length === 0">
            导出 CSV
            <template #icon><n-icon><ChevronDownOutline /></n-icon></template>
          </n-button>
        </n-dropdown>
      </div>
    </n-card>

    <!-- 移动端：顶栏搜索由 App 统一展示，本页只保留抽屉 -->
    <template v-if="isMobile">
      <n-drawer
        v-model:show="mobileSearchDrawer"
        placement="right"
        :width="'88%'"
        :close-on-esc="true"
        :mask-closable="true"
        class="oplog-mobile-search-drawer mobile-search-drawer-unified"
        @update:show="(v: boolean) => { if (!v) mobileSearchDrawer = false }"
      >
        <n-drawer-content title="记录查询" closable>
          <div class="mobile-filter-form">
            <div class="filter-group">
              <span class="filter-label">时间范围</span>
              <n-radio-group v-model:value="timeRange" @update:value="onTimeRangeChange" style="width: 100%; flex-wrap: wrap">
                <n-radio-button value="today">固定日期</n-radio-button>
                <n-radio-button value="7d">7天内</n-radio-button>
                <n-radio-button value="30d">30天内</n-radio-button>
                <n-radio-button value="6m">半年内</n-radio-button>
                <n-radio-button value="1y">一年内</n-radio-button>
                <n-radio-button value="custom">自定义</n-radio-button>
              </n-radio-group>
            </div>
            <div v-if="timeRange === 'today'" class="filter-group">
              <n-date-picker v-model:value="singleDateTs" type="date" placeholder="选择日期" style="width: 100%" />
            </div>
            <div v-if="timeRange === 'custom'" class="filter-group">
              <n-date-picker v-model:value="customStartTs" type="date" placeholder="开始日期" style="width: 100%" />
              <n-date-picker v-model:value="customEndTs" type="date" placeholder="结束日期" style="width: 100%" />
            </div>
            <div class="filter-group">
              <span class="filter-label">操作人</span>
              <n-select
                v-model:value="username"
                placeholder="选择操作人"
                clearable
                style="width: 100%"
                :options="operatorSelectOptions"
                @update:value="fetchLogs"
              />
            </div>
            <div class="filter-group">
              <span class="filter-label">模块</span>
              <n-select
                v-model:value="module"
                placeholder="选择模块"
                clearable
                style="width: 100%"
                :options="moduleSelectOptions"
                @update:value="fetchLogs"
              />
            </div>
            <div class="filter-group">
              <span class="filter-label">操作类型</span>
              <n-select
                v-model:value="action"
                placeholder="选择操作类型"
                clearable
                style="width: 100%"
                :options="actionSelectOptions"
                @update:value="fetchLogs"
              />
            </div>
            <div class="filter-group">
              <span class="filter-label">每页条数</span>
              <n-select
                v-model:value="pageSize"
                placeholder="条数"
                style="width: 100%"
                :options="pageSizeSelectOptions"
                @update:value="onPageSizeChange"
              />
            </div>
            <div class="filter-group">
              <span class="filter-label">关键字</span>
              <n-input v-model:value="keyword" placeholder="搜索摘要" clearable style="width: 100%" @keyup.enter="fetchLogsAndClose" />
            </div>
            <div class="filter-actions">
              <n-button type="primary" :loading="loading" @click="fetchLogsAndClose" block>查询</n-button>
              <n-dropdown trigger="click" :options="excelDropdownOptions" @select="(cmd: string) => handleExportExcel(cmd as 'selected' | 'current' | 'all')" style="width: 100%">
                <n-button type="info" :disabled="logs.length === 0 && selectedRowKeys.length === 0" block>
                  导出 Excel
                  <template #icon><n-icon><ChevronDownOutline /></n-icon></template>
                </n-button>
              </n-dropdown>
              <n-dropdown trigger="click" :options="csvDropdownOptions" @select="(cmd: string) => handleExportCSV(cmd as 'selected' | 'current' | 'all')" style="width: 100%">
                <n-button type="info" :disabled="logs.length === 0 && selectedRowKeys.length === 0" block>
                  导出 CSV
                  <template #icon><n-icon><ChevronDownOutline /></n-icon></template>
                </n-button>
              </n-dropdown>
            </div>
          </div>
        </n-drawer-content>
      </n-drawer>
    </template>

    <n-card class="table-card">
      <!-- 移动端：卡片列表 -->
      <n-spin :show="loading" v-if="isMobile">
        <div class="oplog-card-list">
          <div v-for="row in logs" :key="row.id" class="oplog-card">
            <div class="oplog-card-header">
              <n-tag size="small">{{ moduleLabel(row.module) }}</n-tag>
              <n-tag size="small" type="info">{{ actionLabel(row.action) }}</n-tag>
              <span class="oplog-card-time">{{ formatDateTime(row.created_at) }}</span>
            </div>
            <div class="oplog-card-row">
              <span class="oplog-label">操作人</span>
              <span class="oplog-value">{{ row.real_name || row.username || '—' }}</span>
            </div>
            <div v-if="row.summary" class="oplog-card-summary">{{ formatSummary(row.summary) }}</div>
          </div>
          <div v-if="!loading && totalCount > 0" class="pagination-row mobile-pagination">
            <n-pagination
              v-model:page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[20, 50, 100]"
              :item-count="totalCount"
              show-size-picker
              @update:page="onPageChange"
              @update:page-size="onPageSizeChange"
            />
          </div>
        </div>
      </n-spin>
      <!-- PC 端：表格 -->
      <div v-else class="table-scroll-wrap">
        <n-spin :show="loading">
          <n-data-table
            :columns="tableColumns"
            :data="logs"
            :bordered="true"
            :striped="true"
            :max-height="560"
            :row-key="(row: OperationLog) => row.id"
            @update:checked-row-keys="onSelectionChange"
          />
        </n-spin>
      </div>
      <div v-if="!loading && logs.length === 0" class="empty-tip">暂无记录</div>
      <div v-else-if="!loading && totalCount > 0 && !isMobile" class="pagination-row">
        <n-pagination
          v-model:page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          :item-count="totalCount"
          show-size-picker
          show-quick-jumper
          :prefix="() => `共 ${totalCount} 条`"
          @update:page="onPageChange"
          @update:page-size="onPageSizeChange"
        />
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
// 定义组件名称，用于 keep-alive 缓存
defineOptions({
  name: 'OperationLogs'
})

import { ref, computed, onMounted, onDeactivated, watch, inject, h } from 'vue'
import { useRoute } from 'vue-router'
import {
  NCard, NButton, NIcon, NTag, NRadioGroup, NRadioButton,
  NDatePicker, NSelect, NInput, NDropdown, NDrawer, NDrawerContent,
  NDataTable, NPagination, NSpin,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { ChevronDownOutline } from '@vicons/ionicons5'
import { getOperationLogs, getOperationLogOperatorOptions, type OperationLog, type OperationLogOperatorOption, type TimeRange, type MaterialScope } from '@/api/operationLog'
import { useIsMobile } from '@/composables/useIsMobile'
import { scrollMainToTop } from '@/composables/useScrollMainToTop'
import { formatDateTime } from '@/utils/date'
import { exportToExcel, exportToCSV, type ExportColumn } from '@/utils/exportExcel'

const route = useRoute()
const materialScope = computed<MaterialScope>(() =>
  route.path.startsWith('/electrical') ? 'electrical' : 'mechanical'
)
const { isMobile } = useIsMobile()
const mobileSearchDrawer = ref(false)
const openMobileSearch = inject<{ value: boolean }>('openMobileSearch')
if (openMobileSearch) {
  watch(() => openMobileSearch.value, (v) => {
    if (v && (route.path === '/electrical/operation-logs' || route.path === '/mechanical/operation-logs')) {
      mobileSearchDrawer.value = true
      openMobileSearch.value = false
    }
  })
}
const operatorOptions = ref<OperationLogOperatorOption[]>([])

const moduleOptions = computed(() =>
  materialScope.value === 'electrical'
    ? [{ label: '修复件管理', value: 'spare_part' }]
    : [{ label: '机械修复件', value: 'mechanical_spare_part' }]
)

const operatorSelectOptions = computed(() =>
  operatorOptions.value.map(item => ({ label: item.display, value: item.username }))
)

const moduleSelectOptions = computed(() =>
  moduleOptions.value.map(opt => ({ label: opt.label, value: opt.value }))
)

const actionSelectOptions = [
  { label: '创建', value: 'create' },
  { label: '更新', value: 'update' },
  { label: '删除', value: 'delete' },
  { label: '批量新增', value: 'batch_create' },
  { label: '批量删除', value: 'batch_delete' },
  { label: '领用', value: 'requisition' },
  { label: '修改角色', value: 'update_role' },
  { label: '审批通过', value: 'approve' },
  { label: '审批拒绝', value: 'reject' },
]

const pageSizeSelectOptions = [
  { label: '20 行', value: 20 },
  { label: '50 行', value: 50 },
  { label: '100 行', value: 100 },
]

async function loadOperatorOptions() {
  try {
    const res = await getOperationLogOperatorOptions(materialScope.value)
    operatorOptions.value = Array.isArray(res) ? res : []
  } catch {
    operatorOptions.value = []
  }
}

const timeRange = ref<TimeRange>('30d')
const singleDateTs = ref<number | null>(null)
const customStartTs = ref<number | null>(null)
const customEndTs = ref<number | null>(null)
const username = ref<string | null>(null)
const module = ref<string | null>(null)
const action = ref<string | null>(null)
const keyword = ref<string>('')
/** 每页条数，默认 20 */
const pageSize = ref(20)
/** 当前页码，从 1 开始 */
const currentPage = ref(1)
/** 符合条件的总条数（由接口返回） */
const totalCount = ref(0)

const loading = ref(false)
const logs = ref<OperationLog[]>([])
const selectedRowKeys = ref<Array<string | number>>([])
function onSelectionChange(keys: Array<string | number>) {
  selectedRowKeys.value = keys
}
const selectedLogs = computed(() =>
  logs.value.filter(r => selectedRowKeys.value.includes(r.id))
)

function tsToDateStr(ts: number | null): string {
  if (!ts) return ''
  const d = new Date(ts)
  return formatDateStr(d)
}

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function onTimeRangeChange() {
  if (timeRange.value === 'custom' && !customStartTs.value && !customEndTs.value) {
    const d = new Date()
    const s = new Date(d)
    s.setDate(s.getDate() - 30)
    customStartTs.value = s.getTime()
    customEndTs.value = d.getTime()
  }
}

function moduleLabel(m: string | null | undefined): string {
  if (!m) return '—'
  if (m === 'spare_part') return '修复件管理'
  if (m === 'mechanical_spare_part') return '机械修复件'
  if (m === 'requisition') return '修复件领用'
  if (m === 'inventory') return '库存管理'
  if (m === 'user') return '用户管理'
  return m
}

function actionLabel(a: string | null | undefined): string {
  if (!a) return '—'
  if (a === 'create') return '创建'
  if (a === 'update') return '更新'
  if (a === 'delete') return '删除'
  if (a === 'batch_create') return '批量新增'
  if (a === 'batch_delete') return '批量删除'
  if (a === 'requisition') return '领用'
  if (a === 'update_role') return '修改角色'
  if (a === 'approve') return '审批通过'
  if (a === 'reject') return '审批拒绝'
  return a
}

/** 将摘要中的分号换行显示，便于阅读变更前/变更后等结构 */
function formatSummary(summary: string | null | undefined): string {
  if (!summary) return ''
  return summary.replace(/；/g, '；\n').trim()
}

// Table columns for n-data-table
const tableColumns = computed<DataTableColumns<OperationLog>>(() => [
  { type: 'selection', width: 55 },
  {
    title: '操作时间', key: 'created_at', width: 180, align: 'center', sorter: 'default',
    render(row) { return formatDateTime(row.created_at) },
  },
  {
    title: '操作人', key: 'real_name', width: 120, align: 'center', sorter: 'default',
    render(row) { return row.real_name || row.username || '—' },
  },
  {
    title: '模块', key: 'module', width: 120, align: 'center', sorter: 'default',
    render(row) {
      return h(NTag, { size: 'small' }, { default: () => moduleLabel(row.module) })
    },
  },
  {
    title: '操作类型', key: 'action', width: 110, align: 'center', sorter: 'default',
    render(row) {
      return h(NTag, { size: 'small', type: 'info' }, { default: () => actionLabel(row.action) })
    },
  },
  {
    title: '摘要', key: 'summary', minWidth: 320, align: 'left', sorter: 'default',
    render(row) {
      if (row.summary) {
        return h('div', { class: 'summary-cell', title: row.summary }, formatSummary(row.summary))
      }
      return h('span', { class: 'empty-cell' }, '—')
    },
  },
])

// Dropdown options
const excelDropdownOptions = computed(() => [
  { label: `导出选中 (${selectedRowKeys.value.length})`, key: 'selected', disabled: selectedRowKeys.value.length === 0 },
  { label: `导出当前页 (${logs.value.length})`, key: 'current', disabled: logs.value.length === 0 },
  { label: `全部导出 (${totalCount.value})`, key: 'all' },
])
const csvDropdownOptions = computed(() => [
  { label: `导出选中 (${selectedRowKeys.value.length})`, key: 'selected', disabled: selectedRowKeys.value.length === 0 },
  { label: `导出当前页 (${logs.value.length})`, key: 'current', disabled: logs.value.length === 0 },
  { label: `全部导出 (${totalCount.value})`, key: 'all' },
])

// 导出：与表格列严格一致
const OPERATION_LOG_EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'created_at', label: '操作时间', formatter: (r) => formatDateTime(r.created_at) || '—' },
  { key: 'real_name', label: '操作人', formatter: (r) => (r as OperationLog).real_name || (r as OperationLog).username || '—' },
  { key: 'module', label: '模块', formatter: (r) => moduleLabel(r.module) },
  { key: 'action', label: '操作类型', formatter: (r) => actionLabel(r.action) },
  { key: 'summary', label: '摘要', formatter: (r) => r.summary || '—' },
]

type ExportScope = 'selected' | 'current' | 'all'

function getExportAllParams() {
  let start: string | undefined
  let end: string | undefined
  let range: TimeRange = timeRange.value
  if (timeRange.value === 'today' && singleDateTs.value) {
    const dateStr = tsToDateStr(singleDateTs.value)
    start = dateStr
    end = dateStr
    range = 'custom'
  } else if (timeRange.value === 'custom') {
    start = tsToDateStr(customStartTs.value)
    end = tsToDateStr(customEndTs.value)
  }
  return {
    scope: materialScope.value,
    time_range: range,
    start_date: start,
    end_date: end,
    username: username.value || undefined,
    module: module.value || undefined,
    action: action.value || undefined,
    keyword: keyword.value || undefined,
    limit: 500,
    skip: 0,
  }
}

async function handleExportExcel(scope: ExportScope) {
  let data: OperationLog[] = []
  if (scope === 'all') {
    try {
      const res = await getOperationLogs(getExportAllParams())
      const result = res as { data?: OperationLog[] }
      data = Array.isArray(result?.data) ? result.data : (res as any)?.data ?? []
    } catch (e: any) {
      window.$message?.error(e?.message || '获取数据失败')
      return
    }
  } else {
    data = scope === 'selected' ? selectedLogs.value : logs.value
    if (data.length === 0) {
      window.$message?.warning(scope === 'selected' ? '请先勾选要导出的记录' : '当前页无数据可导出')
      return
    }
  }
  if (data.length === 0) {
    window.$message?.warning('无数据可导出')
    return
  }
  const date = new Date().toISOString().slice(0, 10)
  exportToExcel(data, OPERATION_LOG_EXPORT_COLUMNS, `记录查询_${date}`)
  window.$message?.success(`已导出 ${data.length} 条记录`)
}

async function handleExportCSV(scope: ExportScope) {
  let data: OperationLog[] = []
  if (scope === 'all') {
    try {
      const res = await getOperationLogs(getExportAllParams())
      const result = res as { data?: OperationLog[] }
      data = Array.isArray(result?.data) ? result.data : (res as any)?.data ?? []
    } catch (e: any) {
      window.$message?.error(e?.message || '获取数据失败')
      return
    }
  } else {
    data = scope === 'selected' ? selectedLogs.value : logs.value
    if (data.length === 0) {
      window.$message?.warning(scope === 'selected' ? '请先勾选要导出的记录' : '当前页无数据可导出')
      return
    }
  }
  if (data.length === 0) {
    window.$message?.warning('无数据可导出')
    return
  }
  const date = new Date().toISOString().slice(0, 10)
  exportToCSV(data, OPERATION_LOG_EXPORT_COLUMNS, `记录查询_${date}`)
  window.$message?.success(`已导出 ${data.length} 条记录`)
}

async function fetchLogs() {
  if (timeRange.value === 'custom' && (!customStartTs.value || !customEndTs.value)) {
    window.$message?.warning('请选择自定义的开始和结束日期')
    return
  }
  loading.value = true
  try {
    let start: string | undefined
    let end: string | undefined
    let range: TimeRange = timeRange.value
    if (timeRange.value === 'today' && singleDateTs.value) {
      const dateStr = tsToDateStr(singleDateTs.value)
      start = dateStr
      end = dateStr
      range = 'custom'
    } else if (timeRange.value === 'custom') {
      start = tsToDateStr(customStartTs.value)
      end = tsToDateStr(customEndTs.value)
    }
    const skip = (currentPage.value - 1) * pageSize.value
    const res = await getOperationLogs({
      scope: materialScope.value,
      time_range: range,
      start_date: start,
      end_date: end,
      username: username.value || undefined,
      module: module.value || undefined,
      action: action.value || undefined,
      keyword: keyword.value || undefined,
      limit: pageSize.value,
      skip,
    })
    const result = res as { data?: OperationLog[]; total?: number }
    logs.value = Array.isArray(result?.data) ? result.data : (res as any)?.data ?? []
    totalCount.value = typeof result?.total === 'number' ? result.total : logs.value.length
  } catch (e: any) {
    window.$message?.error(e?.message || '查询操作记录失败')
    logs.value = []
    totalCount.value = 0
  } finally {
    loading.value = false
  }
}

function onPageSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
  fetchLogs()
}

function onPageChange(page: number) {
  currentPage.value = page
  fetchLogs()
}

function onSearch() {
  currentPage.value = 1
  fetchLogs()
}

function fetchLogsAndClose() {
  currentPage.value = 1
  fetchLogs()
  mobileSearchDrawer.value = false
  scrollMainToTop()
}

onMounted(() => {
  singleDateTs.value = new Date().setHours(0, 0, 0, 0)
  onTimeRangeChange()
  loadOperatorOptions()
  fetchLogs()
})
onDeactivated(() => {
  mobileSearchDrawer.value = false
})

// 监听系统切换（电气/机械），重新加载数据
watch(materialScope, () => {
  currentPage.value = 1
  loadOperatorOptions()
  fetchLogs()
})
</script>

<style scoped lang="scss">
.oplog-page {
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
.filter-card {
  margin-bottom: 20px;
}
.filter-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
  &:last-of-type {
    margin-bottom: 0;
  }
}
.filter-label {
  font-size: 14px;
  color: var(--sp-text-secondary);
  white-space: nowrap;
}
.date-row {
  margin-left: 0;
}
.table-card {
  position: relative;
}

.table-scroll-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.empty-tip,
.total-tip {
  text-align: center;
  padding: 16px;
  font-size: 14px;
  color: var(--sp-text-muted);
}
.total-tip {
  color: var(--sp-text-secondary);
}
.pagination-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  padding: 12px 0 8px;
  flex-wrap: wrap;
}
.pagination-row .total-tip {
  padding: 0;
  margin-left: 8px;
}
.pagination-row.mobile-pagination {
  padding: 16px 0;
  justify-content: center;
}
.empty-cell {
  color: var(--sp-text-disabled);
  font-size: 14px;
}
.summary-cell {
  font-size: 13px;
  line-height: 1.5;
  color: var(--sp-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
  padding: 6px 0;
}

/* 移动端卡片 */
.oplog-card-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.oplog-card {
  padding: 16px;
  background: var(--sp-surface);
  border-radius: var(--sp-radius-lg);
  border: 1px solid var(--n-border-color, #e0e0e6);
  box-shadow: var(--sp-shadow-sm);
  border-left: 4px solid var(--sp-info, #909399);
}

.oplog-card-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--n-border-color, #e0e0e6);
}

.oplog-card-time {
  font-size: 12px;
  color: var(--sp-text-muted);
  margin-left: auto;
}

.oplog-card-row {
  display: flex;
  margin-bottom: 6px;
  font-size: 14px;
}

.oplog-label {
  flex: 0 0 56px;
  color: var(--sp-text-muted);
}

.oplog-value {
  flex: 1;
  min-width: 0;
}

.oplog-card-summary {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--n-border-color, #e0e0e6);
  font-size: 13px;
  line-height: 1.5;
  color: var(--sp-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 767px) {
  .oplog-page {
    padding: 0 0 16px;
  }
  .oplog-page h2 {
    font-size: 18px;
  }
  .oplog-page .page-desc {
    font-size: 13px;
    margin-bottom: 16px;
  }
  .table-card {
    border-radius: 8px;
    overflow: hidden;
  }

  .mobile-filter-form {
    .filter-row {
      flex-direction: column;
      align-items: stretch;
      margin-bottom: 12px;
    }

    .filter-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 12px;
    }
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
