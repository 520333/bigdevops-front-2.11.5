<template>
  <div class="p-3">
    <!-- SQL 变更 -->
    <div class="mb-6">
      <div class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
        <span class="inline-block w-1 h-4 bg-blue-500 rounded-sm"></span>
        SQL 变更列表
        <Badge :count="sqlChanges.length" :overflow-count="99" />
      </div>
      <Table
        :dataSource="sqlChanges"
        :columns="sqlColumns"
        row-key="id"
        :pagination="false"
        bordered
        size="small"
        :expandedRowKeys="sqlExpanded"
        @expand="(e, r) => toggleExpand(sqlExpanded, r.id)"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="sqlStatusColor[record.status]">{{ record.statusText }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <a @click="toggleExpand(sqlExpanded, record.id)">查看SQL</a>
          </template>
        </template>
        <template #expandedRowRender="{ record }">
          <div class="bg-gray-900 rounded p-3 font-mono text-xs text-green-300 whitespace-pre leading-5">{{ record.content }}</div>
        </template>
      </Table>
      <Empty v-if="!sqlChanges.length" description="暂无 SQL 变更" class="py-4" />
    </div>

    <!-- ES 变更 -->
    <div class="mb-6">
      <div class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
        <span class="inline-block w-1 h-4 bg-yellow-500 rounded-sm"></span>
        ES 索引变更列表
        <Badge :count="esChanges.length" :overflow-count="99" />
      </div>
      <Table
        :dataSource="esChanges"
        :columns="esColumns"
        row-key="id"
        :pagination="false"
        bordered
        size="small"
        :expandedRowKeys="esExpanded"
        @expand="(e, r) => toggleExpand(esExpanded, r.id)"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="sqlStatusColor[record.status]">{{ record.statusText }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <a @click="toggleExpand(esExpanded, record.id)">查看 Mappings</a>
          </template>
        </template>
        <template #expandedRowRender="{ record }">
          <div class="bg-gray-900 rounded p-3 font-mono text-xs text-yellow-300 whitespace-pre leading-5">{{ JSON.stringify(JSON.parse(record.mappings), null, 2) }}</div>
        </template>
      </Table>
      <Empty v-if="!esChanges.length" description="暂无 ES 变更" class="py-4" />
    </div>

    <!-- MQ 变更 -->
    <div>
      <div class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
        <span class="inline-block w-1 h-4 bg-purple-500 rounded-sm"></span>
        MQ 消息队列变更列表
        <Badge :count="mqChanges.length" :overflow-count="99" />
      </div>
      <Table
        :dataSource="mqChanges"
        :columns="mqColumns"
        row-key="id"
        :pagination="false"
        bordered
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="sqlStatusColor[record.status]">{{ record.statusText }}</Tag>
          </template>
          <template v-if="column.key === 'config'">
            <span class="font-mono text-xs text-gray-500">{{ record.config }}</span>
          </template>
        </template>
      </Table>
      <Empty v-if="!mqChanges.length" description="暂无 MQ 变更" class="py-4" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { Table, Tag, Badge, Empty } from 'ant-design-vue';

  defineProps<{ sqlChanges: any[]; esChanges: any[]; mqChanges: any[] }>();

  const sqlExpanded = ref<number[]>([]);
  const esExpanded = ref<number[]>([]);

  function toggleExpand(arr: number[], id: number) {
    const idx = arr.indexOf(id);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(id);
  }

  const sqlStatusColor: Record<string, string> = {
    success: 'success', pending: 'default', running: 'processing', failed: 'error',
  };

  const sqlColumns = [
    { title: '数据库', dataIndex: 'database', key: 'database', width: 120 },
    { title: '脚本文件名', dataIndex: 'filename', key: 'filename', ellipsis: true },
    { title: '状态', key: 'status', width: 90 },
    { title: '执行时间', dataIndex: 'execTime', key: 'execTime', width: 170 },
    { title: '操作', key: 'action', width: 100 },
  ];

  const esColumns = [
    { title: '集群', dataIndex: 'cluster', key: 'cluster', width: 150 },
    { title: '索引名', dataIndex: 'index', key: 'index', width: 180 },
    { title: '变更类型', dataIndex: 'changeType', key: 'changeType', width: 100 },
    { title: '状态', key: 'status', width: 90 },
    { title: '操作', key: 'action', width: 120 },
  ];

  const mqColumns = [
    { title: '集群', dataIndex: 'cluster', key: 'cluster', width: 150 },
    { title: 'Topic', dataIndex: 'topic', key: 'topic', width: 200 },
    { title: '变更类型', dataIndex: 'changeType', key: 'changeType', width: 100 },
    { title: '状态', key: 'status', width: 90 },
    { title: '配置详情', key: 'config', ellipsis: true },
  ];
</script>
