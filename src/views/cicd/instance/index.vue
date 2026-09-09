<template>
  <PageWrapper title="Jenkins 实例管理" content="配置并管理 DevOps 平台对接的多台 Jenkins 构建服务器及 API 访问凭证。">
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" preIcon="ant-design:plus-outlined" @click="handleCreate">
          新增 Jenkins 实例
        </a-button>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'lastProbSuccess'">
          <Tag :color="record.lastProbSuccess ? 'success' : 'error'">
            {{ record.lastProbSuccess ? '健康在线' : '离线/探活失败' }}
          </Tag>
        </template>

        <template v-else-if="column.key === 'action'">
          <TableAction :actions="[
            {
              icon: 'ant-design:edit-outlined',
              tooltip: '编辑配置',
              onClick: handleEdit.bind(null, record),
            },
            {
              icon: 'ant-design:delete-outlined',
              color: 'error',
              tooltip: '删除实例',
              popConfirm: {
                title: '是否确认删除该 Jenkins 实例？',
                placement: 'left',
                confirm: handleDelete.bind(null, record),
              },
            },
          ]" />
        </template>
      </template>
    </BasicTable>

    <!-- 编辑/创建 弹窗 Modal -->
    <BasicModal v-bind="$attrs" @register="registerModal" :title="modalTitle" width="720px" @ok="handleSubmit">
      <div class="pt-3 px-2">
        <BasicForm @register="registerForm" />
      </div>
    </BasicModal>
  </PageWrapper>
</template>

<script lang="ts" setup>
// 【修改点 1】引入了 nextTick
import { ref, nextTick } from 'vue';
import { Tag } from 'ant-design-vue';
import { PageWrapper } from '@/components/Page';
import { BasicTable, useTable, TableAction, BasicColumn } from '@/components/Table';
import { BasicModal, useModal } from '@/components/Modal';
import { BasicForm, useForm, FormSchema } from '@/components/Form';
import {
  getJenkinsInstanceList,
  createJenkinsInstance,
  updateJenkinsInstance,
  deleteJenkinsInstance,
} from '@/api/cicd';
import { useMessage } from '@/hooks/web/useMessage';

defineOptions({ name: 'JenkinsInstanceManagement' });

const { createMessage } = useMessage();
const isUpdate = ref(false);
const modalTitle = ref('新增 Jenkins 实例');
const currentRecord = ref<any>(null);

const columns: BasicColumn[] = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '实例名称', dataIndex: 'name', width: 160 },
  { title: 'URL 地址', dataIndex: 'url', width: 260 },
  { title: '用户名', dataIndex: 'username', width: 140 },
  { title: '环境', dataIndex: 'env', width: 100 },
  { title: '探活状态', dataIndex: 'lastProbSuccess', width: 140 },
  { title: '错误日志', dataIndex: 'lastProbErrMsg' },
];

const formSchema: FormSchema[] = [
  { field: 'name', label: '实例名称', component: 'Input', required: true },
  { field: 'url', label: 'Jenkins URL', component: 'Input', required: true },
  { field: 'username', label: '用户名', component: 'Input', required: true },
  { field: 'apiToken', label: 'API Token / 密码', component: 'InputPassword', required: true },
  {
    field: 'env',
    label: '环境',
    component: 'Select',
    defaultValue: 'prod',
    componentProps: {
      options: [
        { label: '生产环境 (prod)', value: 'prod' },
        { label: '预发环境 (stage)', value: 'stage' },
        { label: '测试环境 (test)', value: 'test' },
      ],
    },
  },
];

const [registerTable, { reload }] = useTable({
  title: 'Jenkins 多实例列表',
  api: getJenkinsInstanceList,
  columns,
  useSearchForm: false,
  showTableSetting: true,
  bordered: true,
  pagination: {
    current: 1,
    pageSize: 10,
    showQuickJumper: true,
  },
  rowKey: 'id',
  actionColumn: {
    width: 120,
    title: '操作',
    dataIndex: 'action',
    key: 'action',
  },
});

const [registerForm, { setFieldsValue, validate, resetFields }] = useForm({
  labelWidth: 140,
  schemas: formSchema,
  showActionButtonGroup: false,
  baseColProps: { span: 24 },
});

const [registerModal, { openModal, closeModal }] = useModal();

// 【修改点 2】将 handleCreate 改为异步函数，调整执行顺序
async function handleCreate() {
  isUpdate.value = false;
  modalTitle.value = '新增 Jenkins 实例';

  // 先触发弹窗打开，让内部的表单组件开始挂载
  openModal(true);
  // 等待 Vue DOM 更新完成
  await nextTick();
  // 此时表单已渲染，可以安全重置
  await resetFields();
}

// 【修改点 3】将 handleEdit 改为异步函数，调整执行顺序
async function handleEdit(record: Recordable) {
  isUpdate.value = true;
  currentRecord.value = record;
  modalTitle.value = '编辑 Jenkins 实例';

  // 先触发弹窗打开
  openModal(true);
  // 等待 DOM 更新完成
  await nextTick();
  // 推荐先重置表单，清空之前的验证报错和缓存数据
  await resetFields();
  // 赋值回显数据
  await setFieldsValue({ ...record });
}

async function handleDelete(record: Recordable) {
  await deleteJenkinsInstance(record.id);
  createMessage.success('删除成功');
  reload();
}

async function handleSubmit() {
  try {
    const values = await validate();
    if (isUpdate.value && currentRecord.value) {
      await updateJenkinsInstance({ ...values, id: currentRecord.value.id });
      createMessage.success('更新成功');
    } else {
      await createJenkinsInstance(values);
      createMessage.success('创建成功');
    }
    closeModal();
    reload();
  } catch (err) {
    // 验证失败时静默捕获异常即可
  }
}
</script>