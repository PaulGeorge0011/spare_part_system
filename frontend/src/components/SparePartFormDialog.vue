<template>
  <n-modal
    v-model:show="dialogVisible"
    preset="card"
    :title="formTitle"
    :style="isMobile ? 'width: 100%; height: 100%; max-width: 100%;' : 'width: 800px;'"
    :mask-closable="!submitting"
    :closable="!submitting"
    :on-after-leave="resetForm"
    class="spare-part-form-dialog"
    :class="{ 'spare-part-form-dialog--mobile': isMobile }"
  >
    <!-- 表单 -->
    <n-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-width="isMobile ? undefined : 120"
      :label-placement="isMobile ? 'top' : 'right'"
    >
      <!-- 第一行：货位号和MES编码 -->
      <n-grid :cols="isMobile ? 1 : 2" :x-gap="isMobile ? 0 : 20">
        <n-gi>
          <n-form-item label="货位号" path="location_code">
            <n-input
              v-model:value="formData.location_code"
              placeholder="如：A-01-01"
              clearable
            />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item label="MES物料编码" path="mes_material_code">
            <n-input
              v-model:value="formData.mes_material_code"
              placeholder="如：MAT_001"
              clearable
              :disabled="isEditMode"
              @update:value="handleMaterialCodeChange"
            />
            <div class="form-tip" v-if="isEditMode">
              MES编码创建后不可修改
            </div>
          </n-form-item>
        </n-gi>
      </n-grid>

      <!-- 第二行：物料描述 -->
      <n-grid :cols="isMobile ? 1 : 2" :x-gap="isMobile ? 0 : 20">
        <n-gi>
          <n-form-item label="MES物料描述">
            <n-input
              v-model:value="formData.mes_material_desc"
              placeholder="MES系统中的描述"
              clearable
            />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item label="实物物料描述">
            <n-input
              v-model:value="formData.physical_material_desc"
              placeholder="实际物料的描述"
              clearable
            />
          </n-form-item>
        </n-gi>
      </n-grid>

      <!-- 第三行：规格和品牌 -->
      <n-grid :cols="isMobile ? 1 : 2" :x-gap="isMobile ? 0 : 20">
        <n-gi>
          <n-form-item label="规格型号">
            <n-input
              v-model:value="formData.specification_model"
              placeholder="规格型号"
              clearable
            />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item label="适用机型">
            <n-input
              v-model:value="formData.applicable_model"
              placeholder="如：机型A,机型B"
              clearable
            />
          </n-form-item>
        </n-gi>
      </n-grid>

      <!-- 第四行：品牌和单位 -->
      <n-grid :cols="isMobile ? 1 : 2" :x-gap="isMobile ? 0 : 20">
        <n-gi>
          <n-form-item label="品牌">
            <n-input
              v-model:value="formData.brand"
              placeholder="品牌"
              clearable
            />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item label="数量单位" path="unit">
            <n-input
              v-model:value="formData.unit"
              placeholder="如：个、台、米"
              clearable
            />
          </n-form-item>
        </n-gi>
      </n-grid>

      <!-- 第五行：库存信息 -->
      <n-grid :cols="isMobile ? 1 : 2" :x-gap="isMobile ? 0 : 20">
        <n-gi>
          <n-form-item label="MES库存" path="mes_stock">
            <n-input-number
              v-model:value="formData.mes_stock"
              :min="0"
              :step="1"
              :precision="2"
              button-placement="right"
              style="width: 100%"
            />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item label="实物库存" path="physical_stock">
            <n-input-number
              v-model:value="formData.physical_stock"
              :min="0"
              :step="1"
              :precision="2"
              button-placement="right"
              style="width: 100%"
            />
          </n-form-item>
        </n-gi>
      </n-grid>

      <!-- 第六行：存放地 -->
      <n-grid :cols="isMobile ? 1 : 2" :x-gap="isMobile ? 0 : 20">
        <n-gi>
          <n-form-item label="存放地">
            <n-input
              v-model:value="formData.storage_location"
              placeholder="具体存放位置"
              clearable
            />
          </n-form-item>
        </n-gi>
      </n-grid>

      <!-- 图片上传部分 -->
      <n-grid :cols="isMobile ? 1 : 2" :x-gap="isMobile ? 0 : 20">
        <n-gi>
          <n-form-item label="实物图片1">
            <div class="image-upload-section">
              <ImageUploader
                ref="primaryImageUploader"
                v-model="formData.physical_image_url"
                :upload-id="primaryImageUploadId"
                :material-code="formData.mes_material_code"
                :spare-part-id="formData.id"
                image-type="primary"
                :max-size-mb="10"
                @update:upload-id="handlePrimaryImageUploadId"
                @uploaded="handleImageUploaded('primary', $event)"
                @removed="handleImageRemoved('primary')"
              />

            </div>
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item label="实物图片2">
            <div class="image-upload-section">
              <ImageUploader
                ref="secondaryImageUploader"
                v-model="formData.physical_image_url2"
                :upload-id="secondaryImageUploadId"
                :material-code="formData.mes_material_code"
                :spare-part-id="formData.id"
                image-type="secondary"
                :max-size-mb="10"
                @update:upload-id="handleSecondaryImageUploadId"
                @uploaded="handleImageUploaded('secondary', $event)"
                @removed="handleImageRemoved('secondary')"
              />
            </div>
          </n-form-item>
        </n-gi>
      </n-grid>
      <!-- 图片上传提示 -->
      <n-alert
        title="图片上传说明"
        type="info"
        :closable="false"
        class="image-upload-tips"
      >
        <div style="font-size: 12px; line-height: 1.5;">
          <p>• 点击上传按钮上传图片（支持 JPG、PNG、GIF、WebP、BMP 格式，最大 10MB）</p>
          <p>• 图片将先上传到临时存储，提交表单后才转为永久存储</p>
          <p>• 临时图片24小时后自动清理</p>
        </div>
      </n-alert>

      <!-- 第七行：备注（全宽） -->
      <n-form-item label="备注">
        <n-input
          v-model:value="formData.remarks"
          type="textarea"
          :rows="3"
          placeholder="其他备注信息"
          :maxlength="500"
          show-count
        />
      </n-form-item>
    </n-form>

    <!-- 对话框底部 -->
    <template #footer>
      <span class="dialog-footer" :class="{ 'dialog-footer--mobile': isMobile }">
        <n-button :size="isMobile ? 'large' : 'medium'" @click="handleClose" :disabled="submitting">取消</n-button>
        <n-button
          type="primary"
          :size="isMobile ? 'large' : 'medium'"
          @click="handleSubmit"
          :loading="submitting"
        >
          {{ submitButtonText }}
        </n-button>
      </span>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { useIsMobile } from '@/composables/useIsMobile'
