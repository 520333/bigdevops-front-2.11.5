<template>
  <BasicModal
    v-bind="$attrs"
    @register="registerModal"
    :title="`分配用户 - ${roleRecord?.roleName || ''}`"
    width="680px"
    @ok="handleSubmit"
  >
    <div class="p-4 flex justify-center">
      <Transfer
        :data-source="userDataSource"
        :target-keys="targetKeys"
        :titles="['可选用户', '已有成员']"
        :render="(item) => item.title"
        :show-search="true"
        :filter-option="filterOption"
        :list-style="{ width: '280px', height: '360px' }"
        @change="handleChange"
      />
    </div>
  </BasicModal>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { Transfer } from 'ant-design-vue';
import { BasicModal, useModalInner } from '@/components/Modal';
import { getAccountList, setRoleUsers } from '@/api/demo/system';
import { useMessage } from '@/hooks/web/useMessage';

const emit = defineEmits(['success', 'register']);
const { createMessage } = useMessage();

const roleRecord = ref<Recordable>({});
const userDataSource = ref<{ key: string; title: string }[]>([]);
const targetKeys = ref<string[]>([]);

const filterOption = (inputValue: string, option: any) => {
  return option.title.toLowerCase().includes(inputValue.toLowerCase());
};

const handleChange = (keys: string[]) => {
  targetKeys.value = keys;
};

const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
  setModalProps({ confirmLoading: false });
  roleRecord.value = data.record;
  targetKeys.value = (data.record?.users || []).map((u: any) => String(u.id));

  if (userDataSource.value.length === 0) {
    const res: any = await getAccountList({});
    const list = Array.isArray(res) ? res : res?.items || res?.result || [];
    userDataSource.value = list.map((u: any) => ({
      key: String(u.id),
      title: `${u.realName || u.userName} (${u.userName})`,
    }));
  }
});

async function handleSubmit() {
  try {
    setModalProps({ confirmLoading: true });
    await setRoleUsers({
      roleId: Number(roleRecord.value.id),
      userIds: targetKeys.value.map(Number),
    });
    createMessage.success('分配用户成功');
    closeModal();
    emit('success');
  } finally {
    setModalProps({ confirmLoading: false });
  }
}
</script>
