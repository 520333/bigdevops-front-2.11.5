<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    showFooter
    :title="isUpdate ? '编辑 YAML 模板' : '新增 YAML 模板'"
    width="50%"
    @ok="handleSubmit"
  >
    <BasicForm @register="registerForm">
      <template #yamlContentSlot="{ model, field }">
        <div class="border rounded bg-gray-900 overflow-hidden relative">
          <input id="codemirror_yaml_template_input" class="sr-only" tabindex="-1" />
          <Codemirror
            v-model="model[field]"
            placeholder="请输入 K8s 资源 YAML 内容 (支持多段 --- 分隔)..."
            :style="{ height: '420px' }"
            :autofocus="true"
            :indent-with-tab="true"
            :tab-size="2"
            :extensions="extensions"
          />
        </div>
      </template>
    </BasicForm>
  </BasicDrawer>
</template>

<script lang="ts" setup>
  import { ref, unref } from 'vue';
  import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
  import { BasicForm, useForm } from '@/components/Form';
  import { formSchema } from './yamlTemplate.data';
  import { createK8sYamlTemplate, updateK8sYamlTemplate } from '@/api/demo/system';
  import { Codemirror } from 'vue-codemirror';
  import { oneDark } from '@codemirror/theme-one-dark';
  import { yaml } from '@codemirror/lang-yaml';

  const emit = defineEmits(['success', 'register']);
  const isUpdate = ref(false);
  const extensions = [yaml(), oneDark];

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
      setFieldsValue({
        ...data.record,
      });
    }
  });

  async function handleSubmit() {
    try {
      const values = await validate();
      setDrawerProps({ confirmLoading: true });
      if (unref(isUpdate)) {
        await updateK8sYamlTemplate(values);
      } else {
        await createK8sYamlTemplate(values);
      }
      closeDrawer();
      emit('success');
    } finally {
      setDrawerProps({ confirmLoading: false });
    }
  }
</script>
