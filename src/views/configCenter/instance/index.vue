<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" preIcon="ant-design:plus-outlined" v-auth="'POST:/api/nacos/createInstance'"
          @click="handleCreate">
          新建 Nacos 实例
        </a-button>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction :actions="[
            {
              label: '测试',
              tooltip: '在线测试连通性',
              auth: 'POST:/api/nacos/testInstanceConnection',
              onClick: handleTestConnect.bind(null, record),
            },
            {
              label: '编辑',
              auth: 'POST:/api/nacos/updateInstance',
              onClick: handleEdit.bind(null, record),
            },
            {
              label: '删除',
              color: 'error',
              auth: 'DELETE:/api/nacos/deleteInstance',
              popConfirm: {
                title: `确认删除实例 [${record.name}] 吗？`,
                placement: 'left',
                confirm: handleDelete.bind(null, record),
              },
            },
          ]" />
        </template>
      </template>
    </BasicTable>

    <!-- 编辑/创建 弹窗 Modal -->
    <BasicModal v-bind="$attrs" @register="registerModal" :title="modalTitle" width="680px" @ok="handleSubmit">
      <div class="pt-3 px-2">
        <BasicForm @register="registerForm" />
      </div>
    </BasicModal>
  </div>
</template>

<script lang="ts" setup>
import { ref, nextTick } from 'vue';
import { BasicTable, useTable, TableAction } from '@/components/Table';
import { BasicModal, useModal } from '@/components/Modal';
import { BasicForm, useForm } from '@/components/Form';
import {
  getNacosInstanceList,
  getNacosInstanceDetail,
  createNacosInstance,
  updateNacosInstance,
  deleteNacosInstance,
  testNacosInstanceConnection,
} from '@/api/nacos';
import { useMessage } from '@/hooks/web/useMessage';
import { columns, formSchema, searchFormSchema } from './nacos.data';

defineOptions({ name: 'NacosInstanceManagement' });

const { createMessage } = useMessage();
const isUpdate = ref(false);
const modalTitle = ref('新建 Nacos 实例');
const currentRecord = ref<any>(null);

const [registerTable, { reload }] = useTable({
  title: 'Nacos 实例列表',
  api: getNacosInstanceList,
  columns,
  formConfig: {
    labelWidth: 100,
    schemas: searchFormSchema,
  },
  useSearchForm: true,
  showTableSetting: true,
  bordered: true,
  showIndexColumn: false,
  pagination: {
    pageSize: 10,
    showQuickJumper: true,
  },
  actionColumn: {
    width: 160,
    title: '操作',
    dataIndex: 'action',
    key: 'action',
  },
});

const [registerForm, { setFieldsValue, validate, resetFields }] = useForm({
  labelWidth: 120,
  schemas: formSchema,
  showActionButtonGroup: false,
  baseColProps: { span: 24 },
});

const [registerModal, { openModal, closeModal, setModalProps }] = useModal();

async function handleCreate() {
  isUpdate.value = false;
  modalTitle.value = '新建 Nacos 实例';
  openModal(true);
  await nextTick();
  await resetFields();
}

async function handleEdit(record: any) {
  isUpdate.value = true;
  currentRecord.value = record;
  modalTitle.value = '编辑 Nacos 实例';
  openModal(true);
  await nextTick();
  await resetFields();

  let formData = { ...record };
  try {
    const detail = await getNacosInstanceDetail(record.id);
    if (detail) {
      formData = { ...formData, ...detail };
    }
  } catch {
    // 降级使用现有行数据
  }
  await setFieldsValue(formData);
}

async function handleDelete(record: any) {
  try {
    await deleteNacosInstance(record.id);
    createMessage.success(`实例 [${record.name}] 已删除`);
    reload();
  } catch {
    // 异常由全局拦截器自动弹出提示
  }
}

async function handleTestConnect(record: any) {
  createMessage.loading({
    content: `正在握手测试 Nacos [${record.serverAddr}:${record.port || 8848}]...`,
    key: 'testNacos',
  });
  try {
    await testNacosInstanceConnection(record.id);
    createMessage.success({
      content: `Nacos [${record.name}] 握手成功，连通正常！`,
      key: 'testNacos',
    });
    reload();
  } catch (err: any) {
    createMessage.error({
      content: err?.message || '连接失败，请检查网络或账号密码',
      key: 'testNacos',
      duration: 3,
    });
    reload();
  }
}

async function handleSubmit() {
  try {
    const values = await validate();
    setModalProps({ confirmLoading: true });
    if (isUpdate.value && currentRecord.value) {
      await updateNacosInstance(currentRecord.value.id, values);
      createMessage.success('更新 Nacos 实例成功！');
    } else {
      await createNacosInstance(values);
      createMessage.success('创建成功！后台正在测试连通性');
    }
    closeModal();
    reload();
  } catch {
    // 异常由全局拦截器或表单校验自动提示
  } finally {
    setModalProps({ confirmLoading: false });
  }
}
</script>
