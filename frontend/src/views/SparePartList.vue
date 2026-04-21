<template>
  <div class="spare-part-list">
    <div class="header">
      <h2>制丝二设备管理</h2>
      <div class="header-buttons">
        <!-- PC 端：全部按钮 -->
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
            <n-button type="warning" @click="handleBatchImageImport">
              <template #icon><n-icon><ImageOutline /></n-icon></template>
              批量导入图片
            </n-button>
            <n-button type="primary" @click="handleCreate">
              <template #icon><n-icon><AddOutline /></n-icon></template>
              新增设备
            </n-button>
          </template>
          <n-dropdown trigger="click" :options="exportDropdownOptions" @select="handleExportDropdownSelect">
            <n-button type="info" :loading="exportLoading">
              导出 Excel
              <template #icon><n-icon><ChevronDownOutline /></n-icon></template>
            </n-button>
          </n-dropdown>
        </template>
        <!-- 移动端：主要操作 + 下拉更多 -->
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

    <!-- PC 端：搜索栏 + 过滤器 -->
    <div v-if="!isMobile" class="search-and-filter">
      <div class="search-bar">
        <n-input
          v-model:value="searchKeyword"
          placeholder="搜索货位号、MES编码、物料描述、规格型号、品牌..."
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
        <n-select v-model:value="filterUpdatedSince" placeholder="更新时间" clearable style="width: 110px" :options="updatedSinceOptions" @update:value="applyFilters" />
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
        class="spare-part-list-mobile-search-drawer mobile-search-drawer-unified"
        @after-leave="mobileSearchDrawer = false"
      >
        <n-drawer-content title="搜索筛选" closable>
          <div class="mobile-filter-form">
            <div class="filter-group">
              <span class="filter-label">关键词</span>
              <n-input
                v-model:value="searchKeyword"
                placeholder="搜索货位号、MES编码、物料描述、规格型号、品牌..."
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
                <span class="filter-label">更新时间</span>
                <n-select v-model:value="filterUpdatedSince" placeholder="选择更新时间" clearable style="width: 100%" :options="updatedSinceOptions" @update:value="applyFilters" />
              </div>
            </div>
            <div class="filter-group">
              <span class="filter-label">货位号前缀</span>
              <n-select v-model:value="filterLocationPrefix" placeholder="选择货位号前缀" clearable style="width: 100%" :options="filterOptions.location_prefixes.map(b => ({ label: b, value: b }))" @update:value="applyFilters" />
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
    <div v-if="!store.loading && (store.list.length > 0 || store.total > 0)" class="stock-alert-banner">
      <template v-if="stockAlertFilter">
        <span class="banner-label">当前筛选：</span>
        <span>{{ stockAlertFilter === 'zero' ? '零库存' : '低库存' }} 共 {{ store.total }} 条</span>
        <n-button text type="primary" size="small" @click="clearStockAlertFilter">清除库存筛选</n-button>
      </template>
      <template v-else>
        <span class="banner-stat">零库存 <strong>{{ store.zeroCount }}</strong> 条</span>
        <span class="banner-divider">|</span>
        <span class="banner-stat">低库存 <strong>{{ store.lowCount }}</strong> 条</span>
        <n-button v-if="store.zeroCount > 0" text type="error" size="small" @click="setStockAlertFilter('zero')">查看零库存</n-button>
        <n-button v-if="store.lowCount > 0" text type="warning" size="small" @click="setStockAlertFilter('low')">查看低库存</n-button>
      </template>
    </div>

    <!-- 移动端：卡片列表 + 无限滚动 -->
    <div v-if="isMobile" class="card-list-wrap">
      <n-spin :show="store.loading && !store.loadingMore">
      <div class="card-list">
        <div
          v-for="row in store.list"
          :key="row.id"
          class="spare-card"
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
            <div class="card-field-row">
              <span class="card-field-label">物料描述</span>
              <span class="card-desc">{{ row.mes_material_desc || row.physical_material_desc || '—' }}</span>
            </div>
            <div v-if="row.storage_location" class="card-field-row">
              <span class="card-field-label">存放地</span>
              <div class="card-location">
                <n-icon class="location-icon"><LocationOutline /></n-icon>
                <span>{{ row.storage_location }}</span>
              </div>
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
              <span class="stock-info">MES: {{ row.mes_stock ?? 0 }} / 库存: <strong :class="(row.physical_stock ?? 0) > 0 ? 'stock-ok' : 'stock-zero'">{{ row.physical_stock ?? 0 }}</strong> {{ row.unit || '个' }}</span>
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
      <!-- 移动端：滚动加载更多 -->
      <div
        v-if="isMobile && store.list.length > 0"
        ref="loadMoreSentinel"
        class="load-more-sentinel"
      >
        <div v-if="store.loadingMore" class="load-more-loading">加载中...</div>
        <div v-else-if="hasMore" class="load-more-hint">下滑加载更多</div>
        <div v-else class="load-more-end">— 没有更多了 —</div>
      </div>
    </div>

    <!-- PC 端：数据表格 -->
    <div v-else class="table-wrapper">
      <n-spin :show="store.loading">
      <n-data-table
        ref="tableRef"
        :columns="tableColumns"
        :data="store.list"
        :bordered="true"
        :striped="true"
        :row-key="(row: SparePart) => row.id"
        :row-class-name="getRequisitionRowClassName"
        :checked-row-keys="checkedRowKeys"
        @update:checked-row-keys="handleCheckedRowKeysChange"
      />
      </n-spin>
    </div>

    <!-- 分页（移动端隐藏「显示全部」与分页器，改用无限滚动） -->
    <div v-if="!isMobile" class="pagination-wrap">
      <div class="pagination-extra">
        <n-button text type="primary" :disabled="store.loading" @click="handleShowAll">
          显示全部
        </n-button>
        <span class="pagination-tip">（最多 {{ PAGE_SIZE_ALL }} 条/页）</span>
      </div>
      <n-pagination
        v-model:page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="pageSizeOptions"
        :item-count="store.total"
        show-size-picker
        show-quick-jumper
        @update:page="handleCurrentChange"
        @update:page-size="handleSizeChange"
      />
    </div>
    <div v-if="isMobile && store.list.length > 0" class="mobile-total-tip">共 {{ store.total }} 条</div>

    <!-- 表单对话框 -->
    <spare-part-form-dialog
      v-model="dialogVisible"
      :form-data="currentForm"
      :mode="dialogMode"
      @success="handleDialogSuccess"
    />

    <!-- 批量导入对话框 -->
    <BatchImportDialog
      v-model="batchImportDialogVisible"
      @success="handleBatchImportSuccess"
    />
    <!-- 批量更新 MES 库存对话框 -->
    <BatchUpdateDialog
      v-model="batchUpdateDialogVisible"
      type="electrical"
      @success="handleBatchUpdateSuccess"
    />
    <!-- 批量导入图片对话框 -->
    <BatchImageImportDialog
      v-model="batchImageImportDialogVisible"
      :current-page-list="store.list"
      :selected-rows="selectedRows"
      @success="handleBatchImageImportSuccess"
    />
  </div>
