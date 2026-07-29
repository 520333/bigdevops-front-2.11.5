<template>
  <div class="p-4">
    <div class="bg-white dark:bg-gray-800 px-4 pt-2 mb-3 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
      <a-tabs v-model:activeKey="activeTab" :animated="false">
        <a-tab-pane key="service" tab="Service (服务访问入口)" />
        <a-tab-pane key="ingress" tab="Ingress (7层应用路由)" />
      </a-tabs>
    </div>
    <div v-show="activeTab === 'service'">
      <ServiceList />
    </div>
    <div v-show="activeTab === 'ingress'">
      <IngressList />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { Tabs as ATabs, TabPane as ATabPane } from 'ant-design-vue';
  import ServiceList from './ServiceList.vue';
  import IngressList from './IngressList.vue';

  const activeTab = ref('service');
</script>
