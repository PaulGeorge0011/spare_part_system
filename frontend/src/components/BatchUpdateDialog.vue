<template>
  <n-modal
    v-model:show="dialogVisible"
    preset="card"
    :title="title"
    :style="isMobile ? 'width: 95%;' : 'width: 720px;'"
    :mask-closable="false"
    :on-after-leave="handleClose"
  >
    <n-steps :current="currentStep + 1" status="process" style="margin-bottom: 20px">
      <n-step title="上传Excel" />
      <n-step title="字段映射" />
      <n-step title="数据预览" />
      <n-step title="更新结果" />
    </n-steps>

    <!-- Step 1: Upload Excel -->
    <div v-if="currentStep === 0" class="step-content">
      <n-alert type="info" :closable="false" style="margin-bottom: 16px">
        请上传包含 <strong>MES编码</strong> 与 <strong>MES库存</strong> 的 Excel 文件，系统将按 MES 编码匹配并更新对应修复件的 MES 库存。
      </n-alert>
      <n-upload
        ref="uploadRef"
        :default-upload="false"
        :max="1"
        accept=".xlsx,.xls"
        :disabled="isParsing"
        @change="handleFileChange"
      >
        <n-upload-dragger>
          <div style="margin-bottom: 12px">
            <n-icon :size="48" :depth="3"><CloudUploadOutline /></n-icon>
          </div>
          <n-text style="font-size: 14px">
            将 Excel 拖到此处，或<n-text tag="span" type="primary">点击上传</n-text>
          </n-text>
          <n-p depth="3" style="margin: 8px 0 0 0; font-size: 12px">仅支持 .xlsx 或 .xls</n-p>
        </n-upload-dragger>
      </n-upload>
      <div v-if="isParsing" class="parsing-progress">
        <n-spin :size="16" />
        <span class="progress-text">{{ parsingStatus }}</span>
        <n-progress type="line" :percentage="parsingProgress" :height="8" style="flex: 1" />
      </div>
      <div v-if="excelColumns.length > 0 && !isParsing" class="columns-preview">
        <h4>检测到的列：</h4>
        <n-space>
          <n-tag v-for="col in excelColumns" :key="col">{{ col }}</n-tag>
        </n-space>
      </div>
    </div>

    <!-- Step 2: Field Mapping -->
    <div v-if="currentStep === 1" class="step-content">
      <n-alert type="info" :closable="false" style="margin-bottom: 16px">
        请为 <strong>MES编码</strong> 和 <strong>MES库存</strong> 选择对应的 Excel 列（均为必选）。
      </n-alert>
      <n-data-table :columns="mappingColumns" :data="fieldMapping" :bordered="true" />
    </div>

    <!-- Step 3: Data Preview -->
    <div v-if="currentStep === 2" class="step-content" style="position: relative">
      <div v-if="isSubmitting" class="import-overlay">
        <div class="import-progress-box">
          <n-spin :size="32" />
          <div class="import-status">正在提交更新...</div>
        </div>
      </div>
      <n-alert type="warning" :closable="false" style="margin-bottom: 16px">
        共 {{ previewData.length }} 条，将按 MES 编码更新现有记录的 MES 库存；未匹配到的行将跳过。
      </n-alert>
      <div class="table-scroll-wrap">
        <n-data-table :columns="previewColumns" :data="previewData" :bordered="true" :max-height="360" />
      </div>
    </div>

    <!-- Step 4: Result -->
    <div v-if="currentStep === 3" class="step-content">
      <n-result :status="updateResult.success ? 'success' : 'warning'" :title="updateResult.title" :description="updateResult.subTitle">
        <template #footer>
          <div v-if="updateResult.details" class="import-details">
            <n-descriptions :column="2" bordered>
              <n-descriptions-item label="已更新">{{ updateResult.details.updated ?? 0 }} 条</n-descriptions-item>
              <n-descriptions-item label="已跳过">{{ updateResult.details.skipped ?? 0 }} 条</n-descriptions-item>
            </n-descriptions>
            <div v-if="updateResult.details.errors && updateResult.details.errors.length > 0" style="margin-top: 16px">
              <h4>跳过/错误详情：</h4>
              <n-data-table :columns="errorColumns" :data="updateResult.details.errors" :bordered="true" :max-height="200" />
            </div>
          </div>
        </template>
      </n-result>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <n-button :disabled="isSubmitting" @click="dialogVisible = false">取消</n-button>
        <n-button v-if="currentStep > 0 && !isSubmitting" @click="handlePrev">上一步</n-button>
        <n-button
          v-if="currentStep < 3"
          type="primary"
          :disabled="!canNext || isSubmitting"
          :loading="isSubmitting && currentStep === 2"
          @click="handleNext"
        >
          {{ currentStep === 2 ? '开始更新' : '下一步' }}
        </n-button>
        <n-button v-if="currentStep === 3" type="primary" @click="dialogVisible = false">完成</n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, h } from 'vue'
