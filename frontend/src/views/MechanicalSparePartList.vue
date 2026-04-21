<template>
  <div class="mechanical-spare-part-list">
    <div class="header">
      <h2>机械设备管理</h2>
      <div class="header-buttons">
        <template v-if="!isMobile">
          <template v-if="canEdit">
            <n-button
              type="error"
              :disabled="selectedRows.length === 0"
              :loading="isBatchDeleting"
              @click="handleBatchDelete"
            >
              <template #icon><n-icon><TrashOutline /></n-icon></template>
              批量删除 ({{ selectedRows.length }})
            </n-button>
            <n-button type="success" @click="handleBatchImport">
              <template #icon><n-icon><CloudUploadOutline /></n-icon></template>
              批量新增
            </n-button>
            <n-button type="warning" @click="handleBatchUpdate">
              <template #icon><n-icon><CreateOutline /></n-icon></template>
              批量更新
            </n-button>
            <n-button type="primary" @click="handleCreate">
              <template #icon><n-icon><AddOutline /></n-icon></template>
              新增机械设备
            </n-button>
          </template>
          <n-dropdown trigger="click" :options="exportDropdownOptions" @select="handleExportDropdownSelect">
            <n-button type="info" :loading="exportLoading">
              导出 Excel
              <template #icon><n-icon><ChevronDownOutline /></n-icon></template>
            </n-button>
          </n-dropdown>
        </template>
        <template v-else>
          <n-button v-if="canEdit" type="primary" size="small" @click="handleCreate">
            <template #icon><n-icon><AddOutline /></n-icon></template>
            新增
          </n-button>
          <n-dropdown trigger="click" :options="mobileDropdownOptions" @select="handleMobileMenuCommand">
            <n-button size="small">
              更多
              <template #icon><n-icon><ChevronDownOutline /></n-icon></template>
            </n-button>
          </n-dropdown>
        </template>
      </div>
    </div>

    <!-- PC 端：搜索 + 筛选 -->
    <div v-if="!isMobile" class="search-and-filter">
      <div class="search-bar">
        <n-input
          v-model:value="searchKeyword"
          placeholder="搜索货位号、MES编码、规格型号、图号、保管人、物料描述..."
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #suffix>
            <n-icon style="cursor: pointer" @click="handleSearch"><SearchOutline /></n-icon>
          </template>
        </n-input>
      </div>
      <div class="filter-bar">
        <n-select v-model:value="filterBrand" placeholder="品牌" clearable filterable style="width: 120px" :options="filterOptions.brands.map(b => ({ label: b, value: b }))" @update:value="applyFilters" />
        <n-select v-model:value="filterApplicableModel" placeholder="适用机型" clearable filterable style="width: 130px" :options="filterOptions.applicable_models.map(b => ({ label: b, value: b }))" @update:value="applyFilters" />
        <n-select v-model:value="filterStorageLocation" placeholder="存放地" clearable filterable style="width: 120px" :options="filterOptions.storage_locations.map(b => ({ label: b, value: b }))" @update:value="applyFilters" />
        <n-select v-model:value="filterLocationPrefix" placeholder="货位号" clearable style="width: 100px" :options="filterOptions.location_prefixes.map(b => ({ label: b, value: b }))" @update:value="applyFilters" />
        <n-button v-if="hasActiveFilters" @click="clearFilters">清空筛选</n-button>
      </div>
    </div>

    <!-- 移动端：顶栏搜索由 App 统一展示，本页只保留抽屉 -->
    <template v-if="isMobile">
      <n-drawer
        v-model:show="mobileSearchDrawer"
        placement="bottom"
        height="80%"
        :close-on-esc="true"
        :mask-closable="true"
        class="mech-list-mobile-search-drawer mobile-search-drawer-unified"
        @after-leave="mobileSearchDrawer = false"
      >
        <n-drawer-content title="搜索筛选" closable>
          <div class="mobile-filter-form">
            <div class="filter-group">
              <span class="filter-label">关键词</span>
              <n-input
                v-model:value="searchKeyword"
                placeholder="货位号、MES编码、规格型号、图号、保管人..."
                clearable
                @clear="handleSearch"
                @keyup.enter="handleSearchAndClose"
              >
                <template #suffix>
                  <n-icon style="cursor: pointer" @click="handleSearchAndClose"><SearchOutline /></n-icon>
                </template>
              </n-input>
            </div>
            <div class="filter-row-two">
              <div class="filter-group filter-group-half">
                <span class="filter-label">品牌</span>
                <n-select v-model:value="filterBrand" placeholder="选择品牌" clearable style="width: 100%" :options="filterOptions.brands.map(b => ({ label: b, value: b }))" @update:value="applyFilters" />
              </div>
              <div class="filter-group filter-group-half">
                <span class="filter-label">适用机型</span>
                <n-select v-model:value="filterApplicableModel" placeholder="选择适用机型" clearable style="width: 100%" :options="filterOptions.applicable_models.map(b => ({ label: b, value: b }))" @update:value="applyFilters" />
              </div>
            </div>
            <div class="filter-row-two">
              <div class="filter-group filter-group-half">
                <span class="filter-label">存放地</span>
                <n-select v-model:value="filterStorageLocation" placeholder="选择存放地" clearable style="width: 100%" :options="filterOptions.storage_locations.map(b => ({ label: b, value: b }))" @update:value="applyFilters" />
              </div>
              <div class="filter-group filter-group-half">
                <span class="filter-label">货位号前缀</span>
                <n-select v-model:value="filterLocationPrefix" placeholder="选择货位号前缀" clearable style="width: 100%" :options="filterOptions.location_prefixes.map(b => ({ label: b, value: b }))" @update:value="applyFilters" />
              </div>
            </div>
            <div class="filter-actions">
              <n-button v-if="hasActiveFilters" @click="clearFilters">清空</n-button>
              <n-button type="primary" @click="handleSearchAndClose" style="flex:1">
                <template #icon><n-icon><SearchOutline /></n-icon></template>
                查询
              </n-button>
            </div>
          </div>
        </n-drawer-content>
      </n-drawer>
    </template>

    <!-- 方案四：零库存/低库存横幅 + 直接查询 -->
    <div v-if="!loading && (list.length > 0 || total > 0)" class="stock-alert-banner">
      <template v-if="stockAlertFilter">
        <span class="banner-label">当前筛选：</span>
        <span>{{ stockAlertFilter === 'zero' ? '零库存' : '低库存' }} 共 {{ total }} 条</span>
        <n-button text type="primary" size="small" @click="clearStockAlertFilter">清除库存筛选</n-button>
      </template>
      <template v-else>
        <span class="banner-stat">零库存 <strong>{{ zeroCount }}</strong> 条</span>
        <span class="banner-divider">|</span>
        <span class="banner-stat">低库存 <strong>{{ lowCount }}</strong> 条</span>
        <n-button v-if="zeroCount > 0" text type="error" size="small" @click="setStockAlertFilter('zero')">查看零库存</n-button>
        <n-button v-if="lowCount > 0" text type="warning" size="small" @click="setStockAlertFilter('low')">查看低库存</n-button>
      </template>
    </div>

    <!-- 移动端：卡片列表 -->
    <div v-if="isMobile" class="card-list-wrap">
      <n-spin :show="loading && !loadingMore">
      <div class="card-list">
        <div
          v-for="row in list"
          :key="row.id"
          class="mech-card"
          :class="[{ 'card-selected': selectedRows.some(r => r.id === row.id) }, getReqCardStockClass(row)]"
          @click="toggleCardSelection(row)"
        >
          <div class="card-main">
            <n-checkbox
              :checked="selectedRows.some(r => r.id === row.id)"
              @click.stop
              @update:checked="(v: boolean) => v ? addSelection(row) : removeSelection(row)"
            />
            <div class="card-content">
              <div class="card-field-row">
                <span class="card-field-label">货位号</span>
                <n-tag type="info" size="small" class="location-tag">{{ row.location_code }}</n-tag>
              </div>
              <div class="card-field-row">
                <span class="card-field-label">MES编码</span>
                <span class="card-code">{{ row.mes_material_code || '—' }}</span>
              </div>
              <div v-if="row.specification_model" class="card-field-row">
                <span class="card-field-label">规格型号</span>
                <span class="card-spec">{{ row.specification_model }}</span>
              </div>
              <div class="card-field-row">
                <span class="card-field-label">物料描述</span>
                <span class="card-desc">{{ row.mes_material_desc || row.physical_material_desc || '—' }}</span>
              </div>
              <div v-if="row.storage_location || row.custodian" class="card-field-row">
                <span class="card-field-label">存放地</span>
                <div class="card-location">
                  <n-icon v-if="row.storage_location" class="location-icon"><LocationOutline /></n-icon>
                  <span>{{ row.storage_location || '' }}</span>
                  <span v-if="row.custodian" class="card-custodian">保管人：{{ row.custodian }}</span>
                </div>
              </div>
              <div v-if="row.drawing_no" class="card-field-row">
                <span class="card-field-label">图号</span>
                <span class="card-drawing">{{ row.drawing_no }}</span>
              </div>
              <div v-if="row.brand" class="card-field-row">
                <span class="card-field-label">品牌</span>
                <n-tag type="primary" size="small">{{ row.brand }}</n-tag>
              </div>
              <div v-if="row.applicable_model" class="card-field-row">
                <span class="card-field-label">适用机型</span>
                <n-tag type="warning" size="small">{{ formatApplicableModel(row.applicable_model) }}</n-tag>
              </div>
              <div class="card-field-row">
                <span class="card-field-label">库存</span>
                <div class="card-stock">
                  <n-tag :type="getStockType(row.mes_stock ?? 0, row.physical_stock ?? 0)" size="small">MES: {{ row.mes_stock ?? 0 }}</n-tag>
                  <n-tag :type="getStockType(row.physical_stock ?? 0, row.mes_stock ?? 0)" size="small" class="card-stock-tag">修附件: {{ row.physical_stock ?? 0 }}</n-tag>
                  <span class="unit-text">{{ row.unit || '个' }}</span>
                </div>
              </div>
              <div v-if="row.physical_image_url || row.physical_image_url2" class="card-field-row">
                <span class="card-field-label">图片</span>
                <div class="card-images">
                  <n-image
                    v-if="row.physical_image_url"
                    width="36"
                    height="36"
                    style="border-radius: 4px;"
                    :src="getImageUrlForDisplay(row.physical_image_url)"
                    object-fit="cover"
                  />
                  <n-image
                    v-if="row.physical_image_url2"
                    width="36"
                    height="36"
                    style="border-radius: 4px;"
                    :src="getImageUrlForDisplay(row.physical_image_url2)"
                    object-fit="cover"
                  />
                </div>
              </div>
            </div>
          </div>
          <div v-if="canEdit" class="card-actions">
            <n-button size="small" type="primary" text @click.stop="handleEdit(row)">
              <template #icon><n-icon><CreateOutline /></n-icon></template>
              编辑
            </n-button>
            <n-button size="small" type="error" text @click.stop="handleDelete(row)">
              <template #icon><n-icon><TrashOutline /></n-icon></template>
              删除
            </n-button>
          </div>
        </div>
      </div>
      </n-spin>
      <div v-if="isMobile && list.length > 0" ref="loadMoreSentinel" class="load-more-sentinel">
        <div v-if="loadingMore" class="load-more-loading">加载中...</div>
        <div v-else-if="listHasMore" class="load-more-hint">下滑加载更多</div>
        <div v-else class="load-more-end">— 没有更多了 —</div>
      </div>
    </div>

    <!-- PC 端：表格 -->
    <div v-else class="table-wrapper">
      <n-spin :show="loading">
      <n-data-table
        ref="tableRef"
        :columns="tableColumns"
        :data="list"
        :bordered="true"
        :striped="true"
        :row-key="(row: MechanicalSparePart) => row.id"
        :row-class-name="getRequisitionRowClassName"
        :checked-row-keys="checkedRowKeys"
        @update:checked-row-keys="handleCheckedRowKeysChange"
      />
      </n-spin>
    </div>

    <div v-if="!isMobile" class="pagination-wrap">
      <n-pagination
        v-model:page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :item-count="total"
        show-size-picker
        show-quick-jumper
        @update:page="handleCurrentChange"
        @update:page-size="handleSizeChange"
      />
    </div>
    <div v-if="isMobile && !loading && list.length > 0" class="mobile-total-tip">共 {{ total }} 条</div>

    <MechanicalSparePartFormDialog
      v-model="dialogVisible"
      :form-data="currentForm"
      :mode="dialogMode"
      @success="handleDialogSuccess"
    />

    <!-- 批量导入对话框 -->
    <MechanicalBatchImportDialog
      v-model="batchImportDialogVisible"
      @success="handleBatchImportSuccess"
    />
    <!-- 批量更新 MES 库存对话框 -->
    <BatchUpdateDialog
      v-model="batchUpdateDialogVisible"
      type="mechanical"
      @success="handleBatchUpdateSuccess"
    />
  </div>
