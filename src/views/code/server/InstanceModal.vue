<template>
  <BasicModal v-bind="$attrs" @register="registerModal" :title="getTitle" @ok="handleSubmit" width="600px">
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { BasicModal, useModalInner } from '@/components/Modal';
  import { BasicForm, useForm } from '@/components/Form';
  import { createCodeGitServer,updateCodeGitServer, pingCodeGitServer } from '@/api/code/server';
  import { useMessage } from '@/hooks/web/useMessage';
  import { formSchema } from './server.data';
  const emit = defineEmits(['success', 'register']);
  const { createMessage } = useMessage();
  const isUpdate = ref(true);
  const rowId = ref('');

  const [registerForm, { resetFields, setFieldsValue, validate }] = useForm({
    labelWidth: 110,
    baseColProps: { span: 24 },
    schemas: formSchema,
    showActionButtonGroup: false,
  });

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    resetFields();
    setModalProps({ confirmLoading: false });
    isUpdate.value = !!data?.isUpdate;

    if (isUpdate.value && data?.record) {
      rowId.value = data.record.id;
      setFieldsValue({ ...data.record });
    }
  });

  const getTitle = computed(() => (!isUpdate.value ? '关联新 Git 实例' : '编辑实例配置'));

  async function handleSubmit() {
    try {
      const values = await validate();
      
      setModalProps({ confirmLoading: true });
      if (isUpdate.value) {
        await updateCodeGitServer({ id: rowId.value, ...values });
      } else {
        await createCodeGitServer(values);
      }
      closeModal();
      emit('success');
      createMessage.success(!isUpdate.value ? '新实例关联成功' : '实例配置已更新');
    } catch (error) {
      createMessage.error('配置校验未通过', error);
    } finally {
      setModalProps({ confirmLoading: false });
    }
  }


</script>