import {
  NModal, NForm, NFormItem, NInput, NInputNumber,
  NButton, NGrid, NGi, NAlert,
  type FormInst, type FormRules,
} from 'naive-ui'
import ImageUploader from '@/components/common/ImageUploader.vue'
import type { SparePart, SparePartCreate, SparePartUpdate } from '@/types/sparePart'
import {
  deletePermanentImage,
  getTempImage,
  getTempImagesBatch
} from '@/utils/imageUpload'
import {
  sparePartApi,
  createSparePartWithImages,
  updateSparePartWithImages,
  syncSparePartImages
} from '@/api/sparePart'

// 定义组件Props
interface Props {
  modelValue: boolean
  formData?: Partial<SparePart>
  mode?: 'create' | 'edit'
}

const { isMobile } = useIsMobile()

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  formData: () => ({}),
  mode: 'create',
})

// 定义组件Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': [data: SparePart]
  'cancel': []
}>()

// 响应式数据
const formRef = ref<FormInst | null>(null)
const submitting = ref(false)
const primaryImageUploader = ref<any>()
const secondaryImageUploader = ref<any>()

// 图片相关数据
const primaryImageUploadId = ref('')
const secondaryImageUploadId = ref('')
const imageUploadIds = ref<string[]>([])
const imagesToDelete = ref<number[]>([])
const existingImages = ref<any[]>([])
// 当前槽位对应的已存在图片 id（用于删除时提交 image_ids_to_delete）
const primaryExistingImageId = ref<number | null>(null)
const secondaryExistingImageId = ref<number | null>(null)

// 表单数据
const formData = reactive<SparePartCreate & SparePartUpdate & { id?: number }>({
  location_code: '',
  mes_material_code: '',
  mes_material_desc: '',
  physical_material_desc: '',
  specification_model: '',
  applicable_model: '',
  brand: '',
  mes_stock: 0,
  physical_stock: 0,
  unit: '个',
  remarks: '',
  storage_location: '',
  physical_image_url: '',
  physical_image_url2: '',
  ...props.formData,
})

