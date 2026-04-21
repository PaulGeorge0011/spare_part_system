<template>
  <div class="reports-page">
    <h2>报表统计</h2>
    <p class="page-desc">按品牌、适用机型统计修复件的入库、出库数量，支持自定义时间范围。</p>

    <!-- 筛选卡片 -->
    <n-card class="filter-card">
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
        <n-date-picker
          v-model:value="singleDateTs"
          type="date"
          placeholder="选择日期"
          style="width: 200px"
        />
      </div>
      <div v-if="timeRange === 'custom'" class="filter-row date-row">
        <span class="filter-label">开始日期：</span>
        <n-date-picker
          v-model:value="customStartTs"
          type="date"
          placeholder="开始日期"
          style="width: 200px"
        />
        <span class="filter-label" style="margin-left: 16px">结束日期：</span>
        <n-date-picker
          v-model:value="customEndTs"
          type="date"
          placeholder="结束日期"
          style="width: 200px"
        />
      </div>
      <div class="filter-row">
        <n-button type="primary" :loading="loading" @click="fetchData">查询统计</n-button>
      </div>
    </n-card>

    <!-- 图表区域 -->
    <n-spin :show="loading">
      <div class="charts-area">
        <!-- 按品牌统计 -->
        <n-card class="chart-card">
          <template #header>
            <span class="chart-title">按品牌统计（入库 / 出库）</span>
          </template>
          <div v-if="brandData.length === 0 && !loading" class="empty-chart">暂无数据</div>
          <div v-else ref="brandBarRef" class="chart-container"></div>
          <div v-if="brandData.length > 0" class="chart-tabs">
            <n-radio-group v-model:value="brandChartType" size="small" @update:value="renderBrandChart">
              <n-radio-button value="bar">柱状图</n-radio-button>
              <n-radio-button value="pie-inbound">入库占比</n-radio-button>
              <n-radio-button value="pie-outbound">出库占比</n-radio-button>
            </n-radio-group>
          </div>
        </n-card>

        <!-- 按适用机型统计 -->
        <n-card class="chart-card">
          <template #header>
            <span class="chart-title">按适用机型统计（入库 / 出库）</span>
          </template>
          <div v-if="modelData.length === 0 && !loading" class="empty-chart">暂无数据</div>
          <div v-else ref="modelBarRef" class="chart-container"></div>
          <div v-if="modelData.length > 0" class="chart-tabs">
            <n-radio-group v-model:value="modelChartType" size="small" @update:value="renderModelChart">
              <n-radio-button value="bar">柱状图</n-radio-button>
              <n-radio-button value="pie-inbound">入库占比</n-radio-button>
              <n-radio-button value="pie-outbound">出库占比</n-radio-button>
            </n-radio-group>
          </div>
        </n-card>
      </div>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
// 定义组件名称，用于 keep-alive 缓存
defineOptions({
  name: 'Reports'
})

import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import {
  NCard, NButton, NRadioGroup, NRadioButton,
  NDatePicker, NSpin,
} from 'naive-ui'
// ECharts 按需导入，减少打包体积
import * as echarts from 'echarts/core'
import { BarChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useIsMobile } from '@/composables/useIsMobile'
import type { ECharts } from 'echarts/core'

// 注册必要的 ECharts 组件
echarts.use([
  BarChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  CanvasRenderer,
])
import {
  getReportByBrand,
  getReportByApplicableModel,
  type BrandStatItem,
  type ApplicableModelStatItem,
  type TimeRange,
  type MaterialScope,
} from '@/api/report'

const route = useRoute()
const materialScope = computed<MaterialScope>(() =>
  route.path.startsWith('/electrical') ? 'electrical' : 'mechanical'
)

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function tsToDateStr(ts: number | null): string {
  if (!ts) return ''
  return formatDateStr(new Date(ts))
}

const timeRange = ref<TimeRange>('30d')
const singleDateTs = ref<number | null>(null)
const customStartTs = ref<number | null>(null)
const customEndTs = ref<number | null>(null)
const loading = ref(false)
const brandData = ref<BrandStatItem[]>([])
const modelData = ref<ApplicableModelStatItem[]>([])

