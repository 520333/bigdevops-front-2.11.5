<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    showFooter
    :title="isUpdate ? '编辑 YAML 发布任务' : '新增 YAML 发布任务'"
    width="55%"
    @ok="handleSubmit"
  >
    <BasicForm @register="registerForm">
      <!-- 🚀 变量配置项：动态 Key=Value 列表 -->
      <template #variablesSlot>
        <a-form-item-rest>
          <div class="space-y-2 relative">
            <input id="variables_input" class="sr-only" tabindex="-1" />
            <div
              v-for="(item, index) in variableList"
              :key="index"
              class="flex items-center space-x-2"
            >
              <a-input v-model:value="item.key" placeholder="变量键 (如: ${APP_NAME})" class="w-1/2" />
              <span>=</span>
              <a-input v-model:value="item.value" placeholder="变量值 (如: nginx-web)" class="w-1/2" />
              <a-button type="link" danger @click="removeVariable(index)">删除</a-button>
            </div>
            <a-button type="dashed" block @click="addVariable">+ 添加变量 (KEY=VALUE)</a-button>
          </div>
        </a-form-item-rest>
      </template>
    </BasicForm>

    <!-- 🚀 选择模板后的实时 YAML 代码预览 -->
    <div v-if="previewYamlContent" class="mt-4">
      <div class="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">
        YAML 实时渲染预览 (CodeMirror):
      </div>
      <div class="border rounded bg-gray-900 overflow-hidden">
        <Codemirror
          v-model="previewYamlContent"
          :style="{ height: '300px' }"
          :disabled="true"
          :extensions="extensions"
        />
      </div>
    </div>
  </BasicDrawer>
</template>

<script lang="ts" setup>
  import { ref, unref, watch } from 'vue';
  import { Input as AInput, Button as AButton, FormItemRest as AFormItemRest } from 'ant-design-vue';
  import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
  import { BasicForm, useForm } from '@/components/Form';
  import { formSchema } from './yamlTask.data';
  import {
    createK8sYamlTask,
    updateK8sYamlTask,
    getClusterForSelect,
    getK8sYamlTemplateList,
  } from '@/api/demo/system';
  import { Codemirror } from 'vue-codemirror';
  import { oneDark } from '@codemirror/theme-one-dark';
  import { yaml } from '@codemirror/lang-yaml';

  const emit = defineEmits(['success', 'register']);
  const isUpdate = ref(false);
  const extensions = [yaml(), oneDark];

  const variableList = ref<Array<{ key: string; value: string }>>([]);
  const templateList = ref<any[]>([]);
  const previewYamlContent = ref('');

  const [registerForm, { resetFields, setFieldsValue, updateSchema, validate, getFieldsValue }] = useForm({
    labelWidth: 140,
    baseColProps: { span: 24 },
    schemas: formSchema,
    showActionButtonGroup: false,
  });

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
    resetFields();
    variableList.value = [];
    previewYamlContent.value = '';
    setDrawerProps({ confirmLoading: false });
    isUpdate.value = !!data?.isUpdate;

    // 1. 加载集群下拉列表
    try {
      const res = await getClusterForSelect();
      const list = Array.isArray(res) ? res : res?.items || res?.result || [];
      const clusters = list.map((item: any) => ({
        label: typeof item === 'object' ? (item.label || item.value || item.nameZh || item.name) : item,
        value: typeof item === 'object' ? (item.value || item.name || item.label) : item,
      }));
      updateSchema({
        field: 'clusterName',
        componentProps: { options: clusters, showSearch: true },
      });
    } catch (e) {
      console.error(e);
    }

    // 2. 加载 YAML 模板下拉列表
    try {
      const res = await getK8sYamlTemplateList({ page: 1, pageSize: 200 });
      templateList.value = res?.items || res || [];
      const templates = templateList.value.map((item: any) => ({
        label: item.name,
        value: item.id,
      }));
      updateSchema({
        field: 'TemplateId',
        componentProps: {
          options: templates,
          showSearch: true,
          onChange: (val: any) => handleTemplateChange(val),
        },
      });
    } catch (e) {
      console.error(e);
    }

    if (unref(isUpdate) && data.record) {
      setFieldsValue({
        ...data.record,
      });

      // 解析 variables / variablesFront 变量
      let vars: string[] = data.record.variables || [];
      if ((!vars || vars.length === 0) && data.record.variablesFront) {
        vars = data.record.variablesFront
          .split(';')
          .map((s: string) => s.trim())
          .filter((s: string) => s !== '' && s !== '-');
      }

      variableList.value = vars.map((str) => {
        const parts = str.split('=');
        return { key: parts[0] || '', value: parts[1] || '' };
      });

      if (data.record.TemplateId) {
        handleTemplateChange(data.record.TemplateId);
      }
    }
  });

  function handleTemplateChange(templateId: number) {
    const target = templateList.value.find((t) => t.id === templateId);
    if (target) {
      renderPreview(target.content);
    } else {
      previewYamlContent.value = '';
    }
  }

  function renderPreview(content: string) {
    let result = content || '';
    variableList.value.forEach((v) => {
      if (v.key) {
        result = result.replaceAll(v.key, v.value || '');
      }
    });
    previewYamlContent.value = result;
  }

  watch(
    variableList,
    () => {
      const formVal = getFieldsValue();
      if (formVal.TemplateId) {
        handleTemplateChange(formVal.TemplateId);
      }
    },
    { deep: true },
  );

  function addVariable() {
    variableList.value.push({ key: '', value: '' });
  }

  function removeVariable(index: number) {
    variableList.value.splice(index, 1);
  }

  async function handleSubmit() {
    try {
      const values = await validate();
      const variables = variableList.value
        .filter((item) => item.key.trim() !== '')
        .map((item) => `${item.key.trim()}=${item.value.trim()}`);
      const variablesFront = variables.join('; ');

      const postData = {
        ...values,
        variables,
        variablesFront,
      };

      setDrawerProps({ confirmLoading: true });
      if (unref(isUpdate)) {
        await updateK8sYamlTask(postData);
      } else {
        await createK8sYamlTask(postData);
      }
      closeDrawer();
      emit('success');
    } finally {
      setDrawerProps({ confirmLoading: false });
    }
  }
</script>
