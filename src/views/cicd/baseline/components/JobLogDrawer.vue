<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    title="Jenkins 实时编译与部署日志"
    width="75%"
    @close="handleClose"
  >
    <template #title>
      <div class="flex items-center justify-between w-full pr-8 select-none">
        <Space align="center" size="small">
          <span v-if="isRunning || loading" class="w-4 h-4 rounded-full border-2 border-dashed border-blue-500 animate-spin inline-block shrink-0"></span>
          <span v-else-if="buildResult === 'SUCCESS'" class="w-3.5 h-3.5 rounded-full bg-green-500/20 border border-green-500 inline-block shrink-0"></span>
          <span v-else-if="buildResult === 'FAILURE'" class="w-3.5 h-3.5 rounded-full bg-red-500/20 border border-red-500 inline-block shrink-0"></span>
          <span v-else-if="buildResult === 'ABORTED'" class="w-3.5 h-3.5 rounded-full bg-amber-500/20 border border-amber-500 inline-block shrink-0"></span>
          <span v-else class="w-3.5 h-3.5 rounded-full border-2 border-gray-300 inline-block shrink-0"></span>
          <span class="font-bold text-gray-800 dark:text-gray-100">Jenkins Console [ {{ jobName }} #{{ buildNumber }} ]</span>
          <Tag v-if="isRunning" color="processing">BUILDING</Tag>
          <Tag v-else-if="buildResult === 'SUCCESS'" color="success">SUCCESS</Tag>
          <Tag v-else-if="buildResult === 'FAILURE'" color="error">FAILURE</Tag>
          <Tag v-else-if="buildResult === 'ABORTED'" color="warning">ABORTED</Tag>
          <Tag v-else-if="buildResult" color="warning">{{ buildResult }}</Tag>
          <span class="text-xs text-gray-400 font-mono ml-2">Offset: {{ logOffset }} bytes</span>
        </Space>

        <Space size="middle" align="center">
          <a-checkbox v-model:checked="autoScroll" class="text-xs">自动滚到底部</a-checkbox>
          <Button size="small" type="primary" ghost @click="fetchLogs(true)">
            手动刷新
          </Button>
          <a-popconfirm
            v-if="isRunning || canceling"
            title="确认取消当前 Jenkins 构建任务？"
            ok-text="确认取消"
            cancel-text="暂不取消"
            @confirm="handleStopBuild"
          >
            <Button size="small" type="primary" danger :loading="canceling">
              取消构建
            </Button>
          </a-popconfirm>
        </Space>
      </div>
    </template>

    <div class="bg-gray-950 p-3">
      <!-- xterm 终端黑框 -->
      <div ref="terminalRef" class="w-full h-[680px]"></div>
    </div>
  </BasicDrawer>
</template>

<script lang="ts" setup>
import { ref, onBeforeUnmount, nextTick } from 'vue';
import { Card, Tag, Checkbox as ACheckbox, Popconfirm as APopconfirm, Space } from 'ant-design-vue';
import { Button } from '@/components/Button';
import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
import { getJenkinsBuildLogs, triggerJenkinsBuild, stopJenkinsBuild } from '@/api/cicd';
import { useMessage } from '@/hooks/web/useMessage';

import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const emit = defineEmits(['close', 'register']);
const { createMessage } = useMessage();

const instanceId = ref<number>(0);
const jobName = ref<string>('');
const folder = ref<string>('');
const projectName = ref<string>('');
const buildNumber = ref<number>(0);
const isRunning = ref<boolean>(false);
const canceling = ref<boolean>(false);
const buildResult = ref<string>('');
const logOffset = ref<number>(0);
const autoScroll = ref<boolean>(true);
const loading = ref<boolean>(false);
const terminalRef = ref<HTMLElement | null>(null);

let term: Terminal | null = null;
let fitAddon: FitAddon | null = null;
let timer: any = null;
let resizeObserver: ResizeObserver | null = null;

const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let spinnerIndex = 0;
let hasActiveSpinner = false;
let spinnerInterval: any = null;

function removeSpinner() {
  if (hasActiveSpinner && term) {
    term.write('\r\x1b[K');
    hasActiveSpinner = false;
  }
}

function renderSpinner() {
  if (!isRunning.value || !term) {
    removeSpinner();
    return;
  }
  const frame = spinnerFrames[spinnerIndex % spinnerFrames.length];
  spinnerIndex++;
  term.write(`\r\x1b[K\x1b[36;1m${frame} \x1b[0m`);
  hasActiveSpinner = true;
}

function startSpinnerAnimation() {
  stopSpinnerAnimation();
  spinnerInterval = setInterval(() => {
    if (isRunning.value && term) {
      renderSpinner();
    } else {
      stopSpinnerAnimation();
    }
  }, 120);
}

function stopSpinnerAnimation() {
  if (spinnerInterval) {
    clearInterval(spinnerInterval);
    spinnerInterval = null;
  }
  removeSpinner();
}

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
    cursorStyle: 'underline',
    fontSize: 13,
    lineHeight: 1.25,
    letterSpacing: 0,
    fontFamily: 'Consolas, Menlo, Monaco, "Courier New", "PingFang SC", "Microsoft YaHei", monospace',
    disableStdin: true,
    convertEol: true,
    theme: {
      background: '#030712',
      foreground: '#d1d5db',
    },
  });

  fitAddon = new FitAddon();
  term.loadAddon(fitAddon);

  if (terminalRef.value) {
    term.open(terminalRef.value);
    fitAddon.fit();

    resizeObserver = new ResizeObserver(() => {
      try {
        if (fitAddon && term && terminalRef.value && terminalRef.value.clientWidth > 0) {
          fitAddon.fit();
        }
      } catch (_) { }
    });
    resizeObserver.observe(terminalRef.value);
  }

  window.addEventListener('resize', handleResize);

  setTimeout(() => {
    handleResize();
  }, 150);
  setTimeout(() => {
    handleResize();
  }, 350);
}

