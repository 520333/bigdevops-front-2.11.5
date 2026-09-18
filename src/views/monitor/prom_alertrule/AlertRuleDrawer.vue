<template>
  <BasicDrawer v-bind="$attrs" @register="registerDrawer" showFooter :title="getTitle" width="45%" @ok="handleSubmit">
    <div class="pb-24">
      <BasicForm @register="registerForm">
        <template #exprSlot="{ model, field }">
          <div class="mb-1 flex justify-between items-center">
            <span class="text-sm text-gray-500">PromQL Query</span>
            <a-button type="link" size="small" @click="handleCheckSyntax(model[field])">
              检查语法
            </a-button>
          </div>

          <div class="border border-gray-300 rounded overflow-hidden">
            <input id="codemirror_relabel_input" class="sr-only" tabindex="-1" />
            <Codemirror v-if="renderEditor" v-model="model[field]" placeholder="请输入 PromQL 语句..."
              :style="{ height: '200px' }" :extensions="extensions" />
          </div>
        </template>
      </BasicForm>
    </div>
  </BasicDrawer>
</template>

<script lang="ts" setup>
import { ref, computed, nextTick } from 'vue';
import { BasicForm, useForm } from '@/components/Form/index';
import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
import { useMessage } from '@/hooks/web/useMessage';
import { createMonitorPromAlertRule, updateMonitorPromAlertRule, promqlExprCheck } from '@/api/demo/system';
import { formSchema } from './alertrule.data';

import { Codemirror } from 'vue-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { yaml } from '@codemirror/lang-yaml';

const emit = defineEmits(['success', 'register']);
const { createMessage } = useMessage();
const isUpdate = ref(true);
const templateId = ref<number | null>(null);
const renderEditor = ref(false);
const getTitle = computed(() => (!isUpdate.value ? '新增告警规则' : '编辑告警规则'));

const extensions = [oneDark, yaml()];

const [registerForm, { resetFields, setFieldsValue, validate }] = useForm({
  labelWidth: 130,
  baseColProps: { span: 24 },
  schemas: formSchema,
  showActionButtonGroup: false,
});


async function handleCheckSyntax(ql: string) {
  if (!ql || ql.trim() === '') {
    return createMessage.warning('请先输入 PromQL 语句');
  }

  const closeLoading = createMessage.loading('正在校验...', 0);

  try {
    await promqlExprCheck({ ql: ql });
    createMessage.success('语法检查通过！');
  } catch (e: any) {
    const msg = e?.response?.data?.message || e?.message || '语法校验失败';
    createMessage.error(msg);
    console.error('语法错误详情:', msg);
  } finally {
    closeLoading();
  }
}

const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
  renderEditor.value = false;
  await nextTick();
  resetFields();
  setDrawerProps({ confirmLoading: false });
  isUpdate.value = !!data?.isUpdate;
  if (isUpdate.value) {
    templateId.value = data.record.id;
    const recordData = { ...data.record };
    if (Array.isArray(recordData.labelsFront)) recordData.labelsFront = recordData.labelsFront.join('\n');
    if (Array.isArray(recordData.annotationsFront)) recordData.annotationsFront = recordData.annotationsFront.join('\n');
    if (recordData.treeNodeIds) recordData.treeNodeIds = recordData.treeNodeIds.map(Number);
    if (Array.isArray(recordData.poolIds) && recordData.poolIds.length > 0) {
      recordData.poolIds = recordData.poolIds.map(Number);
    } else if (recordData.poolId) {
      recordData.poolIds = [Number(recordData.poolId)];
    } else {
      recordData.poolIds = [];
    }
    setFieldsValue(recordData);
  }
  await nextTick();
  renderEditor.value = true;
});

async function handleSubmit() {
  try {
    const values = await validate();
    if (Array.isArray(values.poolIds)) {
      values.poolId = values.poolIds.length > 0 ? Number(values.poolIds[0]) : 0;
      values.poolIds = values.poolIds.map(String);
    }
    setDrawerProps({ confirmLoading: true });
    if (!isUpdate.value) {
      await createMonitorPromAlertRule(values);
      createMessage.success('创建成功');
    } else {
      await updateMonitorPromAlertRule({ ...values, id: templateId.value });
      createMessage.success('更新成功');
    }
    closeDrawer();
    emit('success');
  } catch (e: any) {
    const msg = e?.response?.data?.message || e?.message || '操作失败，请检查填写内容';
    createMessage.error(msg);
    console.error('保存失败详情:', e);
  } finally {
    setDrawerProps({ confirmLoading: false });
  }
}
</script>
