<template>
  <BasicModal v-bind="$attrs" @register="registerModal" :title="getTitle" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>

<script setup lang="ts">
  import { ref, computed, unref } from 'vue';
  import { BasicModal, useModalInner } from '@/components/Modal';
  import { BasicForm, useForm } from '@/components/Form/index';
  import { accountFormSchema } from './deploy.data';
  import { createDeploy, updateDeployList } from '@/api/cicd/cicd.mock';
  import { useMessage } from '@/hooks/web/useMessage';

  const emit = defineEmits(['success', 'register']);

  const isUpdate = ref(true);
  const rowId = ref<number | string>('');

  const [registerForm, { setFieldsValue, getFieldsValue, resetSchema, clearValidate, updateSchema, resetFields, validate }] = useForm({
    labelWidth: 100,
    baseColProps: { span: 24 },
    schemas: accountFormSchema,
    showActionButtonGroup: false,
    actionColOptions: {
      span: 23,
    },
  });

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    resetFields();
    resetSchema(accountFormSchema);
    setModalProps({ confirmLoading: false });

    isUpdate.value = !!data?.isUpdate;
    if (unref(isUpdate)) {
      rowId.value = data.record.id;
      setFieldsValue(data.record);
      clearValidate();
    }
  });

  const getTitle = computed(() => (!unref(isUpdate) ? '创建部署任务' : '修改部署任务'));

  async function handleSubmit() {
    try {
      const values = await validate();
      setModalProps({ confirmLoading: true });

      const { createMessage } = useMessage();
      const reqData = { ...getFieldsValue() };

      if (unref(isUpdate)) {
        await updateDeployList(rowId.value, reqData);
        createMessage.success('修改部署任务成功');
      } else {
        await createDeploy(reqData);
        createMessage.success('创建部署任务成功');
      }

      closeModal();
      emit('success', { isUpdate: unref(isUpdate), values: { ...values, id: rowId.value } });
    } catch (error) {
      console.warn('表单校验未通过', error);
    } finally {
      setModalProps({ confirmLoading: false });
    }
  }
</script>