</template>

<script setup lang="ts">
// 定义组件名称，用于 keep-alive 缓存
defineOptions({
  name: 'MechanicalSparePartList'
})

import { ref, h, computed, onMounted, onActivated, onDeactivated, onUnmounted, watch, nextTick, inject } from 'vue'
import { useRoute } from 'vue-router'
import {
  NButton, NIcon, NInput, NSelect, NTag, NCheckbox, NImage,
  NDataTable, NPagination, NDrawer, NDrawerContent, NDropdown, NSpin,
  type DataTableColumns, type DataTableRowKey,
} from 'naive-ui'
import {
  SearchOutline, AddOutline, CopyOutline, CreateOutline, TrashOutline,
  CloudUploadOutline, ChevronDownOutline, LocationOutline,
} from '@vicons/ionicons5'
import MechanicalSparePartFormDialog from '@/components/MechanicalSparePartFormDialog.vue'
import MechanicalBatchImportDialog from '@/components/MechanicalBatchImportDialog.vue'
import BatchUpdateDialog from '@/components/BatchUpdateDialog.vue'
import { mechanicalSparePartApi } from '@/api/mechanicalSparePart'
import type { MechanicalSparePart } from '@/types/mechanicalSparePart'
import type { MechanicalSparePartFilterOptions } from '@/types/mechanicalSparePart'
import { useIsMobile } from '@/composables/useIsMobile'
import { scrollMainToTop } from '@/composables/useScrollMainToTop'
import { useDataRefresh } from '@/composables/useDataRefresh'
import { useMechanicalSparePartDataChanged, broadcastMechanicalSparePartDataChanged } from '@/composables/useMechanicalSparePartDataChanged'
import { getImageUrlForDisplay } from '@/utils/image'
import { formatDateTime } from '@/utils/date'
import { navLog, navLogStart } from '@/utils/navLog'
import { exportToExcel, type ExportColumn } from '@/utils/exportExcel'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const canEdit = computed(() => authStore.canAccessModule('mechanical', 'editor'))

