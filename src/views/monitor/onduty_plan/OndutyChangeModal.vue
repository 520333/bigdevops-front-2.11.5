<template>
  <BasicModal v-bind="$attrs" @register="registerModal" title="调整值班人员" @ok="handleSubmit">
    <a-alert type="info" show-icon class="mb-4">
      <template #message>
        <span>
          正在为 <strong>{{ currentData.dateString }}</strong> 的
          <strong>{{ currentData.originRealName }}</strong> 寻找替班人员。
        </span>
      </template>
    </a-alert>
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { BasicModal, useModalInner } from '@/components/Modal';
import { BasicForm, useForm } from '@/components/Form';
import { ondutyChangeFormSchema } from './plan.data';
import { createMonitorOndutyChange } from '@/api/demo/system';
import { Alert as AAlert, message } from 'ant-design-vue';

export default defineComponent({
  name: 'OndutyChangeModal',
  components: { BasicModal, BasicForm, AAlert },
  emits: ['success', 'register'],
  setup(_, { emit }) {
    const currentData = ref<any>({});

    const [registerForm, { validate, resetFields, updateSchema }] = useForm({
      labelWidth: 100,
      baseColProps: { span: 24 },
      schemas: ondutyChangeFormSchema,

      showActionButtonGroup: false,
      actionColOptions: { span: 23 },
    });

    const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
      resetFields();
      setModalProps({ confirmLoading: false });
      currentData.value = data;

      const memberOptions = (data.allowedMembers || []).map((user: any) => ({
        label: user.realName,
        value: user.username || user.userName,
      }));

      updateSchema({
        field: 'targetUserName',
        componentProps: {
          options: memberOptions,
          showSearch: true,
          placeholder: '请选择替班人员',
        },
      });
    });

    async function handleSubmit() {
      try {
        const values = await validate();

        if (values.targetUserName === currentData.value.originUserName) {
          message.warning('替班人员不能是原值班人自己！');
          return;
        }

        setModalProps({ confirmLoading: true });

        const payload = {
          OndutyGroupId: currentData.value.groupId,
          dateString: currentData.value.dateString,
          originUserName: currentData.value.originUserName,
          targetUserName: values.targetUserName,
          name: values.name,
        };

        await createMonitorOndutyChange(payload);

        closeModal();
        message.success('换班成功！');
        emit('success');
      } catch (error) {
        console.error(error);
      } finally {
        setModalProps({ confirmLoading: false });
      }
    }

    return { registerModal, registerForm, handleSubmit, currentData };
  },
});
</script>