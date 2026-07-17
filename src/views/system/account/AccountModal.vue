<template>
  <BasicModal v-bind="$attrs" @register="registerModal" :title="getTitle" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>

<script lang="ts">
import { defineComponent, ref, computed, unref, nextTick } from 'vue';
import { BasicModal, useModalInner } from '@/components/Modal';
import { BasicForm, useForm } from '@/components/Form/index';
import { accountFormSchema } from './account.data';
import { createAccount, updateAccount } from '@/api/demo/system';
import { useMessage } from '@/hooks/web/useMessage';

export default defineComponent({
  name: 'AccountModal',
  components: { BasicModal, BasicForm },
  emits: ['success', 'register'],
  setup(_, { emit }) {
    const isUpdate = ref(true);
    const rowId = ref<number | string>('');

    const [registerForm, { setFieldsValue, getFieldsValue, resetSchema, clearValidate, updateSchema, resetFields, validate }] = useForm({
      labelWidth: 100,
      baseColProps: { span: 24 },
      schemas: accountFormSchema,
      showActionButtonGroup: false,
      actionColOptions: {
        span: 23,
      },
    });

    const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
      resetFields();
      resetSchema(accountFormSchema);
      setModalProps({ confirmLoading: false });

      isUpdate.value = !!data?.isUpdate;
      if (unref(isUpdate)) {
        // 兼容处理：优先使用 id，如果没有则回退使用 userId
        rowId.value = data.record.id || data.record.userId;

        const record = { ...data.record };

        // 将后端的角色对象数组转换为前端选择器需要的 value 数组
        if (record.roles && Array.isArray(record.roles)) {
          record.roles = record.roles.map((item) => item.roleValue);
        }

        updateSchema([
          {
            field: 'userName',
            componentProps: { disabled: true },
            rules: [],
          },
          {
            field: 'password',
            required: false,
            ifShow: false,
          },
        ]);

        await nextTick();
        setFieldsValue(record);

        await nextTick();
        clearValidate();
      }
    });

    const getTitle = computed(() => (!unref(isUpdate) ? '新增账号' : '编辑账号'));

    async function handleSubmit() {
      try {
        const values = await validate();
        setModalProps({ confirmLoading: true });

        const dbAccountFunc = unref(isUpdate) ? updateAccount : createAccount;
        const { createMessage } = useMessage();

        // 浅拷贝一份表单数据，避免污染原始状态
        const reqData = { ...getFieldsValue() };

        // ================= 核心修复 =================
        // 强制将字符串类型的数字转换为 Number，完美迎合 Golang 的 uint 和 int
        if (reqData.id) {
          reqData.id = Number(reqData.id);
        }
        if (reqData.enable) {
          reqData.enable = Number(reqData.enable);
        }
        if (reqData.userId) {
          reqData.userId = Number(reqData.userId);
        }
        // ============================================

        // 处理 roles 字段名转换
        const roles = reqData.roles;
        delete reqData['roles'];
        reqData.rolesFront = roles;

        dbAccountFunc(reqData)
          .then(() => {
            createMessage.success(`${getTitle.value}成功`);
            closeModal();
            emit('success', { isUpdate: unref(isUpdate), values: { ...values, id: rowId.value } });
          })
          .catch(() => {
            createMessage.error(`${getTitle.value}失败`);
          });
      } catch (error) {
        console.warn('表单校验未通过，已被成功拦截', error);
      } finally {
        setModalProps({ confirmLoading: false });
      }
    }

    return { registerModal, registerForm, getTitle, handleSubmit };
  },
});
</script>