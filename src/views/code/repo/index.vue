<template>
  <PageWrapper title="代码仓库管理" content="集中管理企业代码资产，支持从 GitLab/GitHub 等平台同步或新建仓库。">
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="default" preIcon="ant-design:sync-outlined" @click="handleSyncAll">
          全量同步
        </a-button>
        <a-button type="primary" preIcon="ant-design:plus-outlined" @click="handleCreate">
          新建仓库
        </a-button>
      </template>

      <template #bodyCell="{ column, record }">

        <template v-if="column.dataIndex === 'visibility'">
          <Tag :color="record.visibility === 'private' ? 'error' : 'success'">
            {{ record.visibility === 'private' ? '私有' : '公开' }}
          </Tag>
        </template>

        <template v-else-if="column.dataIndex === 'sshUrl'">
          <TypographyText copyable>{{ record.sshUrl }}</TypographyText>
        </template>

        <template v-else-if="column.key === 'action'">
          <TableAction :actions="[
            { icon: 'ant-design:edit-outlined', onClick: () => handleEdit(record) },
            { icon: 'ant-design:delete-outlined', color: 'error', popConfirm: { title: '确定删除？', confirm: () => handleDelete(record) } }
          ]" />
        </template>

      </template>
    </BasicTable>

    <RepoModal @register="registerModal" @success="reload" />
  </PageWrapper>
</template>

<script setup lang="ts">
import { TypographyText, Tag, message } from 'ant-design-vue';
import { PageWrapper } from '@/components/Page';
import { BasicTable, useTable, TableAction } from '@/components/Table';
import { useModal } from '@/components/Modal';
import RepoModal from './RepoModal.vue';

// 假设你的 API 路径，需自行替换
// import { getRepoList, deleteRepo } from '@/api/code/repo'; 

const [registerModal, { openModal }] = useModal();

// 初始化表格配置
const [registerTable, { reload }] = useTable({
  title: '仓库列表',
  // api: getRepoList, // 对接后端 API 时解开此注释
  dataSource: [
    // 模拟数据
    { id: 1, name: 'devops-backend', lang: 'Go', visibility: 'private', sshUrl: 'git@gitlab.com:demo/backend.git', updateTime: '2026-07-16' },
    { id: 2, name: 'vben-admin-ui', lang: 'Vue', visibility: 'public', sshUrl: 'git@gitlab.com:demo/frontend.git', updateTime: '2026-07-15' }
  ],
  columns: [
    { title: '仓库名称', dataIndex: 'name', width: 200, align: 'left' },
    { title: '可见性', dataIndex: 'visibility', width: 100 },
    { title: 'SSH Clone 地址', dataIndex: 'sshUrl', width: 300 },
    // 操作列通常没有 dataIndex，保留 key 即可
    { title: '最后更新', dataIndex: 'updateTime', width: 150 },
    { title: '操作', key: 'action', width: 180, }
  ],
  useSearchForm: true, // 开启自带顶部搜索表单  
  formConfig: {
    labelWidth: 80,
    schemas: [
      { field: 'name', label: '仓库名', component: 'Input', colProps: { span: 6 } },
      { field: 'lang', label: '语言', component: 'Select', componentProps: { options: [{ label: 'Go', value: 'go' }, { label: 'Vue', value: 'vue' }, { label: 'Java', value: 'java' }] }, colProps: { span: 6 } },
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

function handleWebhook(record: Recordable) {
  message.info(`前往配置 [${record.name}] 的 Webhook`);
  // 可以进行路由跳转或打开抽屉组件
}

async function handleDelete(record: Recordable) {
  // await deleteRepo(record.id);
  message.success(`删除仓库 ${record.name} 成功`);
  reload();
}

function handleSyncAll() {
  message.success('已触发底层 Git 平台的仓库状态全量同步');
}
</script>