</template>

<script setup lang="ts">
// 定义组件名称，用于 keep-alive 缓存
defineOptions({
  name: 'SparePartList'
})

import { ref, h, onMounted, onUnmounted, onActivated, onDeactivated, nextTick, computed, watch, inject } from 'vue';
import { useRoute } from 'vue-router';
import {
  NButton, NIcon, NInput, NSelect, NTag, NCheckbox, NImage,
  NDataTable, NPagination, NDrawer, NDrawerContent, NDropdown, NSpin,
  type DataTableColumns, type DataTableRowKey,
} from 'naive-ui';
import {
  SearchOutline, AddOutline, CopyOutline, CreateOutline, TrashOutline,
  CloudUploadOutline, ImageOutline, ChevronDownOutline, LocationOutline,
} from '@vicons/ionicons5';
import { useSparePartStore } from '@/stores/sparePart';
import { useDataRefresh } from '@/composables/useDataRefresh';
import { useSparePartDataChanged, broadcastSparePartDataChanged } from '@/composables/useSparePartDataChanged';
import SparePartFormDialog from '@/components/SparePartFormDialog.vue';
import BatchImportDialog from '@/components/BatchImportDialog.vue';
import BatchUpdateDialog from '@/components/BatchUpdateDialog.vue';
import BatchImageImportDialog from '@/components/BatchImageImportDialog.vue';
import type { SparePart } from '@/types/sparePart';
import { formatDateTime } from '@/utils/date';
import { exportToExcel, type ExportColumn } from '@/utils/exportExcel';
import { sparePartApi, type SparePartFilterOptions } from '@/api/sparePart';
import { useIsMobile } from '@/composables/useIsMobile';
import { scrollMainToTop } from '@/composables/useScrollMainToTop';
import { getImageUrlForDisplay } from '@/utils/image';
import { navLog, navLogStart } from '@/utils/navLog';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const authStore = useAuthStore();
const canEdit = computed(() => authStore.canAccessModule('electrical', 'editor'));
const store = useSparePartStore();
const { isMobile } = useIsMobile();

