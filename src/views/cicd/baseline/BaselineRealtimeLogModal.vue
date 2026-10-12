<template>
  <a-modal v-model:open="visible" :title="modalTitle" width="85%" :footer="null" :destroyOnClose="true"
    :maskClosable="true" wrapClassName="baseline-log-modal" @cancel="handleCancel" @afterClose="handleClose">
    <!-- 顶部操作栏 -->
    <div
      class="flex flex-wrap items-center justify-between gap-3 mb-3 p-2.5 bg-gray-900 rounded border border-gray-800 text-white text-xs">
      <div class="flex flex-wrap items-center gap-3">
        <!-- 运行时类型 Tag -->
        <div class="flex items-center gap-1.5">
          <span class="text-gray-400">运行时:</span>
          <Tag :color="runtimeType === 'k8s' ? 'cyan' : runtimeType === 'docker' ? 'blue' : 'green'"
            class="font-mono font-bold uppercase">
            {{ runtimeType }}
          </Tag>
        </div>

        <!-- 针对 bin / docker: 主机选择/输入 -->
        <div v-if="runtimeType === 'bin' || runtimeType === 'docker'" class="flex items-center gap-1.5">
          <span class="text-gray-400">目标主机:</span>
          <a-select v-if="hostOptions.length > 0" v-model:value="selectedHost" size="small" style="min-width: 170px"
            :options="hostOptions" @change="connectLogStream" />
          <a-input v-else v-model:value="selectedHost" size="small" placeholder="输入目标主机内网 IP" style="width: 150px"
            @pressEnter="connectLogStream" />
        </div>

        <!-- 针对 bin: 日志文件路径可配置 -->
        <div v-if="runtimeType === 'bin'" class="flex items-center gap-1.5">
          <span class="text-gray-400">日志绝对路径:</span>
          <a-input v-model:value="customLogPath" size="small" placeholder="如: /data/logs/app.log" style="width: 260px"
            class="font-mono text-xs" @pressEnter="connectLogStream" />
        </div>

        <!-- 针对 docker: 容器名称 -->
        <div v-if="runtimeType === 'docker'" class="flex items-center gap-1.5">
          <span class="text-gray-400">容器名:</span>
          <a-input v-model:value="customContainerName" size="small" placeholder="容器名称或 ID" style="width: 160px"
            @pressEnter="connectLogStream" />
        </div>

        <!-- 针对 k8s: 集群/命名空间/Pod 名 -->
        <template v-if="runtimeType === 'k8s'">
          <div class="flex items-center gap-1.5">
            <span class="text-gray-400">集群:</span>
            <a-input v-model:value="k8sCluster" size="small" style="width: 110px" @pressEnter="connectLogStream" />
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-gray-400">命名空间:</span>
            <a-input v-model:value="k8sNamespace" size="small" style="width: 100px" @pressEnter="connectLogStream" />
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-gray-400">Pod 名:</span>
            <a-input v-model:value="k8sPodName" size="small" placeholder="Pod 模糊或完整名" style="width: 180px"
              @pressEnter="connectLogStream" />
          </div>
        </template>

        <!-- Tail 行数选择 -->
        <div class="flex items-center gap-1.5">
          <span class="text-gray-400">行数:</span>
          <a-select v-model:value="tailLines" size="small" style="width: 90px" :options="tailOptions"
            @change="connectLogStream" />
        </div>

        <!-- 自动滚动复选框 -->
        <a-checkbox v-model:checked="autoScroll" class="text-gray-300 text-xs">
          自动滚底
        </a-checkbox>

        <!-- 状态点 -->
        <div class="flex items-center gap-1.5 pl-1">
          <span class="inline-block w-2.5 h-2.5 rounded-full"
            :class="isStreaming ? 'bg-green-500 animate-pulse' : 'bg-red-500'"></span>
          <span :class="isStreaming ? 'text-green-400' : 'text-gray-400'" class="font-medium">
            {{ isStreaming ? (runtimeType === 'k8s' ? 'K8s Pod 实时推流' : '实时推流中') : '已断开' }}
          </span>
        </div>
      </div>

      <!-- 右侧操作与搜索按钮组 -->
      <div class="flex items-center gap-2">
        <!-- 搜索条 -->
        <div class="flex items-center gap-1 bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
          <span class="text-gray-400 text-xs">搜索:</span>
          <a-input v-model:value="searchKeyword" size="small" placeholder="搜索日志" style="width: 200px" allow-clear
            @pressEnter="handleSearchNext" @change="handleSearchChange" />
          <a-button size="small" type="text" class="text-gray-300 px-1 !text-xs hover:text-white" title="查找上一个"
            @click="handleSearchPrev">↑</a-button>
          <a-button size="small" type="text" class="text-gray-300 px-1 !text-xs hover:text-white" title="查找下一个"
            @click="handleSearchNext">↓</a-button>
        </div>

        <a-button size="small" type="primary" :loading="loading" @click="connectLogStream">
          重新获取
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
      style="height: 560px;">
      <div v-if="loading"
        class="absolute inset-0 z-10 flex items-center justify-center bg-[#0d1117]/80 text-yellow-400 text-xs">
        正在向目标端发起实时日志拉取 (WebSocket & gRPC 通道握手中)...
      </div>
      <div ref="terminalRef" class="w-full h-full p-2"></div>
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref, computed, nextTick, onUnmounted } from 'vue';
import {
  Modal as AModal,
  Select as ASelect,
  Input as AInput,
  Button as AButton,
  Checkbox as ACheckbox,
  Tag,
  message,
} from 'ant-design-vue';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { SearchAddon } from 'xterm-addon-search';
import 'xterm/css/xterm.css';
import { useGlobSetting } from '@/hooks/setting';
import { getToken } from '@/utils/auth';
import { getJenkinsJobParameters } from '@/api/cicd';

