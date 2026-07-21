<template>
  <BasicModal
    v-bind="$attrs"
    @register="registerModal"
    :title="isBatch ? '批量修改 Node 节点标签' : '修改 Node 节点标签'"
    width="640px"
    @ok="handleSubmit"
  >
    <div class="p-2">
      <!-- 提示区域 -->
      <div class="mb-4 bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700 text-xs">
        <div class="font-bold mb-1">
          目标节点 ({{ targetNodeNames.length }} 个):
          <span v-if="isBatch" class="text-amber-500 ml-2">(批量模式: 支持新增/修改/重命名/删除标签，自动同步应用至所有选中节点)</span>
        </div>
        <div class="text-gray-600 dark:text-gray-400 break-all">
          {{ targetNodeNames.join(', ') }}
        </div>
      </div>

      <!-- 操作工具栏 -->
      <div class="flex justify-between items-center mb-3">
        <span class="font-bold text-sm">Label 键值对配置:</span>
        <a-button type="primary" size="small" @click="handleAddLabel">
          <template #icon><PlusOutlined /></template>
          添加标签
        </a-button>
      </div>

      <!-- Label 动态项列表 -->
      <div v-if="labelItems.length" class="space-y-2 max-h-80 overflow-y-auto pr-1">
        <div v-for="(item, index) in labelItems" :key="index" class="flex items-center space-x-2">
          <a-input v-model:value="item.key" placeholder="标签键 Key (如: devops.com/env)" class="flex-1" />
          <span class="font-bold">=</span>
          <a-input v-model:value="item.value" placeholder="标签值 Value (清空代表删除该标签)" class="flex-1" />
          <a-button type="text" danger size="small" title="移除此项" @click="handleRemoveLabel(index)">
            <template #icon><DeleteOutlined /></template>
          </a-button>
        </div>
      </div>
      <a-empty v-else description="暂无标签配置，请点击右上角添加" class="my-6" />
    </div>
  </BasicModal>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { Input as AInput, Button as AButton, Empty as AEmpty } from 'ant-design-vue';
  import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue';
  import { BasicModal, useModalInner } from '@/components/Modal';
  import { useMessage } from '@/hooks/web/useMessage';
  import { labelK8sNodes } from '@/api/demo/system';

  const emit = defineEmits(['success', 'register']);

  const { createMessage } = useMessage();
  const clusterName = ref<string>('');
  const targetNodeNames = ref<string[]>([]);
  const isBatch = ref<boolean>(false);
  const originalKeys = ref<string[]>([]);
  const labelItems = ref<Array<{ key: string; value: string }>>([]);

  // K8s 官方格式校验正则表达式
  const keyRegex = /^([a-z0-9]([-a-z0-9]*[a-z0-9])?\.)*([a-z0-9]([-a-z0-9]*[a-z0-9])?\/)?([A-Za-z0-9_.-]{1,63})$/;
  const valueRegex = /^([A-Za-z0-9_.-]{1,63})?$/;

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    clusterName.value = data?.clusterName || '';
    targetNodeNames.value = data?.nodeNames || [];
    isBatch.value = targetNodeNames.value.length > 1;

    // 初始化已存在的标签
    const existingPairs = data?.labelPairs || {};
    originalKeys.value = Object.keys(existingPairs);
    labelItems.value = originalKeys.value.map((k) => ({
      key: k,
      value: existingPairs[k] || '',
    }));
  });

  function handleAddLabel() {
    labelItems.value.push({ key: '', value: '' });
  }

  function handleRemoveLabel(index: number) {
    labelItems.value.splice(index, 1);
  }

  async function handleSubmit() {
    if (!clusterName.value || !targetNodeNames.value.length) {
      createMessage.error('目标集群或节点信息缺失');
      return;
    }

    const validLabels: string[] = [];
    const currentKeysSet = new Set<string>();

    for (const item of labelItems.value) {
      const trimmedKey = item.key.trim();
      const trimmedValue = item.value.trim();

      if (trimmedKey) {
        if (!keyRegex.test(trimmedKey)) {
          createMessage.error(`标签 Key [${trimmedKey}] 格式不符合 K8s 规范 (允许字母数字开头结尾，支持域名前缀如 app.io/env)`);
          return;
        }
        if (trimmedValue && !valueRegex.test(trimmedValue)) {
          createMessage.error(`标签 [${trimmedKey}] 的 Value [${trimmedValue}] 格式不符合 K8s 规范 (最大63位字母数字/下划线/中划线/点)`);
          return;
        }
        currentKeysSet.add(trimmedKey);
        validLabels.push(`${trimmedKey}=${trimmedValue}`);
      }
    }

    // 检查原始 key 列表中哪些 key 被修改或删除了，显式补充 "oldKey=" 供后端执行 delete
    for (const oldKey of originalKeys.value) {
      if (!currentKeysSet.has(oldKey)) {
        validLabels.push(`${oldKey}=`);
      }
    }

    try {
      setModalProps({ confirmLoading: true });
      await labelK8sNodes({
        clusterName: clusterName.value,
        nodeNames: targetNodeNames.value,
        labels: validLabels,
      });
      createMessage.success(isBatch.value ? '批量修改节点标签成功' : '节点标签修改成功');
      closeModal();
      emit('success');
    } catch (e: any) {
      console.error('修改节点标签失败:', e);
    } finally {
      setModalProps({ confirmLoading: false });
    }
  }
</script>
