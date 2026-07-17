<template>
  <PageWrapper title="Git 实例管理" content="集成并管理企业内部的 GitLab、Gitea 等代码托管服务，配置统一的 API 访问凭证。">
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" preIcon="ant-design:plus-outlined" @click="handleCreate">
          关联新实例
        </a-button>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'type'">
          <Tag :color="record.type === 'gitlab' ? 'orange' : 'green'">
            <template #icon>
              <Icon :icon="record.type === 'gitlab' ? 'ant-design:gitlab-outlined' : 'ant-design:github-outlined'" />
            </template>
            {{ record.type === 'gitlab' ? 'GitLab' : 'Gitea' }}
          </Tag>
        </template>

        <template v-else-if="column.dataIndex === 'status'">
          <Badge :status="record.status === 'active' ? 'success' : 'error'" :text="record.status === 'active' ? '连接成功' : '连接失败'" />
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
  import { Tag, Badge, message } from 'ant-design-vue';
  import { PageWrapper } from '@/components/Page';
  import { BasicTable, useTable, TableAction } from '@/components/Table';
  import { useModal } from '@/components/Modal';
  import Icon from '@/components/Icon/Icon.vue';
  import InstanceModal from './InstanceModal.vue';

  const [registerModal, { openModal }] = useModal();

  const [registerTable, { reload }] = useTable({
    title: '已关联实例',
    dataSource: [
      { id: 1, name: '集团自建 GitLab', type: 'gitlab', endpoint: 'https://gitlab.mycorp.com', status: 'active', creator: 'admin', createTime: '2026-05-10' },
      { id: 2, name: '研发二部 Gitea', type: 'gitea', endpoint: 'http://192.168.1.100:3000', status: 'active', creator: 'dev_ops', createTime: '2026-06-15' }
    ],
    columns: [
      { title: '实例名称', dataIndex: 'name', width: 200, align: 'left' },
      { title: '类型', dataIndex: 'type', width: 120 },
      { title: 'API 服务地址', dataIndex: 'endpoint', width: 280, align: 'left' },
      { title: '连通状态', dataIndex: 'status', width: 130 },
      { title: '关联人', dataIndex: 'creator', width: 120 },
      { title: '关联时间', dataIndex: 'createTime', width: 150 },
      { title: '操作', key: 'action', width: 160 }
    ],
    useSearchForm: true,
    formConfig: {
      labelWidth: 80,
      schemas: [
        { field: 'name', label: '实例名称', component: 'Input', colProps: { span: 6 } },
        { field: 'type', label: '实例类型', component: 'Select', componentProps: { options: [{label: 'GitLab', value: 'gitlab'}, {label: 'Gitea', value: 'gitea'}] }, colProps: { span: 6 } },
      ]
    },
    bordered: true,
    showIndexColumn: false,
  });

  function handleCreate() {
    openModal(true, { isUpdate: false });
  }

  function handleEdit(record: Recordable) {
    openModal(true, { isUpdate: true, record });
  }

  function handleTestConnection(record: Recordable) {
    message.loading({ content: `正在测试与 [${record.name}] 的 API 通信...`, key: 'testing' });
    setTimeout(() => {
      message.success({ content: `[${record.name}] 连接测试成功！API 握手正常。`, key: 'testing', duration: 2 });
    }, 1200);
  }

  function handleDelete(record: Recordable) {
    message.success(`解绑实例 ${record.name} 成功`);
    reload();
  }
</script>