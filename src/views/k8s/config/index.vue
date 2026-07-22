<template>
  <div class="p-4">
    <div class="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm mb-4">
      <a-tabs v-model:activeKey="activeTab" type="line" size="large">
        <a-tab-pane key="configmap" tab="ConfigMap (配置字典)">
          <ConfigMapList />
        </a-tab-pane>
        <a-tab-pane key="secret" tab="Secret (密钥凭据)">
          <SecretList />
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { Tabs as ATabs, TabPane as ATabPane } from 'ant-design-vue';
  import ConfigMapList from './ConfigMapList.vue';
  import SecretList from './SecretList.vue';

  const activeTab = ref('configmap');
</script>