// 搜索相关
const searchKeyword = ref('');

// 过滤器
const filterBrand = ref<string | null>(null);
const filterApplicableModel = ref<string | null>(null);
const filterStorageLocation = ref<string | null>(null);
const filterLocationPrefix = ref<string | null>(null);
const filterUpdatedSince = ref<string | null>(null);
const filterOptions = ref<SparePartFilterOptions>({
  brands: [],
  applicable_models: [],
  storage_locations: [],
  location_prefixes: [],
});

const updatedSinceOptions = [
  { label: '1 天', value: '1d' },
  { label: '7 天', value: '7d' },
  { label: '30 天', value: '30d' },
  { label: '半年', value: '6m' },
  { label: '一年', value: '1y' },
];

const hasActiveFilters = computed(() =>
  !!(filterBrand.value || filterApplicableModel.value || filterStorageLocation.value || filterLocationPrefix.value || filterUpdatedSince.value)
);

/** 库存提醒筛选：空=全部，zero=仅零库存，low=仅低库存(总库存=1) */
const stockAlertFilter = ref<'zero' | 'low' | ''>('');

async function loadFilterOptions() {
  try {
    const res = await sparePartApi.getFilterOptions();
    if (res?.brands) filterOptions.value.brands = res.brands;
    if (res?.applicable_models) filterOptions.value.applicable_models = res.applicable_models;
    if (res?.storage_locations) filterOptions.value.storage_locations = res.storage_locations;
    if (res?.location_prefixes) filterOptions.value.location_prefixes = res.location_prefixes;
  } catch {
    // 忽略，下拉留空
  }
}

function applyFilters() {
  currentPage.value = 1;
  loadData();
}

function clearFilters() {
  filterBrand.value = null;
  filterApplicableModel.value = null;
  filterStorageLocation.value = null;
  filterLocationPrefix.value = null;
  filterUpdatedSince.value = null;
  stockAlertFilter.value = '';
  currentPage.value = 1;
  loadData();
}

// 分页相关（与后端 limit 上限一致，用于「显示全部」）
const PAGE_SIZE_ALL = 1000;
const pageSizeOptions = [10, 20, 50, 100, PAGE_SIZE_ALL];
const currentPage = ref(1);
const pageSize = ref(20);

// 移动端：搜索抽屉
const mobileSearchDrawer = ref(false);
const openMobileSearch = inject<{ value: boolean }>('openMobileSearch');
if (openMobileSearch) {
  watch(() => openMobileSearch.value, (v) => {
    if (v && route.path === '/electrical/parts') {
      mobileSearchDrawer.value = true;
      openMobileSearch.value = false;
    }
  });
}

// 对话框相关
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const currentForm = ref<Partial<SparePart>>({});
const batchImportDialogVisible = ref(false);
const batchUpdateDialogVisible = ref(false);
const batchImageImportDialogVisible = ref(false);

// 表格选择相关
const tableRef = ref();
const selectedRows = ref<SparePart[]>([]);
const isBatchDeleting = ref(false);
const exportLoading = ref(false);