const { isMobile } = useIsMobile()
const brandBarRef = ref<HTMLElement | null>(null)
const modelBarRef = ref<HTMLElement | null>(null)
const brandChartType = ref<'bar' | 'pie-inbound' | 'pie-outbound'>('bar')
const modelChartType = ref<'bar' | 'pie-inbound' | 'pie-outbound'>('bar')

let brandChart: ECharts | null = null
let modelChart: ECharts | null = null

function onTimeRangeChange() {
  if (timeRange.value === 'custom' && !customStartTs.value && !customEndTs.value) {
    const d = new Date()
    const s = new Date(d)
    s.setDate(s.getDate() - 30)
    customStartTs.value = s.getTime()
    customEndTs.value = d.getTime()
  }
}

async function fetchData() {
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
    const [brandRes, modelRes] = await Promise.all([
      getReportByBrand(materialScope.value, range, start, end),
      getReportByApplicableModel(materialScope.value, range, start, end),
    ])
    brandData.value = Array.isArray(brandRes) ? brandRes : (brandRes as any)?.data ?? []
    modelData.value = Array.isArray(modelRes) ? modelRes : (modelRes as any)?.data ?? []
    await nextTick()
    renderBrandChart()
    renderModelChart()
  } catch (e: any) {
    window.$message?.error(e?.message || '获取统计数据失败')
    brandData.value = []
    modelData.value = []
  } finally {
    loading.value = false
  }
}

function getBarOption(
  data: { name: string; inbound: number; outbound: number }[],
  title: string
): echarts.EChartsOption {
  const names = data.map((d) => d.name)
  const inbound = data.map((d) => d.inbound)
  const outbound = data.map((d) => d.outbound)
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: {
      data: ['入库', '出库'],
      top: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: names.length > 10 ? 80 : 60,
      top: 40,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: {
        rotate: names.length > 8 ? 45 : 0,
        interval: 0,
      },
    },
    yAxis: { type: 'value', name: '数量' },
    series: [
      { name: '入库', type: 'bar', data: inbound, itemStyle: { color: '#67c23a' } },
      { name: '出库', type: 'bar', data: outbound, itemStyle: { color: '#e6a23c' } },
    ],
  }
}

// 为饼图生成丰富的颜色数组
const PIE_COLORS = [
  '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
  '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#5ab1ef',
  '#ffb980', '#d87a80', '#8d98b3', '#e5cf0d', '#97b552',
  '#95706d', '#dc69aa', '#07a2a4', '#9a7fd1', '#588dd5',
  '#f5994e', '#c05050', '#59678c', '#c9ab00', '#7eb00a'
]

function getPieOption(
  data: { name: string; value: number }[],
  title: string,
  mobile: boolean
): echarts.EChartsOption {
  const filtered = data.filter((d) => d.value > 0)
  if (filtered.length === 0) {
    return { title: { text: title, left: 'center' }, series: [] }
  }
  // 移动端：图例放底部横向滚动，饼图居中
  const legend = mobile
    ? {
        orient: 'horizontal' as const,
        bottom: 6,
        left: 8,
        right: 8,
        type: 'scroll' as const,
        pageIconSize: 10,
        pageTextStyle: { fontSize: 10 },
        pageButtonItemGap: 4,
        formatter: (name: string) => (name.length > 6 ? name.slice(0, 5) + '...' : name),
        itemGap: 6,
        itemWidth: 12,
        itemHeight: 12,
        textStyle: { fontSize: 10 },
      }
    : {
        orient: 'vertical' as const,
        right: 10,
        top: 'center',
        type: 'scroll' as const,
      }
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    title: { text: title, left: 'center', top: 10 },
    legend,
    color: PIE_COLORS,
    series: [
      {
        name: title,
        type: 'pie',
        radius: mobile ? ['22%', '45%'] : ['40%', '70%'],
        center: mobile ? ['50%', '34%'] : ['40%', '55%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6 },
        label: {
          show: true,
          formatter: mobile ? '{b}\n{c}' : '{b}: {c}\n({d}%)',
          fontSize: mobile ? 9 : 11,
        },
        emphasis: {
          label: { show: true, fontSize: mobile ? 11 : 14, fontWeight: 'bold' },
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0 },
        },
        data: filtered,
      },
    ],
  }
}

