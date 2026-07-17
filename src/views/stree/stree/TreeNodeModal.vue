<template>
  <BasicModal
    v-bind="$attrs"
    @register="register"
    :title="getTitle"
    @ok="handleSubmit"
    width="20%"
  >
    <div class="pt-3px pr-3px">
      <BasicForm @register="registerForm" />
    </div>
  </BasicModal>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import { BasicModal, useModalInner } from '@/components/Modal';
  import { BasicForm, useForm } from '@/components/Form/index';
  import { modalFormSchema } from './stree.data';
  import { updateStreeNode } from '@/api/demo/system';
  import { useMessage } from '@/hooks/web/useMessage';

  export default defineComponent({
    name: 'TreeNodeModal',
    components: { BasicModal, BasicForm },
    emits: ['success', 'register'],
    setup(_, { emit }) {
      const { createMessage } = useMessage();
      const rowId = ref<string | number>('');
      const getTitle=ref("");

      const [
        registerForm,
        {
          setFieldsValue,
          resetFields,
          validate,
        },
      ] = useForm({
        labelWidth: 120,
        schemas: modalFormSchema,
        showActionButtonGroup: false,
        baseColProps: { span: 24 },
      });

      const [register, { setModalProps, closeModal }] = useModalInner(async (data) => {
        await resetFields();
        setModalProps({ confirmLoading: false });
        getTitle.value = "编辑树节点 - " + data.nodePath;

        if (data) {
          rowId.value = data.id;
          let adminKeys: string[] = [];

          if (Array.isArray(data.ops_admin_users)) {
            adminKeys = data.ops_admin_users;
          } else if (Array.isArray(data.ops_admins)) {
            adminKeys = data.ops_admins.map((u: any) => u.userName);
          }

          await setFieldsValue({
            ...data,
            ops_admin_users: adminKeys,
          });
        }
      });

      async function handleSubmit() {
        try {
          const values = await validate();
          setModalProps({ confirmLoading: true });
          await updateStreeNode({ ...values, id: rowId.value });
          createMessage.success('节点信息修改成功');
          closeModal();
          emit('success', { ...values, id: rowId.value });
        } catch (error) {
          console.error('Submit Error:', error);
        } finally {
          setModalProps({ confirmLoading: false });
        }
      }

      return { register, registerForm, handleSubmit,getTitle };
    },
  });
</script>