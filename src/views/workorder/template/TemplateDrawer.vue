<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    showFooter
    :title="getTitle" 
    width="500px"
    @ok="handleSubmit"
  >
    <BasicForm @register="registerForm" />
  </BasicDrawer>
</template>

<script lang="ts" setup>
  import { ref, computed, unref } from 'vue';
  import { BasicForm, useForm } from '@/components/Form/index';
  import { formSchema } from './template.data';
  import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
  import { useMessage } from '@/hooks/web/useMessage';
  
  import { createWorkOrderTemplate, updateWorkOrderTemplate } from '@/api/demo/system'; 

  const emit = defineEmits(['success', 'register']);
  const { createMessage } = useMessage();
  const isUpdate = ref(true);
  const templateId = ref<number | null>(null);

  const getTitle = computed(() => (!unref(isUpdate) ? '新增工单模板' : '编辑工单模板'));

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
      templateId.value = data.record.id;
      setFieldsValue(data.record);
    } else {
      templateId.value = null;
    }
  });

  async function handleSubmit() {
    try {
      const values = await validate();
      
      setDrawerProps({ confirmLoading: true });
      
      if (!unref(isUpdate)) {
        await createWorkOrderTemplate(values);
        createMessage.success('工单模板创建成功');
      } else {
        await updateWorkOrderTemplate({ ...values, ID: templateId.value });
        createMessage.success('工单模板更新成功');
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