const route = useRoute()
const { isMobile } = useIsMobile()
useDataRefresh(loadData)
useMechanicalSparePartDataChanged(loadData)
const searchKeyword = ref('')
const filterBrand = ref<string | null>(null)
const filterApplicableModel = ref<string | null>(null)
const filterStorageLocation = ref<string | null>(null)
const filterLocationPrefix = ref<string | null>(null)
const filterOptions = ref<MechanicalSparePartFilterOptions>({
  brands: [],
  applicable_models: [],
  storage_locations: [],
  location_prefixes: [],
})
const hasActiveFilters = computed(() =>
  !!(filterBrand.value || filterApplicableModel.value || filterStorageLocation.value || filterLocationPrefix.value)
)
const mobileSearchDrawer = ref(false)
const openMobileSearch = inject<{ value: boolean }>('openMobileSearch')
if (openMobileSearch) {
  watch(() => openMobileSearch.value, (v) => {
    if (v && route.path === '/mechanical/parts') {
      mobileSearchDrawer.value = true
      openMobileSearch.value = false
    }
  })
}

const currentPage = ref(1)
const pageSize = ref(20)
const list = ref<MechanicalSparePart[]>([])
const total = ref(0)
const loading = ref(false)
const loadingMore = ref(false)
const loadMoreSentinel = ref<HTMLElement | null>(null)
const listHasMore = computed(
  () => list.value.length < total.value && !loadingMore.value && !loading.value
)
const stockAlertFilter = ref<'zero' | 'low' | ''>('')
const zeroCount = ref(0)
const lowCount = ref(0)
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const currentForm = ref<Partial<MechanicalSparePart>>({})
const batchImportDialogVisible = ref(false)
const batchUpdateDialogVisible = ref(false)
const selectedRows = ref<MechanicalSparePart[]>([])
const isBatchDeleting = ref(false)
const exportLoading = ref(false)
const tableRef = ref()

