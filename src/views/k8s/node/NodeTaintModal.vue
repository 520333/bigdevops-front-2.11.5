<template>
  <BasicModal
    v-bind="$attrs"
    @register="registerModal"
    :title="isBatch ? '批量修改 Node 节点污点 (Taints)' : '修改 Node 节点污点 (Taints)'"
    width="720px"
    @ok="handleSubmit"
  >
    <div class="p-2">
      <!-- 提示区域 -->
      <div class="mb-4 bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700 text-xs">
        <div class="font-bold mb-1">
          目标节点 ({{ targetNodeNames.length }} 个):
          <span v-if="isBatch" class="text-amber-500 ml-2">(批量模式: 保留各节点原生独有污点，仅增量应用新增、修改或显式剔除的公共污点)</span>
        </div>
        <div class="text-gray-600 dark:text-gray-400 break-all">
          {{ targetNodeNames.join(', ') }}
        </div>
      </div>

      <!-- 操作工具栏 -->
      <div class="flex justify-between items-center mb-3">
        <span class="font-bold text-sm">Taint 污点配置:</span>
        <a-button type="primary" size="small" @click="handleAddTaint">
          <template #icon><PlusOutlined /></template>
          添加污点
        </a-button>
      </div>

      <!-- Taint 动态项列表 -->
      <div v-if="taintItems.length" class="space-y-2 max-h-80 overflow-y-auto pr-1">
        <div v-for="(item, index) in taintItems" :key="index" class="flex items-center space-x-2">
          <a-input v-model:value="item.key" placeholder="Key (如: node-role.kubernetes.io/master)" class="w-1/3" />
          <span class="font-bold">=</span>
          <a-input v-model:value="item.value" placeholder="Value (可选)" class="w-1/3" />
          <span class="font-bold">:</span>
          <a-select v-model:value="item.effect" placeholder="Effect 策略" class="w-1/3">
            <a-select-option value="NoSchedule">NoSchedule</a-select-option>
            <a-select-option value="PreferNoSchedule">PreferNoSchedule</a-select-option>
            <a-select-option value="NoExecute">NoExecute</a-select-option>
          </a-select>
          <a-button type="text" danger size="small" title="移除此项" @click="handleRemoveTaint(index)">
            <template #icon><DeleteOutlined /></template>
          </a-button>
        </div>
      </div>
      <a-empty v-else description="暂无污点配置，节点允许接收任何 Pod 调度" class="my-6" />
    </div>
  </BasicModal>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { Input as AInput, Button as AButton, Empty as AEmpty, Select as ASelect, SelectOption as ASelectOption } from 'ant-design-vue';
  import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue';
  import { BasicModal, useModalInner } from '@/components/Modal';
  import { useMessage } from '@/hooks/web/useMessage';
  import { taintK8sNodes } from '@/api/demo/system';

  const emit = defineEmits(['success', 'register']);

  const { createMessage } = useMessage();
  const clusterName = ref<string>('');
  const targetNodeNames = ref<string[]>([]);
  const isBatch = ref<boolean>(false);
  const originalKeys = ref<string[]>([]);
  const taintItems = ref<Array<{ key: string; value: string; effect: string }>>([]);

  // K8s 官方格式校验正则表达式
  const keyRegex = /^([a-z0-9]([-a-z0-9]*[a-z0-9])?\.)*([a-z0-9]([-a-z0-9]*[a-z0-9])?\/)?([A-Za-z0-9_.-]{1,63})$/;
  const valueRegex = /^([A-Za-z0-9_.-]{1,63})?$/;

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    clusterName.value = data?.clusterName || '';
    targetNodeNames.value = data?.nodeNames || [];
    isBatch.value = targetNodeNames.value.length > 1;

    // 初始化已存在的污点列表
    const rawTaints = data?.taints || [];
    originalKeys.value = rawTaints.map((t: any) => t.key).filter(Boolean);
    taintItems.value = rawTaints.map((t: any) => ({
      key: t.key || '',
      value: t.value || '',
      effect: t.effect || 'NoSchedule',
    }));
  });

  function handleAddTaint() {
    taintItems.value.push({ key: '', value: '', effect: 'NoSchedule' });
  }

  function handleRemoveTaint(index: number) {
    taintItems.value.splice(index, 1);
  }

  async function handleSubmit() {
    if (!clusterName.value || !targetNodeNames.value.length) {
      createMessage.error('目标集群或节点信息缺失');
      return;
    }

    const validTaints: Array<{ key: string; value?: string; effect: string }> = [];
    const currentKeysSet = new Set<string>();

    for (const item of taintItems.value) {
      const trimmedKey = item.key.trim();
      const trimmedValue = item.value.trim();

      if (!trimmedKey) {
        createMessage.error('污点 Key 不能为空');
        return;
      }
      if (!keyRegex.test(trimmedKey)) {
        createMessage.error(`污点 Key [${trimmedKey}] 格式不符合 K8s 规范 (允许字母数字开头结尾，支持域名前缀)`);
        return;
      }
      if (trimmedValue && !valueRegex.test(trimmedValue)) {
        createMessage.error(`污点 [${trimmedKey}] 的 Value [${trimmedValue}] 格式不符合 K8s 规范`);
        return;
      }
      currentKeysSet.add(trimmedKey);
      validTaints.push({
        key: trimmedKey,
        value: trimmedValue || undefined,
        effect: item.effect || 'NoSchedule',
      });
    }

    // 🚀 统计被显式剔除的污点 Key (原本存在于公共列表，但被用户在弹窗中删除了)
    const deletedKeys: string[] = [];
    for (const oldKey of originalKeys.value) {
      if (!currentKeysSet.has(oldKey)) {
        deletedKeys.push(oldKey);
      }
    }

    try {
      setModalProps({ confirmLoading: true });
      await taintK8sNodes({
        clusterName: clusterName.value,
        nodeNames: targetNodeNames.value,
        taints: validTaints,
        deletedKeys,
      });
      createMessage.success(isBatch.value ? '批量修改节点污点成功' : '节点污点修改成功');
      closeModal();
      emit('success');
    } catch (e: any) {
      console.error('修改节点污点失败:', e);
    } finally {
      setModalProps({ confirmLoading: false });
    }
  }
</script>
