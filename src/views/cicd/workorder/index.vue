<template>
  <PageWrapper dense contentFullHeight contentClass="flex">
    <BasicTable @register="registerTable" class="w-full">
      <template #toolbar>
        <Button type="primary" @click="handleCreate">新建工单</Button>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'orderNo'">
          <span class="font-mono text-xs text-gray-500">{{ record.orderNo }}</span>
        </template>
        <template v-if="column.key === 'title'">
          <a class="font-medium" @click="handleDetail(record)">{{ record.title }}</a>
        </template>
        <template v-if="column.key === 'env'">
          <Tag :color="envColorMap[record.envKey] || 'default'">{{ record.env }}</Tag>
        </template>
        <template v-if="column.key === 'status'">
          <Badge :status="statusMap[record.status]?.badge" :text="record.statusText" />
        </template>
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                label: '详情',
                onClick: handleDetail.bind(null, record),
              },
              {
                label: '审批',
                show: record.status === 'pending',
                onClick: handleApprove.bind(null, record),
              },
              {
                label: '删除',
                color: 'error',
                show: record.status !== 'success',
                popConfirm: {
                  title: '确认删除该工单？',
                  placement: 'left',
                  confirm: handleDelete.bind(null, record),
                },
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { Button, Tag, Badge, message } from 'ant-design-vue';
  import { BasicTable, useTable, TableAction } from '@/components/Table';
  import { PageWrapper } from '@/components/Page';
  import { getWorkorderList } from '@/api/cicd/cicd.mock';
  import { useRouter } from 'vue-router';

  const router = useRouter();

  const envColorMap: Record<string, string> = {
    dev: 'green',
    test: 'blue',
    pre: 'orange',
    prod: 'red',
  };

  const statusMap: Record<string, { badge: any }> = {
    pending: { badge: 'warning' },
    releasing: { badge: 'processing' },
    success: { badge: 'success' },
    rollback: { badge: 'error' },
  };

  const columns = [
    { title: '工单号', dataIndex: 'orderNo', key: 'orderNo', width: 160 },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '发布环境', dataIndex: 'env', key: 'env', width: 120 },
    { title: '发布类型', dataIndex: 'type', key: 'type', width: 110 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
    { title: '创建人', dataIndex: 'creator', key: 'creator', width: 100 },
    { title: '计划发布时间', dataIndex: 'planAt', key: 'planAt', width: 170 },
    { title: '操作', key: 'action', width: 160, fixed: 'right' },
  ];

  const [registerTable, { reload }] = useTable({
    title: '发布工单',
    api: getWorkorderList,
    rowKey: 'id',
    columns,
    formConfig: {
      labelWidth: 120,
      schemas: [
        {
          field: 'keyword',
          label: '搜索工单',
          component: 'Input',
          componentProps: {
            placeholder: '搜索工单号/标题',
          },
          colProps: { span: 8 },
        },
        {
          field: 'status',
          label: '工单状态',
          component: 'Select',
          componentProps: {
            options: [
              { label: '待审批', value: 'pending' },
              { label: '发布中', value: 'releasing' },
              { label: '已完成', value: 'success' },
              { label: '已回滚', value: 'rollback' },
            ],
          },
          colProps: { span: 8 },
        },
      ],
      autoSubmitOnEnter: true,
    },
    useSearchForm: true,
    showTableSetting: true,
    bordered: true,
    canResize: false,
  });

  function handleCreate() {
    message.info('新建工单功能待对接后端');
  }

  function handleDetail(record: any) {
    router.push(`/cicd/workorder/detail/${record.id}`);
  }

  function handleApprove(record: any) {
    record.status = 'releasing';
    record.statusText = '持续发布';
    message.success(`已批准工单 ${record.orderNo}`);
  }

  function handleDelete(record: any) {
    message.success(`工单 ${record.orderNo} 已删除`);
    reload();
  }
</script>