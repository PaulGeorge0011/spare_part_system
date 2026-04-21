<template>
  <div class="mechanical-requisition-page">
    <div class="page-header">
      <h2>机械设备领用</h2>
      <p class="page-desc">
        可按规格型号、MES编码、物料描述、适用机型、品牌、图号、保管人查询；空查询返回全部设备。仅支持领用（扣减设备库存），不可新增、删除。
      </p>
    </div>

    <!-- 最近领用记录：每页最多 3 条，支持翻页 -->
    <n-card v-if="recentRequisitions.length > 0" class="recent-card" :bordered="true">
      <template #header>
        <span>最近领用</span>
      </template>
      <div class="recent-list">
        <div
          v-for="r in recentDisplayList"
          :key="r.id"
          class="recent-item"
        >
          <div class="recent-item-info" @click="applyRecentKeyword(r.mes_material_code)">
            <span class="recent-meta">{{ r.location_code }} · {{ r.mes_material_code || '—' }}</span>
            <span class="recent-spec">{{ r.specification_model || '—' }}</span>
            <span class="recent-qty">×{{ r.quantity }}</span>
            <span class="recent-time">{{ formatRecentTime(r.requisition_at) }}</span>
          </div>
          <n-button
            v-if="canRequisition && (r.unreturned_qty ?? 0) > 0"
            size="small"
            type="warning"
            secondary
            class="recent-return-btn"
            @click.stop="openReturnDialog(r)"
          >
            归还 ({{ r.unreturned_qty }})
          </n-button>
        </div>
      </div>
      <div v-if="recentTotalPages > 1" class="recent-pagination">
        <n-button text size="small" :disabled="recentPage <= 1" @click="recentPage = Math.max(1, recentPage - 1)">
          上一页
        </n-button>
        <span class="recent-page-info">{{ recentPage }} / {{ recentTotalPages }}</span>
        <n-button text size="small" :disabled="recentPage >= recentTotalPages" @click="recentPage = Math.min(recentTotalPages, recentPage + 1)">
          下一页
        </n-button>
      </div>
    </n-card>

    <!-- PC 端：筛选（与电气一致） -->
    <n-card v-if="!isMobile" class="filter-card" :bordered="true">
      <div class="filter-row">
        <span class="filter-label">搜索</span>
        <div class="search-input-wrap">
          <n-input
            v-model:value="searchKeyword"
            placeholder="规格型号、MES编码、物料描述、图号、保管人..."
            clearable
            class="search-input"
            @clear="handleClear"
            @keyup.enter="handleSearch"
          />
          <n-button type="primary" @click="handleSearch" class="search-btn">
            <template #icon><n-icon><SearchOutline /></n-icon></template>
            查询
          </n-button>
        </div>
      </div>
      <div class="filter-row filter-filters">
        <n-select v-model:value="filterSpecificationModel" placeholder="规格型号" clearable filterable style="width: 140px" :options="filterOptions.specification_models.map(b => ({ label: b, value: b }))" @update:value="handleSearch" />
        <n-select v-model:value="filterApplicableModel" placeholder="适用机型" clearable filterable style="width: 140px" :options="filterOptions.applicable_models.map(b => ({ label: b, value: b }))" @update:value="handleSearch" />
        <n-select v-model:value="filterBrand" placeholder="品牌" clearable filterable style="width: 120px" :options="filterOptions.brands.map(b => ({ label: b, value: b }))" @update:value="handleSearch" />
        <n-select v-model:value="filterStorageLocation" placeholder="存放地" clearable filterable style="width: 120px" :options="filterOptions.storage_locations.map(b => ({ label: b, value: b }))" @update:value="handleSearch" />
        <n-select v-model:value="filterLocationPrefix" placeholder="货位号" clearable style="width: 100px" :options="filterOptions.location_prefixes.map(b => ({ label: b, value: b }))" @update:value="handleSearch" />
        <n-button v-if="hasActiveFilters" secondary size="small" @click="clearFilters">清空筛选</n-button>
      </div>
    </n-card>

    <!-- 移动端：顶栏搜索由 App 统一展示，本页只保留抽屉 -->
    <template v-if="isMobile">
      <n-drawer
        v-model:show="mobileSearchDrawer"
        placement="bottom"
        height="82%"
        :close-on-esc="true"
        :mask-closable="true"
        class="mech-requisition-mobile-search-drawer mobile-search-drawer-unified"
        @after-leave="mobileSearchDrawer = false"
      >
        <n-drawer-content title="搜索筛选" closable>
          <div class="mobile-filter-form">
            <div class="filter-group">
              <span class="filter-label">关键词搜索</span>
              <n-input
                v-model:value="searchKeyword"
                placeholder="规格型号、MES编码、图号、保管人..."
                clearable
                @clear="handleClear"
                @keyup.enter="handleSearchAndClose"
              />
            </div>
            <div class="filter-row-two">
              <div class="filter-group filter-group-half">
                <span class="filter-label">规格型号</span>
                <n-select v-model:value="filterSpecificationModel" placeholder="选择规格型号" clearable style="width: 100%" :options="filterOptions.specification_models.map(b => ({ label: b, value: b }))" @update:value="handleSearch" />
              </div>
              <div class="filter-group filter-group-half">
                <span class="filter-label">适用机型</span>
                <n-select v-model:value="filterApplicableModel" placeholder="选择适用机型" clearable style="width: 100%" :options="filterOptions.applicable_models.map(b => ({ label: b, value: b }))" @update:value="handleSearch" />
              </div>
            </div>
            <div class="filter-row-two">
              <div class="filter-group filter-group-half">
                <span class="filter-label">品牌</span>
                <n-select v-model:value="filterBrand" placeholder="选择品牌" clearable style="width: 100%" :options="filterOptions.brands.map(b => ({ label: b, value: b }))" @update:value="handleSearch" />
              </div>
              <div class="filter-group filter-group-half">
                <span class="filter-label">存放地</span>
                <n-select v-model:value="filterStorageLocation" placeholder="选择存放地" clearable style="width: 100%" :options="filterOptions.storage_locations.map(b => ({ label: b, value: b }))" @update:value="handleSearch" />
              </div>
            </div>
            <div class="filter-group">
              <span class="filter-label">货位号前缀</span>
              <n-select v-model:value="filterLocationPrefix" placeholder="选择货位号前缀" clearable style="width: 100%" :options="filterOptions.location_prefixes.map(b => ({ label: b, value: b }))" @update:value="handleSearch" />
            </div>
            <div class="filter-actions">
              <n-button v-if="hasActiveFilters" @click="clearFilters">清空筛选</n-button>
              <n-button type="primary" @click="handleSearchAndClose" style="flex:1">
                <template #icon><n-icon><SearchOutline /></n-icon></template>
                查询
              </n-button>
            </div>
          </div>
        </n-drawer-content>
      </n-drawer>
    </template>

    <n-card v-show="hasSearched" class="table-card" :bordered="true">
      <!-- 移动端：卡片列表 -->
      <template v-if="isMobile">
        <div class="card-list-wrap">
          <n-spin :show="loading && !loadingMore">
            <div class="card-list">
              <div v-for="row in list" :key="row.id" class="req-card" :class="getReqCardStockClass(row)">
                <div class="req-card-field-row">
                  <span class="req-field-label">货位号</span>
                  <n-tag type="info" size="small" class="req-location-tag">{{ row.location_code }}</n-tag>
                </div>
                <div class="req-card-field-row">
                  <span class="req-field-label">MES编码</span>
                  <span class="req-code">{{ row.mes_material_code || '—' }}</span>
                </div>
                <div v-if="row.specification_model" class="req-card-field-row">
                  <span class="req-field-label">规格型号</span>
                  <span class="req-card-spec">{{ row.specification_model }}</span>
                </div>
                <div class="req-card-field-row">
                  <span class="req-field-label">物料描述</span>
                  <span class="req-card-desc">{{ row.mes_material_desc || row.physical_material_desc || '—' }}</span>
                </div>
                <div v-if="row.storage_location || row.custodian" class="req-card-field-row">
                  <span class="req-field-label">存放地</span>
                  <div class="req-card-location">
                    <n-icon v-if="row.storage_location" class="location-icon"><LocationOutline /></n-icon>
                    <span>{{ row.storage_location || '' }}</span>
                    <span v-if="row.custodian" class="req-custodian">保管人：{{ row.custodian }}</span>
                  </div>
                </div>
                <div v-if="row.drawing_no" class="req-card-field-row">
                  <span class="req-field-label">图号</span>
                  <span class="req-card-drawing">{{ row.drawing_no }}</span>
                </div>
                <div v-if="row.brand" class="req-card-field-row">
                  <span class="req-field-label">品牌</span>
                  <n-tag type="primary" size="small">{{ row.brand }}</n-tag>
                </div>
                <div v-if="row.applicable_model" class="req-card-field-row">
                  <span class="req-field-label">适用机型</span>
                  <n-tag type="warning" size="small">{{ formatApplicableModel(row.applicable_model) }}</n-tag>
                </div>
                <div class="req-card-field-row">
                  <span class="req-field-label">库存</span>
                  <div class="req-card-stock-row">
                    <n-tag :type="getStockType(row.mes_stock ?? 0, row.physical_stock ?? 0)" size="small">MES: {{ row.mes_stock ?? 0 }}</n-tag>
                    <n-tag :type="getStockType(row.physical_stock ?? 0, row.mes_stock ?? 0)" size="small">库存: {{ row.physical_stock ?? 0 }}</n-tag>
                    <span class="unit-text">{{ row.unit || '个' }}</span>
                  </div>
                </div>
                <div v-if="row.physical_image_url || row.physical_image_url2" class="req-card-field-row req-card-images-row">
                  <span class="req-field-label">图片</span>
                  <div class="req-card-images">
                    <n-image
                      v-if="row.physical_image_url"
                      width="48"
                      height="48"
                      style="border-radius: 6px;"
                      :src="getImageUrlForDisplay(row.physical_image_url)"
                      object-fit="cover"
                    />
                    <n-image
                      v-if="row.physical_image_url2"
                      width="48"
                      height="48"
                      style="border-radius: 6px;"
                      :src="getImageUrlForDisplay(row.physical_image_url2)"
                      object-fit="cover"
                    />
                  </div>
                </div>
                <n-button
                  v-if="canRequisition"
                  type="primary"
                  size="small"
                  :disabled="(row.physical_stock ?? 0) < 1"
                  class="req-card-btn"
                  @click="handleRequisition(row)"
                >
                  领用
                </n-button>
              </div>
            </div>
          </n-spin>
          <div v-if="list.length > 0" ref="loadMoreSentinel" class="load-more-sentinel">
            <div v-if="loadingMore" class="load-more-loading">加载中...</div>
            <div v-else-if="reqHasMore" class="load-more-hint">下滑加载更多</div>
            <div v-else class="load-more-end">— 没有更多了 —</div>
          </div>
        </div>
        <div v-if="!loading && list.length > 0" class="mobile-total-tip">共 {{ total }} 条</div>
        <div v-if="!loading && list.length === 0" class="empty-tip">暂无匹配设备</div>
      </template>

      <!-- PC 端：表格 -->
      <template v-else>
        <div class="table-scroll-wrap">
          <n-data-table
            :loading="loading"
            :columns="tableColumns"
            :data="list"
            :bordered="true"
            :striped="true"
            :row-key="(row: MechanicalSparePart) => row.id"
            :row-class-name="getRequisitionRowClassName"
          />
        </div>
        <div v-if="!loading && list.length === 0" class="empty-tip">暂无匹配设备</div>
        <div v-if="!loading && list.length > 0" class="pagination-wrap">
          <n-pagination
            v-model:page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            :item-count="total"
            show-size-picker
            @update:page="loadData"
            @update:page-size="handlePageSizeChange"
          />
        </div>
      </template>
    </n-card>

    <n-card v-if="!hasSearched" class="empty-card" :bordered="true">
      <n-empty :size="120">
        <template #default>
          <p class="empty-desc">输入关键词或选择筛选条件，或直接点击查询查看全部设备</p>
        </template>
      </n-empty>
    </n-card>

    <MechanicalRequisitionDialog
      v-model="requisitionDialogVisible"
      :row="requisitionRow"
      @success="onRequisitionSuccess"
    />

    <!-- 归还弹窗 -->
    <n-modal
      v-model:show="returnDialogVisible"
      preset="card"
      title="归还备件"
      :style="{ width: isMobile ? '92%' : '400px' }"
      @after-leave="returnRemark = ''; returnQty = 1"
    >
      <div v-if="returnTarget" class="return-dialog-body">
        <p class="return-dialog-info">
          <span class="return-label">备件：</span>
          <span>{{ returnTarget.location_code }} · {{ returnTarget.mes_material_code || '—' }}</span>
        </p>
        <p class="return-dialog-info">
          <span class="return-label">规格型号：</span>
          <span>{{ returnTarget.specification_model || '—' }}</span>
        </p>
        <p class="return-dialog-info">
          <span class="return-label">可归还数量：</span>
          <strong class="return-max">{{ returnTarget.unreturned_qty ?? 0 }}</strong>
        </p>
        <n-form label-width="80" class="return-form">
          <n-form-item label="归还数量">
            <n-input-number
              v-model:value="returnQty"
              :min="1"
              :max="returnTarget.unreturned_qty ?? 1"
              :step="1"
              style="width: 100%"
            />
          </n-form-item>
          <n-form-item label="备注">
            <n-input v-model:value="returnRemark" placeholder="选填" :maxlength="200" show-count clearable />
          </n-form-item>
        </n-form>
      </div>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <n-button @click="returnDialogVisible = false">取消</n-button>
          <n-button type="warning" :loading="returning" @click="submitReturn">确认归还</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
