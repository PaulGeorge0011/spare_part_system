<template>
  <div class="spare-part-images">
    <!-- 表格专用紧凑布局 -->
    <div v-if="hasImages" class="compact-images">
      <div
        v-for="(image, index) in imageList"
        :key="index"
        class="compact-image-item"
      >
        <n-image
          :src="getOptimizedUrl(image.url)"
          :alt="image.alt || `图片 ${index + 1}`"
          object-fit="cover"
          :width="40"
          :height="40"
          class="table-image"
          :img-props="{ style: 'border-radius: 4px;' }"
        >
          <template #placeholder>
            <div class="image-loading">
              <n-spin :size="14" />
              <p>加载中</p>
            </div>
          </template>
        </n-image>

        <!-- 只在有多个图片时显示标签 -->
        <div v-if="imageList.length > 1" class="compact-image-label">
          {{ index === 0 ? '图1' : '图2' }}
        </div>
      </div>
    </div>

    <div v-else class="no-images-compact">
      <n-icon :size="20" :depth="3"><ImageOutline /></n-icon>
      <p>无图片</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NImage, NIcon, NSpin } from 'naive-ui'
import { ImageOutline } from '@vicons/ionicons5'
import { getImageUrl } from '@/utils/imageUpload'
import { getImageUrlForDisplay } from '@/utils/image'

interface Props {
  images: string[]
  editable?: boolean
  sparePartId?: number
  showHeader?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  images: () => [],
  editable: false,
  showHeader: true
})

const emit = defineEmits<{
  'edit': []
  'remove': [index: number]
}>()

const hasImages = computed(() => {
  return props.images.some(url => url && url.trim() !== '')
})

const imageList = computed(() => {
  return props.images
    .filter(url => url && url.trim() !== '')
    .map((url, index) => ({
      url,
      alt: `修复件图片 ${index + 1}`
    }))
})

const getOptimizedUrl = (url: string, options = { width: 120, quality: 80 }) => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return getImageUrlForDisplay(url)
  }

  if (url.startsWith('/api/v1/')) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin
    const pathWithoutPrefix = url.startsWith('/api/v1') ? url.substring(7) : url
    return `${baseUrl}${pathWithoutPrefix}`
  }

  if (url.startsWith('/images/')) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin
    return `${baseUrl}${url}`
  }

  try {
    return getImageUrl(url, options)
  } catch {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
  }
}
</script>

<style scoped>
.spare-part-images {
  width: 100%;
  height: 100%;
}

.compact-images {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.compact-image-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  position: relative;
}

.table-image {
  cursor: pointer;
  transition: transform 0.2s ease;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.table-image:hover {
  transform: scale(1.05);
  border-color: var(--sp-primary, #409eff);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.compact-image-label {
  font-size: 10px;
  color: #909399;
  background: #f5f7fa;
  padding: 1px 4px;
  border-radius: 2px;
  line-height: 1.2;
}

.image-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  color: #909399;
  background: #f5f7fa;
  border-radius: 4px;
}

.image-loading p {
  margin: 2px 0 0;
  font-size: 10px;
  text-align: center;
}

.no-images-compact {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #c0c4cc;
}

.no-images-compact p {
  margin: 4px 0 0;
  font-size: 10px;
  text-align: center;
}
</style>
