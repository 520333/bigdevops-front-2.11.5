<template>
  <a-modal
    v-model:open="visible"
    :title="`容器 Exec 终端: ${podName} ${activeContainer ? `(${activeContainer})` : ''}`"
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
          id="exec-active-container"
          input-id="exec-active-container-input"
          name="activeContainer"
          v-model:value="activeContainer"
          size="small"
          style="width: 150px"
          :options="containerOptions"
          @change="connectTerminal"
        />

        <span>Shell:</span>
        <a-select
          id="exec-active-shell"
          input-id="exec-active-shell-input"
          name="activeShell"
          v-model:value="activeShell"
          size="small"
          style="width: 150px"
          :options="shellOptions"
          @change="connectTerminal"
        />
        <span class="text-green-400">● 状态: {{ isConnected ? '已连接' : '网络已断开' }}</span>
      </div>
      <div class="text-gray-400">
        提示: 输入 exit 可退出 Terminal 会话
      </div>
    </div>

    <div ref="terminalContainer" class="w-full bg-black p-2 rounded" style="height: 500px; overflow: hidden"></div>
  </a-modal>
</template>

<script lang="ts" setup>
  import { ref, nextTick, watch, onUnmounted } from 'vue';
  import { Modal as AModal, Select as ASelect } from 'ant-design-vue';
  import { Terminal } from 'xterm';
  import { FitAddon } from 'xterm-addon-fit';
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
  const isConnected = ref(false);
  const activeContainer = ref('');
  const activeShell = ref('');
  const containerOptions = ref<Array<{ label: string; value: string }>>([]);
  const terminalContainer = ref<HTMLElement | null>(null);

  const shellOptions = [
    { label: '自动探测 (Auto)', value: '' },
    { label: 'bash (/bin/bash)', value: 'bash' },
    { label: 'sh (/bin/sh)', value: 'sh' },
    { label: 'dash (/bin/dash)', value: 'dash' },
    { label: 'zsh (/bin/zsh)', value: 'zsh' },
  ];

  let term: Terminal | null = null;
  let fitAddon: FitAddon | null = null;
  let ws: WebSocket | null = null;

  watch(
    () => props.open,
    (val) => {
      visible.value = val;
      if (val) {
        containerOptions.value = (props.containers || []).map((c) => ({ label: c, value: c }));
        activeContainer.value = props.containers && props.containers.length > 0 ? props.containers[0] : '';
        activeShell.value = '';
        nextTick(() => {
          initTerminal();
          connectTerminal();
        });
      } else {
        handleClose();
      }
    },
  );

  function initTerminal() {
    if (term) {
      term.dispose();
      term = null;
    }
    term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#000000',
        foreground: '#ffffff',
      },
    });

    fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    if (terminalContainer.value) {
      term.open(terminalContainer.value);
      fitAddon.fit();
    }

    term.onData((data) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ op: 'stdin', data }));
      }
    });

    window.addEventListener('resize', handleResize);
  }

  function handleResize() {
    if (fitAddon && term) {
      fitAddon.fit();
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            op: 'resize',
            cols: term.cols,
            rows: term.rows,
          }),
        );
      }
    }
  }

  function connectTerminal() {
    closeWs();
    if (!props.clusterName || !props.namespace || !props.podName) return;

    if (term) {
      term.clear();
      term.writeln(`\x1b[33m正在建立 SPDY Exec 在线 Terminal 连接 ${activeShell.value ? `[Shell: ${activeShell.value}]` : '[Shell: 自动探测]'}...\x1b[0m`);
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
    const wsUrl = `${path}/api/k8s/wsK8sPodExec?clusterName=${encodeURIComponent(
      props.clusterName,
    )}&namespace=${encodeURIComponent(props.namespace)}&name=${encodeURIComponent(
      props.podName,
    )}&container=${encodeURIComponent(activeContainer.value)}&shell=${encodeURIComponent(activeShell.value)}&token=${encodeURIComponent(token)}`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      isConnected.value = true;
      if (term) {
        term.writeln('\x1b[32m✔ 连接成功，Terminal 会话准备就绪。\x1b[0m\r\n');
        handleResize();
      }
    };

    ws.onmessage = (event) => {
      if (term) {
        term.write(event.data);
      }
    };

    ws.onclose = () => {
      isConnected.value = false;
      if (term) {
        term.writeln('\r\n\x1b[31mTerminal 会话已断开。\x1b[0m');
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket terminal 错误:', err);
      isConnected.value = false;
      if (term) {
        term.writeln('\r\n\x1b[31mTerminal 连接异常。\x1b[0m');
      }
    };
  }

  function closeWs() {
    if (ws) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, 'close');
      }
      ws = null;
    }
    isConnected.value = false;
  }

  function handleCancel() {
    visible.value = false;
    emit('update:open', false);
    handleClose();
  }

  function handleClose() {
    closeWs();
    window.removeEventListener('resize', handleResize);
    if (term) {
      term.dispose();
      term = null;
    }
  }

  onUnmounted(() => {
    handleClose();
  });
</script>