// n-data-table checked row keys
const checkedRowKeys = computed(() => selectedRows.value.map(r => r.id));

function handleCheckedRowKeysChange(keys: DataTableRowKey[]) {
  selectedRows.value = store.list.filter(r => keys.includes(r.id));
}

// 计算跳过的记录数
const skip = computed(() => (currentPage.value - 1) * pageSize.value);

// 移动端：是否有更多数据可加载
const hasMore = computed(
  () => store.list.length < store.total && !store.loadingMore && !store.loading
);

const loadMoreSentinel = ref<HTMLElement | null>(null);

// 加载数据（必须在 composable 之前定义，供其使用）
const loadData = async () => {
  const t = navLogStart()
  navLog('SparePartList loadData start', {})
  try {
    await store.fetchList({
      skip: skip.value,
      limit: pageSize.value,
      keyword: searchKeyword.value || undefined,
      brand: filterBrand.value || undefined,
      applicable_model: filterApplicableModel.value || undefined,
      storage_location: filterStorageLocation.value || undefined,
      location_prefix: filterLocationPrefix.value || undefined,
      updated_since: filterUpdatedSince.value || undefined,
      stock_alert: stockAlertFilter.value || undefined,
    });
  } catch (error) {
    window.$message?.error('加载数据失败');
    console.error('[修复件管理] 加载数据失败:', error);
  } finally {
    navLog('SparePartList loadData end', {}, t);
  }
};

/** 总库存 = MES库存 + 修复件库存 */
function totalStock(row: SparePart): number {
  return (row.mes_stock ?? 0) + (row.physical_stock ?? 0);
}
/** 方案一：表格行样式 — 零库存红色、低库存黄色 */
function getRequisitionRowClass({ row }: { row: SparePart }) {
  const t = totalStock(row);
  if (t === 0) return 'req-row-zero';
  if (t === 1) return 'req-row-low';
  return '';
}
// n-data-table row-class-name expects (rowData) => string
function getRequisitionRowClassName(row: SparePart) {
  const t = totalStock(row);
  if (t === 0) return 'req-row-zero';
  if (t === 1) return 'req-row-low';
  return '';
}
/** 方案一：卡片样式 — 零库存/低库存高亮 */
function getReqCardStockClass(row: SparePart): string {
  const t = totalStock(row);
  if (t === 0) return 'req-card-zero';
  if (t === 1) return 'req-card-low';
  return '';
}
function setStockAlertFilter(value: 'zero' | 'low') {
  stockAlertFilter.value = value;
  currentPage.value = 1;
  loadData();
}
function clearStockAlertFilter() {
  stockAlertFilter.value = '';
  currentPage.value = 1;
  loadData();
}

// 移动端：加载更多（追加）
const loadMore = async () => {
  if (!hasMore.value || store.loadingMore) return;
  await store.fetchList(undefined, true);
};

// 必须在 setup 顶层调用，否则 onMounted 内注册的监听器可能不生效（页面一收不到页面二广播）
useDataRefresh(loadData);
useSparePartDataChanged(loadData);

// 首帧后再加载数据，避免页面切换时阻塞渲染导致卡顿
function scheduleAfterPaint(fn: () => void) {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(fn, { timeout: 120 });
  } else {
    setTimeout(fn, 0);
  }
}
onMounted(() => {
  navLog('SparePartList mounted', {});
  scheduleAfterPaint(() => {
    navLog('SparePartList scheduleAfterPaint running', {});
    loadFilterOptions();
    loadData();
  });
});
onActivated(() => {
  navLog('SparePartList activated', {});
});
onDeactivated(() => {
  mobileSearchDrawer.value = false;
});

