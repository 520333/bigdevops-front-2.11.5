<template>
  <BasicDrawer v-bind="$attrs" @register="registerDrawer" showFooter :title="getTitle" width="40%" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicDrawer>
</template>
<script lang="ts">
import { defineComponent, ref, computed, unref } from 'vue';
import { BasicForm, useForm } from '@/components/Form/index';
import { formSchema } from './api.data';
import { BasicDrawer, useDrawerInner } from '@/components/Drawer';

import { createApi, updateApi, getApiList } from '@/api/demo/system';
import { useMessage } from '@/hooks/web/useMessage';

export default defineComponent({
  name: 'ApiDrawer',
  components: { BasicDrawer, BasicForm },
  emits: ['success', 'register'],
  setup(_, { emit }) {
    const isUpdate = ref(true);

    const [registerForm, { resetFields, setFieldsValue, getFieldsValue, updateSchema }] = useForm({
      labelWidth: 100,
      schemas: formSchema,
      showActionButtonGroup: false,
      baseColProps: { lg: 12, md: 24 },
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
      let treeData = await getApiList();

      // ================= 终极拦截逻辑：类型锁死 =================
      const isEditMode = unref(isUpdate);
      const isEditParent = isEditMode && String(data?.record?.type) === '0';
      const isEditChild = isEditMode && String(data?.record?.type) === '1';

      const formatTreeData = (nodes: any[]) => {
        return nodes.map((node) => {
          if (node.id === 0 || node.value === 0) {
            node.disabled = isEditChild;
          }
          if (node.children && node.children.length > 0) {
            node.children = formatTreeData(node.children);
          }
          return node;
        });
      };

      const processedTreeData = formatTreeData(treeData);
      updateSchema([
        {
          field: 'type',
          dynamicDisabled: isEditMode,
        },
        {
          field: 'pId',
          dynamicDisabled: isEditParent,
          componentProps: { treeData: processedTreeData },
        }
      ]);
      // ========================================================
    });

    const getTitle = computed(() => (!unref(isUpdate) ? '新增接口' : '编辑接口'));
    async function handleSubmit() {
      try {
        setDrawerProps({ confirmLoading: true });
        const { createMessage } = useMessage();
        var ApiFunc = createApi
        if (unref(isUpdate)) {
          ApiFunc = updateApi
        }
        ApiFunc(getFieldsValue()).then(() => {
          createMessage.success(`${getTitle.value}成功`)
          closeDrawer();
          emit('success');
        }).catch(() => {
          createMessage.error(`${getTitle.value}失败`)
        })
      } finally {
        setDrawerProps({ confirmLoading: false });
      }
    }
    return { registerDrawer, registerForm, getTitle, handleSubmit };
  },
});
</script>
