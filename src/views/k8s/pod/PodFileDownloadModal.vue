<template>
  <a-modal
    v-model:open="visible"
    :title="`下载容器内部文件: ${podName}`"
    width="520px"
    :footer="null"
    @cancel="handleClose"
  >
    <div class="py-3">
      <!-- 容器选择 -->
      <div class="mb-4 flex items-center space-x-3" v-if="containers && containers.length > 0">
        <span class="text-sm font-semibold w-24">目标容器:</span>
        <a-select
          v-model:value="selectedContainer"
          style="width: 280px"
          :options="containerOptions"
        />
      </div>

      <!-- 文件路径输入 -->
      <div class="mb-4">
        <div class="text-sm font-semibold mb-2">容器内绝对路径 (Path):</div>
        <a-input
          v-model:value="filePath"
          placeholder="例如: /etc/nginx/nginx.conf 或 /var/log/nginx/access.log"
          allow-clear
          @pressEnter="handleStartDownload"
        />
      </div>

      <!-- 预设常用文件路径快捷填入 -->
      <div class="mb-5">
        <div class="text-xs text-gray-500 mb-2">快捷填充常用路径:</div>
        <div class="flex flex-wrap gap-2">
          <a-tag
            v-for="preset in presets"
            :key="preset"
            color="blue"
            class="cursor-pointer hover:opacity-80"
            @click="filePath = preset"
          >
            {{ preset }}
          </a-tag>
        </div>
      </div>

      <div class="flex justify-end space-x-3 pt-3 border-t">
        <a-button @click="handleClose">取消</a-button>
        <a-button type="primary" :disabled="!filePath.trim()" @click="handleStartDownload">
          下载文件
        </a-button>
      </div>
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
  import { ref, watch, computed } from 'vue';
  import {
    Modal as AModal,
    Select as ASelect,
    Input as AInput,
    Button as AButton,
    Tag as ATag,
  } from 'ant-design-vue';
  import { useMessage } from '@/hooks/web/useMessage';
  import { useGlobSetting } from '@/hooks/setting';
  import { getToken } from '@/utils/auth';

  const props = defineProps<{
    open: boolean;
    clusterName: string;
    namespace: string;
    podName: string;
    containers: string[];
  }>();

  const emit = defineEmits(['update:open']);
  const globSetting = useGlobSetting();
  const { createMessage } = useMessage();

  const visible = ref(false);
  const selectedContainer = ref('');
  const filePath = ref('');

  const presets = [
    '/etc/hosts',
    '/etc/nginx/nginx.conf',
    '/var/log/nginx/access.log',
    '/var/log/syslog',
    '/etc/os-release',
  ];

  const containerOptions = computed(() =>
    (props.containers || []).map((c) => ({ label: c, value: c })),
  );

  watch(
    () => props.open,
    (val) => {
      visible.value = val;
      if (val) {
        if (props.containers && props.containers.length > 0) {
          selectedContainer.value = props.containers[0];
        } else {
          selectedContainer.value = '';
        }
        filePath.value = '/etc/hosts';
      }
    },
  );

  function handleStartDownload() {
    if (!filePath.value.trim()) {
      createMessage.warning('请输入有效的容器文件绝对路径');
      return;
    }

    const apiUrl = globSetting.apiUrl || '';
    const token = getToken() || '';
    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

    const downloadUrl = `${cleanApiUrl}/api/k8s/downloadK8sPodFile?clusterName=${encodeURIComponent(
      props.clusterName,
    )}&namespace=${encodeURIComponent(props.namespace)}&name=${encodeURIComponent(
      props.podName,
    )}&container=${encodeURIComponent(
      selectedContainer.value,
    )}&path=${encodeURIComponent(filePath.value.trim())}&token=${encodeURIComponent(token)}`;

    createMessage.success(`开始提取容器文件 [${filePath.value.trim()}]...`);
    window.open(downloadUrl, '_blank');
    handleClose();
  }

  function handleClose() {
    visible.value = false;
    emit('update:open', false);
  }
</script>
