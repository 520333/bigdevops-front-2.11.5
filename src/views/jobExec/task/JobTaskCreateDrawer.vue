<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    showFooter
    :title="getTitle"
    width="1350px"
    @ok="handleSubmit"
  >
    <div v-if="renderEditor" class="flex h-full gap-4">
      <div class="w-[500px] shrink-0 pr-4 border-r dark:border-gray-700">
        <BasicForm @register="registerLeftForm">
          <template #machineTransferSlot="{ model, field }">
            <Transfer
              :target-keys="Array.isArray(model[field]) ? model[field] : []"
              @update:target-keys="(val) => model[field] = val"
              :data-source="Array.isArray(model.machineData) ? model.machineData : []"
              show-search
              :titles="['可选节点主机', '已选目标主机']"
              :render="(item) => item.title"
              :list-style="{ width: '180px', height: '350px' }"
            />
          </template>
        </BasicForm>
      </div>

      <div class="flex-1 min-w-0 pl-2">
        <BasicForm @register="registerRightForm">
          <template #scriptContentSlot="{ model, field }">
            <CodeEditor
              :key="model.lang"
              v-model:value="model[field]"
              :mode="getCodeMirrorMode(model.lang)"
              style="height: 580px;"
              class="border border-gray-300 dark:border-gray-600 rounded"
            />
          </template>
        </BasicForm>
      </div>
    </div>
  </BasicDrawer>
</template>

<script lang="ts" setup>
  import { ref, computed, unref, nextTick } from 'vue';
  import { BasicForm, useForm } from '@/components/Form/index';
  import { leftFormSchema, rightFormSchema } from './jobTask.data';
  import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
  import { useMessage } from '@/hooks/web/useMessage';
  import { createJobExecTask, updateJobExecTask } from '@/api/demo/system';
  import { CodeEditor } from '@/components/CodeEditor';
  import { Transfer } from 'ant-design-vue';
  import 'codemirror/mode/shell/shell.js';
  import 'codemirror/mode/python/python.js';
  import 'codemirror/mode/javascript/javascript.js';
  import 'codemirror/mode/dockerfile/dockerfile.js';
  import 'codemirror/mode/yaml/yaml.js';
  const emit = defineEmits(['success', 'register']);
  const { createMessage } = useMessage();

  const isUpdate = ref(true);
  const taskId = ref<number | null>(null);
  const renderEditor = ref(false);

  const getTitle = computed(() => (!unref(isUpdate) ? '创建下发任务' : '编辑任务'));

  const [registerLeftForm, { resetFields: resetLeft, setFieldsValue: setLeft, validate: validateLeft }] = useForm({
    labelWidth: 100,
    baseColProps: { span: 24 },
    schemas: leftFormSchema,
    showActionButtonGroup: false,
  });

  // 统一转换器
  const getCodeMirrorMode = (lang: string) => {
    const map: Record<string, string> = {
      'shell': 'shell',
      'python': 'python',
      'yaml': 'yaml',          // Ansible 对应
      'ansible': 'yaml',
      'json': 'application/json',
      'javascript': 'application/json'
    };
    return map[lang] || 'shell';
  };

  const [registerRightForm, { resetFields: resetRight, setFieldsValue: setRight, validate: validateRight }] = useForm({
    labelWidth: 90,
    baseColProps: { span: 24 },
    schemas: rightFormSchema,
    showActionButtonGroup: false,
  });

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
    // 1. 关闭渲染，清空状态
    renderEditor.value = false;
    isUpdate.value = !!data?.isUpdate;

    // 2. 🚀 关键：让 Vue 彻底卸载旧的表单 DOM
    await nextTick();

    // 3. 重新渲染，此时 form 实例会重新走 register
    renderEditor.value = true;
    
    // 4. 等待组件挂载完毕，此时 form 实例一定已经准备好
    await nextTick();

    await resetLeft();
    await resetRight();

    if (unref(isUpdate)) {
      taskId.value = data.record.id;
      let parsedIps: string[] = [];
      try {
        parsedIps = JSON.parse(data.record.hostsIdsRaw || data.record.hostsRaw || '[]');
      } catch (e) { parsedIps = []; }
      
      const mockMachineData = parsedIps.map(ip => ({ key: ip, title: ip }));

      setLeft({ 
        ...data.record, 
        targetIps: parsedIps,
        machineData: mockMachineData 
      });

      setRight({
        lang: data.record.lang || 'shell',
        scriptContent: data.record.scriptContent,
      });
    } else {
      taskId.value = null;
      setLeft({ targetIps: [], machineData: [] });
      setRight({ lang: 'shell' });
    }
    setDrawerProps({ confirmLoading: false });
  });

  async function handleSubmit() {
    try {
      const leftValues = await validateLeft();
      const rightValues = await validateRight();
      const submitData = { ...leftValues, ...rightValues };
      
      submitData.hostsIdsRaw = JSON.stringify(submitData.targetIps || []);
      
      delete submitData.targetIps;
      delete submitData.machineData;
      
      setDrawerProps({ confirmLoading: true });
      if (!unref(isUpdate)) {
        await createJobExecTask(submitData);
        createMessage.success('异步任务下发成功');
      } else {
        await updateJobExecTask({ ...submitData, id: taskId.value });
        createMessage.success('任务更新成功');
      }
      closeDrawer();
      emit('success');
    } catch (error) {
      console.error(error);
    } finally {
      setDrawerProps({ confirmLoading: false });
    }
  }
</script>