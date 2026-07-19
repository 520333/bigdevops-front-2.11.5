<template>
  <PageWrapper title="远端系统用户管理" content="管理 GitLab/Gitea 实例上的全局系统用户，支持创建、修改和删除。">
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" preIcon="ant-design:plus-outlined" @click="handleCreate">
          新建用户
        </a-button>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'state'">
          <Tag :color="record.state === 'active' ? 'green' : (record.state === 'banned' ? 'purple' : 'red')">
            {{ record.state === 'active' ? '正常' : (record.state === 'banned' ? '已封禁' : '已禁用') }}
          </Tag>
        </template>

        <template v-if="column.key === 'action'">
          <TableAction :actions="[
            { icon: 'ant-design:edit-outlined', onClick: () => handleEdit(record) }
          ]" />
        </template>
      </template>
    </BasicTable>
    <UserModal @register="registerModal" @success="reload" />
  </PageWrapper>
</template>

<script setup lang="ts">
import { Tag } from 'ant-design-vue';
import { PageWrapper } from '@/components/Page';
import { BasicTable, useTable, TableAction } from '@/components/Table';
import { useModal } from '@/components/Modal';
import UserModal from './UserModal.vue';
import { columns, searchFormSchema } from './user.data';
import { getGitUsers } from '@/api/code/repo';
import { useMessage } from '@/hooks/web/useMessage';

defineOptions({ name: 'CodeUserManagement' });

const { createMessage } = useMessage();
const [registerModal, { openModal }] = useModal();

const [registerTable, { reload, getForm }] = useTable({
  title: '系统用户列表',
  api: getGitUsers,
  beforeFetch: (params) => {
    if (!params.serverId) {
      createMessage.warning('请先选择所属 Git 实例再进行查询');
      return false; 
    }
    return params;
  },
  columns,
  formConfig: {
    labelWidth: 100,
    schemas: searchFormSchema,
    autoSubmitOnEnter: true
  },
  useSearchForm: true,
  showTableSetting: true,
  bordered: true,
  showIndexColumn: false,
  actionColumn: {
    width: 100,
    title: '操作',
    dataIndex: 'action',
  },
});

function getCurrentServerId() {
  const formValues = getForm().getFieldsValue();
  return formValues.serverId;
}

function handleCreate() {
  const serverId = getCurrentServerId();
  if (!serverId) {
    createMessage.warning('请先在搜索栏选择【所属Git实例】');
    return;
  }
  openModal(true, { isUpdate: false, serverId });
}

function handleEdit(record: Recordable) {
  const serverId = getCurrentServerId();
  openModal(true, { isUpdate: true, record, serverId });
}


</script>
