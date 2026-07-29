<template>
  <div class="p-4">
    <div class="bg-white dark:bg-gray-800 px-4 pt-2 mb-3 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
      <a-tabs v-model:activeKey="activeTab" :animated="false">
        <a-tab-pane key="configmap" tab="ConfigMap (配置字典)" />
        <a-tab-pane key="secret" tab="Secret (密钥凭据)" />
      </a-tabs>
    </div>
    <div v-show="activeTab === 'configmap'">
      <ConfigMapList />
    </div>
    <div v-show="activeTab === 'secret'">
      <SecretList />
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