const globSetting = useGlobSetting();

const visible = ref(false);
const loading = ref(false);
const isStreaming = ref(false);

// 基础参数
const currentRecord = ref<any>({});
const runtimeType = ref<'bin' | 'docker' | 'k8s'>('bin');
const tailLines = ref('100');
const autoScroll = ref(true);
const logContent = ref('');
const searchKeyword = ref('');

// xterm 实例
const terminalRef = ref<HTMLElement | null>(null);
let term: Terminal | null = null;
let fitAddon: FitAddon | null = null;
let searchAddon: SearchAddon | null = null;
let resizeObserver: ResizeObserver | null = null;

// bin & docker 参数
const selectedHost = ref('');
const hostOptions = ref<Array<{ label: string; value: string }>>([]);
const customLogPath = ref('');
const customContainerName = ref('');

// k8s 参数
const k8sCluster = ref('');
const k8sNamespace = ref('default');
const k8sPodName = ref('');

let ws: WebSocket | null = null;

const tailOptions = [
  { label: '100 行', value: '100' },
  { label: '200 行', value: '200' },
  { label: '500 行', value: '500' },
  { label: '1000 行', value: '1000' },
];

const modalTitle = computed(() => {
  const sName = currentRecord.value?.name || '应用';
  return `实时日志: ${sName} [${runtimeType.value.toUpperCase()}]`;
});

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

/**
 * 打开日志弹窗入口
 */
async function open(record: any, instanceId?: number) {
  currentRecord.value = record || {};
  visible.value = true;
  loading.value = true;
  logContent.value = '';
  searchKeyword.value = '';

  nextTick(() => {
    initTerminal();
  });

  // 1. 初始化运行时类型
  const rType = String(record?.deployType || 'bin').toLowerCase();
  runtimeType.value = rType === 'k8s' ? 'k8s' : rType === 'docker' ? 'docker' : 'bin';

  // 2. 提取主机列表
  hostOptions.value = [];
  const hosts: string[] = [];
  const extractIps = (val: any) => {
    if (!val) return;
    if (Array.isArray(val)) {
      val.forEach((item) => extractIps(item));
    } else if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => extractIps(item));
          return;
        }
      } catch {
        // not json
      }
      val.split(/[,;\s]+/).forEach((ip) => {
        const clean = ip.trim();
        if (clean && /^\d{1,3}(\.\d{1,3}){3}$/.test(clean) && !hosts.includes(clean)) {
          hosts.push(clean);
        }
      });
    }
  };

  extractIps(record?.targetHosts);
  extractIps(record?.hostIp);
  extractIps(record?.hosts);
  extractIps(record?.ip);

  // 3. 提取服务纯名称并复用
  const rawJobName = record?.name || record?.jobName || 'app';
  const pureServiceName = rawJobName.includes('/') ? rawJobName.split('/').pop()! : rawJobName;

  customContainerName.value = pureServiceName;
  customLogPath.value = record?.logPath || `/data/logs/${pureServiceName}/${pureServiceName}.log`;

  // 4. 初始化 K8s 参数
  k8sCluster.value = record?.targetClusters?.[0] || record?.clusterName || 'domi-test';
  k8sNamespace.value = record?.namespace || 'default';
  k8sPodName.value = record?.podName || pureServiceName;

  // 5. 若主机列表为空调接口拉取目标主机
  const targetInstId = instanceId || record?.instanceId;
  if (hosts.length === 0 && targetInstId) {
    try {
      const rawName = record?.name || record?.jobName || '';
      const shortJobName = rawName.includes('/') ? rawName.split('/').pop()! : rawName;
      const folder =
        record?.folder ||
        record?.projectName ||
        (rawName.includes('/') ? rawName.split('/')[0] : '');

      const res: any = await getJenkinsJobParameters({
        instanceId: targetInstId,
        jobName: shortJobName,
        folder: folder,
        projectName: folder,
      });

      const paramsList = Array.isArray(res) ? res : res?.result || res?.parameters || res?.data || [];
      if (Array.isArray(paramsList)) {
        paramsList.forEach((p: any) => {
          const pName = String(p?.name || '').toLowerCase();
          if (['目标主机', 'target_host', 'targethost', 'hosts', 'host'].some((k) => pName.includes(k))) {
            extractIps(p?.defaultValue);
            if (Array.isArray(p?.choices)) {
              p.choices.forEach((c: any) => extractIps(c));
            }
          }
          if (['容器名', 'container', 'container_name'].some((k) => pName.includes(k)) && p?.defaultValue) {
            if (!record?.containerName) {
              customContainerName.value = String(p.defaultValue).trim();
            }
          }
          if (['集群', 'cluster'].some((k) => pName.includes(k)) && p?.defaultValue) {
            if (!record?.clusterName) {
              k8sCluster.value = String(p.defaultValue).trim();
            }
          }
        });
      }
    } catch (paramErr) {
      console.warn('自动解析服务基线远程目标主机参数失败:', paramErr);
    }
  }

  // 6. 最终确认选中的目标主机
  if (hosts.length > 0) {
    hostOptions.value = hosts.map((h) => ({ label: h, value: h }));
    selectedHost.value = hosts[0];
  } else {
    const lastHost = localStorage.getItem('last_log_host');
    selectedHost.value = lastHost || record?.hostIp || '192.168.1.20';
  }

  nextTick(() => {
    connectLogStream();
  });
}

