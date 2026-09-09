<template>
  <div class="p-4 bg-white dark:bg-zinc-950 h-full flex flex-col overflow-hidden">
    <div class="flex justify-between items-center pb-3 border-b dark:border-zinc-800 mb-4">
      <span class="text-lg font-bold text-gray-800 dark:text-gray-200">填写工单详情</span>
      <a-button @click="goBack">返回模板选择</a-button>
    </div>

    <div class="flex-1 overflow-y-auto px-2" v-loading="loading">
      <div
        class="max-w-3xl mx-auto w-full py-4 p-6 rounded-lg border dark:border-zinc-800 shadow-sm bg-white dark:bg-[#151515]">
        <div
          class="mb-6 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded text-blue-700 dark:text-blue-400 text-sm">
          您正在基于模板 <strong>{{ templateDetail?.name }}</strong> 发起审批流转。
        </div>

        <div class="mb-6 p-4 bg-gray-50 dark:bg-zinc-900/40 border border-gray-200 dark:border-zinc-800 rounded-md"
          v-if="flowNodes.length > 0">
          <div class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">审批流转预览</div>
          <a-steps :current="-1" size="small">
            <a-step v-for="(node, index) in flowNodes" :key="index" :title="node.type"
              :description="node.defineUserOrGroup" />
          </a-steps>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            <span class="text-red-500 mr-1">*</span>工单申请标题
          </label>
          <a-input v-model:value="ticketTitle" placeholder="请简要输入工单用途（如：北京测试节点服务器申请）" size="large" />
        </div>

        <div class="mb-4">
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">期望完成时间</label>
          <a-date-picker v-model:value="desireFinishTime" show-time placeholder="请选择期望完成的时间" style="width: 100%"
            size="large" />
        </div>

        <div class="mt-6 pt-6 border-t border-gray-200 dark:border-zinc-800">
          <VFormCreate v-if="dynamicFormConfig && dynamicFormConfig.schemas" :form-config="dynamicFormConfig"
            v-model:formModel="dynamicFormData" ref="vFormRef" />
          <div v-else-if="dynamicFormConfig && !dynamicFormConfig.schemas" class="text-center text-gray-400 py-10">
            该模板尚未配置表单字段，填写标题后即可提交。
          </div>
        </div>

        <div class="flex justify-center mt-8">
          <a-button type="primary" size="large" :loading="submitting" @click="handleSubmit" style="width: 150px;">
            提交申请
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Button as AButton, Input as AInput, Steps as ASteps, Step as AStep } from 'ant-design-vue';
import { useGo } from '@/hooks/web/usePage';
import { useMessage } from '@/hooks/web/useMessage';
import { DatePicker as ADatePicker } from 'ant-design-vue';
import VFormCreate from '@/views/form-design/components/VFormCreate/index.vue';

import { getWorkOrderTemplateDetail, createWorkOrderInstance } from '@/api/demo/system';

const route = useRoute();
const go = useGo();
const { createMessage } = useMessage();

const loading = ref(false);
const submitting = ref(false);

const templateId = ref<number | string>('');
const templateDetail = ref<any>(null);
const ticketTitle = ref('');
const dynamicFormConfig = ref<any>(null);
const vFormRef = ref<any>(null);
const dynamicFormData = ref<any>({});

const flowNodes = ref<any[]>([]);
const desireFinishTime = ref<any>(null);

onMounted(async () => {
  templateId.value = route.query.templateId as string;

  if (!templateId.value) {
    createMessage.error('缺少模板参数，非法访问');
    goBack();
    return;
  }

  await loadTemplateConfig();
});

function initDefaultValues(schemas: any[], formData: any) {
  if (!Array.isArray(schemas)) return;
  schemas.forEach((schema) => {
    if (schema.field && schema.componentProps?.defaultValue !== undefined && formData[schema.field] === undefined) {
      formData[schema.field] = schema.componentProps.defaultValue;
    }
    if (schema.columns && Array.isArray(schema.columns)) {
      schema.columns.forEach((col: any) => {
        if (col.children) {
          initDefaultValues(col.children, formData);
        }
      });
    }
  });
}

async function loadTemplateConfig() {
  loading.value = true;
  try {
    const res = await getWorkOrderTemplateDetail(templateId.value);
    templateDetail.value = res.result || res;

    if (templateDetail.value?.process?.flowNodes) {
      flowNodes.value = templateDetail.value.process.flowNodes;
    } else {
      flowNodes.value = [];
    }

    const formConfigStr = templateDetail.value?.formDesign?.formConfig || '{"schemas":[]}';

    let parsedConfig = typeof formConfigStr === 'string' ? JSON.parse(formConfigStr) : formConfigStr;

    if (!parsedConfig.schemas) {
      parsedConfig.schemas = [];
    }

    dynamicFormConfig.value = parsedConfig;

    const initialData: Record<string, any> = {};
    initDefaultValues(parsedConfig.schemas, initialData);
    dynamicFormData.value = initialData;

  } catch (e) {
    createMessage.error('获取模板表单配置失败');
    dynamicFormConfig.value = { schemas: [] };
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  if (!ticketTitle.value.trim()) {
    createMessage.warning('请输入工单申请标题');
    return;
  }

  try {
    submitting.value = true;
    if (vFormRef.value && typeof vFormRef.value.validate === 'function') {
      await vFormRef.value.validate();
    }

    const payload = {
      title: ticketTitle.value,
      templateId: Number(templateId.value),
      formValues: JSON.stringify(dynamicFormData.value),
      // 🚨 新增：将日期传给后端 (如果是对象，转为字符串或ISO格式)
      desireFinishTime: desireFinishTime.value ? desireFinishTime.value.format('YYYY-MM-DD HH:mm:ss') : null,
    };

    await createWorkOrderInstance(payload);
    createMessage.success('工单申请提交成功！');
    // goBack();
    go('/workOrder/search');
  } catch (error) {
    createMessage.warning('请检查表单必填项');
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  go('/workOrder/ticket');
}
</script>