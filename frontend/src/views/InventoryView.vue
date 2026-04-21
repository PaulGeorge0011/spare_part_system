<template>
  <div class="inventory-page">
    <h2>库存管理</h2>
    <p class="page-desc">按时间范围查询库存记录，包括入库/出库时间、事件类型（入库、领用、管理出库等）、操作人等。</p>

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
        <span class="filter-label">事件类型：</span>
        <n-select
          v-model:value="filterEventType"
          placeholder="全部"
          clearable
          style="width: 120px"
          :options="eventTypeOptions"
          @update:value="fetchRecords"
        />
        <span class="filter-label">操作人：</span>
        <n-select
          v-model:value="filterRequisitioner"
          placeholder="选择操作人"
          clearable
          filterable
          style="width: 160px"
          :options="operatorSelectOptions"
          @update:value="fetchRecords"
        />
      </div>
      <div class="filter-row">
        <n-button type="primary" :loading="loading" @click="fetchRecords">查询</n-button>
        <n-dropdown trigger="click" :options="excelDropdownOptions" @select="(cmd: string) => handleExportExcel(cmd as 'selected' | 'current' | 'all')">
          <n-button type="info" :disabled="records.length === 0 && selectedRowKeys.length === 0">
            导出 Excel
            <template #icon><n-icon><ChevronDownOutline /></n-icon></template>
          </n-button>
        </n-dropdown>
        <n-dropdown trigger="click" :options="csvDropdownOptions" @select="(cmd: string) => handleExportCSV(cmd as 'selected' | 'current' | 'all')">
          <n-button type="info" :disabled="records.length === 0 && selectedRowKeys.length === 0">
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
        class="inventory-mobile-search-drawer mobile-search-drawer-unified"
        @update:show="(v: boolean) => { if (!v) mobileSearchDrawer = false }"
      >
        <n-drawer-content title="库存查询" closable>
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
              <span class="filter-label">事件类型</span>
              <n-select
                v-model:value="filterEventType"
                placeholder="选择事件类型"
                clearable
                style="width: 100%"
                :options="eventTypeOptions"
                @update:value="fetchRecords"
              />
            </div>
            <div class="filter-group">
              <span class="filter-label">操作人</span>
              <n-select
                v-model:value="filterRequisitioner"
                placeholder="选择操作人"
                clearable
                style="width: 100%"
                :options="operatorSelectOptions"
                @update:value="fetchRecords"
              />
            </div>
            <div class="filter-actions">
              <n-button type="primary" :loading="loading" @click="fetchRecordsAndClose" block>查询</n-button>
              <n-dropdown trigger="click" :options="excelDropdownOptions" @select="(cmd: string) => handleExportExcel(cmd as 'selected' | 'current' | 'all')" style="width: 100%">
                <n-button type="info" :disabled="records.length === 0 && selectedRowKeys.length === 0" block>
                  导出 Excel
                  <template #icon><n-icon><ChevronDownOutline /></n-icon></template>
                </n-button>
              </n-dropdown>
              <n-dropdown trigger="click" :options="csvDropdownOptions" @select="(cmd: string) => handleExportCSV(cmd as 'selected' | 'current' | 'all')" style="width: 100%">
                <n-button type="info" :disabled="records.length === 0 && selectedRowKeys.length === 0" block>
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
        <div class="inv-card-list">
          <div v-for="row in displayRecords" :key="row.id" class="inv-card">
            <div class="inv-card-header">
              <n-tag size="small" :type="row.event_type === '领用' ? 'error' : row.event_type === '归还' ? 'primary' : row.event_type === '入库' ? 'success' : 'warning'">{{ row.event_type }}</n-tag>
              <span class="inv-card-time">{{ formatDateTime(row.inbound_time || row.outbound_time) || '—' }}</span>
            </div>
            <div class="inv-card-row">
              <span class="inv-label">货位号</span>
              <span class="inv-value">{{ row.location_code || '—' }}</span>
            </div>
            <div v-if="row.storage_location" class="inv-card-row inv-card-location">
              <span class="inv-label">存放地</span>
              <span class="inv-value inv-location-value">{{ row.storage_location }}</span>
            </div>
            <div class="inv-card-row">
              <span class="inv-label">MES编码</span>
              <div class="inv-code-cell">
                <n-icon
                  v-if="row.mes_material_code"
                  class="inv-copy-icon"
                  @click.stop="copyToClipboard(row.mes_material_code)"
                >
                  <CopyOutline />
                </n-icon>
                <span class="inv-value inv-code">{{ row.mes_material_code || '—' }}</span>
              </div>
            </div>
            <div class="inv-card-row">
              <span class="inv-label">规格型号</span>
              <div class="inv-code-cell">
                <n-icon
                  v-if="row.specification_model"
                  class="inv-copy-icon"
                  @click.stop="copyToClipboard(row.specification_model)"
                >
                  <CopyOutline />
                </n-icon>
                <span class="inv-value inv-code">{{ row.specification_model || '—' }}</span>
              </div>
            </div>
            <div class="inv-card-row">
              <span class="inv-label">数量</span>
              <span class="inv-value">{{ row.quantity }} {{ row.unit || '个' }}</span>
            </div>
            <div class="inv-card-row">
              <span class="inv-label">库存变化</span>
              <span class="inv-value">{{ row.physical_stock_before ?? '—' }} → {{ row.physical_stock_after ?? '—' }}</span>
            </div>
            <div class="inv-card-row">
              <span class="inv-label">操作人</span>
              <span class="inv-value">{{ row.requisitioner_name || '—' }}</span>
            </div>
            <div class="inv-card-row">
              <span class="inv-label">用户名</span>
              <span class="inv-value">{{ row.operator_name || '—' }}</span>
            </div>
            <div v-if="row.requisition_reason" class="inv-card-row">
              <span class="inv-label">领用原因</span>
              <span class="inv-value">{{ row.requisition_reason }}</span>
            </div>
            <div v-if="row.usage_location" class="inv-card-row">
              <span class="inv-label">使用地点</span>
              <span class="inv-value">{{ row.usage_location }}</span>
            </div>
            <div v-if="row.physical_image_url || row.physical_image_url2" class="inv-card-images">
              <img
                v-if="row.physical_image_url"
                :src="getImageUrlForDisplay(row.physical_image_url)"
                style="width: 48px; height: 48px; border-radius: 6px; object-fit: cover; cursor: pointer;"
                @click="handlePreview(getImageUrlForDisplay(row.physical_image_url))"
              />
              <img
                v-if="row.physical_image_url2"
                :src="getImageUrlForDisplay(row.physical_image_url2)"
                style="width: 48px; height: 48px; border-radius: 6px; object-fit: cover; cursor: pointer;"
                @click="handlePreview(getImageUrlForDisplay(row.physical_image_url2))"
              />
            </div>
            <div v-if="row.remark" class="inv-card-remark">{{ row.remark }}</div>
          </div>
          <div v-if="!loading && records.length > 0" class="pagination-row mobile-pagination">
            <n-pagination
              v-model:page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="pageSizeOptions"
              :item-count="records.length"
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
            :data="displayRecords"
            :bordered="true"
            :striped="true"
            :max-height="560"
            :row-key="(row: InventoryRecord) => row.id"
            @update:checked-row-keys="onInvSelectionChange"
          />
        </n-spin>
      </div>
      <div v-if="!loading && records.length === 0" class="empty-tip">暂无记录</div>
      <div v-else-if="!loading && records.length > 0 && !isMobile" class="pagination-row">
        <n-pagination
          v-model:page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="pageSizeOptions"
          :item-count="records.length"
          show-size-picker
          show-quick-jumper
          :prefix="() => `共 ${records.length} 条`"
          @update:page="onPageChange"
          @update:page-size="onPageSizeChange"
        />
      </div>
    </n-card>

    <!-- 图片预览 -->
    <n-modal v-model:show="previewVisible" preset="card" style="max-width: 90vw; max-height: 90vh;" title="图片预览">
      <img :src="previewUrl" style="max-width: 100%; max-height: 70vh; display: block; margin: 0 auto;" />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
