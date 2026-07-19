<template>
  <PageWrapper title="系统全局设置" content="配置系统的全局参数和通用功能开关">
    <a-card title="水印设置" :bordered="false" class="mb-4">
      <BasicForm @register="registerForm" />
      <div class="flex justify-center mt-4">
        <a-button type="primary" @click="handleSubmit" :loading="loading">保存设置</a-button>
      </div>
    </a-card>
  </PageWrapper>
</template>

<script lang="ts" setup>
  import { ref, onMounted } from 'vue';
  import { PageWrapper } from '@/components/Page';
  import { BasicForm, useForm } from '@/components/Form';
  import { Card as ACard, Button as AButton, message } from 'ant-design-vue';
  import { getSystemSetting, updateSystemSetting } from '@/api/system/setting';
  
  const loading = ref(false);

  const [registerForm, { setFieldsValue, validate }] = useForm({
    labelWidth: 150,
    schemas: [
      {
        field: 'watermarkEnabled',
        label: '开启全局水印',
        component: 'Switch',
        helpMessage: '开启后，系统将在所有页面背景显示水印',
        colProps: { span: 24 },
      },
      {
        field: 'watermarkText',
        label: '自定义水印内容',
        component: 'Input',
        helpMessage: '留空则默认显示当前用户名和日期',
        colProps: { span: 24 },
        componentProps: {
          placeholder: '请输入自定义水印内容（选填）',
        },
      },
    ],
    showActionButtonGroup: false,
  });

  onMounted(async () => {
    try {
      const data = await getSystemSetting();
      setFieldsValue({
        watermarkEnabled: data.watermarkEnabled,
        watermarkText: data.watermarkText,
      });
    } catch (error) {
      console.error('Failed to load system settings', error);
    }
  });

  async function handleSubmit() {
    try {
      const values = await validate();
      loading.value = true;
      await updateSystemSetting(values);
      message.success('保存成功，刷新页面后生效');
    } catch (error) {
      console.error(error);
    } finally {
      loading.value = false;
    }
  }
</script>