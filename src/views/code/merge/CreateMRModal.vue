<template>
  <BasicModal v-bind="$attrs" @register="registerModal" title="新建合并请求" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>

<script setup lang="ts">
  import { ref, unref } from 'vue';
  import { message } from 'ant-design-vue';
  import { BasicModal, useModalInner } from '@/components/Modal';
  import { BasicForm, useForm } from '@/components/Form';
  import { createMergeRequest, getRepoBranches } from '@/api/code/repo';

  const emit = defineEmits(['success', 'register']);
  const searchParamsRef = ref<any>(null);

  const [registerForm, { validate, resetFields, updateSchema }] = useForm({
    labelWidth: 100,
    baseColProps: { span: 24 },
    schemas: [
      {
        field: 'sourceBranch',
        label: '源分支',
        component: 'ApiSelect',
        required: true,
        helpMessage: '包含您的代码更改的分支 (例如: feature/xxx)',
        componentProps: () => ({
          api: searchParamsRef.value ? getRepoBranches : undefined,
          params: searchParamsRef.value || {},
          resultField: 'items',
          labelField: 'name',
          valueField: 'name',
          showSearch: true,
          immediate: false,
          alwaysLoad: true,
        }),
      },
      {
        field: 'targetBranch',
        label: '目标分支',
        component: 'ApiSelect',
        required: true,
        helpMessage: '您希望将代码合并到的目标分支 (通常为 main 或 master)',
        componentProps: () => ({
          api: searchParamsRef.value ? getRepoBranches : undefined,
          params: searchParamsRef.value || {},
          resultField: 'items',
          labelField: 'name',
          valueField: 'name',
          showSearch: true,
          immediate: false,
          alwaysLoad: true,
        }),
      },
      {
        field: 'title',
        label: '请求标题',
        component: 'Input',
        required: true,
      },
      {
        field: 'description',
        label: '描述说明',
        component: 'InputTextArea',
        componentProps: {
          rows: 4,
          placeholder: '详细描述本次合并包含的更改内容...'
        },
      },
    ],
    showActionButtonGroup: false,
    actionColOptions: { span: 24 },
  });

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    resetFields();
    setModalProps({ confirmLoading: false });
    
    // Save current repo params (triggers componentProps reactivity)
    searchParamsRef.value = data.searchParams;
  });

  async function handleSubmit() {
    try {
      const values = await validate();
      setModalProps({ confirmLoading: true });
      
      const payload = {
        serverId: searchParamsRef.value.serverId,
        repoId: searchParamsRef.value.repoId,
        fullName: searchParamsRef.value.fullName,
        title: values.title,
        description: values.description,
        sourceBranch: values.sourceBranch,
        targetBranch: values.targetBranch,
      };

      await createMergeRequest(payload);
      closeModal();
      message.success('创建合并请求成功！');
      emit('success');
    } catch (error) {
      console.error('创建失败:', error);
    } finally {
      setModalProps({ confirmLoading: false });
    }
  }
</script>
