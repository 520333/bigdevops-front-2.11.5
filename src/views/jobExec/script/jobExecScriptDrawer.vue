<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    showFooter
    :title="getTitle"
    width="800px"
    @ok="handleSubmit"
  >
    <BasicForm @register="registerForm" @field-value-change="handleFieldChange" />
    
    <div class="mt-4 p-4 bg-white dark:bg-dark-900 rounded-md">
      <div class="mb-2 font-bold text-gray-700 dark:text-gray-300">脚本内容：</div>
      
      <div class="border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
        <Codemirror
          v-if="renderEditor"
          v-model="scriptContent"
          placeholder="请输入脚本内容..."
          :style="{ height: '400px' }"
          :extensions="editorExtensions"
        />
      </div>
    </div>
  </BasicDrawer>
</template>

<script lang="ts" setup>
  import { ref, computed, unref, nextTick } from 'vue';
  import { BasicForm, useForm } from '@/components/Form/index';
  import { formSchema } from './jobExecScript.data';
  import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
  import { useMessage } from '@/hooks/web/useMessage';
  import { createJobExecScript, updateJobExecScript } from '@/api/demo/system'; 
  
  import { Codemirror } from 'vue-codemirror';
  import { oneDark } from '@codemirror/theme-one-dark';
  import { javascript } from '@codemirror/lang-javascript';
  import { python } from '@codemirror/lang-python';
  import { yaml } from '@codemirror/lang-yaml';
  import { StreamLanguage } from '@codemirror/language';
  import { shell } from '@codemirror/legacy-modes/mode/shell';

  const emit = defineEmits(['success', 'register']);
  const { createMessage } = useMessage();

  const isUpdate = ref(true);
  const templateId = ref<number | null>(null);
  
  const scriptContent = ref('');
  const currentScriptType = ref('shell');
  const renderEditor = ref(true); // 控制编辑器重绘的开关

  const getTitle = computed(() => (!unref(isUpdate) ? '新增脚本模板' : '编辑脚本模板'));

  // 计算编辑器的拓展插件
  const editorExtensions = computed(() => {
    const ext = [oneDark];
    const lang = currentScriptType.value || 'shell';
    if (lang === 'shell') {
      ext.push(StreamLanguage.define(shell));
    } else if (lang === 'javascript' || lang === 'json') {
      ext.push(javascript());
    } else if (lang === 'python') {
      ext.push(python());
    } else if (lang === 'yaml' || lang === 'ansible') {
      ext.push(yaml());
    }
    return ext;
  });

  const [registerForm, { resetFields, setFieldsValue, validate }] = useForm({
    labelWidth: 100,
    baseColProps: { span: 24 },
    schemas: formSchema,
    showActionButtonGroup: false,
  });

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
    resetFields();
    scriptContent.value = '';
    currentScriptType.value = 'shell';
    setDrawerProps({ confirmLoading: false });
    isUpdate.value = !!data?.isUpdate;
    
    if (unref(isUpdate)) {
      templateId.value = data.record.id;
      setFieldsValue(data.record);
      scriptContent.value = data.record.content || '';

      renderEditor.value = false;
      currentScriptType.value = data.record.lang || 'shell';
      await nextTick();
      renderEditor.value = true;
    } else {
      templateId.value = null;
      setFieldsValue({ lang: 'shell' });
    }
  });

  // 🚀 核心逻辑：切换类型时，强制销毁并重建编辑器
  async function handleFieldChange(key: string, value: any) {
    if (key === 'lang') {
      renderEditor.value = false;       // 销毁旧编辑器
      currentScriptType.value = value;  // 更新模式
      await nextTick();                 // 等待 DOM 清理
      renderEditor.value = true;        // 重建新编辑器
    }
  }

  async function handleSubmit() {
    try {
      const values = await validate();
      if (!scriptContent.value.trim()) {
        createMessage.warning('脚本内容不能为空！');
        return;
      }
      setDrawerProps({ confirmLoading: true });
      
      const submitData = { ...values, content: scriptContent.value };
      
      if (!unref(isUpdate)) {
        await createJobExecScript(submitData);
        createMessage.success('脚本模板创建成功');
      } else {
        await updateJobExecScript({ ...submitData, ID: templateId.value });
        createMessage.success('脚本模板更新成功');
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
