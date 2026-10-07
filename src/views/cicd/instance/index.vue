<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button
          type="primary"
          preIcon="ant-design:plus-outlined"
          v-auth="'POST:/api/cicd/createJenkinsInstance'"
          @click="handleCreate"
        >
          新增 Jenkins 实例
        </a-button>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'ant-design:edit-outlined',
                tooltip: '编辑配置',
                auth: 'POST:/api/cicd/updateJenkinsInstance',
                onClick: handleEdit.bind(null, record),
              },
              {
                icon: 'ant-design:delete-outlined',
                color: 'error',
                tooltip: '删除实例',
                auth: 'DELETE:/api/cicd/deleteJenkinsInstance',
                popConfirm: {
                  title: '是否确认删除该 Jenkins 实例？',
                  placement: 'left',
                  confirm: handleDelete.bind(null, record),
                },
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <!-- 编辑/创建 弹窗 Modal -->
    <BasicModal
      v-bind="$attrs"
      @register="registerModal"
      :title="modalTitle"
      width="720px"
      @ok="handleSubmit"
    >
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
    getJenkinsInstanceList,
    getJenkinsInstanceDetail,
    createJenkinsInstance,
    updateJenkinsInstance,
    deleteJenkinsInstance,
  } from '@/api/cicd';
  import { useMessage } from '@/hooks/web/useMessage';
  import { columns, formSchema, searchFormSchema } from './instance.data';

  defineOptions({ name: 'JenkinsInstanceManagement' });

  const { createMessage } = useMessage();
  const isUpdate = ref(false);
  const modalTitle = ref('新增 Jenkins 实例');
  const currentRecord = ref<any>(null);

  const [registerTable, { reload }] = useTable({
    title: 'Jenkins实例列表',
    api: getJenkinsInstanceList,
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

  async function handleCreate() {
    isUpdate.value = false;
    modalTitle.value = '新增 Jenkins 实例';
    openModal(true);
    await nextTick();
    await resetFields();
  }

  async function handleEdit(record: Recordable) {
    isUpdate.value = true;
    currentRecord.value = record;
    modalTitle.value = '编辑 Jenkins 实例';
    openModal(true);
    await nextTick();
    await resetFields();
    let formData = { ...record };
    try {
      const detail = await getJenkinsInstanceDetail({ id: record.id });
      if (detail) {
        formData = { ...formData, ...detail };
      }
    } catch (error) {
      // 降级使用现有行数据
    }
    await setFieldsValue(formData);
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
      // 校验失败静默处理
    }
  }
</script>
