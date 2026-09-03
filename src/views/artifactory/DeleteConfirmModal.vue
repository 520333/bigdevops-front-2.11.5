<template>
  <BasicModal
    v-bind="$attrs"
    @register="register"
    title="⚠️ 高危操作确认 - 删除制品/配置文件"
    ok-text="确认彻底删除"
    cancel-text="取消"
    :ok-button-props="{ danger: true, disabled: isConfirmDisabled }"
    @ok="handleConfirmDelete"
    width="540px"
  >
    <div class="p-2 flex flex-col gap-4">
      <Alert
        message="警告：该删除操作属于高危行为！"
        description="提交删除后，该文件将从 Artifactory 仓库中被移除。请确保已做好本地备份。"
        type="error"
        show-icon
      />

      <div class="text-sm">
        <span>当前准备删除的文件为：</span>
        <span class="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded font-mono ml-1">{{ filename }}</span>
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-xs text-gray-500">
          请输入完整文件名 <code class="font-bold select-all text-gray-700">{{ filename }}</code> 以确认删除：
        </label>
        <Input
          v-model:value="inputName"
          :placeholder="`请输入 ${filename}`"
          allow-clear
          class="font-mono"
        />
      </div>
    </div>
  </BasicModal>
</template>

<script lang="ts">
  import { defineComponent, ref, computed } from 'vue';
  import { Alert, Input } from 'ant-design-vue';
  import { BasicModal, useModalInner } from '@/components/Modal';

  export default defineComponent({
    name: 'DeleteConfirmModal',
    components: { BasicModal, Alert, Input },
    emits: ['confirm', 'register'],
    setup(_, { emit }) {
      const filename = ref('');
      const inputName = ref('');

      const [register, { closeModal }] = useModalInner((data) => {
        filename.value = data.filename || '';
        inputName.value = '';
      });

      const isConfirmDisabled = computed(() => {
        return inputName.value.trim() !== filename.value;
      });

      const handleConfirmDelete = () => {
        if (isConfirmDisabled.value) return;
        emit('confirm');
        closeModal();
      };

      return {
        register,
        filename,
        inputName,
        isConfirmDisabled,
        handleConfirmDelete,
      };
    },
  });
</script>
