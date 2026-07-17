<template>
  <BasicDrawer v-bind="$attrs" @register="registerDrawer" showFooter :title="getTitle" width="500px" @ok="handleSubmit">
    <BasicForm @register="registerForm">
      <template #flowNodes="{ model, field }">
        <AFormItemRest>
          <div :id="field" class="space-y-2">
            <div v-for="(node, index) in (model[field] ?? [])" :key="index" class="flex gap-2 items-center p-2 border rounded">
              <ASelect v-model:value="node.type" style="width: 120px" :options="flowNodeTypeOptions" />
              <ASelect 
                show-search
                v-model:value="node.defineUserOrGroup" 
                placeholder="请选择" 
                style="flex: 1" 
                :options="userRoleOptions" 
                optionFilterProp="label"
              />
              <AButton type="link" danger @click="removeNode(model, field, index)">删除</AButton>
            </div>
            <AButton type="dashed" block @click="addNode(model[field])">+ 新增节点</AButton>
          </div>
        </AFormItemRest>
      </template>
    </BasicForm>
  </BasicDrawer>
</template>

<script lang="ts" setup>
  import { ref, computed, unref, onMounted } from 'vue';
  import { Form, Select, Button } from 'ant-design-vue';
  import { BasicForm, useForm } from '@/components/Form/index';
  import { formSchema, flowNodeTypeOptions } from './process.data';
  import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
  import { useMessage } from '@/hooks/web/useMessage';
  import { cloneDeep } from 'lodash-es';
  import { getAllUserAndRoles, createProcess, updateProcess } from '@/api/demo/system'; 

  const AFormItemRest = Form.ItemRest;
  const ASelect = Select;
  const AButton = Button;

  const { createMessage } = useMessage();
  const emit = defineEmits(['success', 'register']);
  const isUpdate = ref(true);
  const processId = ref<number | null>(null);
  const userRoleOptions = ref([]);

  const getTitle = computed(() => (!unref(isUpdate) ? '新增流程' : '编辑流程'));

  const [registerForm, { resetFields, setFieldsValue, validate }] = useForm({
    labelWidth: 90, baseColProps: { span: 24 }, schemas: formSchema, showActionButtonGroup: false,
  });

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
    resetFields();
    setDrawerProps({ confirmLoading: false });
    isUpdate.value = !!data?.isUpdate;
    if (unref(isUpdate)) {
      processId.value = data.record.id;
      setFieldsValue(cloneDeep(data.record));
    } else {
      processId.value = null;
      setFieldsValue({ flowNodes: [{ type: '起始节点', defineUserOrGroup: '' }] });
    }
  });

  onMounted(async () => {
    const res = await getAllUserAndRoles();
    const data = res.result || res;
    userRoleOptions.value = data.map((item: any) => ({
      ...item,
      label: item.value.includes('组@') ? `[组] ${item.label}` : item.label
    }));
  });

  function addNode(nodes: any[]) { nodes.push({ type: '审批节点', defineUserOrGroup: '' }); }
  function removeNode(model: any, field: string, index: number) { model[field].splice(index, 1); }

  async function handleSubmit() {
    try {
      const values = await validate();
      if (!values.flowNodes?.length) return createMessage.warning('请至少添加一个节点');
      setDrawerProps({ confirmLoading: true });
      if (!unref(isUpdate)) await createProcess(values);
      else await updateProcess({ ...values, ID: processId.value });
      createMessage.success('操作成功');
      closeDrawer();
      emit('success'); 
    } finally {
      setDrawerProps({ confirmLoading: false });
    }
  }
</script>