// n-data-table checked row keys
const checkedRowKeys = computed(() => selectedRows.value.map(r => r.id))

function handleCheckedRowKeysChange(keys: DataTableRowKey[]) {
  selectedRows.value = list.value.filter(r => keys.includes(r.id))
}

const skip = computed(() => (currentPage.value - 1) * pageSize.value)

async function loadFilterOptions() {
  try {
    const res = await mechanicalSparePartApi.getFilterOptions()
    if (res?.brands) filterOptions.value.brands = res.brands
    if (res?.applicable_models) filterOptions.value.applicable_models = res.applicable_models
    if (res?.storage_locations) filterOptions.value.storage_locations = res.storage_locations
    if (res?.location_prefixes) filterOptions.value.location_prefixes = res.location_prefixes
  } catch {
    // ignore
  }
}

function formatApplicableModel(v: string | null | undefined): string {
  if (!v) return '—'
  const s = String(v).trim()
  return s.length > 20 ? s.slice(0, 20) + '...' : s
}

function copyToClipboard(text: string) {
  const t = String(text || '').trim()
  if (!t) return
  navigator.clipboard.writeText(t)
    .then(() => {
      window.$message?.success('已复制到剪贴板')
    })
    .catch(() => {
      const textArea = document.createElement('textarea')
      textArea.value = t
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      window.$message?.success('已复制到剪贴板')
    })
}

// 与电气一致：MES/修附件库存标签颜色
function getStockType(current: number, compare: number): 'success' | 'warning' | 'error' | 'info' {
  if (current !== 0 && !current) return 'info'
  if (compare !== undefined && compare !== null) {
    const diff = Math.abs(current - compare)
    if (diff > 10) return 'error'
    if (diff > 5) return 'warning'
  }
  if (current === 0) return 'error'
  if (current < 10) return 'warning'
  return 'success'
}

function totalStock(row: MechanicalSparePart): number {
  return (row.mes_stock ?? 0) + (row.physical_stock ?? 0)
}
function getRequisitionRowClassName(row: MechanicalSparePart) {
  const t = totalStock(row)
  if (t === 0) return 'req-row-zero'
  if (t === 1) return 'req-row-low'
  return ''
}
function getReqCardStockClass(row: MechanicalSparePart): string {
  const t = totalStock(row)
  if (t === 0) return 'req-card-zero'
  if (t === 1) return 'req-card-low'
  return ''
}
function setStockAlertFilter(value: 'zero' | 'low') {
  stockAlertFilter.value = value
  currentPage.value = 1
  loadData()
}
function clearStockAlertFilter() {
  stockAlertFilter.value = ''
  currentPage.value = 1
  loadData()
}

async function loadData(append = false) {
  const t = navLogStart()
  navLog('MechanicalSparePartList loadData start', { append })
  if (append) {
    loadingMore.value = true
  } else {
    loading.value = true
  }
  try {
    const skipVal = append ? list.value.length : skip.value
    const res = await mechanicalSparePartApi.getList({
      skip: skipVal,
      limit: pageSize.value,
      keyword: searchKeyword.value || undefined,
      brand: filterBrand.value || undefined,
      applicable_model: filterApplicableModel.value || undefined,
      storage_location: filterStorageLocation.value || undefined,
      location_prefix: filterLocationPrefix.value || undefined,
      stock_alert: stockAlertFilter.value || undefined,
    }) as { items?: MechanicalSparePart[]; total?: number; zero_count?: number; low_count?: number }
    const newItems = res?.items ?? []
    const totalCount = res?.total ?? 0
    if (typeof res?.zero_count === 'number') zeroCount.value = res.zero_count
    if (typeof res?.low_count === 'number') lowCount.value = res.low_count
    if (append && newItems.length > 0) {
      const ids = new Set(list.value.map((i) => i.id))
      const toAdd = newItems.filter((i) => !ids.has(i.id))
      list.value = [...list.value, ...toAdd]
    } else {
      list.value = newItems
    }
    total.value = totalCount
  } catch {
    window.$message?.error('加载数据失败')
    if (!append) {
      list.value = []
      total.value = 0
    }
  } finally {
    loading.value = false
    loadingMore.value = false
    navLog('MechanicalSparePartList loadData end', { append }, t)
  }
}

function loadMore() {
  if (!listHasMore.value || loadingMore.value) return
  loadData(true)
}

function handleSearch() {
  currentPage.value = 1
  loadData()
}

function handleSearchAndClose() {
  handleSearch()
  mobileSearchDrawer.value = false
  scrollMainToTop()
}

function handleSizeChange(val: number) {
  pageSize.value = val
  currentPage.value = 1
  loadData()
}

function handleCurrentChange(val: number) {
  currentPage.value = val
  loadData()
}

function applyFilters() {
  currentPage.value = 1
  loadData()
}

function clearFilters() {
  searchKeyword.value = ''
  filterBrand.value = null
  filterApplicableModel.value = null
  filterStorageLocation.value = null
  filterLocationPrefix.value = null
  stockAlertFilter.value = ''
  zeroCount.value = 0
  lowCount.value = 0
  currentPage.value = 1
  loadData()
  mobileSearchDrawer.value = false
}

