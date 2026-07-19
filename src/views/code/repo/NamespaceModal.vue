<!-- src/views/code/repo/NamespaceModal.vue -->
<template>
  <BasicModal v-bind="$attrs" @register="registerModal" title="新建命名空间 (群组)" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { BasicModal, useModalInner } from '@/components/Modal';
import { BasicForm, useForm } from '@/components/Form';
import { createGitNamespace } from '@/api/code/repo';

const emit = defineEmits(['success', 'register']);
const serverId = ref<number | string>('');

const [registerForm, { resetFields, validate }] = useForm({
  labelWidth: 100,
  baseColProps: { span: 24 },
  showActionButtonGroup: false,
  schemas: [
    {
      field: 'name',
      label: '群组名称',
      component: 'Input',
      required: true,
      helpMessage: '例如: 后端服务组',
    },
    {
      field: 'path',
      label: '群组路径',
      component: 'Input',
      required: true,
      helpMessage: '例如: backend-group (将作为URL的一部分)',
    },
    {
      field: 'visibility',
      label: '可见性',
      component: 'Select',
      defaultValue: 'private',
      componentProps: {
        options: [
          { label: '公开', value: 'public' },
          { label: '内部', value: 'internal' },
          { label: '私有', value: 'private' },
        ],
      },
    }
  ],
});

const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
  resetFields();
  // 接收父组件传过来的 serverId，创建命名空间必须知道是在哪个 Git 实例上建
  serverId.value = data?.serverId; 
});

async function handleSubmit() {
  try {
    const values = await validate();
    setModalProps({ confirmLoading: true });
    
    // 携带所属服务器ID发起创建请求
    await createGitNamespace({
      serverId: serverId.value,
      ...values
    });
    
    closeModal();
    // 触发成功事件，让父组件刷新下拉框
    emit('success');
  } catch (error) {
    console.error(error);
  } finally {
    setModalProps({ confirmLoading: false });
  }
}
</script>