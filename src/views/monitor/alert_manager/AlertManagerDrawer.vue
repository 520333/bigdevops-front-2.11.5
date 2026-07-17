<template>
  <BasicDrawer v-bind="$attrs" @register="registerDrawer" showFooter :title="getTitle" width="40%" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicDrawer>
</template>

<script lang="ts" setup>
import { ref, computed, unref } from 'vue';
import { BasicForm, useForm } from '@/components/Form/index';
import { formSchema } from './alertmanager.data';
import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
import { useMessage } from '@/hooks/web/useMessage';

import { createMonitorAlertManagerPool, updateMonitorAlertManagerPool } from '@/api/demo/system';

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

    if (Array.isArray(recordData.groupBy)) {
      recordData.groupBy = recordData.groupBy.join('\n');
    }

    setFieldsValue(recordData);
  } else {
    templateId.value = null;
  }

});

async function handleSubmit() {
  try {
    const values = await validate();

    if (values.groupBy && typeof values.groupBy === 'string') {
      values.groupBy = values.groupBy
        .split('\n')
        .map(item => item.trim())
        .filter(item => item !== '');
    } else {
      values.groupBy = [];
    }
    setDrawerProps({ confirmLoading: true });

    if (!unref(isUpdate)) {
      await createMonitorAlertManagerPool(values);
      createMessage.success('实例创建成功');
    } else {
      await updateMonitorAlertManagerPool({ ...values, ID: templateId.value });
      createMessage.success('实例更新成功');
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