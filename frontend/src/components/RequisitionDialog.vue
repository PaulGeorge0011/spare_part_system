<template>
  <n-modal
    v-model:show="visible"
    preset="card"
    title="设备领用"
    :style="isMobile ? 'width: 100%; height: 100%; max-width: 100%;' : 'width: 420px;'"
    :mask-closable="!submitting"
    :closable="!submitting"
    :on-after-leave="resetForm"
    class="requisition-dialog"
  >
    <n-form
      ref="formRef"
      :model="form"
      :rules="rules"
      :label-width="isMobile ? undefined : 90"
      :label-placement="isMobile ? 'top' : 'left'"
    >
      <n-form-item label="设备">
        <span class="requisition-part-label">{{ partLabel }}</span>
      </n-form-item>
      <n-form-item v-if="row?.physical_material_desc" label="实物物料描述">
        <span class="requisition-physical-desc">{{ row.physical_material_desc }}</span>
      </n-form-item>
      <n-form-item label="当前库存">
        <n-tag type="info">{{ (row?.physical_stock ?? 0) }} {{ row?.unit || '个' }}</n-tag>
      </n-form-item>
      <n-form-item label="领用人">
        <n-input
          :value="requisitionerDisplay"
          readonly
          placeholder="—"
          size="large"
        />
        <span v-if="!requisitionerDisplay" class="requisition-tip">您尚未设置真实姓名，请先完善个人信息</span>
      </n-form-item>
      <n-form-item label="领用数量" path="quantity">
        <n-input-number
          v-model:value="form.quantity"
          :min="1"
          :max="Math.max(0, (row?.physical_stock ?? 0))"
          :precision="0"
          button-placement="right"
          :size="isMobile ? 'large' : 'medium'"
          style="width: 100%"
        />
      </n-form-item>
      <n-form-item label="领用原因" path="requisition_reason">
        <n-input
          v-model:value="form.requisition_reason"
          :size="isMobile ? 'large' : 'medium'"
          placeholder="请输入领用原因（必填）"
          :maxlength="500"
          show-count
        />
      </n-form-item>
      <n-form-item label="使用地点" path="usage_location">
        <n-input
          v-model:value="form.usage_location"
          :size="isMobile ? 'large' : 'medium'"
          placeholder="请输入使用地点（必填）"
          :maxlength="200"
          show-count
        />
      </n-form-item>
      <n-form-item label="备注">
        <n-input
          v-model:value="form.remark"
          type="textarea"
          :rows="isMobile ? 3 : 2"
          placeholder="选填"
          :maxlength="500"
          show-count
        />
      </n-form-item>
    </n-form>
    <template #footer>
      <div class="requisition-dialog__footer" :class="{ 'requisition-dialog__footer--mobile': isMobile }">
        <n-button :size="isMobile ? 'large' : 'medium'" @click="handleClose">取消</n-button>
        <n-button
          type="primary"
          :size="isMobile ? 'large' : 'medium'"
          :loading="submitting"
          @click="handleSubmit"
        >
          确认领用
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useIsMobile } from '@/composables/useIsMobile'
import { useAuthStore } from '@/stores/auth'
import {
  NModal, NForm, NFormItem, NInput, NInputNumber,
  NButton, NTag,
  type FormInst, type FormRules,
} from 'naive-ui'
import type { SparePart } from '@/types/sparePart'
import { sparePartApi } from '@/api/sparePart'
import { broadcastSparePartDataChanged } from '@/composables/useSparePartDataChanged'

const { isMobile } = useIsMobile()
const authStore = useAuthStore()

const props = defineProps<{
  modelValue: boolean
  row: SparePart | null
}>()
const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  'success': []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const formRef = ref<FormInst | null>(null)
const submitting = ref(false)
const form = reactive({ quantity: 1, requisition_reason: '', usage_location: '', remark: '' })

const requisitionerDisplay = computed(() => {
  const u = authStore.user
  if (!u) return ''
  return (u.real_name || u.username || '').trim() || ''
})

const rules: FormRules = {
  quantity: [
    { required: true, message: '请输入领用数量', trigger: 'blur' },
    { type: 'number', min: 1, message: '领用数量至少为 1', trigger: 'blur' },
  ],
  requisition_reason: [
    { required: true, message: '请输入领用原因', trigger: 'blur' },
  ],
  usage_location: [
    { required: true, message: '请输入使用地点', trigger: 'blur' },
  ],
}

const partLabel = computed(() => {
  const r = props.row
  if (!r) return '-'
  return [r.mes_material_code, r.specification_model].filter(Boolean).join(' · ') || r.location_code || '-'
})

function resetForm() {
  form.quantity = 1
  form.requisition_reason = ''
  form.usage_location = ''
  form.remark = ''
  formRef.value?.restoreValidation()
}

watch(
  () => props.row,
  (r) => {
    const max = Math.max(0, r?.physical_stock ?? 0)
    form.quantity = max > 0 ? 1 : 0
    form.requisition_reason = ''
    form.usage_location = ''
    form.remark = ''
  },
  { immediate: true }
)

watch(visible, (v) => {
  if (v && props.row) {
    const max = Math.max(0, props.row.physical_stock ?? 0)
    form.quantity = max > 0 ? 1 : 0
    form.requisition_reason = ''
    form.usage_location = ''
    form.remark = ''
  }
})

const handleClose = () => {
  if (!submitting.value) visible.value = false
}

const handleSubmit = async () => {
  if (!formRef.value || !props.row) return
  if (!requisitionerDisplay.value) {
    window.$message?.warning('领用人信息缺失，请重新登录或联系管理员完善真实姓名')
    return
  }
  try {
    await formRef.value.validate()
    const max = Math.max(0, props.row.physical_stock ?? 0)
    if (form.quantity < 1 || form.quantity > max) {
      window.$message?.warning('领用数量需在 1 与当前设备库存之间')
      return
    }
    submitting.value = true
    await sparePartApi.requisition(props.row.id, form.quantity, form.requisition_reason, form.usage_location, form.remark || undefined)
    broadcastSparePartDataChanged()
    window.$message?.success('领用成功')
    visible.value = false
    emit('success')
  } catch (e: any) {
    if (e?.message) window.$message?.error(e.message)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.requisition-part-label {
  font-size: 14px;
  color: var(--sp-text-secondary);
}

.requisition-tip {
  font-size: 12px;
  color: var(--sp-warning);
  margin-top: 4px;
  display: block;
}

.requisition-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.requisition-dialog__footer--mobile {
  padding: 12px 0;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0));
}

.requisition-dialog__footer--mobile .n-button {
  flex: 1;
}
</style>
