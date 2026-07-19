<template>
  <PageWrapper title="远端命名空间管理" content="管理 GitLab/Gitea 实例上的组织、群组或个人命名空间，支持创建、修改和删除。">
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" preIcon="ant-design:plus-outlined" @click="handleCreate">
          新建命名空间
        </a-button>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'kind'">
          <Tag :color="record.kind === 'user' ? 'blue' : 'green'">
            {{ record.kind === 'user' ? '个人(User)' : '组织(Group/Org)' }}
          </Tag>
        </template>

        <template v-if="column.key === 'action'">
          <TableAction :actions="[
            { 
              icon: 'ant-design:edit-outlined', 
              onClick: () => handleEdit(record),
              disabled: record.kind === 'user' // 个人命名空间通常不支持作为组织那样去编辑
            }
          ]" />
        </template>
      </template>
    </BasicTable>
    <NamespaceModal @register="registerModal" @success="reload" />
  </PageWrapper>
</template>

<script setup lang="ts">
import { Tag } from 'ant-design-vue';
import { PageWrapper } from '@/components/Page';
import { BasicTable, useTable, TableAction } from '@/components/Table';
import { useModal } from '@/components/Modal';
import NamespaceModal from './NamespaceModal.vue';
import { columns, searchFormSchema } from './namespace.data';
import { getGitNamespaces } from '@/api/code/repo';
import { useMessage } from '@/hooks/web/useMessage';

defineOptions({ name: 'CodeNamespaceManagement' });

const { createMessage } = useMessage();
const [registerModal, { openModal }] = useModal();

const [registerTable, { reload, getForm }] = useTable({
  title: '命名空间列表',
  api: getGitNamespaces,
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
