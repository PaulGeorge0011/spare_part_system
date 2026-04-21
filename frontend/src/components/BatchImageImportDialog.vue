<template>
  <n-modal
    v-model:show="dialogVisible"
    preset="card"
    title="批量导入图片"
    :style="isMobile ? 'width: 95%;' : 'width: 640px;'"
    :mask-closable="false"
    :on-after-leave="handleClose"
  >
    <div class="tab-content">
      <p class="tab-desc">从 Excel 按顺序提取图片，按您选择的规则匹配到修复件并上传、确认。</p>
      <n-upload
        ref="importUploadRef"
        :default-upload="false"
        :max="1"
        accept=".xlsx"
        @change="onImportFileChange"
      >
        <n-upload-dragger>
          <div style="margin-bottom: 12px">
            <n-icon :size="48" :depth="3"><CloudUploadOutline /></n-icon>
          </div>
          <n-text style="font-size: 14px">
            将 .xlsx 文件拖到此处，或<n-text tag="span" type="primary">点击选择</n-text>
          </n-text>
        </n-upload-dragger>
      </n-upload>
      <div v-if="importOrdered.length > 0" class="import-options">
        <n-alert type="info" :closable="false" style="margin-bottom: 12px">
          已解析到 <strong>{{ importOrdered.length }}</strong> 张图片
        </n-alert>
        <div class="match-mode">
          <span class="label">匹配方式：</span>
          <n-radio-group v-model:value="matchMode">
            <n-space vertical>
              <n-radio value="page">按当前页列表顺序（第 1 张→第 1 条修复件，依次类推）</n-radio>
              <n-radio value="selected">按勾选修复件顺序（第 1 张→第 1 个勾选修复件）</n-radio>
            </n-space>
          </n-radio-group>
        </div>
        <p v-if="matchMode === 'selected' && selectedRows.length === 0" class="tip-warn">
          请先在列表中勾选要导入图片的修复件，并保证勾选顺序与图片顺序一致。
        </p>
        <p v-else class="tip-ok">
          将把前 <strong>{{ targetPartCount }}</strong> 张图片导入到 <strong>{{ targetPartCount }}</strong> 个修复件。
        </p>
        <n-button
          type="primary"
          :loading="isImporting"
          :disabled="!canStartImport"
          @click="startImportToParts"
        >
          开始导入
        </n-button>
      </div>
    </div>
    <template #footer>
      <n-button @click="dialogVisible = false">关闭</n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useIsMobile } from '@/composables/useIsMobile'
import {
  NModal, NUpload, NUploadDragger, NIcon, NText,
  NAlert, NRadioGroup, NRadio, NSpace, NButton,
  type UploadFileInfo,
} from 'naive-ui'
import { CloudUploadOutline } from '@vicons/ionicons5'
import { getOrderedAnchorsWithBlobs } from '@/utils/excelEmbeddedImages'
import { uploadTempImageFromBlob } from '@/utils/imageUpload'
import request from '@/utils/request'
import type { SparePart } from '@/types/sparePart'
import { syncSparePartImages } from '@/api/sparePart'

const { isMobile } = useIsMobile()

const MATERIAL_CODE_PATTERN = /^[a-zA-Z0-9_-]{3,50}$/
function materialCodeForUpload(mes: string | undefined): string | null {
  const s = mes != null ? String(mes).trim() : ''
  if (s && MATERIAL_CODE_PATTERN.test(s)) return s
  return null
}

const props = defineProps<{
  modelValue: boolean
  currentPageList: SparePart[]
  selectedRows: SparePart[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const importUploadRef = ref()

const importFile = ref<File | null>(null)
const importOrdered = ref<Array<{ dataRowIndex: number; col: number; blob: Blob }>>([])
const matchMode = ref<'page' | 'selected'>('page')
const isImporting = ref(false)

const targetParts = computed(() => {
  if (matchMode.value === 'selected') return props.selectedRows
  return props.currentPageList
})

const targetPartCount = computed(() => {
  const n = importOrdered.value.length
  const parts = targetParts.value
  return Math.min(n, parts.length)
})

const canStartImport = computed(() => {
  if (importOrdered.value.length === 0) return false
  if (matchMode.value === 'selected') return props.selectedRows.length > 0
  return props.currentPageList.length > 0
})

async function onImportFileChange(data: { file: UploadFileInfo; fileList: UploadFileInfo[] }) {
  const raw = data.file.file
  if (!raw?.name.toLowerCase().endsWith('.xlsx')) {
    window.$message?.warning('请选择 .xlsx 文件')
    return
  }
  importFile.value = raw
  importOrdered.value = []
  try {
    const buf = await raw.arrayBuffer()
    importOrdered.value = await getOrderedAnchorsWithBlobs(buf)
  } catch (e: any) {
    window.$message?.error(e?.message || '解析 Excel 失败')
  }
}

async function startImportToParts() {
  const parts = targetParts.value
  const ordered = importOrdered.value
  const N = Math.min(ordered.length, parts.length)
  if (N === 0) {
    window.$message?.warning('没有可匹配的修复件或图片')
    return
  }
  const confirmed = await new Promise<boolean>((resolve) => {
    window.$dialog?.warning({
      title: '确认批量导入',
      content: `将把前 ${N} 张图片依次导入到 ${N} 个修复件，是否继续？`,
      positiveText: '确认',
      negativeText: '取消',
      onPositiveClick: () => { resolve(true) },
      onNegativeClick: () => { resolve(false) },
    })
  })
  if (!confirmed) return

  isImporting.value = true
  let ok = 0
  let fail = 0
  try {
    for (let i = 0; i < N; i++) {
      const part = parts[i]
      const { blob } = ordered[i]
      const code = materialCodeForUpload(part.mes_material_code) || `row_${i + 1}`
      try {
        const res = await uploadTempImageFromBlob(
          blob,
          `batch_${part.mes_material_code || i}_1.png`,
          code
        )
        if (!res?.upload_id) {
          fail++
          continue
        }
        const formData = new FormData()
        formData.append('upload_id', res.upload_id)
        formData.append('material_code', code)
        formData.append('spare_part_id', String(part.id))
        formData.append('image_index', '0')
        await request.post('/images/confirm', formData)
        await syncSparePartImages(part.id)
        ok++
      } catch (_) {
        fail++
      }
    }
    if (ok > 0) {
      window.$message?.success(`导入完成：成功 ${ok} 个修复件${fail > 0 ? `，失败 ${fail} 个` : ''}`)
      emit('success')
    } else {
      window.$message?.error('全部导入失败，请检查物料编码格式或网络')
    }
  } finally {
    isImporting.value = false
  }
}

function handleClose() {
  importFile.value = null
  importOrdered.value = []
  importUploadRef.value?.clear()
}
</script>

<style scoped>
.tab-content {
  padding: 8px 0;
}
.tab-desc {
  color: var(--sp-text-secondary);
  font-size: 13px;
  margin-bottom: 16px;
  line-height: 1.5;
}
.import-options {
  margin-top: 16px;
}
.match-mode {
  margin: 12px 0;
}
.match-mode .label {
  margin-right: 8px;
}
.tip-warn { color: var(--sp-warning); font-size: 13px; margin: 8px 0 12px; }
.tip-ok { color: var(--sp-success); font-size: 13px; margin: 8px 0 12px; }
</style>