// 定义组件名称，用于 keep-alive 缓存
defineOptions({
  name: 'Inventory'
})

import { ref, computed, onMounted, onDeactivated, watch, inject, h } from 'vue'
import { useRoute } from 'vue-router'
import {
  NCard, NButton, NIcon, NTag, NRadioGroup, NRadioButton,
  NDatePicker, NSelect, NDropdown, NDrawer, NDrawerContent,
  NDataTable, NPagination, NSpin, NModal,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { CopyOutline, ChevronDownOutline } from '@vicons/ionicons5'
import { getInventoryRecords, getInventoryOperatorOptions, type InventoryRecord, type TimeRange, type MaterialScope } from '@/api/inventory'
import { formatDateTime } from '@/utils/date'
import { exportToExcel, exportToCSV, type ExportColumn } from '@/utils/exportExcel'
import { useIsMobile } from '@/composables/useIsMobile'
import { getImageUrlForDisplay } from '@/utils/image'
import { scrollMainToTop } from '@/composables/useScrollMainToTop'

const route = useRoute()
const materialScope = computed<MaterialScope>(() =>
  route.path.startsWith('/electrical') ? 'electrical' : 'mechanical'
)
const { isMobile } = useIsMobile()
const mobileSearchDrawer = ref(false)
const openMobileSearch = inject<{ value: boolean }>('openMobileSearch')
if (openMobileSearch) {
  watch(() => openMobileSearch.value, (v) => {
    if (v && (route.path === '/electrical/inventory' || route.path === '/mechanical/inventory')) {
      mobileSearchDrawer.value = true
      openMobileSearch.value = false
    }
  })
}

// 图片预览
const previewVisible = ref(false)
const previewUrl = ref('')
function handlePreview(url: string) {
  previewUrl.value = url
  previewVisible.value = true
}

function copyToClipboard(text: string) {
  const t = String(text || '').trim()
  if (!t) return
  navigator.clipboard.writeText(t)
    .then(() => window.$message?.success('已复制到剪贴板'))
    .catch(() => {
      const ta = document.createElement('textarea')
      ta.value = t
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      window.$message?.success('已复制到剪贴板')
    })
}

const timeRange = ref<TimeRange>('30d')

// Naive UI date-picker uses timestamps (milliseconds)
const singleDateTs = ref<number | null>(null)
const customStartTs = ref<number | null>(null)
const customEndTs = ref<number | null>(null)

// Convert timestamp to YYYY-MM-DD string
function tsToDateStr(ts: number | null): string {
  if (!ts) return ''
  const d = new Date(ts)
  return formatDateStr(d)
}

const filterEventType = ref<string | null>(null)
const filterRequisitioner = ref<string | null>(null)
const operatorOptions = ref<string[]>([])
const loading = ref(false)

const eventTypeOptions = [
  { label: '全部', value: '' },
  { label: '领用', value: '领用' },
  { label: '归还', value: '归还' },
  { label: '入库', value: '入库' },
  { label: '管理出库', value: '管理出库' },
]

const operatorSelectOptions = computed(() =>
  operatorOptions.value.map(item => ({ label: item, value: item }))
)

async function loadOperatorOptions() {
  try {
    const res = await getInventoryOperatorOptions(materialScope.value)
    operatorOptions.value = Array.isArray(res) ? res : []
  } catch {
    operatorOptions.value = []
  }
}
const records = ref<InventoryRecord[]>([])
/** 每页条数选项与默认值 */
const pageSizeOptions = [20, 50, 100]
const pageSize = ref(20)
const currentPage = ref(1)
/** 当前页用于展示的数据（表格/卡片只渲染此切片） */
const displayRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return records.value.slice(start, start + pageSize.value)
})
const selectedRowKeys = ref<Array<string | number>>([])
function onInvSelectionChange(keys: Array<string | number>) {
  selectedRowKeys.value = keys
}
const selectedRecords = computed(() =>
  records.value.filter(r => selectedRowKeys.value.includes(r.id))
)