/**
 * 建立 WebSocket 实时日志流连接
 */
function connectLogStream() {
  closeWebSocket();

  loading.value = true;
  isStreaming.value = false;
  const initialMsg = `[${new Date().toLocaleTimeString()}] 正在建立实时日志流连接...\r\n`;
  logContent.value = initialMsg;
  if (term) {
    term.clear();
    term.write(initialMsg);
  }

  if (selectedHost.value && selectedHost.value !== '127.0.0.1') {
    localStorage.setItem('last_log_host', selectedHost.value);
  }

  try {
    const apiUrl = globSetting.apiUrl || '';
    let wsBase = apiUrl;
    if (wsBase.startsWith('http://')) {
      wsBase = wsBase.replace('http://', 'ws://');
    } else if (wsBase.startsWith('https://')) {
      wsBase = wsBase.replace('https://', 'wss://');
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsBase = `${protocol}//${window.location.host}${apiUrl}`;
    }

    const params = new URLSearchParams({
      runtimeType: runtimeType.value,
      tailLines: tailLines.value,
      token: getToken() || '',
    });

    if (runtimeType.value === 'bin' || runtimeType.value === 'docker') {
      params.append('hostIp', selectedHost.value);
      params.append('grpcPort', '9091');
      if (runtimeType.value === 'bin') {
        params.append('logPath', customLogPath.value);
      } else {
        params.append('containerName', customContainerName.value);
      }
    } else if (runtimeType.value === 'k8s') {
      params.append('clusterName', k8sCluster.value);
      params.append('namespace', k8sNamespace.value);
      params.append('podName', k8sPodName.value);
    }

    const fullWsUrl = `${wsBase}/api/cicd/wsBaselineRealtimeLogs?${params.toString()}`;
    ws = new WebSocket(fullWsUrl);

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

    ws.onerror = () => {
      loading.value = false;
      isStreaming.value = false;
      const errMsg = `\r\n\x1b[31;1m[系统错误] WebSocket 连接失败，请检查网络或目标主机 Agent 状态\x1b[0m\r\n`;
      logContent.value += errMsg;
      if (term) {
        term.write(errMsg);
      }
    };

    ws.onclose = () => {
      loading.value = false;
      isStreaming.value = false;
    };
  } catch (err: any) {
    loading.value = false;
    isStreaming.value = false;
    message.error(`发起 WebSocket 连接失败: ${err?.message || err}`);
  }
}

function closeWebSocket() {
  if (ws) {
    ws.onclose = null;
    ws.onerror = null;
    ws.onmessage = null;
    ws.close();
    ws = null;
  }
  isStreaming.value = false;
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
  const link = document.createElement('a');
  link.href = url;
  link.download = `${currentRecord.value?.name || 'app'}_live_${Date.now()}.log`;
  link.click();
  URL.revokeObjectURL(url);
}

function handleCancel() {
  visible.value = false;
  handleClose();
}

function handleClose() {
  closeWebSocket();
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

defineExpose({
  open,
});
</script>

<style scoped>
.baseline-log-modal :deep(.ant-modal-body) {
  padding: 12px 16px;
}

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
