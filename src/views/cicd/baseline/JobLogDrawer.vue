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
        <Space align="center" size="small" class="flex-wrap">
          <span
            v-if="isRunning || loading"
            class="w-4 h-4 rounded-full border-2 border-dashed border-blue-500 animate-spin inline-block shrink-0"
          ></span>
          <span
            v-else-if="buildResult === 'SUCCESS'"
            class="w-3.5 h-3.5 rounded-full bg-green-500/20 border border-green-500 inline-block shrink-0"
          ></span>
          <span
            v-else-if="buildResult === 'FAILURE'"
            class="w-3.5 h-3.5 rounded-full bg-red-500/20 border border-red-500 inline-block shrink-0"
          ></span>
          <span
            v-else-if="buildResult === 'ABORTED'"
            class="w-3.5 h-3.5 rounded-full bg-amber-500/20 border border-amber-500 inline-block shrink-0"
          ></span>
          <span
            v-else
            class="w-3.5 h-3.5 rounded-full border-2 border-gray-300 inline-block shrink-0"
          ></span>
          <span class="font-bold text-gray-800 dark:text-gray-100 shrink-0">
            {{ jobName }}
          </span>

          <!-- 历史构建选择下拉框 -->
          <a-select
            v-model:value="buildNumber"
            size="small"
            style="min-width: 140px; max-width: 220px"
            :loading="historyLoading"
            placeholder="历史构建期数"
            @change="handleBuildNumberChange"
          >
            <a-select-option
              v-for="item in historyList"
              :key="item.buildNumber"
              :value="item.buildNumber"
            >
              <div class="flex items-center justify-between gap-1.5 text-xs font-mono">
                <span>#{{ item.buildNumber }}</span>
                <Tag
                  :color="getBuildResultColor(item.result)"
                  class="text-[10px] px-1 py-0 m-0 border-0"
                >
                  {{ item.result || 'BUILT' }}
                </Tag>
              </div>
            </a-select-option>
          </a-select>

          <!-- 当前构建状态 Tag -->
          <Tag v-if="isRunning" color="processing">BUILDING</Tag>
          <Tag v-else-if="buildResult === 'SUCCESS'" color="success">SUCCESS</Tag>
          <Tag v-else-if="buildResult === 'FAILURE'" color="error">FAILURE</Tag>
          <Tag v-else-if="buildResult === 'ABORTED'" color="warning">ABORTED</Tag>
          <Tag v-else-if="buildResult" color="default">{{ buildResult }}</Tag>

          <!-- 构建参数 Popover -->
          <a-popover
            trigger="click"
            placement="bottomLeft"
          >
            <template #title>
              <div class="flex items-center justify-between text-xs font-bold gap-4">
                <span>第 #{{ buildNumber }} 期构建入参快照</span>
                <span class="text-gray-400 font-normal">触发人: {{ currentBuildTriggerUser || '系统' }}</span>
              </div>
            </template>
            <template #content>
              <div class="max-w-md max-h-72 overflow-y-auto">
                <div v-if="currentBuildParams.length === 0" class="py-4 text-center text-xs text-gray-400">
                  该期任务无自定义构建入参
                </div>
                <table v-else class="w-full text-xs border-collapse">
                  <thead>
                    <tr class="border-b border-gray-200 dark:border-gray-700 text-gray-500">
                      <th class="py-1 text-left font-semibold pr-4">参数名 (Key)</th>
                      <th class="py-1 text-left font-semibold">参数值 (Value)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="param in currentBuildParams"
                      :key="param.name"
                      class="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td class="py-1 pr-3 font-mono text-blue-600 dark:text-blue-400 font-medium">
                        {{ param.name }}
                      </td>
                      <td class="py-1 font-mono text-gray-800 dark:text-gray-200 break-all select-all">
                        {{ param.value !== undefined && param.value !== '' ? param.value : '-' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
            <Button size="small" type="dashed" class="text-xs">
              <template #icon>
                <Icon icon="ant-design:profile-outlined" />
              </template>
              构建参数 ({{ currentBuildParams.length }})
            </Button>
          </a-popover>
        </Space>

        <Space size="middle" align="center" class="shrink-0">
          <span class="text-xs text-gray-400 font-mono hidden md:inline">Offset: {{ logOffset }} bytes</span>
          <a-checkbox v-model:checked="autoScroll" class="text-xs">自动滚到底部</a-checkbox>
          <Button size="small" type="primary" ghost @click="fetchLogs(true)"> 手动刷新 </Button>
          <a-popconfirm
            v-if="isRunning || canceling"
            title="确认取消当前 Jenkins 构建任务？"
            ok-text="确认取消"
            cancel-text="暂不取消"
            @confirm="handleStopBuild"
          >
            <Button size="small" type="primary" danger :loading="canceling"> 取消构建 </Button>
          </a-popconfirm>
        </Space>
      </div>
    </template>

    <div class="bg-gray-950 p-2 h-[85vh] w-full flex flex-col box-border overflow-hidden">
      <!-- xterm 终端黑框 -->
      <div ref="terminalRef" class="w-full h-full flex-1 min-h-0"></div>
    </div>
  </BasicDrawer>
</template>

<script lang="ts" setup>
  import { ref, onBeforeUnmount, nextTick } from 'vue';
  import {
    Tag,
    Checkbox as ACheckbox,
    Popconfirm as APopconfirm,
    Space,
    Select as ASelect,
    SelectOption as ASelectOption,
    Popover as APopover,
  } from 'ant-design-vue';
  import { Button } from '@/components/Button';
  import Icon from '@/components/Icon/Icon.vue';
  import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
  import {
    getJenkinsBuildLogs,
    triggerJenkinsBuild,
    stopJenkinsBuild,
    getJenkinsJobBuildHistory,
    type JobBuildHistoryItem,
    type JobBuildParamKV,
  } from '@/api/cicd';
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

  const historyLoading = ref<boolean>(false);
  const historyList = ref<JobBuildHistoryItem[]>([]);
  const currentBuildParams = ref<JobBuildParamKV[]>([]);
  const currentBuildTriggerUser = ref<string>('');

  function getBuildResultColor(res: string) {
    const r = (res || '').toUpperCase();
    if (r === 'SUCCESS') return 'green';
    if (r === 'FAILURE' || r === 'FAILED') return 'red';
    if (r === 'BUILDING' || r === 'IN_PROGRESS') return 'blue';
    if (r === 'ABORTED') return 'orange';
    return 'default';
  }

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
      fontFamily:
        'Consolas, Menlo, Monaco, "Courier New", "PingFang SC", "Microsoft YaHei", monospace',
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
        } catch {
          // ignore
        }
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
      } catch {
        // ignore
      }
    }
  }

  async function fetchBuildHistory() {
    if (!instanceId.value || !jobName.value) return;
    historyLoading.value = true;
    try {
      const res: any = await getJenkinsJobBuildHistory({
        instanceId: instanceId.value,
        jobName: jobName.value,
        folder: folder.value,
        projectName: projectName.value,
        limit: 25,
      });
      historyList.value = res?.items || [];
      if ((!buildNumber.value || buildNumber.value <= 0) && historyList.value.length > 0) {
        buildNumber.value = historyList.value[0].buildNumber;
      }
      updateCurrentBuildMeta();
    } catch {
      // ignore
    } finally {
      historyLoading.value = false;
    }
  }

  function handleBuildNumberChange(val: number) {
    buildNumber.value = val;
    updateCurrentBuildMeta();
    fetchLogs(true);
    if (isRunning.value) {
      startTimer();
    } else {
      stopTimer();
    }
  }

  function updateCurrentBuildMeta() {
    const cur = historyList.value.find(
      (item) => Number(item.buildNumber) === Number(buildNumber.value),
    );
    if (cur) {
      currentBuildParams.value = cur.paramList || [];
      currentBuildTriggerUser.value = cur.triggerUser || '';
      buildResult.value = cur.result || '';
      isRunning.value = cur.building || cur.result === 'BUILDING';
    } else {
      currentBuildParams.value = [];
    }
  }

  const [registerDrawer] = useDrawerInner(async (data) => {
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
    historyList.value = [];
    currentBuildParams.value = [];
    currentBuildTriggerUser.value = '';
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
          branch: data.branch || '',
          customParams: data.customParams || {},
          createUserName: data.createUserName || '',
        });
        buildNumber.value = triggerRes.buildNumber || 0;
        createMessage.success('Jenkins 构建流程调度成功！');
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        if (errMsg.includes('invalid character') || errMsg.includes('解析远程任务定义发生奔溃')) {
          createMessage.error(
            `触发构建失败: 远端 Jenkins 任务 [${data.jobName}] 对象可能未在 Jenkins 中就绪或响应 404，请确认该 Job 配置是否正常。`,
          );
        } else {
          createMessage.error('触发构建失败: ' + errMsg);
        }
        loading.value = false;
        return;
      }
    }

    await fetchBuildHistory();
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
        if (res.buildNumber && (!buildNumber.value || buildNumber.value <= 0)) {
          buildNumber.value = res.buildNumber;
          updateCurrentBuildMeta();
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
    } catch {
      // ignore
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
  :deep(.ant-drawer-content) {
    background-color: #030712 !important;
  }

  :deep(.ant-drawer-body) {
    padding: 0 !important;
    background-color: #030712 !important;
    overflow: hidden !important;
    height: 100% !important;
  }

  :deep(.ant-drawer-body .scroll-container) {
    height: 100% !important;
    overflow: hidden !important;
  }

  :deep(.ant-drawer-body .scrollbar__wrap) {
    padding: 0 !important;
    margin-bottom: 0 !important;
    overflow: hidden !important;
    height: 100% !important;
  }

  :deep(.ant-drawer-body .scrollbar__view) {
    height: 100% !important;
  }

  :deep(.ant-drawer-body .scrollbar__bar) {
    display: none !important;
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
