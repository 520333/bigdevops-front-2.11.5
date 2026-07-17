<template>
  <BasicDrawer v-bind="$attrs" @register="registerDrawer" showFooter :title="getTitle" width="30%" @ok="handleSubmit">
    <BasicForm @register="registerForm"/>
  </BasicDrawer>
</template>

<script lang="ts" setup>
import { ref, computed, unref, nextTick } from 'vue';
import { BasicForm, useForm } from '@/components/Form/index';
import { formSchema } from './sendgroup.data';
import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
import { useMessage } from '@/hooks/web/useMessage';
import { createMonitorAlertManagerSendGroup, updateMonitorAlertManagerSendGroup } from '@/api/demo/system';

const emit = defineEmits(['success', 'register']);
const { createMessage } = useMessage();
const isUpdate = ref(true);
const templateId = ref<number | null>(null);
const renderEditor = ref(false);
const getTitle = computed(() => (!unref(isUpdate) ? '新增发送组' : '编辑发送组'));

const [registerForm, { resetFields, setFieldsValue, validate }] = useForm({
  labelWidth: 100,
  baseColProps: { span: 24 },
  schemas: formSchema,
  showActionButtonGroup: false,
});

const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
  renderEditor.value = false;
  await nextTick();
  resetFields();
  setDrawerProps({ confirmLoading: false });
  isUpdate.value = !!data?.isUpdate;

  if (unref(isUpdate)) {
    templateId.value = data.record.id;
    const recordData = { ...data.record };


    if (recordData.treeNodeIds && Array.isArray(recordData.treeNodeIds)) {
      recordData.treeNodeIds = recordData.treeNodeIds.map(id => Number(id));
    }
    if (recordData.relabelConfigsYamlString) {
      if (!recordData.relabelConfigsYamlString.startsWith('\n')) {
        recordData.relabelConfigsYamlString = '\n' + recordData.relabelConfigsYamlString;
      }
    }
    setFieldsValue(recordData);
  } else {
    templateId.value = null;

  }

  await nextTick();
  renderEditor.value = true;

});

async function handleSubmit() {
  try {
    const values = await validate();
    if (values.needUpgrade === 2) {
      delete values['firstUserNames'];
      delete values['upgradeMinutes'];
    }
    if (values.treeNodeIds && Array.isArray(values.treeNodeIds)) {
      values.treeNodeIds = values.treeNodeIds.map(String);
    }
    if (values.relabelConfigsYamlString) {
      values.relabelConfigsYamlString = '\n' + values.relabelConfigsYamlString.trim();
    }

    setDrawerProps({ confirmLoading: true });


    if (!unref(isUpdate)) {
      await createMonitorAlertManagerSendGroup(values);
      createMessage.success('发送组创建成功');
    } else {
      await updateMonitorAlertManagerSendGroup({ ...values, id: templateId.value });
      createMessage.success('发送组更新成功');
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