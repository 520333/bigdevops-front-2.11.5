<template>
  <div class="p-4">
    <div class="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm mb-4">
      <a-tabs v-model:activeKey="activeTab" type="line" size="large">
        <a-tab-pane key="deployment" tab="Deployment (无状态部署)">
          <DeploymentList />
        </a-tab-pane>
        <a-tab-pane key="statefulset" tab="StatefulSet (有状态服务)">
          <StatefulSetList />
        </a-tab-pane>
        <a-tab-pane key="daemonset" tab="DaemonSet (守护进程集)">
          <DaemonSetList />
        </a-tab-pane>
      </a-tabs>
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