// 表单验证规则
const formRules: FormRules = {
  location_code: [
    { required: true, message: '请输入货位号', trigger: 'blur' },
    { max: 50, message: '货位号不能超过50个字符', trigger: 'blur' },
  ],
  mes_material_code: [
    { required: true, message: '请输入MES物料编码', trigger: 'blur' },
    { max: 100, message: 'MES编码不能超过100个字符', trigger: 'blur' },
  ],
  mes_stock: [
    { required: true, message: '请输入MES库存', trigger: 'blur' },
    { type: 'number', min: 0, message: '库存不能为负数', trigger: 'blur' },
  ],
  physical_stock: [
    { required: true, message: '请输入实物库存', trigger: 'blur' },
    { type: 'number', min: 0, message: '库存不能为负数', trigger: 'blur' },
  ],
  unit: [
    { required: true, message: '请输入数量单位', trigger: 'blur' },
    { max: 20, message: '单位不能超过20个字符', trigger: 'blur' },
  ],
}

// 计算属性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const isEditMode = computed(() => props.mode === 'edit')

const formTitle = computed(() => {
  return isEditMode.value ? '编辑设备信息' : '新增设备'
})

const submitButtonText = computed(() => {
  return submitting.value
    ? (isEditMode.value ? '更新中...' : '创建中...')
    : (isEditMode.value ? '更新' : '创建')
})

// 方法
const handleClose = () => {
  if (submitting.value) {
    window.$message?.warning('正在提交，请稍候...')
    return
  }

  emit('cancel')
  dialogVisible.value = false
  resetForm()
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.restoreValidation()
  }
  Object.assign(formData, {
    location_code: '',
    mes_material_code: '',
    mes_material_desc: '',
    physical_material_desc: '',
    specification_model: '',
    applicable_model: '',
    brand: '',
    mes_stock: 0,
    physical_stock: 0,
    unit: '个',
    remarks: '',
    storage_location: '',
    physical_image_url: '',
    physical_image_url2: '',
  })
  imageUploadIds.value = []
  imagesToDelete.value = []
  existingImages.value = []
  primaryImageUploadId.value = ''
  secondaryImageUploadId.value = ''
  primaryExistingImageId.value = null
  secondaryExistingImageId.value = null
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    // 验证表单
    await formRef.value.validate()

    submitting.value = true

    // 检查物料编码
    if (!formData.mes_material_code) {
      window.$message?.error('请输入MES物料编码')
      return
    }

    // 收集所有临时图片的upload_id
    const allUploadIds = []
    if (primaryImageUploadId.value) allUploadIds.push(primaryImageUploadId.value)
    if (secondaryImageUploadId.value) allUploadIds.push(secondaryImageUploadId.value)

    // 准备提交数据 - 根据后端schema适配
    const submitData: any = {
      location_code: formData.location_code,
      mes_material_code: formData.mes_material_code,
      mes_material_desc: formData.mes_material_desc,
      physical_material_desc: formData.physical_material_desc,
      specification_model: formData.specification_model,
      applicable_model: formData.applicable_model,
      brand: formData.brand,
      mes_stock: formData.mes_stock,
      physical_stock: formData.physical_stock,
      unit: formData.unit,
      remarks: formData.remarks,
      storage_location: formData.storage_location,
    }

    let result: SparePart

    if (isEditMode.value && formData.id) {
      // 更新修复件（包含图片处理）
      console.log('更新修复件，ID:', formData.id, '临时图片:', allUploadIds, '删除图片:', imagesToDelete.value)

      result = await updateSparePartWithImages(
        formData.id,
        submitData,
        allUploadIds,
        imagesToDelete.value
      )

    } else {
      // 创建修复件（包含图片处理）
      console.log('创建修复件，临时图片:', allUploadIds)

      result = await createSparePartWithImages(
        submitData,
        allUploadIds
      )
    }



    // 触发父组件成功事件（传递 mode/data/id，避免 handleDialogSuccess 解构 result.mode 报错）
    emit('success', { mode: props.mode, data: result, id: result?.id } as any)
    dialogVisible.value = false
    resetForm()

    window.$message?.success(isEditMode.value ? '修复件更新成功' : '修复件创建成功')

  } catch (error: any) {
    console.error('表单提交失败:', error)

    // Naive UI validate throws on failure, check if it's a validation error
    if (error?.length || error?.message === 'validation failed') return

    let errorMessage = isEditMode.value ? '更新失败，请重试' : '创建失败，请重试'
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }

    window.$message?.error(errorMessage)
  } finally {
    submitting.value = false
  }
}