// Dropdown options
const excelDropdownOptions = computed(() => [
  { label: `导出选中 (${selectedRowKeys.value.length})`, key: 'selected', disabled: selectedRowKeys.value.length === 0 },
  { label: `导出当前页 (${displayRecords.value.length})`, key: 'current', disabled: displayRecords.value.length === 0 },
  { label: `全部导出 (${records.value.length})`, key: 'all', disabled: records.value.length === 0 },
])
const csvDropdownOptions = computed(() => [
  { label: `导出选中 (${selectedRowKeys.value.length})`, key: 'selected', disabled: selectedRowKeys.value.length === 0 },
  { label: `导出当前页 (${displayRecords.value.length})`, key: 'current', disabled: displayRecords.value.length === 0 },
  { label: `全部导出 (${records.value.length})`, key: 'all', disabled: records.value.length === 0 },
])

// Table columns for n-data-table
const tableColumns = computed<DataTableColumns<InventoryRecord>>(() => [
  { type: 'selection', width: 55 },
  {
    title: '入库时间', key: 'inbound_time', width: 170, align: 'center', sorter: 'default',
    render(row) { return formatDateTime(row.inbound_time) || '—' },
  },
  {
    title: '出库时间', key: 'outbound_time', width: 170, align: 'center', sorter: 'default',
    render(row) { return formatDateTime(row.outbound_time) || '—' },
  },
  {
    title: '事件类型', key: 'event_type', width: 110, align: 'center', sorter: 'default',
    render(row) {
      const typeMap: Record<string, 'error' | 'primary' | 'success' | 'warning'> = {
        '领用': 'error', '归还': 'primary', '入库': 'success',
      }
      return h(NTag, { size: 'small', type: typeMap[row.event_type] || 'warning' }, { default: () => row.event_type })
    },
  },
  {
    title: '操作人', key: 'requisitioner_name', width: 100, align: 'center', sorter: 'default',
    render(row) { return row.requisitioner_name || '—' },
  },
  {
    title: '用户名', key: 'operator_name', width: 100, align: 'center', sorter: 'default',
    render(row) { return row.operator_name || '—' },
  },
  { title: '货位号', key: 'location_code', width: 110, sorter: 'default', ellipsis: { tooltip: true } },
  {
    title: 'MES编码', key: 'mes_material_code', minWidth: 220, sorter: 'default',
    render(row) {
      return h('div', { class: 'code-cell' }, [
        row.mes_material_code
          ? h(NIcon, {
              class: 'copy-icon',
              onClick: (e: Event) => { e.stopPropagation(); copyToClipboard(row.mes_material_code) },
            }, { default: () => h(CopyOutline) })
          : null,
        h('span', { class: 'code-value' }, row.mes_material_code || '—'),
      ])
    },
  },
  {
    title: '规格型号', key: 'specification_model', minWidth: 140, sorter: 'default', ellipsis: { tooltip: true },
    render(row) {
      return h('div', { class: 'code-cell' }, [
        row.specification_model
          ? h(NIcon, {
              class: 'copy-icon',
              onClick: (e: Event) => { e.stopPropagation(); copyToClipboard(row.specification_model) },
            }, { default: () => h(CopyOutline) })
          : null,
        h('span', { class: 'code-value' }, row.specification_model || '—'),
      ])
    },
  },
  {
    title: '实物图片1', key: 'physical_image_url', width: 100, align: 'center',
    render(row) {
      if (row.physical_image_url) {
        return h('img', {
          src: getImageUrlForDisplay(row.physical_image_url),
          style: 'width: 56px; height: 56px; border-radius: 4px; object-fit: cover; cursor: pointer;',
          onClick: () => handlePreview(getImageUrlForDisplay(row.physical_image_url)),
        })
      }
      return h('span', { class: 'empty-cell' }, '—')
    },
  },
  {
    title: '实物图片2', key: 'physical_image_url2', width: 100, align: 'center',
    render(row) {
      if (row.physical_image_url2) {
        return h('img', {
          src: getImageUrlForDisplay(row.physical_image_url2),
          style: 'width: 56px; height: 56px; border-radius: 4px; object-fit: cover; cursor: pointer;',
          onClick: () => handlePreview(getImageUrlForDisplay(row.physical_image_url2)),
        })
      }
      return h('span', { class: 'empty-cell' }, '—')
    },
  },
  {
    title: '数量', key: 'quantity', width: 80, align: 'center', sorter: 'default',
    render(row) { return `${row.quantity} ${row.unit || '个'}` },
  },
  {
    title: '库存变化', key: 'physical_stock_before', width: 120, align: 'center', sorter: 'default',
    render(row) { return `${row.physical_stock_before ?? '—'} → ${row.physical_stock_after ?? '—'}` },
  },
  {
    title: '领用原因', key: 'requisition_reason', minWidth: 140, sorter: 'default', ellipsis: { tooltip: true },
    render(row) { return row.requisition_reason || '—' },
  },
  {
    title: '使用地点', key: 'usage_location', minWidth: 120, sorter: 'default', ellipsis: { tooltip: true },
    render(row) { return row.usage_location || '—' },
  },
  {
    title: '备注', key: 'remark', minWidth: 120, sorter: 'default', ellipsis: { tooltip: true },
    render(row) { return row.remark || '—' },
  },
])

