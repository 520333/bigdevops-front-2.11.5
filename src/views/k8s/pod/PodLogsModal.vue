<template>
  <a-modal :open="visible" :title="`Pod 日志: ${podName} ${activeContainer ? `(${activeContainer})` : ''}`"
    width="85%" :footer="null" :destroyOnClose="true" :maskClosable="true" @cancel="handleCancel"
    @afterClose="handleClose" @update:open="onOpenChange">
    <!-- 顶部操作栏 -->
    <div
      class="flex flex-wrap items-center justify-between gap-3 mb-3 px-2.5 py-2 bg-gray-800 rounded text-white text-xs">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-1.5">
          <span class="text-gray-400">容器:</span>
          <a-select v-model:value="activeContainer" size="small" style="width: 160px" :options="containerOptions"
            @change="connectLogStream" />
        </div>

        <div class="flex items-center gap-1.5">
          <span class="text-gray-400">行数:</span>
          <a-select v-model:value="tailLines" size="small" style="width: 90px" :options="tailOptions"
            @change="connectLogStream" />
        </div>

        <a-checkbox v-model:checked="autoScroll" class="text-gray-300 text-xs">
          自动滚底
        </a-checkbox>

        <div class="flex items-center gap-1.5 pl-1">
          <span class="inline-block w-2.5 h-2.5 rounded-full"
            :class="isStreaming ? 'bg-green-500 animate-pulse' : 'bg-red-500'"></span>
          <span :class="isStreaming ? 'text-green-400' : 'text-gray-400'" class="font-medium">
            {{ isStreaming ? '实时 Log 持续推流中 (kubectl logs -f)' : '已断开' }}
          </span>
        </div>
      </div>

      <!-- 右侧操作与搜索按钮组 -->
      <div class="flex items-center gap-2">
        <!-- 搜索条 -->
        <div class="flex items-center gap-1 bg-gray-900 px-2 py-0.5 rounded border border-gray-700">
          <span class="text-gray-400 text-xs">搜索:</span>
          <a-input v-model:value="searchKeyword" size="small" placeholder="搜索日志" style="width: 200px" allow-clear
            @pressEnter="handleSearchNext" @change="handleSearchChange" />
          <a-button size="small" type="text" class="text-gray-300 px-1 !text-xs hover:text-white" title="查找上一个"
            @click="handleSearchPrev">↑</a-button>
          <a-button size="small" type="text" class="text-gray-300 px-1 !text-xs hover:text-white" title="查找下一个"
            @click="handleSearchNext">↓</a-button>
        </div>

        <a-button size="small" type="primary" :loading="loading" @click="connectLogStream">
          重连 / 刷新
        </a-button>
        <a-button size="small" @click="clearLog">
          清屏
        </a-button>
        <a-button size="small" @click="downloadLog">
          下载日志
        </a-button>
      </div>
    </div>

    <!-- xterm 终端渲染容器 -->
    <div class="relative w-full rounded border border-gray-800 shadow-inner overflow-hidden bg-[#0d1117]"
      style="height: 540px;">
      <div v-if="loading"
        class="absolute inset-0 z-10 flex items-center justify-center bg-[#0d1117]/80 text-yellow-400 text-xs">
        正在建立 WebSocket 实时日志持续流连接 (kubectl logs -f)...
      </div>
      <div ref="terminalRef" class="w-full h-full p-2"></div>
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick, onUnmounted } from 'vue';
import {
  Modal as AModal,
  Select as ASelect,
  Input as AInput,
  Button as AButton,
  Checkbox as ACheckbox,
  message,
} from 'ant-design-vue';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { SearchAddon } from 'xterm-addon-search';
import 'xterm/css/xterm.css';
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
const searchKeyword = ref('');

// xterm 相关
const terminalRef = ref<HTMLElement | null>(null);
let term: Terminal | null = null;
let fitAddon: FitAddon | null = null;
let searchAddon: SearchAddon | null = null;
let resizeObserver: ResizeObserver | null = null;

let ws: WebSocket | null = null;

const containerOptions = ref<Array<{ label: string; value: string }>>([]);
const tailOptions = [
  { label: '100 行', value: '100' },
  { label: '200 行', value: '200' },
  { label: '500 行', value: '500' },
  { label: '1000 行', value: '1000' },
];

