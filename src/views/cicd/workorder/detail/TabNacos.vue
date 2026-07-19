<template>
  <div class="p-3">
    <div class="mb-3 flex justify-between items-center">
      <span class="text-sm text-gray-500">共 {{ nacosChanges.length }} 处配置变更</span>
      <Button size="small" type="primary" ghost @click="message.info('导出功能待对接')">导出变更单</Button>
    </div>

    <Collapse :defaultActiveKey="nacosChanges.map(i => i.id)">
      <CollapsePanel v-for="item in nacosChanges" :key="item.id">
        <template #header>
          <div class="flex items-center gap-3">
            <Tag :color="changeTypeColor[item.changeType]" class="text-xs">{{ item.changeType }}</Tag>
            <span class="font-mono text-sm font-medium">{{ item.dataId }}</span>
            <span class="text-xs text-gray-400">{{ item.namespace }} / {{ item.group }}</span>
          </div>
        </template>

        <div class="grid grid-cols-2 gap-3">
          <!-- Before -->
          <div>
            <div class="text-xs font-semibold text-red-500 mb-1 flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
              变更前
            </div>
            <div v-if="item.before" class="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded p-3 font-mono text-xs text-red-700 dark:text-red-300 whitespace-pre leading-5">{{ item.before }}</div>
            <div v-else class="bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 rounded p-3 text-xs text-gray-400 text-center">（无）</div>
          </div>
          <!-- After -->
          <div>
            <div class="text-xs font-semibold text-green-600 mb-1 flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
              变更后
            </div>
            <div v-if="item.after" class="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded p-3 font-mono text-xs text-green-700 dark:text-green-300 whitespace-pre leading-5">{{ item.after }}</div>
            <div v-else class="bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 rounded p-3 text-xs text-gray-400 text-center">（已删除）</div>
          </div>
        </div>
      </CollapsePanel>
    </Collapse>

    <Empty v-if="!nacosChanges.length" description="暂无 NACOS 配置变更" class="py-8" />
  </div>
</template>

<script setup lang="ts">
  import { message, Button, Tag, Collapse, Empty } from 'ant-design-vue';

  const CollapsePanel = Collapse.Panel;

  defineProps<{ nacosChanges: any[] }>();

  const changeTypeColor: Record<string, string> = {
    'update': 'orange',
    'add': 'green',
    'delete': 'red',
  };
</script>