// 在 script 部分添加错误处理函数

const handlePreviewImageError = (type: 'primary' | 'secondary') => {
  console.error('图片预览加载失败:', type)

  // 设置默认图片
  if (type === 'primary') {
    formData.physical_image_url = '/src/assets/no-image.png'
  } else {
    formData.physical_image_url2 = '/src/assets/no-image.png'
  }
}

// 图片相关方法
const handleMaterialCodeChange = () => {
  // 物料编码改变时，清空图片上传器
  if (primaryImageUploader.value) {
    primaryImageUploader.value.clear()
  }
  if (secondaryImageUploader.value) {
    secondaryImageUploader.value.clear()
  }
}

const handlePrimaryImageUploadId = (uploadId: string) => {
  primaryImageUploadId.value = uploadId
  updateImageUploadIds()
}

const handleSecondaryImageUploadId = (uploadId: string) => {
  secondaryImageUploadId.value = uploadId
  updateImageUploadIds()
}

const handleImageUploaded = (type: 'primary' | 'secondary', response: any) => {
  console.log('图片上传成功:', type, response)
  window.$message?.success('图片上传成功')
}

const handleImageRemoved = (type: 'primary' | 'secondary') => {
  if (type === 'primary') {
    if (primaryExistingImageId.value != null) {
      if (!imagesToDelete.value.includes(primaryExistingImageId.value)) {
        imagesToDelete.value.push(primaryExistingImageId.value)
      }
      primaryExistingImageId.value = null
    }
    formData.physical_image_url = ''
    primaryImageUploadId.value = ''
  } else {
    if (secondaryExistingImageId.value != null) {
      if (!imagesToDelete.value.includes(secondaryExistingImageId.value)) {
        imagesToDelete.value.push(secondaryExistingImageId.value)
      }
      secondaryExistingImageId.value = null
    }
    formData.physical_image_url2 = ''
    secondaryImageUploadId.value = ''
  }
  updateImageUploadIds()
}

const handleImageError = (event: any) => {
  console.error('图片加载失败:', event)
  const img = event.target as HTMLImageElement

  // 设置默认图片
  img.src = '/src/assets/no-image.png'
}

const updateImageUploadIds = () => {
  imageUploadIds.value = []
  if (primaryImageUploadId.value) {
    imageUploadIds.value.push(primaryImageUploadId.value)
  }
  if (secondaryImageUploadId.value) {
    imageUploadIds.value.push(secondaryImageUploadId.value)
  }
}

const markImageForDeletion = async (imageId: number) => {
  window.$dialog?.warning({
    title: '删除确认',
    content: '确定要删除这张图片吗？删除后不可恢复',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      // 添加到待删除列表
      if (!imagesToDelete.value.includes(imageId)) {
        imagesToDelete.value.push(imageId)
      }

      // 从现有图片列表中移除
      existingImages.value = existingImages.value.filter(img => img.id !== imageId)

      window.$message?.success('图片已标记为删除')
    },
  })
}

const previewImage = (image: any) => {
  if (image.url) {
    window.open(image.url, '_blank')
  }
}

const getDisplayFilename = (image: any): string => {
  return image.original_filename || image.filename || '未知文件'
}

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '未知'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 加载已有图片（编辑模式下）
// 在 script 部分修改 loadExistingImages 函数

