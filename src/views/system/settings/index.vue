<template>
  <PageWrapper title="系统全局设置" content="配置系统的全局水印以及版本发布/系统公告弹窗的时机与内容">
    <a-card :bordered="false" class="mb-4">
      <BasicForm @register="registerForm" />
      <div class="flex justify-center mt-6">
        <a-button type="primary" size="large" @click="handleSubmit" :loading="loading">
          保存全部系统设置
        </a-button>
      </div>
    </a-card>
  </PageWrapper>
</template>

<script lang="ts" setup>
  import { ref, onMounted } from 'vue';
  import { PageWrapper } from '@/components/Page';
  import { BasicForm, useForm } from '@/components/Form';
  import { Card as ACard, Button as AButton, message } from 'ant-design-vue';
  import { getSystemSetting, updateSystemSetting, type SystemSetting } from '@/api/system/setting';

  const loading = ref(false);

  const [registerForm, { setFieldsValue, validate }] = useForm({
    labelWidth: 170,
    schemas: [
      {
        field: 'divider-watermark',
        component: 'Divider',
        label: '全局水印设置',
        colProps: { span: 24 },
      },
      {
        field: 'watermarkEnabled',
        label: '开启全局水印',
        component: 'Switch',
        helpMessage: '开启后，系统将在所有页面背景显示防泄密水印',
        colProps: { span: 24 },
      },
      {
        field: 'watermarkText',
        label: '自定义水印内容',
        component: 'Input',
        helpMessage: '留空则默认显示当前登录用户实名与当天日期',
        colProps: { span: 24 },
        componentProps: {
          placeholder: '请输入自定义水印内容（选填）',
        },
      },
      {
        field: 'divider-upgrade',
        component: 'Divider',
        label: '版本发布与系统弹窗设置',
        colProps: { span: 24 },
      },
      {
        field: 'upgradePromptEnabled',
        label: '开启弹窗提示',
        component: 'Switch',
        helpMessage: '总开关：控制登录后是否显示系统公告/版本更新弹窗',
        colProps: { span: 24 },
      },
      {
        field: 'upgradePromptTiming',
        label: '弹窗时机',
        component: 'Select',
        helpMessage: '选择弹窗触发的策略与条件',
        colProps: { span: 24 },
        componentProps: {
          options: [
            { label: '仅新版本首次登录弹窗 (推荐：发布新版本号后提醒一次)', value: 'version_once' },
            { label: '每次登录均弹窗', value: 'every_login' },
            { label: '每日首次登录弹窗 (当天重复登录不弹)', value: 'day_once' },
            { label: '从不弹窗 (完全静默)', value: 'never' },
          ],
        },
      },
      {
        field: 'upgradePromptVersion',
        label: '当前版本标识',
        component: 'Input',
        helpMessage: '与“仅新版本首次登录弹窗”配合使用。修改此版本号后，所有员工在下次登录时均会收到弹窗',
        colProps: { span: 24 },
        componentProps: {
          placeholder: '例如：v2.11.5 或 2026.09.18',
        },
      },
      {
        field: 'upgradePromptTitle',
        label: '弹窗标题',
        component: 'Input',
        helpMessage: '弹窗顶部的标题文字',
        colProps: { span: 24 },
        componentProps: {
          placeholder: '例如：新版本发布 或 系统功能升级通知',
        },
      },
      {
        field: 'upgradePromptContent',
        label: '弹窗公告内容',
        component: 'InputTextArea',
        helpMessage: '支持多行输入本次发布的说明信息、更新日志或维护公告',
        colProps: { span: 24 },
        componentProps: {
          rows: 4,
          placeholder: '请输入具体版本更新功能点或向用户告知的内容...',
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
        upgradePromptEnabled: data.upgradePromptEnabled ?? false,
        upgradePromptTiming: data.upgradePromptTiming || 'version_once',
        upgradePromptVersion: data.upgradePromptVersion || 'v1.0.0',
        upgradePromptTitle: data.upgradePromptTitle || '新版本发布',
        upgradePromptContent:
          data.upgradePromptContent ||
          '系统已升级至最新版本，优化了部分功能并提升了运行稳定性。',
      });
    } catch (error) {
      console.error('Failed to load system settings', error);
    }
  });

  async function handleSubmit() {
    try {
      const values = await validate();
      loading.value = true;
      await updateSystemSetting(values as unknown as SystemSetting);
      message.success('保存成功，设置已即时生效！');
    } catch (error) {
      console.error(error);
    } finally {
      loading.value = false;
    }
  }
</script>