import { useIsMobile } from '@/composables/useIsMobile'
import {
  NModal, NSteps, NStep, NUpload, NUploadDragger,
  NIcon, NText, NP, NAlert, NButton, NTag, NSpace,
  NDataTable, NSelect, NProgress, NSpin,
  NResult, NDescriptions, NDescriptionsItem,
  type DataTableColumns, type UploadFileInfo,
} from 'naive-ui'
import { CloudUploadOutline } from '@vicons/ionicons5'
import * as XLSX from 'xlsx'
import { sparePartApi } from '@/api/sparePart'
import { mechanicalSparePartApi } from '@/api/mechanicalSparePart'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    type?: 'electrical' | 'mechanical'
  }>(),
  { type: 'electrical' }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
}>()

const title = computed(() =>
  props.type === 'mechanical' ? '批量更新 MES 库存（机械修复件）' : '批量更新 MES 库存（电气修复件）'
)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const { isMobile } = useIsMobile()
const currentStep = ref(0)
const uploadRef = ref()
const excelColumns = ref<string[]>([])
const excelData = ref<any[][]>([])
const fieldMapping = ref<Array<{ fieldName: string; fieldLabel: string; excelColumn: string }>>([
  { fieldName: 'mes_material_code', fieldLabel: 'MES编码', excelColumn: '' },
  { fieldName: 'mes_stock', fieldLabel: 'MES库存', excelColumn: '' },
])
const previewData = ref<Array<{ mes_material_code: string; mes_stock: number }>>([])
const updateResult = ref<{
  success: boolean
  title: string
  subTitle: string
  details: { updated: number; skipped: number; errors: Array<{ row: number; message: string }> } | null
}>({ success: false, title: '', subTitle: '', details: null })

const isParsing = ref(false)
const parsingProgress = ref(0)
const parsingStatus = ref('')
const isSubmitting = ref(false)

const selectOptions = computed(() =>
  excelColumns.value.map(c => ({ label: c, value: c }))
)

const mappingColumns = computed<DataTableColumns>(() => [
  { title: '字段', key: 'fieldLabel', width: 140 },
  {
    title: '对应 Excel 列',
    key: 'excelColumn',
    minWidth: 280,
    render(_row: any, rowIndex: number) {
      return h(NSelect, {
        value: fieldMapping.value[rowIndex].excelColumn || null,
        options: selectOptions.value,
        placeholder: '请选择列',
        clearable: true,
        onUpdateValue: (v: string | null) => {
          fieldMapping.value[rowIndex].excelColumn = v ?? ''
        },
      })
    },
  },
])

const previewColumns: DataTableColumns = [
  { title: 'MES编码', key: 'mes_material_code', minWidth: 140, ellipsis: { tooltip: true } },
  { title: 'MES库存', key: 'mes_stock', width: 100, align: 'right' },
]

const errorColumns: DataTableColumns = [
  { title: '行号', key: 'row', width: 80 },
  { title: '说明', key: 'message', ellipsis: { tooltip: true } },
]

const canNext = computed(() => {
  if (currentStep.value === 0) return excelColumns.value.length > 0 && !isParsing.value
  if (currentStep.value === 1) {
    return fieldMapping.value.every((f) => f.excelColumn)
  }
  if (currentStep.value === 2) return previewData.value.length > 0
  return true
})

function getOptimizedRange(worksheet: XLSX.WorkSheet): string | null {
  try {
    const ref = worksheet['!ref']
    if (!ref) return null
    const range = XLSX.utils.decode_range(ref)
    const totalCells = (range.e.r - range.s.r + 1) * (range.e.c - range.s.c + 1)
    if (totalCells < 1000000) return null
    let minR = Infinity, maxR = -1, minC = Infinity, maxC = -1
    const re = /^([A-Z]+)(\d+)$/
    for (const key of Object.keys(worksheet)) {
      if (key.startsWith('!')) continue
      const m = key.match(re)
      if (!m) continue
      const cell = worksheet[key]
      if (!cell || (cell.v !== 0 && !cell.v)) continue
      const d = XLSX.utils.decode_cell(key)
      minR = Math.min(minR, d.r)
      maxR = Math.max(maxR, d.r)
      minC = Math.min(minC, d.c)
      maxC = Math.max(maxC, d.c)
    }
    if (maxR < 0 || maxC < 0) return null
    return XLSX.utils.encode_range({ s: { r: minR, c: minC }, e: { r: maxR, c: maxC } })
  } catch {
    return null
  }
}