function onTimeRangeChange() {
  if (timeRange.value === 'custom' && !customStartTs.value && !customEndTs.value) {
    const d = new Date()
    const s = new Date(d)
    s.setDate(s.getDate() - 30)
    customStartTs.value = s.getTime()
    customEndTs.value = d.getTime()
  }
}

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function fetchRecords() {
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
    const res = await getInventoryRecords(
      materialScope.value,
      range,
      start,
      end,
      filterEventType.value || undefined,
      filterRequisitioner.value || undefined
    )
    records.value = Array.isArray(res) ? res : (res as any)?.data ?? []
    currentPage.value = 1
  } catch (e: any) {
    window.$message?.error(e?.message || '查询库存记录失败')
    records.value = []
  } finally {
    loading.value = false
  }
}

function onPageSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
}
function onPageChange(page: number) {
  currentPage.value = page
}

function fetchRecordsAndClose() {
  fetchRecords()
  mobileSearchDrawer.value = false
  scrollMainToTop()
}

// 导出：与表格列严格一致（排除实物图片1、实物图片2）
const INVENTORY_EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'inbound_time', label: '入库时间', formatter: (r) => formatDateTime(r.inbound_time) || '—' },
  { key: 'outbound_time', label: '出库时间', formatter: (r) => formatDateTime(r.outbound_time) || '—' },
  { key: 'event_type', label: '事件类型' },
  { key: 'requisitioner_name', label: '操作人', formatter: (r) => r.requisitioner_name || '—' },
  { key: 'operator_name', label: '用户名', formatter: (r) => r.operator_name || '—' },
  { key: 'location_code', label: '货位号' },
  { key: 'mes_material_code', label: 'MES编码' },
  { key: 'specification_model', label: '规格型号' },
  {
    key: 'quantity',
    label: '数量',
    formatter: (r) => `${r.quantity ?? '—'} ${r.unit || '个'}`.trim(),
  },
  {
    key: 'physical_stock_before',
    label: '库存变化',
    formatter: (r) => `${r.physical_stock_before ?? '—'} → ${r.physical_stock_after ?? '—'}`,
  },
  { key: 'requisition_reason', label: '领用原因', formatter: (r) => r.requisition_reason || '—' },
  { key: 'usage_location', label: '使用地点', formatter: (r) => r.usage_location || '—' },
  { key: 'remark', label: '备注', formatter: (r) => r.remark || '—' },
]