function handleCreate() {
  currentForm.value = { mes_stock: 0, physical_stock: 0, unit: '个' }
  dialogMode.value = 'create'
  dialogVisible.value = true
}

function handleEdit(row: MechanicalSparePart) {
  currentForm.value = { ...row }
  dialogMode.value = 'edit'
  dialogVisible.value = true
}

function toggleCardSelection(row: MechanicalSparePart) {
  const idx = selectedRows.value.findIndex((r) => r.id === row.id)
  if (idx >= 0) {
    selectedRows.value = selectedRows.value.filter((r) => r.id !== row.id)
  } else {
    selectedRows.value = [...selectedRows.value, row]
  }
}

function addSelection(row: MechanicalSparePart) {
  if (!selectedRows.value.some((r) => r.id === row.id)) {
    selectedRows.value = [...selectedRows.value, row]
  }
}

function removeSelection(row: MechanicalSparePart) {
  selectedRows.value = selectedRows.value.filter((r) => r.id !== row.id)
}

async function handleBatchDelete() {
  if (selectedRows.value.length === 0) {
    window.$message?.warning('请先选择要删除的机械设备')
    return
  }

  const count = selectedRows.value.length
  const ids = selectedRows.value.map((row) => row.id)
  const mesCodes = selectedRows.value.map((row) => row.mes_material_code || row.location_code).join('、')

  window.$dialog?.warning({
    title: '确认批量删除',
    content: `确定删除选中的 ${count} 个机械设备吗？\n涉及：${mesCodes.substring(0, 100)}${mesCodes.length > 100 ? '...' : ''}\n此操作不可恢复。`,
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      isBatchDeleting.value = true
      try {
        const result = await mechanicalSparePartApi.batchDelete(ids)
        const { deleted, failed, errors } = result
        if (failed === 0) {
          window.$message?.success(`成功删除 ${deleted} 个机械设备`)
        } else {
          window.$message?.warning(`删除完成：成功 ${deleted} 个，失败 ${failed} 个`)
          if (errors?.length) console.error('批量删除错误:', errors)
        }
        selectedRows.value = []
        loadData()
        broadcastMechanicalSparePartDataChanged()
      } catch (error) {
        window.$message?.error('批量删除失败')
        console.error('批量删除失败:', error)
      } finally {
        isBatchDeleting.value = false
      }
    },
  })
}

async function handleDelete(row: MechanicalSparePart) {
  window.$dialog?.warning({
    title: '确认删除',
    content: `确定删除机械设备 "${row.mes_material_code || row.location_code}" 吗？此操作不可恢复。`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await mechanicalSparePartApi.delete(row.id)
        window.$message?.success('删除成功')
        loadData()
        broadcastMechanicalSparePartDataChanged()
      } catch {
        window.$message?.error('删除失败')
      }
    },
  })
}

function handleDialogSuccess() {
  dialogVisible.value = false
  loadData()
  broadcastMechanicalSparePartDataChanged()
}

// 批量新增相关
function handleBatchImport() {
  batchImportDialogVisible.value = true
}

function handleBatchImportSuccess() {
  loadData()
  broadcastMechanicalSparePartDataChanged()
}

function handleBatchUpdate() {
  batchUpdateDialogVisible.value = true
}

function handleBatchUpdateSuccess() {
  loadData()
  broadcastMechanicalSparePartDataChanged()
}