function handleFileChange(data: { file: UploadFileInfo }) {
  const raw = data.file.file
  if (!raw) return
  isParsing.value = true
  parsingProgress.value = 0
  parsingStatus.value = '正在读取...'
  excelColumns.value = []
  excelData.value = []

  const reader = new FileReader()
  reader.onload = (e) => {
    const arrayBuffer = e.target?.result as ArrayBuffer
    parsingProgress.value = 40
    parsingStatus.value = '解析工作表...'
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const optimizedRange = getOptimizedRange(worksheet)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      range: optimizedRange || undefined,
    }) as any[][]
    parsingProgress.value = 90
    if (jsonData.length === 0) {
      isParsing.value = false
      window.$message?.error('Excel 为空')
      return
    }
    const headers = (jsonData[0] || []) as string[]
    excelColumns.value = headers.filter((h) => h != null && String(h).trim())
    excelData.value = jsonData.slice(1)
    parsingProgress.value = 100
    parsingStatus.value = '解析完成'
    isParsing.value = false
    fieldMapping.value = [
      { fieldName: 'mes_material_code', fieldLabel: 'MES编码', excelColumn: '' },
      { fieldName: 'mes_stock', fieldLabel: 'MES库存', excelColumn: '' },
    ]
  }
  reader.readAsArrayBuffer(raw)
}

function buildPreviewRows(): Array<{ mes_material_code: string; mes_stock: number }> {
  const mesCol = fieldMapping.value.find((f) => f.fieldName === 'mes_material_code')?.excelColumn
  const stockCol = fieldMapping.value.find((f) => f.fieldName === 'mes_stock')?.excelColumn
  if (!mesCol || !stockCol) return []
  const mesIdx = excelColumns.value.indexOf(mesCol)
  const stockIdx = excelColumns.value.indexOf(stockCol)
  if (mesIdx < 0 || stockIdx < 0) return []
  const out: Array<{ mes_material_code: string; mes_stock: number }> = []
  for (const row of excelData.value as any[][]) {
    const code = row && row[mesIdx] != null ? String(row[mesIdx]).trim() : ''
    const raw = row && row[stockIdx] != null ? row[stockIdx] : ''
    if (raw === '' || raw == null) continue
    let stock: number
    if (typeof raw === 'number' && !Number.isNaN(raw)) stock = Math.max(0, Math.round(raw))
    else {
      const n = Number(raw)
      if (Number.isNaN(n)) continue
      stock = Math.max(0, Math.round(n))
    }
    if (!code) continue
    out.push({ mes_material_code: code, mes_stock: stock })
  }
  return out
}

watch(
  () => currentStep.value,
  (step) => {
    if (step === 2) {
      previewData.value = buildPreviewRows()
    }
  }
)

function handlePrev() {
  if (currentStep.value > 0) currentStep.value--
}

async function handleNext() {
  if (currentStep.value === 2) {
    const payload = [...previewData.value]
    if (payload.length === 0) {
      window.$message?.warning('没有可更新的数据')
      return
    }
    isSubmitting.value = true
    try {
      const api = props.type === 'mechanical' ? mechanicalSparePartApi : sparePartApi
      const res = await api.batchUpdateMesStock(payload)
      updateResult.value = {
        success: (res.updated ?? 0) > 0 || (res.skipped ?? 0) === payload.length,
        title: '更新完成',
        subTitle: `已更新 ${res.updated ?? 0} 条，跳过 ${res.skipped ?? 0} 条`,
        details: {
          updated: res.updated ?? 0,
          skipped: res.skipped ?? 0,
          errors: res.errors ?? [],
        },
      }
      currentStep.value = 3
      if ((res.updated ?? 0) > 0) {
        window.$message?.success(`已更新 ${res.updated} 条 MES 库存`)
        emit('success')
      }
    } catch (e: any) {
      window.$message?.error(e?.message || '批量更新失败')
      updateResult.value = {
        success: false,
        title: '更新失败',
        subTitle: e?.message || '请求异常',
        details: null,
      }
      currentStep.value = 3
    } finally {
      isSubmitting.value = false
    }
    return
  }
  if (currentStep.value < 3) currentStep.value++
}

function handleClose() {
  currentStep.value = 0
  excelColumns.value = []
  excelData.value = []
  previewData.value = []
  fieldMapping.value = [
    { fieldName: 'mes_material_code', fieldLabel: 'MES编码', excelColumn: '' },
    { fieldName: 'mes_stock', fieldLabel: 'MES库存', excelColumn: '' },
  ]
  updateResult.value = { success: false, title: '', subTitle: '', details: null }
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      currentStep.value = 0
      excelColumns.value = []
      excelData.value = []
      previewData.value = []
    }
  }
)
</script>

<style scoped>
.step-content {
  min-height: 200px;
}
.columns-preview {
  margin-top: 16px;
}
.columns-preview h4 {
  margin-bottom: 8px;
  font-size: 14px;
}
.parsing-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}
.progress-text {
  font-size: 14px;
}
.table-scroll-wrap {
  overflow-x: auto;
}
.import-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
.import-progress-box {
  text-align: center;
}
.import-status {
  margin-top: 8px;
  font-size: 14px;
}
.import-details {
  text-align: left;
  max-width: 560px;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
