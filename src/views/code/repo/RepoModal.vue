<template>
  <BasicModal v-bind="$attrs" @register="registerModal" :title="getTitle" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>

<script setup lang="ts">
  import { ref, computed, unref } from 'vue';
  import { BasicModal, useModalInner } from '@/components/Modal';
  import { BasicForm, useForm } from '@/components/Form';
  import { message } from 'ant-design-vue';

  const emit = defineEmits(['success', 'register']);
  const isUpdate = ref(true);
  const rowId = ref('');

  // 初始化表单配置
  const [registerForm, { resetFields, setFieldsValue, validate }] = useForm({
    labelWidth: 100,
    baseColProps: { span: 24 },
    schemas: [
      {
        field: 'name',
        label: '仓库名称',
        component: 'Input',
        required: true,
        helpMessage: '必须符合 Git 仓库命名规范，如小写字母、数字和中划线'
      },
      {
        field: 'visibility',
        label: '可见性',
        component: 'RadioGroup',
        defaultValue: 'private',
        componentProps: {
          options: [
            { label: '私有 (Private)', value: 'private' },
            { label: '公开 (Public)', value: 'public' },
          ],
        },
      },
      {
        field: 'namespace',
        label: '所属命名空间',
        component: 'Select', // 实际开发建议用 ApiSelect 从接口拉取
        componentProps: {
          options: [
            { label: '核心业务 (core-biz)', value: 'core-biz' },
            { label: '基础设施 (infra)', value: 'infra' },
          ]
        },
        required: true,
      },
      {
        field: 'desc',
        label: '仓库描述',
        component: 'InputTextArea',
        componentProps: { rows: 4 }
      }
    ],
    showActionButtonGroup: false,
    actionColOptions: { span: 23 },
  });

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    resetFields();
    setModalProps({ confirmLoading: false });
    isUpdate.value = !!data?.isUpdate;

    if (unref(isUpdate)) {
      rowId.value = data.record.id;
      setFieldsValue({ ...data.record });
    }
  });

  const getTitle = computed(() => (!unref(isUpdate) ? '新建代码仓库' : '编辑仓库配置'));

  async function handleSubmit() {
    try {
      const values = await validate();
      setModalProps({ confirmLoading: true });
      
      console.log('提交的数据:', values);
      // const apiMethod = unref(isUpdate) ? updateRepo(rowId.value, values) : createRepo(values);
      // await apiMethod;

      closeModal();
      emit('success');
      message.success(!unref(isUpdate) ? '仓库创建成功' : '配置修改成功');
    } catch (error) {
      console.error('表单校验失败', error);
    } finally {
      setModalProps({ confirmLoading: false });
    }
  }
</script>