// n-data-table columns
const tableColumns = computed<DataTableColumns<MechanicalSparePart>>(() => {
  const cols: DataTableColumns<MechanicalSparePart> = [
    { type: 'selection', fixed: 'left', width: 55 },
    {
      title: '货位号', key: 'location_code', width: 100, fixed: 'left', sorter: true,
      render(row) {
        return h(NTag, { type: 'info', size: 'small' }, { default: () => row.location_code })
      },
    },
    {
      title: 'MES编码', key: 'mes_material_code', minWidth: 220, fixed: 'left', sorter: true,
      render(row) {
        return h('div', { class: 'code-cell' }, [
          row.mes_material_code
            ? h(NIcon, { class: 'copy-icon', onClick: () => copyToClipboard(row.mes_material_code!) }, { default: () => h(CopyOutline) })
            : null,
          h('span', { class: 'code-value' }, row.mes_material_code || '—'),
        ])
      },
    },
    {
      title: '规格型号', key: 'specification_model', width: 150, fixed: 'left', ellipsis: { tooltip: true }, sorter: true,
      render(row) {
        return h('div', { class: 'code-cell' }, [
          row.specification_model
            ? h(NIcon, { class: 'copy-icon', onClick: (e: Event) => { e.stopPropagation(); copyToClipboard(row.specification_model!); } }, { default: () => h(CopyOutline) })
            : null,
          h('span', { class: 'code-value' }, row.specification_model || '—'),
        ])
      },
    },
    { title: '图号', key: 'drawing_no', width: 100, ellipsis: { tooltip: true }, sorter: true },
    {
      title: '物料描述', key: 'mes_material_desc', minWidth: 180, ellipsis: { tooltip: true }, sorter: true,
      render(row) {
        return row.mes_material_desc || row.physical_material_desc || '—'
      },
    },
    {
      title: '适用机型', key: 'applicable_model', width: 120, ellipsis: { tooltip: true }, sorter: true,
      render(row) {
        return row.applicable_model
          ? h(NTag, { type: 'warning', size: 'small' }, { default: () => formatApplicableModel(row.applicable_model!) })
          : h('span', null, '—')
      },
    },
    {
      title: '品牌', key: 'brand', width: 100, ellipsis: { tooltip: true }, sorter: true,
      render(row) {
        return row.brand
          ? h(NTag, { type: 'primary', size: 'small' }, { default: () => row.brand })
          : h('span', null, '—')
      },
    },
    {
      title: 'MES库存', key: 'mes_stock', width: 100, sorter: true,
      render(row) {
        return h('div', { class: 'stock-cell' }, [
          h(NTag, { type: getStockType(row.mes_stock ?? 0, row.physical_stock ?? 0), size: 'small' }, { default: () => String(row.mes_stock ?? 0) }),
          h('span', { class: 'unit-text' }, row.unit || '个'),
        ])
      },
    },
    {
      title: '修附件库存', key: 'physical_stock', width: 110, sorter: true,
      render(row) {
        return h('div', { class: 'stock-cell' }, [
          h(NTag, { type: getStockType(row.physical_stock ?? 0, row.mes_stock ?? 0), size: 'small' }, { default: () => String(row.physical_stock ?? 0) }),
          h('span', { class: 'unit-text' }, row.unit || '个'),
        ])
      },
    },
    {
      title: '存放地', key: 'storage_location', minWidth: 120, ellipsis: { tooltip: true }, sorter: true,
      render(row) {
        return row.storage_location
          ? h(NTag, { type: 'success', size: 'small' }, { default: () => row.storage_location })
          : h('span', null, '—')
      },
    },
    {
      title: '保管人', key: 'custodian', width: 90, ellipsis: { tooltip: true }, sorter: true,
      render(row) {
        return row.custodian || '—'
      },
    },
    {
      title: '实物图片1', key: 'physical_image_url', width: 100, align: 'center',
      render(row) {
        return row.physical_image_url
          ? h('div', { class: 'image-cell' }, [
              h(NImage, {
                width: 40, height: 40,
                src: getImageUrlForDisplay(row.physical_image_url),
                objectFit: 'cover',
                style: 'border-radius: 4px;',
              }),
            ])
          : h('span', { class: 'empty-text' }, '无')
      },
    },
    {
      title: '实物图片2', key: 'physical_image_url2', width: 100, align: 'center',
      render(row) {
        return row.physical_image_url2
          ? h('div', { class: 'image-cell' }, [
              h(NImage, {
                width: 40, height: 40,
                src: getImageUrlForDisplay(row.physical_image_url2),
                objectFit: 'cover',
                style: 'border-radius: 4px;',
              }),
            ])
          : h('span', { class: 'empty-text' }, '无')
      },
    },
    {
      title: '处置方式', key: 'disposal_method', width: 100, ellipsis: { tooltip: true }, sorter: true,
      render(row) {
        return row.disposal_method || '—'
      },
    },
    {
      title: '来源说明', key: 'source_description', minWidth: 120, ellipsis: { tooltip: true }, sorter: true,
      render(row) {
        return row.source_description || '—'
      },
    },
    {
      title: '技术鉴定', key: 'technical_appraisal', minWidth: 120, ellipsis: { tooltip: true }, sorter: true,
      render(row) {
        return row.technical_appraisal || '—'
      },
    },
    {
      title: '更新时间', key: 'updated_at', width: 160, sorter: true,
      render(row) {
        return row.updated_at
          ? h('span', { class: 'time-text' }, formatDateTime(row.updated_at))
          : h('span', { class: 'empty-text' }, '—')
      },
    },
  ]

  if (canEdit.value) {
    cols.push({
      title: '操作', key: 'actions', width: 180, fixed: 'right', align: 'center',
      render(row) {
        return h('div', { class: 'action-buttons' }, [
          h(NButton, {
            size: 'small', type: 'primary', secondary: true,
            onClick: () => handleEdit(row),
          }, {
            icon: () => h(NIcon, null, { default: () => h(CreateOutline) }),
            default: () => '编辑',
          }),
          h(NButton, {
            size: 'small', type: 'error', secondary: true,
            onClick: () => handleDelete(row),
          }, {
            icon: () => h(NIcon, null, { default: () => h(TrashOutline) }),
            default: () => '删除',
          }),
        ])
      },
    })
  }

  return cols
})

// Dropdown options for export
const exportDropdownOptions = computed(() => [
  { label: `导出选中 (${selectedRows.value.length})`, key: 'selected', disabled: selectedRows.value.length === 0 },
  { label: `导出当前页 (${list.value.length})`, key: 'current', disabled: list.value.length === 0 },
  { label: '全部导出', key: 'all' },
])

function handleExportDropdownSelect(key: string) {
  handleExportExcel(key as 'selected' | 'current' | 'all')
}

// Mobile dropdown options
const mobileDropdownOptions = computed(() => {
  const opts: Array<{ label: string; key: string; disabled?: boolean }> = []
  if (canEdit.value) {
    opts.push(
      { label: `批量删除 (${selectedRows.value.length})`, key: 'batch-delete', disabled: selectedRows.value.length === 0 },
      { label: '批量新增', key: 'batch-import' },
      { label: '批量更新', key: 'batch-update' },
    )
  }
  opts.push(
    { label: '导出选中', key: 'export-selected', disabled: selectedRows.value.length === 0 },
    { label: '导出当前页', key: 'export-current', disabled: list.value.length === 0 },
    { label: '全部导出', key: 'export-all' },
  )
  return opts
})