// 定义组件名称，用于 keep-alive 缓存
defineOptions({
  name: 'MechanicalSparePartRequisition'
})

import { ref, h, computed, onMounted, onActivated, onDeactivated, watch, inject, nextTick, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  NButton, NIcon, NInput, NInputNumber, NSelect, NTag, NCard,
  NDataTable, NPagination, NDrawer, NDrawerContent, NModal,
  NForm, NFormItem, NEmpty, NSpin, NImage,
  type DataTableColumns,
} from 'naive-ui'
import { SearchOutline, CopyOutline, LocationOutline } from '@vicons/ionicons5'
import MechanicalRequisitionDialog from '@/components/MechanicalRequisitionDialog.vue'
import { mechanicalSparePartApi } from '@/api/mechanicalSparePart'
import type { MechanicalSparePart, MechanicalSparePartFilterOptions } from '@/types/mechanicalSparePart'
import { useIsMobile } from '@/composables/useIsMobile'
import { scrollMainToTop } from '@/composables/useScrollMainToTop'
import { useDataRefresh } from '@/composables/useDataRefresh'
import { useMechanicalSparePartDataChanged } from '@/composables/useMechanicalSparePartDataChanged'
import { getImageUrlForDisplay } from '@/utils/image'
import { useAuthStore } from '@/stores/auth'
import { navLog, navLogStart } from '@/utils/navLog'

