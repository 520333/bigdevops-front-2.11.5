<template>
  <a-modal
    v-model:open="visible"
    :title="`扩缩容 Deployment: ${deploymentName}`"
    width="480px"
    :confirmLoading="loading"
    @ok="handleSave"
    @cancel="handleClose"
  >
    <div class="py-3">
      <div class="mb-4 text-sm text-gray-600 dark:text-gray-300">
        调整对象: <span class="font-bold text-blue-500">{{ deploymentName }}</span> (命名空间: {{ namespace }})
      </div>

      <div class="flex items-center space-x-3 mb-2">
        <span class="text-sm font-semibold">目标副本数量 (Replicas):</span>
        <a-input-number
          id="scale-deployment-replicas-input"
          v-model:value="replicas"
          :min="0"
          :max="500"
          style="width: 150px"
        />
      </div>

      <div class="text-xs text-gray-400">
        提示: 将副本数设置为 0 将暂停此 Deployment 的所有 Pod 实例。
      </div>
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
  import { ref, watch } from 'vue';
  import { Modal as AModal, InputNumber as AInputNumber } from 'ant-design-vue';
  import { scaleK8sDeployment } from '@/api/demo/system';
  import { useMessage } from '@/hooks/web/useMessage';

  const props = defineProps<{
    open: boolean;
    clusterName: string;
    namespace: string;
    deploymentName: string;
    currentReplicas: number;
  }>();

  const emit = defineEmits(['update:open', 'success']);
  const { createMessage } = useMessage();

  const visible = ref(false);
  const loading = ref(false);
  const replicas = ref(1);

  watch(
    () => props.open,
    (val) => {
      visible.value = val;
      if (val) {
        replicas.value = props.currentReplicas || 0;
      }
    },
  );

  async function handleSave() {
    if (!props.clusterName || !props.namespace || !props.deploymentName) return;
    loading.value = true;
    try {
      await scaleK8sDeployment({
        clusterName: props.clusterName,
        namespace: props.namespace,
        name: props.deploymentName,
        replicas: replicas.value,
      });
      createMessage.success(`Deployment [${props.deploymentName}] 副本数调整为 ${replicas.value}`);
      visible.value = false;
      emit('update:open', false);
      emit('success');
    } catch (e: any) {
      console.error(e);
      createMessage.error('扩缩容失败: ' + (e.message || e));
    } finally {
      loading.value = false;
    }
  }

  function handleClose() {
    visible.value = false;
    emit('update:open', false);
  }
</script>
