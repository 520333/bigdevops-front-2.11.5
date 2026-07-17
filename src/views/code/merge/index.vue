<template>
  <PageWrapper title="合并请求 (Merge Requests)" content="管理团队代码的代码审查(Code Review)与分支合并操作。">
    <BasicTable @register="registerTable">
      
      <template #toolbar>
        <a-button type="primary" preIcon="ant-design:plus-outlined" @click="handleCreateMR">
          新建合并请求
        </a-button>
      </template>

      <template #bodyCell="{ column, record }">
        
        <template v-if="column.key === 'branches'">
          <div class="flex items-center space-x-2">
            <Tag color="cyan">{{ record.sourceBranch }}</Tag>
            <Icon icon="ant-design:arrow-right-outlined" class="text-gray-400" />
            <Tag color="blue">{{ record.targetBranch }}</Tag>
          </div>
        </template>

        <template v-else-if="column.key === 'status'">
          <Tag :color="getStatusColor(record.status)">
            {{ getStatusText(record.status) }}
          </Tag>
        </template>

        <template v-else-if="column.key === 'action'">
          <TableAction :actions="[
            { 
              label: '审查与合并', 
              icon: 'ant-design:merge-cells-outlined', 
              type: 'primary',
              // 仅当状态为 pending (待合并) 时显示此按钮
              ifShow: record.status === 'pending',
              onClick: () => handleMerge(record) 
            },
            { 
              label: '查看', 
              icon: 'ant-design:eye-outlined', 
              ifShow: record.status !== 'pending',
              onClick: () => handleView(record) 
            }
          ]" />
        </template>
      </template>
    </BasicTable>

    <MergeDrawer @register="registerDrawer" @success="reload" />
  </PageWrapper>
</template>

<script setup lang="ts">
  import { Tag } from 'ant-design-vue';
  import { PageWrapper } from '@/components/Page';
  import { BasicTable, useTable, TableAction } from '@/components/Table';
  import { useDrawer } from '@/components/Drawer';
  import Icon from '@/components/Icon/Icon.vue';
  import MergeDrawer from './MergeDrawer.vue';

  const [registerDrawer, { openDrawer }] = useDrawer();

  const [registerTable, { reload }] = useTable({
    title: '待处理的 Merge Request',
    dataSource: [
      { id: 1, title: 'feat: 新增支付网关路由', repo: 'devops-backend', sourceBranch: 'feature/payment', targetBranch: 'main', author: '张三', status: 'pending', time: '10分钟前' },
      { id: 2, title: 'fix: 修复表格列错位问题', repo: 'vben-admin-ui', sourceBranch: 'hotfix/table-bug', targetBranch: 'main', author: '李四', status: 'merged', time: '2小时前' },
    ],
    columns: [
      { title: 'MR 标题', dataIndex: 'title', width: 220, align: 'left' },
      { title: '所属仓库', dataIndex: 'repo', width: 150 },
      { title: '分支流向 (Source -> Target)', key: 'branches', width: 250 },
      { title: '提交人', dataIndex: 'author', width: 100 },
      { title: '状态', key: 'status', width: 100 },
      { title: '更新时间', dataIndex: 'time', width: 120 },
      { title: '操作', key: 'action', width: 150 }
    ],
    useSearchForm: true,
    formConfig: {
      labelWidth: 80,
      schemas: [
        { field: 'repo', label: '仓库', component: 'Input', colProps: { span: 6 } },
        { field: 'status', label: '状态', component: 'Select', componentProps: { options: [{label: '待处理', value: 'pending'}, {label: '已合并', value: 'merged'}] }, colProps: { span: 6 } },
      ]
    },
    bordered: true,
  });

  // 状态颜色映射
  const getStatusColor = (status: string) => {
    const map = { pending: 'warning', merged: 'success', closed: 'error' };
    return map[status] || 'default';
  };
  const getStatusText = (status: string) => {
    const map = { pending: '待审核', merged: '已合并', closed: '已关闭' };
    return map[status] || '未知';
  };

  function handleCreateMR() {
    // 路由跳转到新建 MR 页面
  }

  function handleMerge(record: Recordable) {
    openDrawer(true, { isUpdate: true, record });
  }

  function handleView(record: Recordable) {
    // 查看已合并的详情
  }
</script>