const route = useRoute()
const { isMobile } = useIsMobile()
const authStore = useAuthStore()
const canEdit = computed(() => authStore.canAccessModule('mechanical', 'editor'))
/** 领用员或有编辑权限者均可进行领用/归还操作 */
const canRequisition = computed(() => canEdit.value || authStore.isMechanicalClerk)
useDataRefresh(loadData)
useMechanicalSparePartDataChanged(loadData)
const mobileSearchDrawer = ref(false)
const openMobileSearch = inject<{ value: boolean }>('openMobileSearch')
if (openMobileSearch) {
  watch(() => openMobileSearch.value, (v) => {
    if (v && route.path === '/mechanical/requisition') {
      mobileSearchDrawer.value = true
      openMobileSearch.value = false
    }
  })
}
const searchKeyword = ref('')
const filterSpecificationModel = ref<string | null>(null)
const filterApplicableModel = ref<string | null>(null)
const filterBrand = ref<string | null>(null)
const filterStorageLocation = ref<string | null>(null)
const filterLocationPrefix = ref<string | null>(null)
const filterOptions = ref<{
  specification_models: string[]
  applicable_models: string[]
  brands: string[]
  storage_locations: string[]
  location_prefixes: string[]
}>({
  specification_models: [],
  applicable_models: [],
  brands: [],
  storage_locations: [],
  location_prefixes: [],
})
const hasActiveFilters = computed(
  () =>
    !!(filterSpecificationModel.value || filterApplicableModel.value || filterBrand.value || filterStorageLocation.value || filterLocationPrefix.value)
)
const currentPage = ref(1)
const pageSize = ref(20)
const list = ref<MechanicalSparePart[]>([])
const total = ref(0)
const loading = ref(false)
const loadingMore = ref(false)
const loadMoreSentinel = ref<HTMLElement | null>(null)
const hasSearched = ref(false)
const reqHasMore = computed(
  () => list.value.length < total.value && !loadingMore.value && !loading.value
)
const stockAlertFilter = ref<'zero' | 'low' | ''>('')
const zeroCount = ref(0)
const lowCount = ref(0)
const requisitionDialogVisible = ref(false)
const requisitionRow = ref<MechanicalSparePart | null>(null)

