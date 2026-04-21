<template>
  <div class="electrical-layout">
    <router-view v-slot="{ Component, route }">
      <Transition name="page-slide" mode="out-in">
        <keep-alive :max="8" :include="cachedViews">
          <component :is="Component" :key="route.name" class="page-view" />
        </keep-alive>
      </Transition>
    </router-view>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'ElectricalLayout'
})

import { onMounted, onActivated, watch } from 'vue'
import { useRoute } from 'vue-router'
import { navLog } from '@/utils/navLog'

const route = useRoute()

onMounted(() => {
  navLog('ElectricalLayout mounted', { path: route.path })
})
watch(() => route.path, (path) => {
  navLog('ElectricalLayout route change', { path })
}, { immediate: false })

const cachedViews = [
  'SparePartList',
  'SparePartRequisition',
  'Inventory',
  'OperationLogs',
  'UserManage',
  'Reports'
]

onActivated(() => {
  navLog('ElectricalLayout activated', { path: route.path })
})
</script>

<style scoped>
.electrical-layout {
  height: 100%;
  min-height: 0;
  overflow: auto;
}

.page-slide-enter-active,
.page-slide-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}
.page-slide-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.page-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
.page-view {
  transform: translateZ(0);
}
</style>
