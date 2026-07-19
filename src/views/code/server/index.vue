<template>
  <PageWrapper title="Git 实例管理" content="集成并管理企业内部的 GitLab、Gitea 等代码托管服务，配置统一的 API 访问凭证。">
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" preIcon="ant-design:plus-outlined" @click="handleCreate">
          关联新实例
        </a-button>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'platform'">
          <Tag :color="record.platform === 'gitlab' ? 'orange' : 'green'">
            <template #icon>
              <Icon
                :icon="record.platform === 'gitlab' ? 'ant-design:gitlab-outlined' : 'ant-design:github-outlined'" />
            </template>
            {{ record.platform === 'gitlab' ? 'GitLab' : 'Gitea' }}
          </Tag>
        </template>

        <template v-else-if="column.dataIndex === 'status'">
          <Badge :status="record.status === 'connected' ? 'success' : 'error'"
            :text="record.status === 'connected' ? '连接成功' : '连接失败'" />
        </template>

        <template v-else-if="column.key === 'action'">
          <TableAction :actions="[
            {
              icon: 'ant-design:api-outlined',
              tooltip: '测试连接',
              onClick: () => handleTestConnection(record)
            },
            {
              icon: 'ant-design:edit-outlined',
              tooltip: '编辑配置',
              onClick: () => handleEdit(record)
            },
            {
              icon: 'ant-design:delete-outlined',
              color: 'error',
              tooltip: '解绑实例',
              popConfirm: {
                title: '确定要解除与该实例的关联吗？这不会影响 Git 上的物理数据，但会导致平台相关的流水线暂时失效。',
                placement: 'left',
                confirm: () => handleDelete(record)
              }
            }
          ]" />
        </template>
      </template>
    </BasicTable>

    <InstanceModal @register="registerModal" @success="reload" />
  </PageWrapper>
</template>

<script setup lang="ts">
import { Tag, Badge } from 'ant-design-vue';
import { PageWrapper } from '@/components/Page';
import { BasicTable, useTable, TableAction } from '@/components/Table';
import { useModal } from '@/components/Modal';
import { useMessage } from '@/hooks/web/useMessage';
import Icon from '@/components/Icon/Icon.vue';
import InstanceModal from './InstanceModal.vue';
import { getCodeGitServerList, deleteCodeGitServer, pingCodeGitServer } from '@/api/code/server';
import { columns, searchFormSchema } from './server.data';
defineOptions({ name: 'CodeServerManagement' });
const { createMessage } = useMessage();
const [registerModal, { openModal }] = useModal();
const [registerTable, { reload }] = useTable({
  title: '已关联实例',
  api: getCodeGitServerList,
  columns,
  formConfig: {
    labelWidth: 80,
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

function handleCreate() {
  openModal(true, { isUpdate: false });
}

function handleEdit(record: Recordable) {
  openModal(true, { isUpdate: true, record });
}

function handleTestConnection(record: Recordable) {
  record.pingLoading = true;
  pingCodeGitServer(record).then(() => {
    createMessage.loading({ content: `正在测试与 [${record.name}] 的 API 通信...`, key: 'testing' });
    setTimeout(() => {
      createMessage.success({ content: `[${record.name}] 连接测试成功！API 握手正常。`, key: 'testing', duration: 2 });
      reload()
    }, 1200);
  }).catch(() => {
    reload()
  })

}


function handleDelete(record: Recordable) {
  deleteCodeGitServer(record.id).then(() => {
    createMessage.success(`解绑实例 ${record.name} 成功`);
    reload()
  }).catch(() => {
    createMessage.error('删除失败');
  });

}
</script>