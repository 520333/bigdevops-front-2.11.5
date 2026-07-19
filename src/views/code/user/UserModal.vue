<template>
  <BasicModal v-bind="$attrs" @register="registerModal" :title="getTitle" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>

<script setup lang="ts">
import { ref, computed, unref } from 'vue';
import { BasicModal, useModalInner } from '@/components/Modal';
import { BasicForm, useForm } from '@/components/Form';
import { formSchema } from './user.data';
import { createGitUser, updateGitUser } from '@/api/code/repo';
import { useMessage } from '@/hooks/web/useMessage';

const { createMessage } = useMessage();
const emit = defineEmits(['success', 'register']);
const isUpdate = ref(true);
const rowId = ref('');

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
    rowId.value = data.record.id;
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

const getTitle = computed(() => (!unref(isUpdate) ? '新增远端系统用户' : '编辑远端系统用户'));

async function handleSubmit() {
  try {
    const values = await validate();
    setModalProps({ confirmLoading: true });
    
    // 剔除前端用来控制显隐/必填的临时字段
    const submitData = { ...values };
    delete submitData.isUpdate;

    if (unref(isUpdate)) {
      await updateGitUser(submitData);
      createMessage.success('用户更新成功');
    } else {
      await createGitUser(submitData);
      createMessage.success('用户创建成功');
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
