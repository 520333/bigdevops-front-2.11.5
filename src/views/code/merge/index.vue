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
              ifShow: record.status === 'pending',
              onClick: () => handleMerge(record) 
            },
            {
              label: '拒绝',
              icon: 'ant-design:close-circle-outlined',
              color: 'error',
              ifShow: record.status === 'pending',
              popConfirm: {
                title: '确定要拒绝并关闭此合并请求吗？',
                confirm: () => handleFastReject(record),
              },
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
    <CreateMRModal @register="registerModal" @success="reload" />
  </PageWrapper>
</template>

<script setup lang="ts">
  import { Tag, message } from 'ant-design-vue';
  import { PageWrapper } from '@/components/Page';
  import { BasicTable, useTable, TableAction } from '@/components/Table';
  import { useDrawer } from '@/components/Drawer';
  import { useModal } from '@/components/Modal';
  import Icon from '@/components/Icon/Icon.vue';
  import MergeDrawer from './MergeDrawer.vue';
  import CreateMRModal from './CreateMRModal.vue';
  import { columns, searchFormSchema } from './merge.data';
  import { getMergeRequests, closeMergeRequest } from '@/api/code/repo';

  const [registerDrawer, { openDrawer }] = useDrawer();
  const [registerModal, { openModal }] = useModal();

  const [registerTable, { reload, getForm }] = useTable({
    title: '合并请求列表',
    api: getMergeRequests,
    beforeFetch: (params) => {
      if (!params.serverId || !params.repoInfo) {
        return false;
      }
      try {
        const repoData = JSON.parse(params.repoInfo);
        params.repoId = repoData.repoId;
        params.fullName = repoData.fullName;
        delete params.repoInfo;
      } catch(e) {
        // Fallback
      }
      return params;
    },
    columns,
    useSearchForm: true,
    formConfig: {
      labelWidth: 100,
      schemas: searchFormSchema,
      autoSubmitOnEnter: true,
    },
    bordered: true,
    // prevent auto fetch on mount since it needs required params
    immediate: false, 
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
    const searchParams = getSearchParams();
    if (!searchParams.serverId || !searchParams.repoId && !searchParams.fullName) {
      message.warning('请先在搜索栏选择“所属Git实例”和“所属仓库”再新建合并请求！');
      return;
    }
    openModal(true, { searchParams });
  }

  function getSearchParams() {
    const params = getForm().getFieldsValue();
    let repoId = null, fullName = null;
    try {
      const repoData = JSON.parse(params.repoInfo);
      repoId = repoData.repoId;
      fullName = repoData.fullName;
    } catch(e) {}
    return {
      serverId: params.serverId,
      repoId,
      fullName
    };
  }

  async function handleFastReject(record: Recordable) {
    try {
      const searchParams = getSearchParams();
      const payload = {
        serverId: searchParams.serverId,
        repoId: searchParams.repoId,
        fullName: searchParams.fullName,
        mrId: record.iid || record.id,
      };

      await closeMergeRequest(payload);
      message.success('已拒绝/关闭合并请求');
      reload();
    } catch (error) {
      console.error('快捷关闭请求失败', error);
    }
  }

  function handleMerge(record: Recordable) {
    const searchParams = getSearchParams();
    openDrawer(true, { isUpdate: true, record: { ...record, searchParams } });
  }

  function handleView(record: Recordable) {
    const searchParams = getSearchParams();
    openDrawer(true, { isUpdate: false, record: { ...record, searchParams } });
  }
</script>