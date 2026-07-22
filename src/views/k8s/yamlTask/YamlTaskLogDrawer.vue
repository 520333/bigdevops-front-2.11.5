<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    :title="`执行历史记录 - [ ${taskTitle} ]`"
    width="65%"
    :showFooter="false"
  >
    <BasicTable @register="registerTable">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <Tag :color="record.status === 'SUCCESS' ? 'green' : 'red'">
            {{ record.status === 'SUCCESS' ? '成功 (SUCCESS)' : '失败 (FAILED)' }}
          </Tag>
        </template>
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'ant-design:code-outlined',
                tooltip: '查看当时应用 YAML',
                onClick: handlePreviewYaml.bind(null, record),
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>

    <!-- 🚀 查看应用 YAML 源码 Modal -->
    <a-modal
      v-model:open="previewVisible"
      :title="`历史应用 YAML 源码 (执行于 ${previewTime})`"
      width="60%"
    >
      <template #footer>
        <a-button type="primary" @click="handleDownloadHistoryYaml">
          下载该历史 YAML
        </a-button>
      </template>
      <div v-if="previewErrMsg" class="mb-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded text-red-600 text-xs font-mono break-all">
        <strong>报错异常:</strong> {{ previewErrMsg }}
      </div>
      <div class="p-2 border rounded bg-gray-900 overflow-hidden">
        <Codemirror
          v-model="previewYaml"
          :style="{ height: '420px' }"
          :disabled="true"
          :extensions="extensions"
        />
      </div>
    </a-modal>
  </BasicDrawer>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { Tag, Modal as AModal, Button as AButton } from 'ant-design-vue';
  import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
  import { BasicTable, useTable, TableAction, BasicColumn } from '@/components/Table';
  import { getK8sYamlTaskLogList } from '@/api/demo/system';
  import dayjs from 'dayjs';
  import { Codemirror } from 'vue-codemirror';
  import { oneDark } from '@codemirror/theme-one-dark';
  import { yaml } from '@codemirror/lang-yaml';
  import { useMessage } from '@/hooks/web/useMessage';

  const { createMessage } = useMessage();
  const taskTitle = ref('');
  const taskId = ref<number | string>(0);
  const extensions = [yaml(), oneDark];

  const previewVisible = ref(false);
  const previewYaml = ref('');
  const previewTime = ref('');
  const previewErrMsg = ref('');

  const logColumns: BasicColumn[] = [
    {
      title: '执行时间',
      dataIndex: 'CreatedAt',
      width: 170,
      format: (text) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作人',
      dataIndex: 'createUserName',
      width: 150,
      customRender: ({ record }) => record.createUserName || '系统',
    },
    {
      title: '目标集群',
      dataIndex: 'clusterName',
      width: 140,
      customRender: ({ record }) => record.clusterName || '-',
    },
    {
      title: '执行状态',
      dataIndex: 'status',
      key: 'status',
      width: 130,
    },
    {
      title: '失败消息',
      dataIndex: 'errMsg',
      ellipsis: true,
      customRender: ({ record }) => record.errMsg || '-',
    },
  ];

  const [registerTable, { reload, setProps }] = useTable({
    api: async (params) => {
      if (!taskId.value) return { items: [], total: 0 };
      return getK8sYamlTaskLogList({
        ...params,
        taskId: taskId.value,
      });
    },
    columns: logColumns,
    bordered: true,
    showIndexColumn: false,
    pagination: { pageSize: 10 },
    actionColumn: {
      width: 90,
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      fixed: 'right',
    },
  });

  const [registerDrawer] = useDrawerInner(async (data) => {
    taskId.value = data?.taskId || 0;
    taskTitle.value = data?.taskName || '';
    reload();
  });

  function handlePreviewYaml(record: Recordable) {
    previewTime.value = record.CreatedAt ? dayjs(record.CreatedAt).format('YYYY-MM-DD HH:mm:ss') : '';
    previewYaml.value = record.yamlContent || '';
    previewErrMsg.value = record.errMsg || '';
    previewVisible.value = true;
  }

  function handleDownloadHistoryYaml() {
    const filename = `${taskTitle.value || 'history'}-${previewTime.value.replace(/[: ]/g, '_')}.yaml`;
    const blob = new Blob([previewYaml.value], { type: 'text/yaml;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    createMessage.success(`历史 YAML 文件 ${filename} 已成功下载`);
  }
</script>
