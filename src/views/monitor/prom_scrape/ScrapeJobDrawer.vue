<template>
  <BasicDrawer v-bind="$attrs" @register="registerDrawer" showFooter :title="getTitle" width="55%" @ok="handleSubmit">
    <BasicForm @register="registerForm">
      <template #relabelSlot="{ model, field }">
        <div class="border border-gray-300 rounded overflow-hidden relative">
          <input id="codemirror_relabel_input" class="sr-only" tabindex="-1" />
          <Codemirror v-if="renderEditor" v-model="model[field]" placeholder="请输入自定义relabel配置，YAML格式"
            :style="{ height: '200px' }" :extensions="extensions" />
        </div>
      </template>
    </BasicForm>
  </BasicDrawer>
</template>

<script lang="ts" setup>
import { ref, computed, unref, nextTick } from 'vue';
import { BasicForm, useForm } from '@/components/Form/index';
import { formSchema } from './job.data';
import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
import { useMessage } from '@/hooks/web/useMessage';

import { Codemirror } from 'vue-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { yaml } from '@codemirror/lang-yaml';

import { createMonitorPromScrapeJob, updateMonitorPromScrapeJob } from '@/api/demo/system';

const emit = defineEmits(['success', 'register']);
const { createMessage } = useMessage();
const isUpdate = ref(true);
const templateId = ref<number | null>(null);
const renderEditor = ref(false);
const getTitle = computed(() => (!unref(isUpdate) ? '新增采集任务' : '编辑采集任务'));
  const extensions = [oneDark, yaml()];
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
    if (values.treeNodeIds && Array.isArray(values.treeNodeIds)) {
      values.treeNodeIds = values.treeNodeIds.map(String);
    }
    if (values.relabelConfigsYamlString) {
      values.relabelConfigsYamlString = '\n' + values.relabelConfigsYamlString.trim();
    }

    setDrawerProps({ confirmLoading: true });


    if (!unref(isUpdate)) {
      await createMonitorPromScrapeJob(values);
      createMessage.success('采集任务创建成功');
    } else {
      await updateMonitorPromScrapeJob({ ...values, id: templateId.value });
      createMessage.success('采集任务更新成功');
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