// 移动端：IntersectionObserver 监听滚动加载更多
let observer: IntersectionObserver | null = null;
function setupLoadMoreObserver() {
  if (!isMobile.value || !loadMoreSentinel.value) return;
  observer?.disconnect();
  observer = new IntersectionObserver(
    (entries) => {
      const e = entries[0];
      if (e?.isIntersecting && hasMore.value) loadMore();
    },
    { root: null, rootMargin: '100px', threshold: 0.1 }
  );
  observer.observe(loadMoreSentinel.value);
}
watch(
  [loadMoreSentinel, () => store.list.length],
  () => {
    if (isMobile.value && store.list.length > 0) {
      nextTick(setupLoadMoreObserver);
    }
  },
  { immediate: true }
);
onUnmounted(() => {
  observer?.disconnect();
});

// n-data-table columns
const tableColumns = computed<DataTableColumns<SparePart>>(() => {
  const cols: DataTableColumns<SparePart> = [
    { type: 'selection', fixed: 'left', width: 55 },
    {
      title: '货位号', key: 'location_code', width: 100, fixed: 'left', sorter: true,
      render(row) {
        return h(NTag, { type: 'info', size: 'small' }, { default: () => row.location_code });
      },
    },
    {
      title: 'MES物料编码', key: 'mes_material_code', minWidth: 220, fixed: 'left', sorter: true,
      render(row) {
        return h('div', { class: 'code-cell' }, [
          row.mes_material_code
            ? h(NIcon, { class: 'copy-icon', onClick: () => copyToClipboard(row.mes_material_code!) }, { default: () => h(CopyOutline) })
            : null,
          h('span', { class: 'code-value' }, row.mes_material_code || ''),
        ]);
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
        ]);
      },
    },
    { title: 'MES物料描述', key: 'mes_material_desc', minWidth: 200, ellipsis: { tooltip: true }, sorter: true },
    { title: '实物物料描述', key: 'physical_material_desc', minWidth: 250, ellipsis: { tooltip: true }, sorter: true },
    {
      title: '适用机型', key: 'applicable_model', width: 150, ellipsis: { tooltip: true }, sorter: true,
      render(row) {
        return row.applicable_model
          ? h(NTag, { type: 'warning', size: 'small' }, { default: () => formatApplicableModel(row.applicable_model!) })
          : null;
      },
    },
    {
      title: '品牌', key: 'brand', width: 120, ellipsis: { tooltip: true }, sorter: true,
      render(row) {
        return row.brand
          ? h(NTag, { type: 'primary', size: 'small' }, { default: () => row.brand })
          : null;
      },
    },
    {
      title: 'MES库存', key: 'mes_stock', width: 120, sorter: true,
      render(row) {
        return h('div', { class: 'stock-cell' }, [
          h(NTag, { type: getStockType(row.mes_stock, row.physical_stock), size: 'small' }, { default: () => String(row.mes_stock || 0) }),
          h('span', { class: 'unit-text' }, row.unit || '个'),
        ]);
      },
    },
    {
      title: '设备库存', key: 'physical_stock', width: 120, sorter: true,
      render(row) {
        return h('div', { class: 'stock-cell' }, [
          h(NTag, { type: getStockType(row.physical_stock, row.mes_stock), size: 'small' }, { default: () => String(row.physical_stock || 0) }),
          h('span', { class: 'unit-text' }, row.unit || '个'),
        ]);
      },
    },
    {
      title: '单位', key: 'unit', width: 80, sorter: true,
      render(row) {
        return h('span', { class: 'unit-text' }, row.unit || '个');
      },
    },
    {
      title: '存放地', key: 'storage_location', width: 150, ellipsis: { tooltip: true }, sorter: true,
      render(row) {
        return row.storage_location
          ? h(NTag, { type: 'success', size: 'small' }, { default: () => row.storage_location })
          : h('span', { class: 'empty-text' }, '未指定');
      },
    },
    {
      title: '实物图片1', key: 'physical_image_url', width: 120, align: 'center',
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
          : h('span', { class: 'empty-text' }, '无');
      },
    },
    {
      title: '实物图片2', key: 'physical_image_url2', width: 120, align: 'center',
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
          : h('span', { class: 'empty-text' }, '无');
      },
    },
    {
      title: '备注', key: 'remarks', width: 150, ellipsis: { tooltip: true }, sorter: true,
      render(row) {
        return row.remarks
          ? h('span', { class: 'remarks-text' }, row.remarks)
          : h('span', { class: 'empty-text' }, '-');
      },
    },
    {
      title: '更新时间', key: 'updated_at', width: 160, sorter: true,
      render(row) {
        return row.updated_at
          ? h('span', { class: 'time-text' }, formatDateTime(row.updated_at))
          : h('span', { class: 'empty-text' }, '-');
      },
    },
  ];

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
        ]);
      },
    });
  }

  return cols;
});

