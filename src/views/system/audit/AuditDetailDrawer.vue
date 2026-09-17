<template>
  <BasicDrawer v-bind="$attrs" @register="registerDrawer" title="操作审计日志明细" width="600px">
    <Description :column="2" :data="logData" :schema="detailSchema" class="mb-4" />

    <a-divider orientation="left">请求报文 Payload (已脱敏)</a-divider>
    <div class="code-container">
      <pre
        class="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono overflow-auto max-h-72">{{ formattedReqBody }}</pre>
    </div>

    <template v-if="logData?.respMessage">
      <a-divider orientation="left">响应结果摘要</a-divider>
      <div class="code-container">
        <pre
          class="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono overflow-auto max-h-48">{{ logData.respMessage }}</pre>
      </div>
    </template>
  </BasicDrawer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { Divider as ADivider } from 'ant-design-vue';
import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
import { Description } from '@/components/Description';
import { detailSchema } from './audit.data';

const logData = ref<Recordable>({});

const [registerDrawer] = useDrawerInner((data) => {
  logData.value = data?.record || {};
});

const formattedReqBody = computed(() => {
  const raw = logData.value?.reqBody;
  if (!raw) {
    return '无请求参数 (GET 或空 Payload)';
  }
  try {
    const parsed = JSON.parse(raw);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return raw;
  }
});
</script>

<style scoped>
.code-container pre {
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
