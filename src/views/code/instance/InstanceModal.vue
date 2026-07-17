<template>
  <BasicModal v-bind="$attrs" @register="registerModal" :title="getTitle" @ok="handleSubmit" width="600px">
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { BasicModal, useModalInner } from '@/components/Modal';
  import { BasicForm, useForm } from '@/components/Form';
  import { message } from 'ant-design-vue';

  const emit = defineEmits(['success', 'register']);
  const isUpdate = ref(true);
  const rowId = ref('');

  const [registerForm, { resetFields, setFieldsValue, validate }] = useForm({
    labelWidth: 110,
    baseColProps: { span: 24 },
    schemas: [
      {
        field: 'name',
        label: '实例名称',
        component: 'Input',
        required: true,
        componentProps: { placeholder: '例如：集团 GitLab / 团队 Gitea' }
      },
      {
        field: 'type',
        label: '实例类型',
        component: 'Select',
        required: true,
        defaultValue: 'gitlab',
        componentProps: {
          options: [
            { label: 'GitLab Enterprise / Community', value: 'gitlab' },
            { label: 'Gitea (Self-hosted Git)', value: 'gitea' },
          ],
        },
      },
      {
        field: 'endpoint',
        label: 'API 服务地址',
        component: 'Input',
        required: true,
        componentProps: { placeholder: '例如：https://gitlab.example.com 或 http://192.168.1.100:3000' },
        helpMessage: '必须是可以通过平台后台网络直接访问的 HTTP/HTTPS 根路径，无需追加 /api/v4 等后缀。'
      },
      {
        field: 'token',
        label: 'Access Token',
        component: 'InputPassword',
        required: true,
        componentProps: { placeholder: '请输入具有 API 读写权限的个人访问令牌' },
        helpMessage: 'GitLab 请勾选 "api" 权限；Gitea 请在个人设置->应用令牌中生成，勾选 "write:repository" 权限。'
      },
      {
        field: 'desc',
        label: '描述备注',
        component: 'InputTextArea',
        componentProps: { rows: 3 }
      }
    ],
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
      
      console.log('提交实例数据:', values);
      
      closeModal();
      emit('success');
      message.success(!isUpdate.value ? '新实例关联成功' : '实例配置已更新');
    } catch (error) {
      console.error('配置校验未通过', error);
    } finally {
      setModalProps({ confirmLoading: false });
    }
  }
</script>