const loadExistingImages = async () => {
  if (!isEditMode.value || !formData.id) {
    return
  }

  try {
    // 使用 with-images 接口一次获取详情+图片列表，避免 /images/by-spare-part 404
    const detail = await sparePartApi.getDetailWithImages(formData.id!) as any
    if (!detail || typeof detail !== 'object') return

    if (detail.physical_image_url) formData.physical_image_url = detail.physical_image_url
    if (detail.physical_image_url2) formData.physical_image_url2 = detail.physical_image_url2

    const images = Array.isArray(detail.images) ? detail.images : []
    primaryExistingImageId.value = null
    secondaryExistingImageId.value = null
    existingImages.value = images.map((img: any) => ({
      id: img.id,
      url: img.url,
      filename: img.filename,
      size: img.size,
      is_temp: img.is_temp,
      upload_id: img.upload_id
    }))

    // 按索引顺序优先赋值（images 按 uploaded_at ASC 排列，与 slot 0/1 对应）
    if (existingImages.value[0]) primaryExistingImageId.value = existingImages.value[0].id
    if (existingImages.value[1]) secondaryExistingImageId.value = existingImages.value[1].id
    // 再用路径匹配（去掉 presigned 签名参数）进行二次修正
    const stripQuery = (url: string) => (url || '').split('?')[0]
    const u1path = stripQuery(formData.physical_image_url || '')
    const u2path = stripQuery(formData.physical_image_url2 || '')
    for (const img of existingImages.value) {
      const imgPath = stripQuery(img.url || '')
      if (imgPath && u1path && imgPath === u1path) primaryExistingImageId.value = img.id
      else if (imgPath && u2path && imgPath === u2path) secondaryExistingImageId.value = img.id
    }

    if ((!formData.physical_image_url || !formData.physical_image_url2) && existingImages.value.length > 0) {
      try {
        await syncSparePartImages(formData.id!)
        const updated = await sparePartApi.getDetailWithImages(formData.id!) as any
        if (updated?.physical_image_url) formData.physical_image_url = updated.physical_image_url
        if (updated?.physical_image_url2) formData.physical_image_url2 = updated.physical_image_url2
      } catch {
        /* 同步失败时保留已有数据 */
      }
    }
  } catch {
    existingImages.value = []
    primaryExistingImageId.value = null
    secondaryExistingImageId.value = null
  }
}
// 监听props变化，更新表单数据
watch(
  () => props.formData,
  (newData) => {
    if (newData && Object.keys(newData).length > 0) {
      Object.assign(formData, newData)

      // 编辑模式下加载已有图片
      if (isEditMode.value && formData.id) {
        nextTick(() => {
          loadExistingImages()
        })
      }
    }
  },
  { deep: true, immediate: true }
)

// 监听对话框显示状态
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && isEditMode.value && formData.id) {
      console.log('对话框打开，加载图片')
      loadExistingImages()
    }
  }
)

// 组件挂载时也尝试加载
onMounted(() => {
  if (props.modelValue && isEditMode.value && formData.id) {
    console.log('组件挂载，加载图片')
    loadExistingImages()
  }
})
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.image-upload-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.existing-images {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 8px;
}

.existing-image-item {
  position: relative;
  width: 140px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  padding: 8px;
  background: white;
}

.existing-image-item img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  background-color: #f5f7fa;
}

.image-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s;
}

.existing-image-item:hover .image-actions {
  opacity: 1;
}

.image-info {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.image-info .filename {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.image-info .size {
  color: #999;
  text-align: right;
}

.image-upload-tips {
  margin-top: 10px;
  margin-bottom: 10px;
}

.image-upload-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.image-preview {
  margin-top: 8px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 8px;
  background-color: #fafafa;
  text-align: center;
}

.preview-image {
  max-width: 100%;
  max-height: 120px;
  object-fit: contain;
  border-radius: 4px;
}

.preview-info {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

/* 移动端：全屏弹窗，内容可滚动，底部按钮固定 */
.spare-part-form-dialog--mobile :deep(.n-card) {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  border-radius: 0;
}
.spare-part-form-dialog--mobile :deep(.n-card__content) {
  padding: 16px;
  padding-bottom: 24px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.spare-part-form-dialog--mobile :deep(.n-form-item) {
  margin-bottom: 18px;
}
.spare-part-form-dialog--mobile :deep(.n-form-item-label) {
  margin-bottom: 6px;
}
.spare-part-form-dialog--mobile :deep(.n-input-number) {
  width: 100%;
}
.spare-part-form-dialog--mobile :deep(.n-card__footer) {
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0));
  border-top: 1px solid var(--sp-border-color, #efeff5);
}
.dialog-footer--mobile {
  display: flex !important;
  gap: 12px;
  width: 100%;
}
.dialog-footer--mobile .n-button {
  flex: 1;
}

/* 非全屏时的移动端适配 */
@media (max-width: 767px) {
  .spare-part-form-dialog:not(.spare-part-form-dialog--mobile) :deep(.n-card__content) {
    max-height: 65vh;
    overflow-y: auto;
    padding: 12px;
  }
  .spare-part-form-dialog:not(.spare-part-form-dialog--mobile) :deep(.n-form-item) {
    margin-bottom: 16px;
  }
  .spare-part-form-dialog:not(.spare-part-form-dialog--mobile) :deep(.n-input-number) {
    width: 100%;
  }
}
</style>