type ExportScope = 'selected' | 'current' | 'all'
function getExportData(scope: ExportScope): InventoryRecord[] {
  if (scope === 'selected') return selectedRecords.value
  if (scope === 'current') return displayRecords.value
  return records.value
}
function handleExportExcel(scope: ExportScope) {
  const data = getExportData(scope)
  if (data.length === 0) {
    window.$message?.warning(scope === 'selected' ? '请先勾选要导出的记录' : '无数据可导出')
    return
  }
  const date = new Date().toISOString().slice(0, 10)
  exportToExcel(data, INVENTORY_EXPORT_COLUMNS, `库存记录_${date}`)
  window.$message?.success(`已导出 ${data.length} 条记录`)
}

function handleExportCSV(scope: ExportScope) {
  const data = getExportData(scope)
  if (data.length === 0) {
    window.$message?.warning(scope === 'selected' ? '请先勾选要导出的记录' : '无数据可导出')
    return
  }
  const date = new Date().toISOString().slice(0, 10)
  exportToCSV(data, INVENTORY_EXPORT_COLUMNS, `库存记录_${date}`)
  window.$message?.success(`已导出 ${data.length} 条记录`)
}

onMounted(() => {
  singleDateTs.value = new Date().setHours(0, 0, 0, 0)
  onTimeRangeChange()
  loadOperatorOptions()
  fetchRecords()
})
onDeactivated(() => {
  mobileSearchDrawer.value = false
})

