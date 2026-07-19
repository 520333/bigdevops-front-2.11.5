<template>
  <BasicModal v-bind="$attrs" @register="registerModal" :title="getTitle" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>

<script setup lang="ts">
import { ref, computed, unref } from 'vue';
import { BasicModal, useModalInner } from '@/components/Modal';
import { BasicForm, useForm } from '@/components/Form';
import { formSchema } from './namespace.data';
import { createGitNamespace, updateGitNamespace } from '@/api/code/repo';
import { useMessage } from '@/hooks/web/useMessage';

const { createMessage } = useMessage();
const emit = defineEmits(['success', 'register']);
const isUpdate = ref(true);
const oldPathRef = ref('');

const [registerForm, { resetFields, setFieldsValue, validate }] = useForm({
  labelWidth: 100,
  baseColProps: { span: 24 },
  schemas: formSchema,
  showActionButtonGroup: false,
  actionColOptions: { span: 23 },
});

const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
  resetFields();
  setModalProps({ confirmLoading: false });
  isUpdate.value = !!data?.isUpdate;

  if (unref(isUpdate)) {
    oldPathRef.value = data.record.path;
    setFieldsValue({
      ...data.record,
      serverId: data.serverId,
      isUpdate: true,
    });
  } else {
    setFieldsValue({
      serverId: data?.serverId || undefined,
      isUpdate: false,
    });
  }
});

const getTitle = computed(() => (!unref(isUpdate) ? '新建远端命名空间/组织' : '编辑命名空间'));

async function handleSubmit() {
  try {
    const values = await validate();
    setModalProps({ confirmLoading: true });
    
    const submitData = { ...values };
    delete submitData.isUpdate;

    if (unref(isUpdate)) {
      submitData.oldPath = oldPathRef.value;
      await updateGitNamespace(submitData);
      createMessage.success('命名空间更新成功');
    } else {
      await createGitNamespace(submitData);
      createMessage.success('命名空间创建成功');
    }
    closeModal();
    emit('success');
  } catch (error) {
    console.error(error);
  } finally {
    setModalProps({ confirmLoading: false });
  }
}
</script>
