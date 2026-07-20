<template>
  <BasicDrawer v-bind="$attrs" @register="registerDrawer" showFooter :title="getTitle" width="50%" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicDrawer>
</template>
<script lang="ts">
import { defineComponent, ref, computed, unref } from 'vue';
import { BasicForm, useForm } from '@/components/Form/index';
import { formSchema } from './menu.data';
import { BasicDrawer, useDrawerInner } from '@/components/Drawer';

import { createMenu, updateMenu, getMenuList } from '@/api/demo/system';
import { useMessage } from '@/hooks/web/useMessage';

export default defineComponent({
  name: 'MenuDrawer',
  components: { BasicDrawer, BasicForm },
  emits: ['success', 'register'],
  setup(_, { emit }) {
    const isUpdate = ref(true);

    const [registerForm, { resetFields, setFieldsValue, updateSchema, validate }] = useForm({
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
      const treeData = await getMenuList();
      updateSchema({
        field: 'pId',
        componentProps: { treeData },
      });
    });

    const getTitle = computed(() => (!unref(isUpdate) ? '新增菜单' : '编辑菜单'));

    async function handleSubmit() {
      try {
        const values = await validate();
        setDrawerProps({ confirmLoading: true });

        if (values.type === '0') {
          values.component = 'LAYOUT';
        }

        const { createMessage } = useMessage();

        let menuFunc = createMenu;
        if (unref(isUpdate)) {
          menuFunc = updateMenu;
        }
        menuFunc(values).then(() => {
          createMessage.success(`${getTitle.value}成功`);
          closeDrawer();
          emit('success');
        }).catch(() => {
          createMessage.error(`${getTitle.value}失败`);
        });

      } finally {
        setDrawerProps({ confirmLoading: false });
      }
    }

    return { registerDrawer, registerForm, getTitle, handleSubmit };
  },
});
</script>
