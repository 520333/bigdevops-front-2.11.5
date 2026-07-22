<template>
  <div class="p-4">
    <div class="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm mb-4">
      <a-tabs v-model:activeKey="activeTab" type="line" size="large">
        <a-tab-pane key="service" tab="Service (服务访问入口)">
          <ServiceList />
        </a-tab-pane>
        <a-tab-pane key="ingress" tab="Ingress (7层应用路由)">
          <IngressList />
        </a-tab-pane>
      </a-tabs>
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