// 归还功能
type RecentItem = { id: number; requisition_at: string; quantity: number; mechanical_spare_part_id: number; mes_material_code?: string; specification_model?: string; location_code?: string; unreturned_qty?: number }
const returnDialogVisible = ref(false)
const returnTarget = ref<RecentItem | null>(null)
const returnQty = ref(1)
const returnRemark = ref('')
const returning = ref(false)

function openReturnDialog(item: RecentItem) {
  returnTarget.value = item
  returnQty.value = Math.min(1, item.unreturned_qty ?? 1)
  returnRemark.value = ''
  returnDialogVisible.value = true
}

async function submitReturn() {
  if (!returnTarget.value) return
  const maxQty = returnTarget.value.unreturned_qty ?? 0
  if (returnQty.value <= 0 || returnQty.value > maxQty) {
    window.$message?.warning(`归还数量须在 1 ~ ${maxQty} 之间`)
    return
  }
  returning.value = true
  try {
    await mechanicalSparePartApi.returnPart(returnTarget.value.mechanical_spare_part_id, returnQty.value, returnRemark.value || undefined)
    window.$message?.success('归还成功')
    returnDialogVisible.value = false
    loadData()
    loadRecentRequisition()
  } catch (e: any) {
    const detail = e?.response?.data?.detail
    window.$message?.error(typeof detail === 'string' ? detail : '归还失败，请重试')
  } finally {
    returning.value = false
  }
}

