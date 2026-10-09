<template>
  <a-modal
    v-model:open="visible"
    :title="modalTitle"
    width="85%"
    :footer="null"
    :destroyOnClose="true"
    :maskClosable="false"
    wrapClassName="baseline-log-modal"
    @cancel="handleCancel"
    @afterClose="handleClose"
  >
    <!-- 顶部操作栏 -->
    <div class="flex flex-wrap items-center justify-between gap-3 mb-3 p-2.5 bg-gray-900 rounded border border-gray-800 text-white text-xs">
      <div class="flex flex-wrap items-center gap-3">
        <!-- 运行时类型 Tag -->
        <div class="flex items-center gap-1.5">
          <span class="text-gray-400">运行时:</span>
          <Tag :color="runtimeType === 'k8s' ? 'cyan' : runtimeType === 'docker' ? 'blue' : 'green'" class="font-mono font-bold uppercase">
            {{ runtimeType }}
          </Tag>
        </div>

        <!-- 针对 bin / docker: 主机选择/输入 -->
        <div v-if="runtimeType === 'bin' || runtimeType === 'docker'" class="flex items-center gap-1.5">
          <span class="text-gray-400">目标主机:</span>
          <a-select
            v-if="hostOptions.length > 0"
            v-model:value="selectedHost"
            size="small"
            style="min-width: 170px"
            :options="hostOptions"
            @change="connectLogStream"
          />
          <a-input
            v-else
            v-model:value="selectedHost"
            size="small"
            placeholder="输入目标主机内网 IP"
            style="width: 150px"
            @pressEnter="connectLogStream"
          />
        </div>

        <!-- 针对 bin: 日志文件路径可配置 -->
        <div v-if="runtimeType === 'bin'" class="flex items-center gap-1.5">
          <span class="text-gray-400">日志绝对路径:</span>
          <a-input
            v-model:value="customLogPath"
            size="small"
            placeholder="如: /data/logs/app.log"
            style="width: 260px"
            class="font-mono text-xs"
            @pressEnter="connectLogStream"
          />
        </div>

        <!-- 针对 docker: 容器名称 -->
        <div v-if="runtimeType === 'docker'" class="flex items-center gap-1.5">
          <span class="text-gray-400">容器名:</span>
          <a-input
            v-model:value="customContainerName"
            size="small"
            placeholder="容器名称或 ID"
            style="width: 160px"
            @pressEnter="connectLogStream"
          />
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
            <a-input v-model:value="k8sPodName" size="small" placeholder="Pod 模糊或完整名" style="width: 180px" @pressEnter="connectLogStream" />
          </div>
        </template>

        <!-- Tail 行数选择 -->
        <div class="flex items-center gap-1.5">
          <span class="text-gray-400">行数:</span>
          <a-select
            v-model:value="tailLines"
            size="small"
            style="width: 90px"
            :options="tailOptions"
            @change="connectLogStream"
          />
        </div>

        <!-- 自动滚动复选框 -->
        <a-checkbox v-model:checked="autoScroll" class="text-gray-300 text-xs">
          自动滚底
        </a-checkbox>

        <!-- 状态点 -->
        <div class="flex items-center gap-1.5 pl-1">
          <span
            class="inline-block w-2.5 h-2.5 rounded-full"
            :class="isStreaming ? 'bg-green-500 animate-pulse' : 'bg-red-500'"
          ></span>
          <span :class="isStreaming ? 'text-green-400' : 'text-gray-400'" class="font-medium">
            {{ isStreaming ? (runtimeType === 'k8s' ? 'K8s Pod 实时推流' : 'Agent gRPC 按需拉取中') : '已断开' }}
          </span>
        </div>
      </div>

      <!-- 右侧操作按钮组 -->
      <div class="flex items-center gap-2">
        <a-button size="small" type="primary" :loading="loading" @click="connectLogStream">
          重新拉取
        </a-button>
        <a-button size="small" @click="clearLog">
          清屏
        </a-button>
        <a-button size="small" @click="downloadLog">
          下载日志
        </a-button>
      </div>
    </div>

    <!-- 黑色终端日志展示容器 -->
    <div
      ref="logContainerRef"
      class="w-full bg-[#0d1117] p-3.5 rounded font-mono text-xs text-green-400 overflow-y-auto leading-relaxed border border-gray-800 shadow-inner"
      style="height: 560px; white-space: pre-wrap; word-break: break-all"
    >
      <div v-if="loading" class="text-yellow-400 py-6 text-center">
        正在向目标端发起实时日志拉取 (WebSocket & gRPC 通道握手中)...
      </div>
      <div v-else-if="!logContent" class="text-gray-500 py-6 text-center">
        暂无日志数据输出，或该进程尚未产生最新控制台日志。
      </div>
      <div v-else>
        {{ logContent }}
      </div>
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
  import { useGlobSetting } from '@/hooks/setting';
  import { getToken } from '@/utils/auth';

  const globSetting = useGlobSetting();

  const visible = ref(false);
  const loading = ref(false);
  const isStreaming = ref(false);

  // 基础参数
  const currentRecord = ref<any>({});
  const runtimeType = ref<'bin' | 'docker' | 'k8s'>('bin');
  const tailLines = ref('200');
  const autoScroll = ref(true);
  const logContent = ref('');
  const logContainerRef = ref<HTMLElement | null>(null);

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

  import { getJenkinsJobParameters } from '@/api/cicd';

  const modalTitle = computed(() => {
    const sName = currentRecord.value?.name || '应用';
    return `实时应用日志 (按需拉取): ${sName} [${runtimeType.value.toUpperCase()}]`;
  });

  /**
   * 打开实时日志弹窗 (供父组件调用)
   */
  async function open(record: any, instanceId?: number) {
    currentRecord.value = record || {};
    visible.value = true;
    logContent.value = '';

    // 1. 初始化运行时类型
    const rType = String(record?.deployType || 'bin').toLowerCase();
    runtimeType.value = rType === 'k8s' ? 'k8s' : rType === 'docker' ? 'docker' : 'bin';

    // 2. 提取主机列表：优先从 record 自身属性中提取
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
          // 匹配常见 IP 格式
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

    // 3. 提取服务纯名称并直接复用为容器名与日志目录名
    const rawJobName = record?.name || record?.jobName || 'app';
    const pureServiceName = rawJobName.includes('/') ? rawJobName.split('/').pop()! : rawJobName;

    // 容器名称直接复用服务名称
    customContainerName.value = pureServiceName;
    // 日志路径默认带上服务名称
    customLogPath.value = record?.logPath || `/data/logs/${pureServiceName}/${pureServiceName}.log`;

    // 4. 初始化 K8s 参数 (Pod 名默认也带上服务名称便于模糊匹配)
    k8sCluster.value = record?.targetClusters?.[0] || record?.clusterName || 'domi-test';
    k8sNamespace.value = record?.namespace || 'default';
    k8sPodName.value = record?.podName || pureServiceName;

    // 5. 核心：如果主机列表为空且有 instanceId，自动调接口从远端 Jenkins Job 构建参数中拉取真实配置的目标主机
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
            // 匹配目标主机参数
            if (['目标主机', 'target_host', 'targethost', 'hosts', 'host'].some((k) => pName.includes(k))) {
              extractIps(p?.defaultValue);
              if (Array.isArray(p?.choices)) {
                p.choices.forEach((c: any) => extractIps(c));
              }
            }
            // 匹配容器名
            if (['容器名', 'container', 'container_name'].some((k) => pName.includes(k)) && p?.defaultValue) {
              if (!record?.containerName) {
                customContainerName.value = String(p.defaultValue).trim();
              }
            }
            // 匹配集群
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
      // 优先复用本地曾经成功拉取过的主机 IP (例如上次使用的 192.168.1.20)
      const lastHost = localStorage.getItem('last_log_host');
      selectedHost.value = lastHost || record?.hostIp || '192.168.1.20';
    }

    // 发起连接
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
    logContent.value = `[${new Date().toLocaleTimeString()}] 正在建立实时日志流连接...\n`;

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
      };

      ws.onmessage = (event) => {
        loading.value = false;
        isStreaming.value = true;
        logContent.value += event.data;

        if (autoScroll.value) {
          nextTick(() => {
            if (logContainerRef.value) {
              logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight;
            }
          });
        }
      };

      ws.onerror = () => {
        loading.value = false;
        isStreaming.value = false;
        logContent.value += `\n[系统错误] WebSocket 连接失败，请检查网络或目标主机 Agent 状态\n`;
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
    closeWebSocket();
  }

  function handleClose() {
    closeWebSocket();
  }

  onUnmounted(() => {
    closeWebSocket();
  });

  defineExpose({
    open,
  });
</script>

<style scoped>
  .baseline-log-modal :deep(.ant-modal-body) {
    padding: 12px 16px;
  }
</style>
