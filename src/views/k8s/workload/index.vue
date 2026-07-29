<template>
  <div class="p-4">
    <div class="bg-white dark:bg-gray-800 px-4 pt-2 mb-3 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
      <a-tabs v-model:activeKey="activeTab" :animated="false">
        <a-tab-pane key="deployment" tab="Deployment (无状态部署)" />
        <a-tab-pane key="statefulset" tab="StatefulSet (有状态服务)" />
        <a-tab-pane key="daemonset" tab="DaemonSet (守护进程集)" />
      </a-tabs>
    </div>
    <div v-show="activeTab === 'deployment'">
      <DeploymentList />
    </div>
    <div v-show="activeTab === 'statefulset'">
      <StatefulSetList />
    </div>
    <div v-show="activeTab === 'daemonset'">
      <DaemonSetList />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { Tabs as ATabs, TabPane as ATabPane } from 'ant-design-vue';
  import DeploymentList from './DeploymentList.vue';
  import StatefulSetList from './StatefulSetList.vue';
  import DaemonSetList from './DaemonSetList.vue';

  const activeTab = ref('deployment');
</script>