const RECENT_PAGE_SIZE = 3
const recentRequisitions = ref<RecentItem[]>([])
const recentPage = ref(1)
const recentDisplayList = computed(() => {
  const list = recentRequisitions.value
  const total = list.length
  if (total === 0) return []
  const start = (recentPage.value - 1) * RECENT_PAGE_SIZE
  return list.slice(start, start + RECENT_PAGE_SIZE)
})
const recentTotalPages = computed(() => Math.max(1, Math.ceil(recentRequisitions.value.length / RECENT_PAGE_SIZE)))

const skip = computed(() => (currentPage.value - 1) * pageSize.value)

function formatApplicableModel(v: string | null | undefined): string {
  if (!v) return '—'
  const s = String(v).trim()
  return s.length > 20 ? s.slice(0, 20) + '…' : s
}

function copyToClipboard(text: string) {
  const t = String(text || '').trim()
  if (!t) return
  navigator.clipboard.writeText(t).then(() => window.$message?.success('已复制')).catch(() => {})
}

async function loadFilterOptions() {
  try {
    const res = await mechanicalSparePartApi.getFilterOptions() as MechanicalSparePartFilterOptions
    if (res?.brands) filterOptions.value.brands = res.brands
    if (res?.applicable_models) filterOptions.value.applicable_models = res.applicable_models
    if (res?.specification_models) filterOptions.value.specification_models = res.specification_models ?? []
    if (res?.storage_locations) filterOptions.value.storage_locations = res.storage_locations ?? []
    if (res?.location_prefixes) filterOptions.value.location_prefixes = res.location_prefixes ?? []
  } catch {
    /* ignore */
  }
}

function formatRecentTime(iso: string) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const now = new Date()
    const diff = (now.getTime() - d.getTime()) / 60000
    if (diff < 1) return '刚刚'
    if (diff < 60) return `${Math.floor(diff)}分钟前`
    if (diff < 1440) return `${Math.floor(diff / 60)}小时前`
    return `${d.getMonth() + 1}/${d.getDate()}`
  } catch {
    return iso.slice(0, 16)
  }
}

function applyRecentKeyword(mesCode: string | undefined) {
  if (mesCode) {
    searchKeyword.value = mesCode
    currentPage.value = 1
    loadData()
  }
}