// Dropdown options for export
const exportDropdownOptions = computed(() => [
  { label: `导出选中 (${selectedRows.value.length})`, key: 'selected', disabled: selectedRows.value.length === 0 },
  { label: `导出当前页 (${store.list.length})`, key: 'current', disabled: store.list.length === 0 },
  { label: '全部导出', key: 'all' },
]);

function handleExportDropdownSelect(key: string) {
  handleExportExcel(key as 'selected' | 'current' | 'all');
}

// Mobile dropdown options
const mobileDropdownOptions = computed(() => {
  const opts: Array<{ label: string; key: string; disabled?: boolean }> = [];
  if (canEdit.value) {
    opts.push(
      { label: `批量删除 (${selectedRows.value.length})`, key: 'batch-delete', disabled: selectedRows.value.length === 0 },
      { label: '批量新增', key: 'batch-import' },
      { label: '批量更新', key: 'batch-update' },
      { label: '批量导入图片', key: 'batch-image' },
    );
  }
  opts.push(
    { label: '导出选中', key: 'export-selected', disabled: selectedRows.value.length === 0 },
    { label: '导出当前页', key: 'export-current', disabled: store.list.length === 0 },
    { label: '全部导出', key: 'export-all' },
  );
  return opts;
});

// 导出 Excel：与表格列严格一致（排除实物图片1、实物图片2、操作）
const SPARE_PART_EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'location_code', label: '货位号' },
  { key: 'mes_material_code', label: 'MES物料编码' },
  { key: 'specification_model', label: '规格型号' },
  { key: 'mes_material_desc', label: 'MES物料描述' },
  { key: 'physical_material_desc', label: '实物物料描述' },
  { key: 'applicable_model', label: '适用机型', formatter: (r) => formatApplicableModel((r as SparePart).applicable_model || '') },
  { key: 'brand', label: '品牌' },
  { key: 'mes_stock', label: 'MES库存' },
  { key: 'physical_stock', label: '设备库存' },
  { key: 'unit', label: '单位', formatter: (r) => (r as SparePart).unit || '个' },
  { key: 'storage_location', label: '存放地' },
  { key: 'remarks', label: '备注' },
  { key: 'updated_at', label: '更新时间', formatter: (r) => formatDateTime((r as SparePart).updated_at) || '—' },
];
type ExportScope = 'selected' | 'current' | 'all';
const handleExportExcel = async (scope: ExportScope = 'all') => {
  exportLoading.value = true;
  try {
    let items: SparePart[] = [];
    if (scope === 'selected') {
      items = selectedRows.value;
      if (items.length === 0) {
        window.$message?.warning('请先勾选要导出的记录');
        return;
      }
    } else if (scope === 'current') {
      items = [...store.list];
      if (items.length === 0) {
        window.$message?.warning('当前页无数据可导出');
        return;
      }
    } else {
      const res = await sparePartApi.getList({
        keyword: searchKeyword.value || undefined,
        skip: 0,
        limit: 1000,
        brand: filterBrand.value || undefined,
        applicable_model: filterApplicableModel.value || undefined,
        storage_location: filterStorageLocation.value || undefined,
        location_prefix: filterLocationPrefix.value || undefined,
        updated_since: filterUpdatedSince.value || undefined,
        stock_alert: stockAlertFilter.value || undefined,
      });
      items = Array.isArray((res as any)?.items) ? (res as any).items : (Array.isArray(res) ? res : []);
      if (items.length === 0) {
        window.$message?.warning('当前筛选条件下无数据可导出');
        return;
      }
    }
    const date = new Date().toISOString().slice(0, 10);
    exportToExcel(items, SPARE_PART_EXPORT_COLUMNS, `设备列表_${date}`);
    window.$message?.success(`已导出 ${items.length} 条记录`);
  } catch (e: any) {
    window.$message?.error(e?.message || '导出失败');
  } finally {
    exportLoading.value = false;
  }
};

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1;
  loadData();
};