// 导出 Excel：与表格列严格一致（排除实物图片1、实物图片2、操作）
const MECHANICAL_EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'location_code', label: '货位号' },
  { key: 'mes_material_code', label: 'MES编码' },
  { key: 'specification_model', label: '规格型号' },
  { key: 'drawing_no', label: '图号' },
  {
    key: 'mes_material_desc',
    label: '物料描述',
    formatter: (r) => (r as MechanicalSparePart).mes_material_desc || (r as MechanicalSparePart).physical_material_desc || '—',
  },
  { key: 'applicable_model', label: '适用机型', formatter: (r) => formatApplicableModel((r as MechanicalSparePart).applicable_model) || '—' },
  { key: 'brand', label: '品牌' },
  { key: 'mes_stock', label: 'MES库存' },
  { key: 'physical_stock', label: '修附件库存' },
  { key: 'storage_location', label: '存放地' },
  { key: 'custodian', label: '保管人' },
  { key: 'disposal_method', label: '处置方式' },
  { key: 'source_description', label: '来源说明' },
  { key: 'technical_appraisal', label: '技术鉴定' },
  { key: 'updated_at', label: '更新时间', formatter: (r) => formatDateTime((r as MechanicalSparePart).updated_at) || '—' },
]
type ExportScope = 'selected' | 'current' | 'all'
async function handleExportExcel(scope: ExportScope) {
  exportLoading.value = true
  try {
    let items: MechanicalSparePart[] = []
    if (scope === 'selected') {
      items = selectedRows.value
      if (items.length === 0) {
        window.$message?.warning('请先勾选要导出的记录')
        return
      }
    } else if (scope === 'current') {
      items = [...list.value]
      if (items.length === 0) {
        window.$message?.warning('当前页无数据可导出')
        return
      }
    } else {
      const res = (await mechanicalSparePartApi.getList({
        skip: 0,
        limit: 1000,
        keyword: searchKeyword.value || undefined,
        brand: filterBrand.value || undefined,
        applicable_model: filterApplicableModel.value || undefined,
        storage_location: filterStorageLocation.value || undefined,
        location_prefix: filterLocationPrefix.value || undefined,
        stock_alert: stockAlertFilter.value || undefined,
      })) as { items?: MechanicalSparePart[] }
      items = res?.items ?? []
      if (items.length === 0) {
        window.$message?.warning('当前筛选条件下无数据可导出')
        return
      }
    }
    const date = new Date().toISOString().slice(0, 10)
    exportToExcel(items, MECHANICAL_EXPORT_COLUMNS, `机械修复件列表_${date}`)
    window.$message?.success(`已导出 ${items.length} 条记录`)
  } catch (e: any) {
    window.$message?.error(e?.message || '导出失败')
  } finally {
    exportLoading.value = false
  }
}

// 移动端菜单命令
function handleMobileMenuCommand(command: string) {
  if (command === 'batch-delete') handleBatchDelete()
  else if (command === 'batch-import') handleBatchImport()
  else if (command === 'batch-update') handleBatchUpdate()
  else if (command === 'export-selected') handleExportExcel('selected')
  else if (command === 'export-current') handleExportExcel('current')
  else if (command === 'export-all') handleExportExcel('all')
}

function scheduleAfterPaint(fn: () => void) {
  if (typeof requestIdleCallback !== 'undefined') requestIdleCallback(fn, { timeout: 120 })
  else setTimeout(fn, 0)
}
onMounted(() => {
  navLog('MechanicalSparePartList mounted', {})
  scheduleAfterPaint(() => {
    navLog('MechanicalSparePartList scheduleAfterPaint running', {})
    loadFilterOptions()
    loadData()
  })
})
onActivated(() => {
  navLog('MechanicalSparePartList activated', {})
})
onDeactivated(() => {
  mobileSearchDrawer.value = false
})

// 移动端：IntersectionObserver 监听滚动加载更多
let observer: IntersectionObserver | null = null
function setupLoadMoreObserver() {
  if (!isMobile.value || !loadMoreSentinel.value) return
  observer?.disconnect()
  observer = new IntersectionObserver(
    (entries) => {
      const e = entries[0]
      if (e?.isIntersecting && listHasMore.value) loadMore()
    },
    { root: null, rootMargin: '100px', threshold: 0.1 }
  )
  observer.observe(loadMoreSentinel.value)
}
watch(
  [loadMoreSentinel, () => list.value.length],
  () => {
    if (isMobile.value && list.value.length > 0) {
      nextTick(setupLoadMoreObserver)
    }
  },
  { immediate: true }
)
onUnmounted(() => {
  observer?.disconnect()
})
</script>

<style scoped lang="scss">
.mechanical-spare-part-list {
  padding: 20px;
  background: var(--sp-content-bg);
  min-height: calc(100vh - 60px);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .header-buttons {
    display: flex;
    gap: 12px;
  }

  h2 {
    margin: 0;
    color: var(--sp-text-primary);
    font-size: var(--sp-text-2xl);
    font-weight: 700;
    letter-spacing: -0.02em;
  }
}

.search-and-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.search-bar {
  flex: 0 0 auto;
  min-width: 280px;
  max-width: 400px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.code-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .code-value {
    font-family: var(--sp-font-mono);
    font-weight: bold;
    color: var(--sp-primary);
  }

  .copy-icon {
    margin-left: 8px;
    cursor: pointer;
    color: var(--sp-text-muted);
    transition: color 0.3s;

    &:hover {
      color: var(--sp-primary);
    }
  }
}

.stock-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .unit-text {
    color: var(--sp-text-muted);
    font-size: 12px;
  }
}

.image-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-text {
  color: var(--sp-text-disabled);
  font-style: italic;
}