function initTerminal() {
  if (term) {
    term.dispose();
    term = null;
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }

  term = new Terminal({
    cursorBlink: false,
    cursorInactiveStyle: 'none',
    fontSize: 12,
    lineHeight: 1.25,
    fontFamily: 'Consolas, Menlo, Monaco, "Courier New", monospace',
    disableStdin: true,
    convertEol: true,
    theme: {
      background: '#0d1117',
      foreground: '#4ade80',
      cursor: 'transparent',
      cursorAccent: 'transparent',
    },
  });

  fitAddon = new FitAddon();
  term.loadAddon(fitAddon);

  searchAddon = new SearchAddon();
  term.loadAddon(searchAddon);

  if (terminalRef.value) {
    term.open(terminalRef.value);
    fitAddon.fit();

    resizeObserver = new ResizeObserver(() => {
      try {
        if (fitAddon && term && terminalRef.value && terminalRef.value.clientWidth > 0) {
          fitAddon.fit();
        }
      } catch {
        // ignore
      }
    });
    resizeObserver.observe(terminalRef.value);
  }

  setTimeout(() => {
    fitAddon?.fit();
  }, 100);
}

function handleSearchChange() {
  if (!searchAddon) return;
  const kw = searchKeyword.value.trim();
  if (!kw) {
    searchAddon.clearDecorations();
  } else {
    autoScroll.value = false;
    searchAddon.findNext(kw, {
      caseSensitive: false,
      incremental: true,
    });
  }
}

function handleSearchNext() {
  const kw = searchKeyword.value.trim();
  if (searchAddon && kw) {
    autoScroll.value = false;
    searchAddon.findNext(kw, {
      caseSensitive: false,
    });
  }
}

function handleSearchPrev() {
  const kw = searchKeyword.value.trim();
  if (searchAddon && kw) {
    autoScroll.value = false;
    searchAddon.findPrevious(kw, {
      caseSensitive: false,
    });
  }
}

watch(
  () => props.open,
  (val) => {
    visible.value = val;
    if (val) {
      searchKeyword.value = '';
      logContent.value = '';
      containerOptions.value = (props.containers || []).map((c) => ({ label: c, value: c }));
      activeContainer.value = props.containers && props.containers.length > 0 ? props.containers[0] : '';
      nextTick(() => {
        initTerminal();
        connectLogStream();
      });
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
  const initialMsg = `[${new Date().toLocaleTimeString()}] 正在建立 Pod 日志流连接...\r\n`;
  logContent.value = initialMsg;
  if (term) {
    term.clear();
    term.write(initialMsg);
  }

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
    if (fitAddon) {
      fitAddon.fit();
    }
  };

  ws.onmessage = (event) => {
    loading.value = false;
    isStreaming.value = true;
    logContent.value += event.data;
    if (term) {
      term.write(event.data);
      if (autoScroll.value) {
        term.scrollToBottom();
      }
    }
  };

  ws.onclose = () => {
    loading.value = false;
    isStreaming.value = false;
  };

  ws.onerror = () => {
    loading.value = false;
    isStreaming.value = false;
    const errMsg = `\r\n\x1b[31;1m[系统错误] WebSocket 连接失败，请检查 K8s 集群连接或 Pod 运行状态\x1b[0m\r\n`;
    logContent.value += errMsg;
    if (term) {
      term.write(errMsg);
    }
  };
}

function clearLog() {
  logContent.value = '';
  if (term) {
    term.clear();
  }
}

function downloadLog() {
  if (!logContent.value) {
    message.warning('当前日志内容为空');
    return;
  }
  const blob = new Blob([logContent.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${props.podName}-${activeContainer.value || 'container'}_${Date.now()}.log`;
  a.click();
  URL.revokeObjectURL(url);
}

function onOpenChange(val: boolean) {
  visible.value = val;
  if (!val) {
    handleCancel();
  }
}

function handleCancel() {
  visible.value = false;
  emit('update:open', false);
  handleClose();
}

function handleClose() {
  closeWs();
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (term) {
    term.dispose();
    term = null;
  }
}

onUnmounted(() => {
  handleClose();
});
</script>

<style scoped>
:deep(.xterm) {
  height: 100%;
}

:deep(.xterm .xterm-viewport) {
  overflow-y: auto;
}

:deep(.xterm-cursor-layer),
:deep(.xterm-cursor),
:deep(.xterm-cursor-block),
:deep(.xterm-cursor-outline),
:deep(.xterm-cursor-underline),
:deep(.xterm-cursor-bar) {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  width: 0 !important;
  height: 0 !important;
}
</style>