// 移动端：搜索后关闭抽屉
const handleSearchAndClose = () => {
  handleSearch();
  mobileSearchDrawer.value = false;
  scrollMainToTop();
};

// 分页处理
const handleSizeChange = (val: number) => {
  pageSize.value = val;
  currentPage.value = 1; // 切换每页条数后回到第一页
  loadData();
};

// 显示全部：单页最多 PAGE_SIZE_ALL 条
const handleShowAll = () => {
  pageSize.value = PAGE_SIZE_ALL;
  currentPage.value = 1;
  loadData();
};

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  loadData();
};

// 新增设备
const handleCreate = () => {
  currentForm.value = {
    mes_stock: 0,
    physical_stock: 0,
    unit: '个',
  };
  dialogMode.value = 'create';
  dialogVisible.value = true;
};

const handleBatchImport = () => {
  batchImportDialogVisible.value = true;
};

const handleBatchImportSuccess = () => {
  loadData();
  broadcastSparePartDataChanged();
};

const handleBatchUpdate = () => {
  batchUpdateDialogVisible.value = true;
};

const handleBatchUpdateSuccess = () => {
  loadData();
  broadcastSparePartDataChanged();
};

const handleBatchImageImport = () => {
  batchImageImportDialogVisible.value = true;
};

const handleBatchImageImportSuccess = () => {
  loadData();
  broadcastSparePartDataChanged();
};

// 编辑设备
const handleEdit = (row: SparePart) => {
  currentForm.value = { ...row };
  dialogMode.value = 'edit';
  dialogVisible.value = true;
};

// 移动端卡片选择
function toggleCardSelection(row: SparePart) {
  const idx = selectedRows.value.findIndex((r) => r.id === row.id);
  if (idx >= 0) {
    selectedRows.value = selectedRows.value.filter((r) => r.id !== row.id);
  } else {
    selectedRows.value = [...selectedRows.value, row];
  }
}
function addSelection(row: SparePart) {
  if (!selectedRows.value.some((r) => r.id === row.id)) {
    selectedRows.value = [...selectedRows.value, row];
  }
}
function removeSelection(row: SparePart) {
  selectedRows.value = selectedRows.value.filter((r) => r.id !== row.id);
}

// 移动端下拉菜单命令
function handleMobileMenuCommand(cmd: string) {
  if (cmd === 'batch-delete') handleBatchDelete();
  else if (cmd === 'batch-import') handleBatchImport();
  else if (cmd === 'batch-update') handleBatchUpdate();
  else if (cmd === 'batch-image') handleBatchImageImport();
  else if (cmd === 'export-selected') handleExportExcel('selected');
  else if (cmd === 'export-current') handleExportExcel('current');
  else if (cmd === 'export-all') handleExportExcel('all');
}

// 批量删除设备
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    window.$message?.warning('请先选择要删除的设备');
    return;
  }

  const count = selectedRows.value.length;
  const ids = selectedRows.value.map(row => row.id);
  const mesCodes = selectedRows.value.map(row => row.mes_material_code).join('、');

  window.$dialog?.warning({
    title: '确认批量删除',
    content: `确定删除选中的 ${count} 个设备吗？\n涉及：${mesCodes.substring(0, 100)}${mesCodes.length > 100 ? '...' : ''}\n此操作不可恢复。`,
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      isBatchDeleting.value = true;
      try {
        const result = await store.batchDeleteSpareParts(ids);
        const { deleted, failed, errors } = result;

        if (failed === 0) {
          window.$message?.success(`成功删除 ${deleted} 个设备`);
        } else {
          window.$message?.warning(`删除完成：成功 ${deleted} 个，失败 ${failed} 个`);
          if (errors && errors.length > 0) {
            console.error('批量删除错误:', errors);
          }
        }

        // 清空选择
        selectedRows.value = [];

        // 刷新数据
        loadData();
        broadcastSparePartDataChanged();
      } catch (error) {
        window.$message?.error('批量删除失败');
        console.error('批量删除失败:', error);
      } finally {
        isBatchDeleting.value = false;
      }
    },
  });
};

