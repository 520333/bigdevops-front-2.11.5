<template>
  <div class="space-y-4 p-2">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-sm font-bold text-gray-700 dark:text-gray-200">
          关联 Archery SQL 工单清单 (共 {{ list.length }} 个)
        </span>
        <Tag :color="allSqlExecuted ? 'success' : 'error'">
          {{ allSqlExecuted ? '✓ 前置 SQL 变更已全部就绪' : '⚠️ 存在未执行的 SQL 工单，应用发布将受限' }}
        </Tag>
      </div>

      <Space>
        <Button type="primary" size="small" @click="handleOpenSelectArcheryModal">
          关联 Archery 工单
        </Button>
      </Space>
    </div>

    <Table
      :data-source="list"
      :columns="columns"
      row-key="id"
      :pagination="false"
      size="middle"
      bordered
      class="bg-white dark:bg-[#151515] rounded border border-gray-100 dark:border-zinc-800"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'workflowId'">
          <span class="font-mono font-bold text-blue-600">#{{ record.workflowId }}</span>
        </template>

        <template v-else-if="column.key === 'dbName'">
          <Tag color="processing" class="font-mono">{{ record.dbName }}</Tag>
          <span class="text-xs text-gray-400 ml-1">({{ record.groupName }})</span>
        </template>

        <template v-else-if="column.key === 'syntaxType'">
          <Tag :color="record.syntaxType === 1 ? 'warning' : 'processing'">
            {{ record.syntaxType === 1 ? 'DDL 结构' : 'DML 数据' }}
          </Tag>
        </template>

        <template v-else-if="column.key === 'status'">
          <Tag :color="record.status === 'workflow_finish' ? 'success' : 'warning'">
            {{ record.status === 'workflow_finish' ? '已执行完成' : '待审批 / 待执行' }}
          </Tag>
        </template>

        <template v-else-if="column.key === 'isBackup'">
          <Tag :color="record.isBackup ? 'success' : 'default'">
            {{ record.isBackup ? '是' : '否' }}
          </Tag>
        </template>

        <template v-else-if="column.key === 'action'">
          <Button type="link" danger size="small" @click="handleRemoveItem(index)">
            解除关联
          </Button>
        </template>
      </template>
    </Table>

    <!-- 关联现有工单弹窗 -->
    <Modal
      v-model:open="selectModalVisible"
      title="从 Archery 选择待关联的 SQL 工单"
      width="800px"
      @ok="handleConfirmSelect"
    >
      <div class="py-2 space-y-3">
        <InputSearch
          v-model:value="archerySearchText"
          placeholder="搜索工单标题、数据库或发起人..."
          @search="fetchArcheryWorkflows"
        />
        <Table
          :data-source="availableWorkflows"
          :columns="modalColumns"
          :row-selection="rowSelection"
          row-key="id"
          size="small"
          :pagination="{ pageSize: 5 }"
          bordered
        />
      </div>
    </Modal>
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed, PropType } from 'vue';
  import {
    Table,
    Tag,
    Button,
    Space,
    Modal,
    InputSearch,
    message,
  } from 'ant-design-vue';
  import { getArcheryWorkflowsApi } from '@/api/workorder/archery';
  import type { SqlWorkflowItem } from '../types';

  const props = defineProps({
    modelValue: {
      type: Array as PropType<SqlWorkflowItem[]>,
      required: true,
    },
  });

  const list = props.modelValue;
  const selectModalVisible = ref(false);
  const archerySearchText = ref('');
  const availableWorkflows = ref<any[]>([]);
  const selectedRowKeys = ref<number[]>([]);
  const selectedRows = ref<any[]>([]);

  const allSqlExecuted = computed(() => {
    return list.every((item) => item.status === 'workflow_finish');
  });

  const columns = [
    { title: '工单号', key: 'workflowId', width: 90, align: 'center' as const },
    { title: '工单标题', dataIndex: 'workflowName', key: 'workflowName', minWidth: 220 },
    { title: '目标数据库', key: 'dbName', width: 220 },
    { title: '类型', key: 'syntaxType', width: 100, align: 'center' as const },
    { title: '发起人', dataIndex: 'engineer', width: 110, align: 'center' as const },
    { title: '执行状态', key: 'status', width: 130, align: 'center' as const },
    { title: '备份', key: 'isBackup', width: 75, align: 'center' as const },
    { title: '操作', key: 'action', width: 100, align: 'center' as const },
  ];

  const modalColumns = [
    { title: '工单号', dataIndex: 'workflow_id', width: 80 },
    { title: '标题', dataIndex: 'workflow_name' },
    { title: '目标数据库', dataIndex: 'db_name', width: 120 },
    { title: '发起人', dataIndex: 'engineer', width: 100 },
  ];

  const rowSelection = {
    selectedRowKeys: selectedRowKeys,
    onChange: (keys: any[], rows: any[]) => {
      selectedRowKeys.value = keys;
      selectedRows.value = rows;
    },
  };

  const fetchArcheryWorkflows = async () => {
    try {
      const res = await getArcheryWorkflowsApi({ limit: 20 });
      if (res && res.items) {
        availableWorkflows.value = res.items.map((item: any) => ({
          id: item.workflow?.id || item.id,
          workflow_id: item.workflow_id || item.workflow?.id,
          workflow_name: item.workflow?.workflow_name,
          db_name: item.workflow?.db_name,
          group_name: item.workflow?.group_name,
          syntax_type: item.workflow?.syntax_type,
          status: item.workflow?.status,
          engineer: item.workflow?.engineer,
          is_backup: item.workflow?.is_backup,
        }));
      }
    } catch {
      availableWorkflows.value = [
        {
          id: 1277,
          workflow_id: 1277,
          workflow_name: '测试2 - 支付流水表结构扩展新增字段',
          db_name: 'v1',
          group_name: '花花卡-生产环境',
          syntax_type: 1,
          status: 'workflow_finish',
          engineer: '测试用户',
          is_backup: true,
        },
      ];
    }
  };

  const handleOpenSelectArcheryModal = () => {
    fetchArcheryWorkflows();
    selectModalVisible.value = true;
  };

  const handleConfirmSelect = () => {
    selectedRows.value.forEach((row) => {
      const exists = list.some((item) => item.workflowId === row.workflow_id);
      if (!exists) {
        list.push({
          id: row.id,
          workflowId: row.workflow_id,
          workflowName: row.workflow_name,
          dbName: row.db_name,
          groupName: row.group_name || '花花卡-生产环境',
          syntaxType: row.syntax_type || 1,
          status: row.status || 'workflow_finish',
          engineer: row.engineer || '当前用户',
          isBackup: !!row.is_backup,
        });
      }
    });
    message.success(`已成功关联 ${selectedRows.value.length} 个 Archery SQL 工单`);
    selectModalVisible.value = false;
  };

  const handleRemoveItem = (index: number) => {
    list.splice(index, 1);
  };
</script>