async function loadRecentRequisition() {
  try {
    const res = await mechanicalSparePartApi.getRecentRequisition(10)
    recentRequisitions.value = res?.items ?? []
    recentPage.value = 1
  } catch {
    recentRequisitions.value = []
    recentPage.value = 1
  }
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

/** 总库存 = MES库存 + 修附件库存 */
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

// n-data-table columns definition
const tableColumns = computed<DataTableColumns<MechanicalSparePart>>(() => {
  const cols: DataTableColumns<MechanicalSparePart> = [
    {
      title: '货位号',
      key: 'location_code',
      width: 100,
      fixed: 'left',
      render(row) {
        return h(NTag, { type: 'info', size: 'small' }, { default: () => row.location_code })
      },
    },
    {
      title: 'MES编码',
      key: 'mes_material_code',
      minWidth: 120,
      ellipsis: { tooltip: true },
      render(row) {
        return h('div', { class: 'code-cell' }, [
          row.mes_material_code
            ? h(NIcon, {
                class: 'copy-icon',
                onClick: (e: Event) => { e.stopPropagation(); copyToClipboard(row.mes_material_code!) },
              }, { default: () => h(CopyOutline) })
            : null,
          h('span', { class: 'code-value' }, row.mes_material_code || '—'),
        ])
      },
    },
    {
      title: '规格型号',
      key: 'specification_model',
      minWidth: 120,
      ellipsis: { tooltip: true },
      render(row) {
        return h('div', { class: 'code-cell' }, [
          row.specification_model
            ? h(NIcon, {
                class: 'copy-icon',
                onClick: (e: Event) => { e.stopPropagation(); copyToClipboard(row.specification_model!) },
              }, { default: () => h(CopyOutline) })
            : null,
          h('span', { class: 'code-value' }, row.specification_model || '—'),
        ])
      },
    },
    {
      title: '图号',
      key: 'drawing_no',
      width: 100,
      ellipsis: { tooltip: true },
    },
    {
      title: '物料描述',
      key: 'material_desc',
      minWidth: 160,
      ellipsis: { tooltip: true },
      render(row) {
        return row.mes_material_desc || row.physical_material_desc || '—'
      },
    },
    {
      title: '适用机型',
      key: 'applicable_model',
      width: 120,
      ellipsis: { tooltip: true },
      render(row) {
        if (row.applicable_model) {
          return h(NTag, { type: 'warning', size: 'small' }, { default: () => formatApplicableModel(row.applicable_model) })
        }
        return h('span', null, '—')
      },
    },
    {
      title: '品牌',
      key: 'brand',
      width: 100,
      ellipsis: { tooltip: true },
      render(row) {
        if (row.brand) {
          return h(NTag, { type: 'primary', size: 'small' }, { default: () => row.brand })
        }
        return h('span', null, '—')
      },
    },
    {
      title: '实物图片1',
      key: 'physical_image_url',
      width: 100,
      align: 'center',
      render(row) {
        if (row.physical_image_url) {
          return h('div', { class: 'image-cell' }, [
            h(NImage, {
              width: 40,
              height: 40,
              style: 'border-radius: 4px;',
              src: getImageUrlForDisplay(row.physical_image_url),
              objectFit: 'cover',
            }),
          ])
        }
        return h('span', { class: 'empty-text' }, '—')
      },
    },
    {
      title: '实物图片2',
      key: 'physical_image_url2',
      width: 100,
      align: 'center',
      render(row) {
        if (row.physical_image_url2) {
          return h('div', { class: 'image-cell' }, [
            h(NImage, {
              width: 40,
              height: 40,
              style: 'border-radius: 4px;',
              src: getImageUrlForDisplay(row.physical_image_url2),
              objectFit: 'cover',
            }),
          ])
        }
        return h('span', { class: 'empty-text' }, '—')
      },
    },
    {
      title: 'MES库存',
      key: 'mes_stock',
      width: 100,
      render(row) {
        return h('div', { class: 'stock-cell' }, [
          h(NTag, { type: getStockType(row.mes_stock ?? 0, row.physical_stock ?? 0), size: 'small' }, { default: () => String(row.mes_stock ?? 0) }),
          h('span', { class: 'unit-text' }, row.unit || '个'),
        ])
      },
    },
    {
      title: '修附件库存',
      key: 'physical_stock',
      width: 110,
      render(row) {
        return h('div', { class: 'stock-cell' }, [
          h(NTag, { type: getStockType(row.physical_stock ?? 0, row.mes_stock ?? 0), size: 'small' }, { default: () => String(row.physical_stock ?? 0) }),
          h('span', { class: 'unit-text' }, row.unit || '个'),
        ])
      },
    },
    {
      title: '存放地',
      key: 'storage_location',
      width: 120,
      ellipsis: { tooltip: true },
      render(row) {
        if (row.storage_location) {
          return h(NTag, { type: 'success', size: 'small' }, { default: () => row.storage_location })
        }
        return h('span', null, '—')
      },
    },
    {
      title: '保管人',
      key: 'custodian',
      width: 90,
      ellipsis: { tooltip: true },
      render(row) {
        return row.custodian || '—'
      },
    },
  ]

  if (canRequisition.value) {
    cols.push({
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render(row) {
        return h(NButton, {
          type: 'primary',
          size: 'small',
          disabled: (row.physical_stock ?? 0) < 1,
          onClick: () => handleRequisition(row),
        }, { default: () => '领用' })
      },
    })
  }

  return cols
})

async function loadData(append = false) {
  const t = navLogStart()
  navLog('MechanicalSparePartRequisition loadData start', { append })
  if (append) {
    loadingMore.value = true
  } else {
    loading.value = true
  }
  hasSearched.value = true
  try {
    const skipVal = append ? list.value.length : skip.value
    const res = (await mechanicalSparePartApi.requisitionSearch({
      keyword: searchKeyword.value?.trim() || undefined,
      skip: skipVal,
      limit: pageSize.value,
      brand: filterBrand.value || undefined,
      applicable_model: filterApplicableModel.value || undefined,
      specification_model: filterSpecificationModel.value || undefined,
      storage_location: filterStorageLocation.value || undefined,
      location_prefix: filterLocationPrefix.value || undefined,
      stock_alert: stockAlertFilter.value || undefined,
    })) as { items?: MechanicalSparePart[]; total?: number; zero_count?: number; low_count?: number }
    const newItems = res?.items ?? []
    const totalCount = typeof res?.total === 'number' ? res.total : newItems.length
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
      zeroCount.value = 0
      lowCount.value = 0
    }
  } finally {
    loading.value = false
    loadingMore.value = false
    navLog('MechanicalSparePartRequisition loadData end', { append }, t)
  }
}

async function loadMore() {
  if (!reqHasMore.value || loadingMore.value) return
  await loadData(true)
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

function handlePageSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
  loadData()
}

function clearFilters() {
  filterSpecificationModel.value = null
  filterApplicableModel.value = null
  filterBrand.value = null
  filterStorageLocation.value = null
  filterLocationPrefix.value = null
  searchKeyword.value = ''
  stockAlertFilter.value = ''
  zeroCount.value = 0
  lowCount.value = 0
  currentPage.value = 1
  loadData()
}

function handleClear() {
  searchKeyword.value = ''
  currentPage.value = 1
  loadData()
}

function handleRequisition(row: MechanicalSparePart) {
  requisitionRow.value = row
  requisitionDialogVisible.value = true
}

function onRequisitionSuccess() {
  loadData()
  loadRecentRequisition()
}