// 删除设备
const handleDelete = async (row: SparePart) => {
  window.$dialog?.warning({
    title: '确认删除',
    content: `确定删除设备 "${row.mes_material_code}" 吗？此操作不可恢复。`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await store.deleteSparePart(row.id);
        window.$message?.success('删除成功');
        loadData();
        broadcastSparePartDataChanged();
      } catch (error) {
        window.$message?.error('删除失败');
      }
    },
  });
};

// 对话框成功回调：表单内已通过 createSparePartWithImages / updateSparePartWithImages 完成 API 调用，此处仅刷新列表
const handleDialogSuccess = (_result?: { mode?: string; data?: any; id?: number }) => {
  dialogVisible.value = false;
  loadData();
  broadcastSparePartDataChanged();
};

// 复制到剪贴板
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
    .then(() => {
      window.$message?.success('已复制到剪贴板');
    })
    .catch(() => {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      window.$message?.success('已复制到剪贴板');
    });
};

// 格式化适用机型（如果是逗号分隔的字符串）
const formatApplicableModel = (modelString: string) => {
  if (!modelString) return '';
  const models = modelString.split(',').map(m => m.trim());
  return models.length > 2 ? `${models[0]}等${models.length}个` : modelString;
};

// 获取库存标签类型
const getStockType = (current: number | undefined | null, compare: number | undefined | null): 'info' | 'error' | 'warning' | 'success' => {
  const cur = current ?? 0;
  const comp = compare ?? 0;

  if (!current && current !== 0) return 'info';

  // 如果有对比库存，显示差异
  if (compare !== undefined && compare !== null) {
    const diff = Math.abs(cur - comp);
    if (diff > 10) return 'error'; // 差异较大
    if (diff > 5) return 'warning'; // 有差异
  }

  // 根据库存数量显示
  if (cur === 0) return 'error'; // 零库存
  if (cur < 10) return 'warning'; // 低库存
  return 'success'; // 正常库存
};
</script>

<style scoped lang="scss">
.spare-part-list {
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

.remarks-text {
  font-size: 12px;
  color: var(--sp-text-secondary);
  line-height: 1.4;
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

.pagination-extra {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-tip {
  font-size: 12px;
  color: var(--sp-text-muted);
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

.spare-card.req-card-zero {
  border-left-color: var(--sp-danger);
  background: linear-gradient(to bottom, #fef2f2, #fee2e2);
}
.spare-card.req-card-low {
  border-left-color: var(--sp-warning);
  background: linear-gradient(to bottom, #fffbeb, #fef3c7);
}

// 表格横向滚动容器（小屏时）
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

.spare-card {
  background: linear-gradient(to bottom, #ffffff, #fafbff);
  border-radius: var(--sp-radius-lg);
  padding: 14px 16px;
  box-shadow: var(--sp-shadow-sm);
  border: 1px solid var(--sp-border-light);
  border-left: 4px solid var(--sp-primary-light);
  transition: box-shadow var(--sp-transition-fast), transform var(--sp-transition-fast);

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
  display: flex;
  gap: 12px;
  align-items: flex-start;
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

.card-location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--sp-success);
  flex: 1;

  .location-icon {
    font-size: 14px;
    flex-shrink: 0;
  }
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

.stock-info {
  font-size: 12px;
  color: var(--sp-text-muted);
  flex: 1;

  .stock-ok { color: var(--sp-success); font-weight: 600; }
  .stock-zero { color: var(--sp-danger); font-weight: 600; }
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
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--sp-border-light);
}

// 响应式调整
@media (max-width: 1200px) {
  .spare-part-list {
    padding: 16px;
  }

  .header h2 {
    font-size: var(--sp-text-xl);
  }
}

@media (max-width: 767px) {
  .spare-part-list {
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
