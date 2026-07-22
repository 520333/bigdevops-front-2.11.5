<template>
  <a-modal
    v-model:open="visible"
    :title="`Pod 日志: ${podName} ${activeContainer ? `(${activeContainer})` : ''}`"
    width="80%"
    :footer="null"
    :destroyOnClose="true"
    :maskClosable="true"
    @cancel="handleCancel"
    @afterClose="handleClose"
  >
    <div class="flex items-center justify-between mb-3 px-2 py-1 bg-gray-800 rounded text-white text-xs">
      <div class="flex items-center space-x-3">
        <span>容器:</span>
        <a-select
          v-model:value="activeContainer"
          size="small"
          style="width: 160px"
          :options="containerOptions"
          @change="connectLogStream"
        />

        <span>行数:</span>
        <a-select
          v-model:value="tailLines"
          size="small"
          style="width: 100px"
          :options="tailOptions"
          @change="connectLogStream"
        />

        <a-checkbox v-model:checked="autoScroll" class="text-white text-xs">
          自动滚动到底部
        </a-checkbox>

        <span class="text-green-400 font-medium">● 状态: {{ isStreaming ? '实时 Log 持续推流中 (kubectl logs -f)' : '已断开' }}</span>
      </div>

      <div class="flex items-center space-x-2">
        <a-button size="small" type="primary" @click="connectLogStream">
          重连 / 刷新
        </a-button>
        <a-button size="small" @click="downloadLog">
          下载日志
        </a-button>
      </div>
    </div>

    <!-- 日志内容展示区 -->
    <div
      ref="logContainer"
      class="w-full bg-black p-3 rounded font-mono text-xs text-green-400 overflow-y-auto leading-relaxed border border-gray-800"
      style="height: 520px; white-space: pre-wrap; word-break: break-all"
    >
      <div v-if="loading" class="text-yellow-400 py-4 text-center">
        正在建立 WebSocket 实时日志持续流连接...
      </div>
      <div v-else-if="!logContent" class="text-gray-500 py-4 text-center">
        暂无日志数据或该容器尚未输出控制网日志
      </div>
      <div v-else>
        {{ logContent }}
      </div>
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
  import { ref, watch, nextTick, onUnmounted } from 'vue';
  import { Modal as AModal, Select as ASelect, Button as AButton, Checkbox as ACheckbox } from 'ant-design-vue';
  import { useGlobSetting } from '@/hooks/setting';
  import { getToken } from '@/utils/auth';

  const globSetting = useGlobSetting();

  const props = defineProps<{
    open: boolean;
    clusterName: string;
    namespace: string;
    podName: string;
    containers: string[];
  }>();

  const emit = defineEmits(['update:open']);

  const visible = ref(false);
  const loading = ref(false);
  const isStreaming = ref(false);
  const activeContainer = ref('');
  const tailLines = ref('200');
  const autoScroll = ref(true);
  const logContent = ref('');
  const logContainer = ref<HTMLElement | null>(null);

  let ws: WebSocket | null = null;

  const containerOptions = ref<Array<{ label: string; value: string }>>([]);
  const tailOptions = [
    { label: '100 行', value: '100' },
    { label: '200 行', value: '200' },
    { label: '500 行', value: '500' },
    { label: '1000 行', value: '1000' },
  ];

  watch(
    () => props.open,
    (val) => {
      visible.value = val;
      if (val) {
        containerOptions.value = (props.containers || []).map((c) => ({ label: c, value: c }));
        activeContainer.value = props.containers && props.containers.length > 0 ? props.containers[0] : '';
        connectLogStream();
      } else {
        handleClose();
      }
    },
  );

  function closeWs() {
    if (ws) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      ws.close();
      ws = null;
    }
    isStreaming.value = false;
  }

  function connectLogStream() {
    closeWs();
    if (!props.clusterName || !props.namespace || !props.podName) return;

    loading.value = true;
    logContent.value = '';

    const apiUrl = globSetting.apiUrl || '';
    let wsHost = '';
    if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
      wsHost = apiUrl.replace(/^http/, 'ws');
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsHost = `${protocol}//${window.location.host}${apiUrl.startsWith('/') ? '' : '/'}${apiUrl}`;
    }

    const token = getToken() || '';
    const path = wsHost.endsWith('/') ? wsHost.slice(0, -1) : wsHost;
    const wsUrl = `${path}/api/k8s/wsK8sPodLogs?clusterName=${encodeURIComponent(
      props.clusterName,
    )}&namespace=${encodeURIComponent(props.namespace)}&name=${encodeURIComponent(
      props.podName,
    )}&container=${encodeURIComponent(activeContainer.value)}&tailLines=${encodeURIComponent(
      tailLines.value,
    )}&token=${encodeURIComponent(token)}`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      loading.value = false;
      isStreaming.value = true;
    };

    ws.onmessage = (event) => {
      loading.value = false;
      logContent.value += event.data;
      if (autoScroll.value) {
        scrollToBottom();
      }
    };

    ws.onclose = () => {
      loading.value = false;
      isStreaming.value = false;
    };

    ws.onerror = () => {
      loading.value = false;
      isStreaming.value = false;
    };
  }

  function scrollToBottom() {
    nextTick(() => {
      setTimeout(() => {
        if (logContainer.value) {
          logContainer.value.scrollTop = logContainer.value.scrollHeight;
        }
      }, 50);
    });
  }

  function downloadLog() {
    if (!logContent.value) return;
    const blob = new Blob([logContent.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${props.podName}-${activeContainer.value || 'container'}.log`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCancel() {
    visible.value = false;
    emit('update:open', false);
    handleClose();
  }

  function handleClose() {
    closeWs();
  }

  onUnmounted(() => {
    handleClose();
  });
</script>
