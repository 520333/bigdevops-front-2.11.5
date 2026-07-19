<template>
  <PageWrapper title="代码仓库管理" content="集中管理企业代码资产，支持从 GitLab/GitHub 等平台同步或新建仓库。">
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" preIcon="ant-design:plus-outlined" @click="handleCreate">
          新建仓库
        </a-button>
      </template>

      <template #bodyCell="{ column, record }">



        <template v-if="column.dataIndex === 'sshUrl'">
          <TypographyText copyable>{{ record.sshUrl }}</TypographyText>
        </template>

        <template v-if="column.key === 'action'">
          <TableAction :actions="[
            { icon: 'ant-design:edit-outlined', onClick: () => handleEdit(record) },
            {
              icon: 'ant-design:usergroup-add-outlined',
              tooltip: '成员权限管理',
              onClick: () => handleManageMembers(record),
            }
          ]" />
        </template>

        <!-- 🚀 展开行展示分支信息 -->
        <template v-if="column.key === 'expandedRowRender'">
          <RepoBranches :record="record" />
        </template>

      </template>
    </BasicTable>
    <MemberDrawer @register="registerDrawer" />
    <RepoModal @register="registerModal" @success="reload" />

  </PageWrapper>
</template>

<script setup lang="ts">
import { TypographyText, Tag, message } from 'ant-design-vue';
import { PageWrapper } from '@/components/Page';
import { BasicTable, useTable, TableAction } from '@/components/Table';
import { useModal } from '@/components/Modal';
import RepoModal from './RepoModal.vue';
import RepoBranches from './RepoBranches.vue';
import { columns, searchFormSchema } from './repo.data';
import { getCodeGitRepoList } from '@/api/code/repo';
import MemberDrawer from './MemberDrawer.vue';
import { useDrawer } from '@/components/Drawer';
defineOptions({ name: 'CodeRepoManagement' });

const [registerModal, { openModal }] = useModal();
const [registerDrawer, { openDrawer }] = useDrawer();

const [registerTable, { reload, getForm }] = useTable({
  title: '仓库列表',
  api: getCodeGitRepoList,
  beforeFetch: (params) => {
    if (!params.serverId) {
      message.warning('请先选择所属 Git 实例再进行查询');
      return false; // 取消请求
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
  expandRowByClick: true,
  rowKey: 'id',
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

function handleManageMembers(record: Recordable) {
  console.log(record)
  // 第一个参数 true 表示打开抽屉
  // 第二个参数是传递给抽屉的数据 (对应 Drawer 内部 useDrawerInner 接收到的 data)
  openDrawer(true, {
    id: record.id,       // 必须传：你的数据库仓库ID，用于拉取成员API
    name: record.name,   // 可选传：用于在抽屉标题上显示 "成员管理 - xxx项目"
    record: record       // 也可以把整行数据丢过去备用
  });
}


</script>
<!-- <style >
.ant-table-tbody > tr.ant-table-row:hover > td {
  background: #0274ee46 !important;
  transition: background 0.2s ease !important;
}
</style> -->