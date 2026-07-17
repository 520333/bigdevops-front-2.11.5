<template>
  <BasicDrawer v-bind="$attrs" @register="registerDrawer" showFooter :title="getTitle" width="600px" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicDrawer>
</template>

<script lang="ts" setup>
import { ref, computed, unref } from 'vue';
import { BasicForm, useForm } from '@/components/Form/index';
import { formSchema } from './pool.data';
import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
import { useMessage } from '@/hooks/web/useMessage';
import { createMonitorPromScrapePool, updateMonitorPromScrapePool } from '@/api/demo/system';

const emit = defineEmits(['success', 'register']);
const { createMessage } = useMessage();
const isUpdate = ref(true);
const templateId = ref<number | null>(null);
const getTitle = computed(() => (!unref(isUpdate) ? '新增采集池' : '编辑采集池'));
const [registerForm, { resetFields, setFieldsValue, validate }] = useForm({
  labelWidth: 100,
  baseColProps: { span: 24 },
  schemas: formSchema,
  showActionButtonGroup: false,
});

const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
  resetFields();
  setDrawerProps({ confirmLoading: false });
  isUpdate.value = !!data?.isUpdate;

  if (unref(isUpdate)) {
    templateId.value = data.record.id;
    const recordData = { ...data.record };

    if (Array.isArray(recordData.externalLabels)) {
      recordData.externalLabels = recordData.externalLabels.join('\n');
    }

    setFieldsValue(recordData);
  } else {
    templateId.value = null;
  }
});

async function handleSubmit() {
  try {
    const values = await validate();
    setDrawerProps({ confirmLoading: true });

    if (values.externalLabels) {
      values.externalLabels = values.externalLabels
        .split('\n')
        .map(item => item.trim())
        .filter(item => item !== '');
    }

    if (!unref(isUpdate)) {
      await createMonitorPromScrapePool(values);
      createMessage.success('采集池创建成功');
    } else {
      await updateMonitorPromScrapePool({ ...values, ID: templateId.value });
      createMessage.success('采集池更新成功');
    }

    closeDrawer();
    emit('success');
  } catch (error) {
    console.error('提交失败:', error);
  } finally {
    setDrawerProps({ confirmLoading: false });
  }
}
</script>