function renderBrandChart() {
  if (!brandBarRef.value || brandData.value.length === 0) return
  if (!brandChart) {
    brandChart = echarts.init(brandBarRef.value)
  }
  const data = brandData.value.map((d) => ({
    name: d.brand,
    inbound: d.inbound,
    outbound: d.outbound,
  }))
  if (brandChartType.value === 'bar') {
    brandChart.setOption(getBarOption(data, '按品牌'), true)
  } else if (brandChartType.value === 'pie-inbound') {
    brandChart.setOption(
      getPieOption(
        data.map((d) => ({ name: d.name, value: d.inbound })),
        '各品牌入库数量占比',
        isMobile.value
      ),
      true
    )
  } else {
    brandChart.setOption(
      getPieOption(
        data.map((d) => ({ name: d.name, value: d.outbound })),
        '各品牌出库数量占比',
        isMobile.value
      ),
      true
    )
  }
}

function renderModelChart() {
  if (!modelBarRef.value || modelData.value.length === 0) return
  if (!modelChart) {
    modelChart = echarts.init(modelBarRef.value)
  }
  const data = modelData.value.map((d) => ({
    name: d.applicable_model,
    inbound: d.inbound,
    outbound: d.outbound,
  }))
  if (modelChartType.value === 'bar') {
    modelChart.setOption(getBarOption(data, '按适用机型'), true)
  } else if (modelChartType.value === 'pie-inbound') {
    modelChart.setOption(
      getPieOption(
        data.map((d) => ({ name: d.name, value: d.inbound })),
        '各机型入库数量占比',
        isMobile.value
      ),
      true
    )
  } else {
    modelChart.setOption(
      getPieOption(
        data.map((d) => ({ name: d.name, value: d.outbound })),
        '各机型出库数量占比',
        isMobile.value
      ),
      true
    )
  }
}

function resizeCharts() {
  brandChart?.resize()
  modelChart?.resize()
}

// 切换移动/PC 时重新渲染饼图布局
watch(isMobile, () => {
  renderBrandChart()
  renderModelChart()
})

onMounted(() => {
  singleDateTs.value = new Date().setHours(0, 0, 0, 0)
  onTimeRangeChange()
  fetchData()
  window.addEventListener('resize', resizeCharts)
})

// 监听系统切换（电气/机械），重新加载数据
watch(materialScope, () => {
  fetchData()
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCharts)
  brandChart?.dispose()
  modelChart?.dispose()
  brandChart = null
  modelChart = null
})
</script>

<style scoped lang="scss">
.reports-page {
  padding: 0 20px 20px;
}

h2 {
  margin: 0 0 8px;
  font-size: var(--sp-text-xl);
  color: var(--sp-text-primary);
}

.page-desc {
  margin: 0 0 16px;
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

  &:last-child {
    margin-bottom: 0;
  }
}

.filter-label {
  font-size: 14px;
  color: var(--sp-text-secondary);
  flex-shrink: 0;
}

.date-row {
  margin-left: 0;
}

.charts-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-card {
  min-height: 360px;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--sp-text-primary);
}

.chart-container {
  width: 100%;
  height: 320px;
  min-height: 320px;
}

.empty-chart {
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sp-text-muted);
  font-size: 14px;
}

.chart-tabs {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--n-border-color, #e0e0e6);
}

@media (max-width: 767px) {
  .reports-page {
    padding: 0 0 16px;
  }
  .reports-page h2 {
    font-size: 18px;
  }
  .reports-page .page-desc {
    font-size: 13px;
    margin-bottom: 16px;
  }

  .filter-card {
    margin-bottom: 16px;
  }
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .charts-area {
    gap: 16px;
  }
  .chart-card {
    min-height: 280px;
  }
  .chart-title {
    font-size: 15px;
  }
  .chart-container {
    height: 260px;
    min-height: 260px;
  }
  .empty-chart {
    height: 260px;
  }
}
</style>