// 监听系统切换（电气/机械），重新加载数据
watch(materialScope, () => {
  loadOperatorOptions()
  fetchRecords()
})
</script>

<style scoped lang="scss">
.inventory-page {
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
.code-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  .code-value {
    flex: 1;
    min-width: 0;
  }
  .copy-icon {
    flex-shrink: 0;
    cursor: pointer;
    color: var(--sp-text-muted);
    font-size: 14px;
    &:hover {
      color: var(--sp-primary);
    }
  }
}

/* 移动端卡片 */
.inv-card-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.inv-card {
  padding: 16px;
  background: var(--sp-surface);
  border-radius: var(--sp-radius-lg);
  border: 1px solid var(--n-border-color, #e0e0e6);
  box-shadow: var(--sp-shadow-sm);
  border-left: 4px solid var(--sp-info, #909399);
}

.inv-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--n-border-color, #e0e0e6);
}

.inv-card-time {
  font-size: 12px;
  color: var(--sp-text-muted);
}

.inv-card-row {
  display: flex;
  margin-bottom: 6px;
  font-size: 14px;
}

.inv-card-location .inv-location-value {
  color: var(--sp-success);
}

.inv-label {
  flex: 0 0 72px;
  color: var(--sp-text-muted);
  font-size: 13px;
}

.inv-value {
  flex: 1;
  min-width: 0;
  word-break: break-all;
}

.inv-code-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}
.inv-code-cell .inv-copy-icon {
  flex-shrink: 0;
  cursor: pointer;
  color: var(--sp-text-muted);
  font-size: 14px;
}
.inv-code-cell .inv-copy-icon:hover {
  color: var(--sp-primary);
}
.inv-code {
  font-family: var(--sp-font-mono);
  color: var(--sp-primary);
}

.inv-card-images {
  display: flex;
  gap: 8px;
  margin-top: 10px;

  img {
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
}

.inv-card-remark {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--n-border-color, #e0e0e6);
  font-size: 13px;
  color: var(--sp-text-secondary);
  line-height: 1.4;
}

@media (max-width: 767px) {
  .inventory-page {
    padding: 0 0 16px;
  }
  .inventory-page h2 {
    font-size: 18px;
  }
  .inventory-page .page-desc {
    font-size: 13px;
    margin-bottom: 16px;
  }
  .table-card {
    border-radius: 8px;
    overflow: hidden;
  }
  .inv-card-list {
    gap: 12px;
  }
  .inv-card {
    padding: 14px;
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
