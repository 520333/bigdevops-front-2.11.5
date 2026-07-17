<template>
  <BasicDrawer v-bind="$attrs" @register="registerDrawer" showFooter :title="getTitle" width="500px" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicDrawer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { BasicForm, useForm } from '@/components/Form/index';
import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
import { useMessage } from '@/hooks/web/useMessage';
import { formSchema } from './event.data';
import { alertManagerEventSilence, alertManagerEventBatchSilence } from '@/api/demo/system';

const emit = defineEmits(['success', 'register']);
const { createMessage } = useMessage();

const isBatchMode = ref(false);
const templateId = ref<number | null>(null);
const selectedEventIds = ref<number[]>([]);

const getTitle = computed(() => isBatchMode.value ? '批量屏蔽告警设置' : '屏蔽告警设置');

const [registerForm, { resetFields, setFieldsValue, validate }] = useForm({
  labelWidth: 120,
  baseColProps: { span: 24 },
  schemas: formSchema,
  showActionButtonGroup: false,
});

const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
  resetFields();
  setDrawerProps({ confirmLoading: false });

  isBatchMode.value = !!data?.isBatch;

  if (isBatchMode.value) {
    selectedEventIds.value = data.selectedIds || [];
  } else if (data?.record) {
    templateId.value = data.record.id;
  }

  setFieldsValue({
    silenceTime: '2h',
    byName: false,
  });
});

async function handleSubmit() {
  try {
    const values = await validate();

    setDrawerProps({ confirmLoading: true });

    if (isBatchMode.value) {
      if (selectedEventIds.value.length === 0) {
        createMessage.error('没有选择任何告警事件');
        return;
      }
      await alertManagerEventBatchSilence({
        eventIds: selectedEventIds.value,
        silenceTime: values.silenceTime,
        byName: values.byName
      });
      createMessage.success(`批量屏蔽规则已下发 (${selectedEventIds.value.length}个)`);
    } else {
      // Handle Single Silence
      if (templateId.value === null) {
        createMessage.error('无法获取当前告警事件的有效ID，请关闭弹窗重试');
        return;
      }
      await alertManagerEventSilence(templateId.value, values);
      createMessage.success('告警屏蔽规则已成功下发至 Alertmanager');
    }

    closeDrawer();
    emit('success');
  } catch (e: any) {
    const errorMsg = e?.response?.data?.message || e?.message || '当下发屏蔽规则时发生了未知错误';
    createMessage.error(errorMsg);
    console.error('静默下发失败详情:', e);
  } finally {
    setDrawerProps({ confirmLoading: false });
  }
}
</script>