function scheduleAfterPaint(fn: () => void) {
  if (typeof requestIdleCallback !== 'undefined') requestIdleCallback(fn, { timeout: 120 })
  else setTimeout(fn, 0)
}
onMounted(() => {
  navLog('MechanicalSparePartRequisition mounted', {})
  scheduleAfterPaint(async () => {
    await loadFilterOptions()
    loadRecentRequisition()
    if (authStore.isMechanicalClerk || authStore.isElectricalClerk || authStore.canManageSystem || authStore.canAccessModule('mechanical', 'admin')) handleSearch()
  })
})
onActivated(() => {
  navLog('MechanicalSparePartRequisition activated', {})
  loadRecentRequisition()
})
onDeactivated(() => {
  mobileSearchDrawer.value = false
})

// 移动端：IntersectionObserver 监听滚动加载更多（与电气领用/电气修复件一致）
let observer: IntersectionObserver | null = null
function setupLoadMoreObserver() {
  if (!isMobile.value || !loadMoreSentinel.value) return
  observer?.disconnect()
  observer = new IntersectionObserver(
    (entries) => {
      const e = entries[0]
      if (e?.isIntersecting && reqHasMore.value) loadMore()
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

<style scoped>
.mechanical-requisition-page {
  padding: 20px;
  background: var(--sp-content-bg);
  min-height: calc(100vh - 60px);
}
.page-header {
  margin-bottom: 20px;
}
.page-header h2 {
  margin: 0 0 8px;
  font-size: var(--sp-text-2xl);
  font-weight: 700;
  letter-spacing: -0.02em;
}
.page-desc {
  margin: 0;
  font-size: 14px;
  color: var(--sp-text-secondary);
}
.filter-card {
  margin-bottom: 16px;
  border-radius: var(--sp-radius-lg);
  border: 1px solid var(--sp-border-color, rgba(0, 0, 0, 0.09));
}
.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.filter-row.filter-filters {
  margin-top: 12px;
  flex-wrap: wrap;
}
.filter-label {
  font-size: 14px;
  color: var(--sp-text-secondary);
  white-space: nowrap;
}
.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  max-width: 400px;
}
.recent-card {
  margin-bottom: 16px;
  border-radius: var(--sp-radius-lg);
  border: 1px solid var(--sp-border-color, rgba(0, 0, 0, 0.09));
}
.table-scroll-wrap :deep(.n-data-table-tr.req-row-zero) {
  background-color: #fef2f2 !important;
}
.table-scroll-wrap :deep(.n-data-table-tr.req-row-zero:hover > .n-data-table-td) {
  background-color: #fee2e2 !important;
}
.table-scroll-wrap :deep(.n-data-table-tr.req-row-low) {
  background-color: #fffbeb !important;
}
.table-scroll-wrap :deep(.n-data-table-tr.req-row-low:hover > .n-data-table-td) {
  background-color: #fef3c7 !important;
}
.req-card.req-card-zero {
  border-left: 4px solid var(--sp-danger, #d03050);
  background: linear-gradient(to bottom, #fef2f2, #fee2e2) !important;
}
.req-card.req-card-low {
  border-left: 4px solid var(--sp-warning, #f0a020);
  background: linear-gradient(to bottom, #fffbeb, #fef3c7) !important;
}
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.recent-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px 0 4px;
  margin-top: 4px;
  border-top: 1px solid var(--sp-border-color, rgba(0, 0, 0, 0.09));
}
.recent-page-info {
  font-size: 12px;
  color: var(--sp-text-secondary);
  min-width: 48px;
  text-align: center;
}
.recent-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  transition: background 0.15s;
}
.recent-item:hover {
  background: var(--sp-fill-light, rgba(0, 0, 0, 0.04));
}
.recent-item-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  cursor: pointer;
}
.recent-return-btn {
  flex-shrink: 0;
}

/* 归还弹窗 */
.return-dialog-body { padding: 4px 0; }
.return-dialog-info {
  margin: 0 0 10px;
  font-size: 14px;
  color: var(--sp-text-primary);
  display: flex;
  align-items: baseline;
  gap: 4px;
  .return-label { color: var(--sp-text-muted); font-size: 13px; white-space: nowrap; }
  .return-max { color: var(--sp-warning); font-size: 16px; font-weight: 600; }
}
.return-form { margin-top: 12px; }
.recent-meta {
  font-size: 13px;
  color: var(--sp-text-primary);
  font-family: var(--sp-font-mono);
}
.recent-spec {
  font-size: 12px;
  color: var(--sp-text-secondary);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.recent-qty {
  font-size: 12px;
  color: var(--sp-primary);
}
.recent-time {
  font-size: 11px;
  color: var(--sp-text-secondary);
}
.empty-card {
  margin-top: 16px;
  border-radius: var(--sp-radius-lg);
  border: 1px dashed var(--sp-border-color, rgba(0, 0, 0, 0.09));
  background: linear-gradient(to bottom, #fafbfc, #fff);
}
.empty-desc {
  margin: 0;
  font-size: 14px;
  color: var(--sp-text-secondary);
}

@media (max-width: 767px) {
  .mechanical-requisition-page {
    padding: 0 0 16px;
  }
  .page-header {
    margin-bottom: 16px;
  }
  .page-header h2 {
    font-size: 18px;
  }
  .page-desc {
    font-size: 13px;
  }
  .search-input-wrap {
    max-width: none;
    width: 100%;
  }
  .req-card-list {
    gap: 14px;
  }
  /* 移动端：避免 iframe 内裁切卡片边框，改由 body 做圆角裁剪 */
  .table-card {
    overflow: visible;
    :deep(.n-card__content) {
      padding: 0;
      overflow: hidden;
      border-radius: var(--sp-radius-lg);
    }
  }
}
.search-input {
  flex: 1;
}
.pagination-wrap {
  margin-top: 16px;
}
.table-scroll-wrap {
  overflow-x: auto;
}
.code-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}
.code-cell .code-value {
  flex: 1;
  min-width: 0;
}
.copy-icon {
  cursor: pointer;
  color: var(--sp-primary);
}
.unit-text {
  margin-left: 4px;
  font-size: 12px;
  color: var(--sp-text-secondary);
}
.stock-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}
.image-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.empty-text {
  font-size: 13px;
  color: var(--sp-text-disabled, rgba(0, 0, 0, 0.3));
}
.req-card-stock .req-stock-tag {
  margin-left: 6px;
}
.empty-tip {
  text-align: center;
  padding: 24px;
  color: var(--sp-text-secondary);
}

/* 移动端卡片 */
.card-list-wrap {
  margin-bottom: 12px;
  /* 留出安全区，避免卡片边框在 iframe 内被裁切 */
  padding: 0 2px;
}
.card-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.req-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: var(--sp-radius-xl);
  padding: 18px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-left: 4px solid var(--sp-success, #18a058);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.req-card:active {
  transform: scale(0.99);
}
/* 字段标签行样式 */
.req-card-field-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
.req-field-label {
  flex: 0 0 60px;
  font-size: 12px;
  color: var(--sp-text-muted);
  font-weight: 500;
  padding-top: 2px;
  line-height: 1.4;
  text-align: left;
}
.req-card-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.req-location-tag {
  flex-shrink: 0;
}
.req-code {
  font-family: var(--sp-font-mono);
  font-size: 14px;
  color: var(--sp-primary);
  font-weight: 600;
  word-break: break-all;
  flex: 1;
}
.req-card-spec {
  font-size: 13px;
  color: var(--sp-text-primary);
  line-height: 1.4;
  word-break: break-word;
  flex: 1;
}
.req-card-desc {
  font-size: 14px;
  color: var(--sp-text-primary);
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  flex: 1;
}
.req-card-location {
  font-size: 12px;
  color: var(--sp-success);
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  flex-wrap: wrap;
}
.req-card-location .location-icon {
  font-size: 14px;
  flex-shrink: 0;
}
.req-custodian {
  color: var(--sp-text-secondary);
  margin-left: 4px;
}
.req-card-drawing {
  font-size: 13px;
  color: var(--sp-text-secondary);
  flex: 1;
}
.req-card-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  flex: 1;
}
.req-card-stock-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  flex-wrap: wrap;
}
.req-card-images {
  display: flex;
  gap: 8px;
  flex: 1;
}
.req-drawing { font-size: 12px; color: var(--sp-text-secondary); }
/* 搜索抽屉两列布局 */
.filter-row-two {
  display: flex;
  gap: 12px;
  .filter-group-half { flex: 1; min-width: 0; }
}
.req-card-physical-image {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}
.req-card-physical-image-empty {
  font-size: 13px;
  color: var(--sp-text-disabled, rgba(0, 0, 0, 0.3));
}
.req-card-stock {
  font-size: 12px;
  color: var(--sp-text-muted);
  margin-bottom: 10px;
}
.req-card-btn {
  width: 100%;
  font-weight: 600;
  padding: 10px 16px;
  border-radius: 8px;
}
.load-more-sentinel {
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  font-size: 13px;
  color: var(--sp-text-secondary);
}
.load-more-loading {
  color: var(--sp-primary);
}
.load-more-end {
  color: var(--sp-text-disabled, rgba(0, 0, 0, 0.3));
}
.mobile-total-tip {
  text-align: center;
  font-size: 13px;
  color: var(--sp-text-secondary);
  padding: 8px 0;
}
.mobile-filter-form .filter-group {
  margin-bottom: 16px;
}
.mobile-filter-form .filter-label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: var(--sp-text-secondary);
}
.mobile-filter-form .filter-actions {
  margin-top: 16px;
}
</style>