function handleResize() {
  if (fitAddon && term && terminalRef.value && terminalRef.value.clientWidth > 0) {
    try {
      fitAddon.fit();
    } catch (_) { }
  }
}

const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
  instanceId.value = data.instanceId;
  const rawJobName = data.jobName || '';
  jobName.value = rawJobName.includes('/') ? rawJobName.split('/').pop()! : rawJobName;
  folder.value = data.folder || (rawJobName.includes('/') ? rawJobName.split('/')[0] : '');
  projectName.value = data.projectName || folder.value;
  buildNumber.value = data.buildNumber || 0;
  isRunning.value = false;
  canceling.value = false;
  buildResult.value = '';
  logOffset.value = 0;
  loading.value = true;
  stopTimer();
  stopSpinnerAnimation();

  await nextTick();
  initTerminal();

  if (data.triggerBuild) {
    try {
      const triggerRes: any = await triggerJenkinsBuild({
        instanceId: data.instanceId,
        jobName: data.jobName,
        folder: data.folder,
        projectName: data.projectName || data.folder,
        branch: data.branch,
        deployEnv: data.deployEnv,
        deployType: data.deployType,
        gitRepo: data.gitRepo,
      });
      buildNumber.value = triggerRes.buildNumber || 0;
      createMessage.success('Jenkins 构建流程调度成功！');
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      if (errMsg.includes('invalid character') || errMsg.includes('解析远程任务定义发生奔溃')) {
        createMessage.error(`触发构建失败: 远端 Jenkins 任务 [${data.jobName}] 对象可能未在 Jenkins 中就绪或响应 404，请确认该 Job 配置是否正常。`);
      } else {
        createMessage.error('触发构建失败: ' + errMsg);
      }
      loading.value = false;
      return;
    }
  }

  fetchLogs(true);
  startTimer();
});

async function fetchLogs(reset = false) {
  if (reset) {
    logOffset.value = 0;
    stopSpinnerAnimation();
    if (term) {
      term.clear();
    }
  }
  try {
    handleResize();
    const res: any = await getJenkinsBuildLogs({
      instanceId: instanceId.value,
      jobName: jobName.value,
      folder: folder.value,
      projectName: projectName.value,
      buildNumber: buildNumber.value,
      offset: logOffset.value,
    });

    if (res) {
      if (res.buildNumber) {
        buildNumber.value = res.buildNumber;
      }
      if (res.content && term) {
        removeSpinner();
        term.write(res.content);
      }
      logOffset.value = res.offset || 0;

      const finishedStatuses = ['SUCCESS', 'FAILURE', 'ABORTED', 'UNSTABLE', 'CANCELLED'];
      if (res.result && finishedStatuses.includes(String(res.result).toUpperCase())) {
        isRunning.value = false;
        buildResult.value = String(res.result).toUpperCase();
      } else {
        isRunning.value = res.isRunning ?? res.building ?? true;
        buildResult.value = res.result || 'BUILDING';
      }

      if (isRunning.value) {
        renderSpinner();
        if (!spinnerInterval) {
          startSpinnerAnimation();
        }
      } else {
        stopSpinnerAnimation();
        if (buildResult.value === 'SUCCESS') {
          term?.write('\x1b[32;1m✔ Jenkins Pipeline executed successfully!\x1b[0m\r\n');
        } else if (buildResult.value === 'FAILURE') {
          term?.write('\x1b[31;1m✖ Jenkins Pipeline build failed!\x1b[0m\r\n');
        } else if (buildResult.value === 'ABORTED') {
          term?.write('\x1b[33;1m⚠ Jenkins Pipeline build was cancelled (ABORTED).\x1b[0m\r\n');
        }
      }

      handleResize();

      if (autoScroll.value && term) {
        term.scrollToBottom();
      }
    }
  } catch (err) {
  } finally {
    loading.value = false;
  }
}

async function handleStopBuild() {
  if (!instanceId.value || !jobName.value) return;
  canceling.value = true;
  try {
    await stopJenkinsBuild({
      instanceId: instanceId.value,
      jobName: jobName.value,
      folder: folder.value,
      projectName: projectName.value,
      buildNumber: buildNumber.value,
    });
    createMessage.success('已发送取消构建指令！');
    fetchLogs(true);
  } catch (err: any) {
    createMessage.error('取消构建失败: ' + (err?.message || err));
  } finally {
    canceling.value = false;
  }
}

function startTimer() {
  stopTimer();
  timer = setInterval(() => {
    if (isRunning.value || logOffset.value === 0) {
      fetchLogs(false);
    } else {
      stopTimer();
    }
  }, 2000);
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function handleClose() {
  stopTimer();
  stopSpinnerAnimation();
  window.removeEventListener('resize', handleResize);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (term) {
    term.dispose();
    term = null;
  }
  emit('close');
}

onBeforeUnmount(() => {
  stopTimer();
  stopSpinnerAnimation();
  window.removeEventListener('resize', handleResize);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (term) {
    term.dispose();
    term = null;
  }
});
</script>

<style scoped>
:deep(.ant-drawer-body) {
  padding: 0 !important;
  background-color: #030712 !important;
  overflow: hidden !important;
}

:deep(.xterm .xterm-viewport) {
  background-color: #030712 !important;
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
