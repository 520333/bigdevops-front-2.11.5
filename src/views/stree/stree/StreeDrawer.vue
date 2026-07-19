<template>
  <BasicDrawer v-bind="$attrs" @register="registerDrawer" showFooter :title="getTitle" width="500px" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicDrawer>
</template>
<script lang="ts">
import { defineComponent, ref} from 'vue';
import { BasicForm, useForm } from '@/components/Form/index';
import { formSchema } from './stree.data';
import { BasicDrawer, useDrawerInner } from '@/components/Drawer';

import { createStreeNode } from '@/api/demo/system';
import { useMessage } from '@/hooks/web/useMessage';

export default defineComponent({
  name: 'StreeDrawer',
  components: { BasicDrawer, BasicForm },
  emits: ['success', 'register'],
  setup(_, { emit }) {

    const [registerForm, { resetFields, getFieldsValue  }] = useForm({
      labelWidth: 120,
      schemas: formSchema,
      showActionButtonGroup: false,
      baseColProps: { span: 24 },
    });

    const level = ref("");
    const pId = ref(0);


    const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
      level.value = data?.level;
      pId.value = data?.pid;
      resetFields();
      setDrawerProps({ confirmLoading: false });

    });

    const getTitle = '新增顶级节点';

    async function handleSubmit() {
      try {
        setDrawerProps({ confirmLoading: true });

        const { createMessage } = useMessage();
        var reqData = getFieldsValue();
        reqData['level'] = level.value;
        reqData['pid'] = pId.value;

        createStreeNode(reqData).then(() => {
          createMessage.success(`${getTitle}成功`)
          closeDrawer();
          emit('success');
        }).catch(() => {
          createMessage.error(`${getTitle}失败`)
        })
      } finally {
        setDrawerProps({ confirmLoading: false });
      }
    }

    return { registerDrawer, registerForm, getTitle, handleSubmit };
  },
});
</script>