.time-text {
  font-size: 12px;
  color: var(--sp-text-muted);
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.pagination-wrap {
  margin-top: 24px;
  padding: 16px 20px;
  background: var(--sp-surface);
  border-radius: var(--sp-radius-lg);
  box-shadow: var(--sp-shadow-sm);
  border: 1px solid var(--sp-border-light);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

// 方案一+方案四：库存提醒横幅与行/卡片高亮
.stock-alert-banner {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  padding: 12px 16px;
  margin-bottom: 14px;
  background: linear-gradient(to right, #fef3c7 0%, #fef9c3 100%);
  border: 1px solid #fcd34d;
  border-radius: var(--sp-radius-lg);
  font-size: var(--sp-text-base);
  color: var(--sp-warning);

  .banner-label { font-weight: 600; }
  .banner-stat strong { margin: 0 2px; }
  .banner-divider { color: var(--sp-warning); margin: 0 4px; }
}

.table-wrapper :deep(.n-data-table-tr.req-row-zero) {
  background-color: #fef2f2 !important;
}
.table-wrapper :deep(.n-data-table-tr.req-row-zero:hover > .n-data-table-td) {
  background-color: #fee2e2 !important;
}
.table-wrapper :deep(.n-data-table-tr.req-row-low) {
  background-color: #fffbeb !important;
}
.table-wrapper :deep(.n-data-table-tr.req-row-low:hover > .n-data-table-td) {
  background-color: #fef3c7 !important;
}

.mech-card.req-card-zero {
  border-left-color: var(--sp-danger);
  background: linear-gradient(to bottom, #fef2f2, #fee2e2);
}
.mech-card.req-card-low {
  border-left-color: var(--sp-warning);
  background: linear-gradient(to bottom, #fffbeb, #fef3c7);
}

// 表格横向滚动容器
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

// 移动端卡片列表
.card-list-wrap {
  margin-bottom: 16px;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.load-more-sentinel {
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  font-size: 13px;
  color: var(--sp-text-muted);
}

.load-more-loading {
  color: var(--sp-primary);
}

.load-more-end {
  color: var(--sp-text-disabled);
}

.mobile-total-tip {
  text-align: center;
  padding: 12px;
  font-size: 13px;
  color: var(--sp-text-muted);
}

.mech-card {
  background: linear-gradient(to bottom, #ffffff, #fafbff);
  border-radius: var(--sp-radius-lg);
  padding: 14px 16px;
  box-shadow: var(--sp-shadow-sm);
  border: 1px solid var(--sp-border-light);
  border-left: 4px solid var(--sp-primary-light);
  transition: box-shadow var(--sp-transition-fast), transform var(--sp-transition-fast);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  tap-highlight-color: transparent;
  touch-action: manipulation;
  user-select: none;

  &:active {
    transform: scale(0.99);
  }

  &.card-selected {
    border-left-color: var(--sp-primary);
    background: linear-gradient(to bottom, var(--sp-primary-light-bg, #eff6ff), #fff);
    box-shadow: 0 2px 12px rgba(37, 99, 235, 0.12);
  }
}

.card-main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.card-content {
  flex: 1;
  min-width: 0;
}

/* 字段标签行样式 */
.card-field-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 5px;
}

.card-field-label {
  flex: 0 0 56px;
  font-size: 11px;
  color: var(--sp-text-muted);
  font-weight: 500;
  padding-top: 2px;
  line-height: 1.4;
  text-align: left;
}

.card-code {
  font-family: var(--sp-font-mono);
  font-size: 14px;
  color: var(--sp-primary);
  font-weight: 600;
  flex: 1;
  word-break: break-all;
}

.card-spec {
  font-size: 13px;
  color: var(--sp-text-primary);
  line-height: 1.4;
  word-break: break-word;
  flex: 1;
}

.card-location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--sp-success);
  flex: 1;
  flex-wrap: wrap;

  .location-icon {
    font-size: 14px;
    flex-shrink: 0;
  }
}

.card-custodian {
  color: var(--sp-text-secondary);
  margin-left: 2px;
}

.card-drawing {
  font-size: 12px;
  color: var(--sp-text-secondary);
  flex: 1;
}

.card-desc {
  font-size: 13px;
  color: var(--sp-text-secondary);
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  flex: 1;
}

.card-stock {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  flex-wrap: wrap;

  .card-stock-tag {
    margin-left: 0;
  }

  .unit-text {
    color: var(--sp-text-muted);
    font-size: 12px;
  }
}

.card-images {
  display: flex;
  gap: 8px;
  flex: 1;
}

/* 搜索抽屉两列布局 */
.filter-row-two {
  display: flex;
  gap: 12px;
  margin-bottom: 0;
  .filter-group-half { flex: 1; min-width: 0; }
}

.card-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

// 响应式调整
@media (max-width: 1200px) {
  .mechanical-spare-part-list {
    padding: 16px;
  }

  .header h2 {
    font-size: var(--sp-text-xl);
  }
}

@media (max-width: 767px) {
  .mechanical-spare-part-list {
    padding: 0 0 16px;
  }

  .header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;

    h2 {
      font-size: var(--sp-text-lg);
      margin: 0;
    }

    .header-buttons {
      justify-content: flex-start;
    }
  }

  .search-and-filter {
    flex-direction: column;
    align-items: stretch;
  }

  .mobile-filter-form .filter-actions {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }

  .search-bar {
    min-width: 0;
    max-width: none;
  }

  .filter-bar {
    flex-direction: column;
  }

  .pagination-wrap {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
