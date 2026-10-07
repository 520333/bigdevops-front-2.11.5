<template>
  <BasicDrawer v-bind="$attrs" @register="registerDrawer" showFooter
    :title="isUpdate ? '编辑流水线模版' : '新增流水线模版'" width="70%" @ok="handleSubmit">
    <div class="flex flex-col gap-4 py-2 px-3">
      <BasicForm @register="registerForm">
        <template #pipelineScriptSlot>
          <div class="flex flex-col gap-2 w-full">
            <div
              class="flex items-center justify-between bg-slate-100 dark:bg-slate-900 px-3 py-2 rounded-t-lg border-b border-gray-200 dark:border-gray-800">
              <span class="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                <Icon icon="ant-design:code-outlined" class="text-cyan-500 text-sm" />
                <span>Jenkinsfile (Groovy DSL 流水线定义)</span>
                <Tag color="processing" class="ml-2 font-mono text-xs font-semibold">Groovy Syntax</Tag>
              </span>
              <Space align="center">
                <Tag v-if="syntaxStatus === 'success'" color="success"
                  class="font-bold text-xs py-0.5 px-2 flex items-center gap-1 border border-green-500/40">
                  <Icon icon="ant-design:check-circle-filled" class="text-green-500 text-sm" />
                  <span>校验通过</span>
                </Tag>
                <Tag v-else-if="syntaxStatus === 'error'" color="error"
                  class="font-bold text-xs py-0.5 px-2 flex items-center gap-1 border border-red-500/40">
                  <Icon icon="ant-design:close-circle-filled" class="text-red-500 text-sm" />
                  <span>校验失败</span>
                </Tag>
                <Button size="small" type="primary" class="bg-indigo-600 border-0 font-medium" :loading="validating"
                  @click="handlePreCheckSyntax">
                  <template #icon>
                    <Icon icon="ant-design:check-circle-outlined" />
                  </template>
                  语法检查
                </Button>
              </Space>
            </div>
            <div
              class="border-2 border-gray-300 dark:border-gray-700 rounded-b-lg overflow-hidden shadow-xs hover:border-cyan-500/70 transition-all">
              <Codemirror v-model="pipelineScript" placeholder="在此输入 Groovy 流水线定义代码 (pipeline { agent any ... })"
                :style="{ height: '460px', fontSize: '13px' }" :extensions="pipelineEditorExtensions" />
            </div>
          </div>
        </template>
      </BasicForm>
    </div>
  </BasicDrawer>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Tag, Space, Modal } from 'ant-design-vue';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon/Icon.vue';
import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
import { BasicForm, useForm } from '@/components/Form';
import { createJenkinsPipeline, updateJenkinsPipeline, validateJenkinsPipeline } from '@/api/cicd';
import { useMessage } from '@/hooks/web/useMessage';
import { formSchema, pipelineEditorExtensions, defaultTemplateScript } from './pipeline.data';
import { Codemirror } from 'vue-codemirror';

const emit = defineEmits(['success', 'register']);
const { createMessage } = useMessage();
const isUpdate = ref(false);
const recordId = ref<number | null>(null);
const pipelineScript = ref<string>('');
const validating = ref(false);
const syntaxStatus = ref<'success' | 'error' | null>(null);

watch(pipelineScript, () => {
  syntaxStatus.value = null;
});

async function validatePipelineCode(): Promise<boolean> {
  if (!pipelineScript.value || pipelineScript.value.trim() === '') {
    createMessage.warning('流水线脚本内容不能为空');
    return false;
  }
  try {
    validating.value = true;
    const res: any = await validateJenkinsPipeline({
      pipelineScript: pipelineScript.value,
    });
    if (res && res.valid) {
      syntaxStatus.value = 'success';
      return true;
    } else {
      syntaxStatus.value = 'error';
      const errors = Array.isArray(res?.errors) ? res.errors.join('\n') : res?.errors || '语法错误';
      Modal.error({
        title: 'Pipeline 语法校验未通过',
        width: 580,
        content: `${errors}`,
      });
      return false;
    }
  } catch (e) {
    createMessage.error('语法检测接口连线失败');
    return false;
  } finally {
    validating.value = false;
  }
}

async function handlePreCheckSyntax() {
  const isValid = await validatePipelineCode();
  if (isValid) {
    Modal.success({
      title: 'Linter检测通过',
      content: '当前 Jenkinsfile 语法完全符合 Groovy DSL 规范，可安全发布及使用。',
    });
  }
}

const [registerForm, { validate, resetFields, setFieldsValue }] = useForm({
  labelWidth: 125,
  schemas: formSchema,
  showActionButtonGroup: false,
});

const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
  resetFields();
  setDrawerProps({ confirmLoading: false });
  isUpdate.value = !!data?.isUpdate;
  recordId.value = data?.record?.id || null;

  if (isUpdate.value && data?.record) {
    const record = data.record;
    setFieldsValue({
      name: record.name || '',
      lang: record.lang || 'Vue/TS',
      description: record.description || '',
    });
    pipelineScript.value = record.pipelineScript || defaultTemplateScript;
  } else {
    pipelineScript.value = defaultTemplateScript;
  }
});

async function handleSubmit() {
  try {
    const values = await validate();
    if (!pipelineScript.value || pipelineScript.value.trim() === '') {
      createMessage.warning('流水线 Pipeline 脚本内容不能为空');
      return;
    }

    setDrawerProps({ confirmLoading: true });

    // 1. 点击确认时先进行 Groovy 语法检查，未通过则拦截保存
    const isSyntaxValid = await validatePipelineCode();
    if (!isSyntaxValid) {
      return;
    }

    // 2. 语法校验通过后发起保存
    const payload = {
      id: recordId.value || undefined,
      name: values.name,
      lang: values.lang,
      description: values.description,
      pipelineScript: pipelineScript.value,
    };

    if (isUpdate.value) {
      await updateJenkinsPipeline(payload);
      createMessage.success(`流水线模版 [${values.name}] 保存成功！`);
    } else {
      await createJenkinsPipeline(payload);
      createMessage.success(`流水线模版 [${values.name}] 成功创建！`);
    }

    closeDrawer();
    emit('success');
  } catch (e) {
  } finally {
    setDrawerProps({ confirmLoading: false });
  }
}
</script>
