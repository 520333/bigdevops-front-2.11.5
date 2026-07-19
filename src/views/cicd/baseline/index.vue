<template>
  <PageWrapper title="服务基线" content="管理每日构建，触发 Jenkins 构建并实时查看日志">
    <!-- 搜索栏 -->
    <div class="bg-white dark:bg-dark-bg rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-center">
      <Input
        v-model:value="searchKeyword"
        placeholder="搜索服务名"
        style="width: 200px"
        allow-clear
        @pressEnter="loadList"
      />
      <Select v-model:value="searchLang" placeholder="语言类型" style="width: 130px" allow-clear>
        <SelectOption value="Java">Java</SelectOption>
        <SelectOption value="Vue/TS">Vue/TS</SelectOption>
        <SelectOption value="Go">Go</SelectOption>
      </Select>
      <Button type="primary" @click="loadList">查询</Button>
      <Button @click="() => { searchKeyword = ''; searchLang = undefined; loadList(); }">重置</Button>
    </div>

    <!-- 基线列表 -->
    <div class="bg-white dark:bg-dark-bg rounded-lg">
      <Table
        :dataSource="list"
        :columns="columns"
        :loading="loading"
        row-key="id"
        bordered
        :pagination="{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'latestBuildStatus'">
            <div class="flex items-center gap-2">
              <span
                :class="[
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                  record.latestBuildStatus === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                  record.latestBuildStatus === 'FAILURE' ? 'bg-red-100 text-red-700' :
                  record.latestBuildStatus === 'BUILDING' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-500'
                ]"
              >
                <span v-if="record.latestBuildStatus === 'BUILDING'" class="animate-pulse">●</span>
                <span v-else>●</span>
                {{ record.latestBuildStatus }}
              </span>
              <span class="text-xs text-gray-400">#{{ record.latestBuildNo }}</span>
            </div>
          </template>
          <template v-if="column.key === 'latestTag'">
            <Tooltip :title="record.latestTag">
              <span class="font-mono text-xs text-blue-500">{{ record.latestTag.slice(0, 28) }}...</span>
            </Tooltip>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button
                size="small"
                type="primary"
                :loading="buildingMap[record.id]"
                @click="handleBuild(record)"
              >
                触发构建
              </Button>
              <Button size="small" @click="viewBuildLog(record)">构建日志</Button>
              <Button size="small" @click="viewStartupLog(record)">启动日志</Button>
            </Space>
          </template>
        </template>
      </Table>
    </div>

    <!-- 日志抽屉 -->
    <Drawer
      v-model:open="logDrawer.visible"
      :title="logDrawer.title"
      placement="right"
      width="820"
      :destroyOnClose="true"
    >
      <template #extra>
        <Space>
          <Switch
            v-model:checked="logDrawer.autoScroll"
            checked-children="自动滚动"
            un-checked-children="已锁定"
            size="small"
          />
          <Button size="small" @click="clearLog">清空</Button>
          <Button size="small" type="primary" ghost :loading="logDrawer.loading" @click="reloadLog">
            刷新
          </Button>
        </Space>
      </template>

      <!-- 日志头部信息 -->
      <div v-if="logDrawer.app" class="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg grid grid-cols-3 gap-2 text-xs">
        <div><span class="text-gray-400">服务名：</span><span class="font-medium">{{ logDrawer.app.appName }}</span></div>
        <div><span class="text-gray-400">Jenkins Job：</span><span class="font-mono">{{ logDrawer.app.jenkinsJob }}</span></div>
        <div><span class="text-gray-400">构建号：</span><span class="font-medium">#{{ logDrawer.app.latestBuildNo }}</span></div>
        <div><span class="text-gray-400">分支：</span><span class="font-mono text-blue-500">{{ logDrawer.app.branch }}</span></div>
        <div><span class="text-gray-400">最后构建：</span><span>{{ logDrawer.app.lastBuildTime }}</span></div>
        <div>
          <span class="text-gray-400">状态：</span>
          <Tag :color="logDrawer.app.latestBuildStatus === 'SUCCESS' ? 'success' : logDrawer.app.latestBuildStatus === 'FAILURE' ? 'error' : 'processing'" class="text-xs">
            {{ logDrawer.app.latestBuildStatus }}
          </Tag>
        </div>
      </div>

      <!-- 日志区 -->
      <div
        class="bg-gray-900 rounded-lg p-4 font-mono text-xs text-green-400 overflow-auto"
        :style="{ height: 'calc(100vh - 260px)' }"
        ref="logContainer"
        @scroll="handleLogScroll"
      >
        <div v-if="logDrawer.loading && !logLines.length" class="flex items-center justify-center h-32 text-gray-500">
          <Spin tip="加载日志中..." />
        </div>
        <div v-for="(line, i) in logLines" :key="i" :class="['leading-5', getLogLineClass(line)]">
          {{ line }}
        </div>
        <div v-if="logDrawer.loading && logLines.length" class="text-yellow-400 mt-2 flex items-center gap-2">
          <span class="animate-pulse">▶</span>
          <span>实时输出中...</span>
        </div>
        <div v-if="!logDrawer.loading && !logLines.length" class="text-gray-600 text-center py-8">
          暂无日志
        </div>
      </div>
    </Drawer>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { ref, nextTick, onBeforeUnmount } from 'vue';
  import { message, Table, Input, Select, Button, Space, Tooltip, Tag, Drawer, Switch, Spin } from 'ant-design-vue';
  import { PageWrapper } from '@/components/Page';
  import { getBaselineList, triggerJenkinsBuild, generateBuildLog } from '@/api/cicd/cicd.mock';

  const SelectOption = Select.Option;

  // Jenkins 连接配置（对接时使用）
  // const JENKINS_URL = 'http://192.168.50.100:8081';
  // const JENKINS_TOKEN = '115c12aeda19134e183500da3f00bcf843';

  const searchKeyword = ref('');
  const searchLang = ref<string | undefined>(undefined);
  const loading = ref(false);
  const list = ref<any[]>([]);
  const buildingMap = ref<Record<number, boolean>>({});
  const logContainer = ref<HTMLElement | null>(null);

  const logDrawer = ref({
    visible: false,
    title: '构建日志',
    loading: false,
    app: null as any,
    autoScroll: true,
    type: 'build' as 'build' | 'startup',
  });

  const logLines = ref<string[]>([]);
  let streamTimer: ReturnType<typeof setInterval> | null = null;

  const columns = [
    { title: '服务名', dataIndex: 'appName', key: 'appName', width: 180 },
    { title: '语言/类型', dataIndex: 'lang', key: 'lang', width: 100 },
    { title: '最近构建状态', key: 'latestBuildStatus', width: 160 },
    { title: '最新 Tag', key: 'latestTag', ellipsis: true },
    { title: '分支', dataIndex: 'branch', key: 'branch', width: 90 },
    { title: '最后构建时间', dataIndex: 'lastBuildTime', key: 'lastBuildTime', width: 170 },
    { title: '操作', key: 'action', width: 250, fixed: 'right' },
  ];

  async function loadList() {
    loading.value = true;
    try {
      const res = await getBaselineList();
      let items = res.items;
      if (searchKeyword.value) items = items.filter((i: any) => i.appName.includes(searchKeyword.value));
      if (searchLang.value) items = items.filter((i: any) => i.lang === searchLang.value);
      list.value = items;
    } finally {
      loading.value = false;
    }
  }

  async function handleBuild(record: any) {
    buildingMap.value[record.id] = true;
    try {
      await triggerJenkinsBuild({ appName: record.appName, jenkinsJob: record.jenkinsJob });
      message.success(`${record.appName} 构建已触发，Jenkins Job: ${record.jenkinsJob}`);
      record.latestBuildStatus = 'BUILDING';
      setTimeout(() => {
        record.latestBuildStatus = 'SUCCESS';
        record.latestBuildNo += 1;
        record.lastBuildTime = new Date().toLocaleString('zh-CN');
        buildingMap.value[record.id] = false;
      }, 5000);
    } catch {
      buildingMap.value[record.id] = false;
      message.error('触发构建失败');
    }
  }

  function viewBuildLog(record: any) {
    logDrawer.value = {
      ...logDrawer.value,
      visible: true,
      title: `构建日志 - ${record.appName} #${record.latestBuildNo}`,
      loading: true,
      app: record,
      type: 'build',
    };
    logLines.value = [];
    streamLog(generateBuildLog(record.appName, record.latestBuildNo));
  }

  function viewStartupLog(record: any) {
    logDrawer.value = {
      ...logDrawer.value,
      visible: true,
      title: `启动日志 - ${record.appName}`,
      loading: true,
      app: record,
      type: 'startup',
    };
    logLines.value = [];
    const startupLog = `  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \\ \\ \\ \\
( ( )\\___ | '_ | '_| | '_ \\/ _\` | \\ \\ \\ \\
 \\\\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::               (v3.2.1)

2025-03-10 14:20:20.001  INFO --- [main] ${record.appName}: Starting ${record.appName}...
2025-03-10 14:20:20.120  INFO --- [main] Config: Loading config from nacos: pre-env/${record.appName}.yaml
2025-03-10 14:20:20.350  INFO --- [main] DataSource: Initializing connection pool to 10.0.3.30:3306
2025-03-10 14:20:20.890  INFO --- [main] Redis: Connected to 10.0.3.20:6379
2025-03-10 14:20:21.200  INFO --- [main] Nacos: Registered service: ${record.appName} -> 172.21.0.68:8080
2025-03-10 14:20:21.450  INFO --- [main] Undertow: Started on port(s): 8080 (http)
2025-03-10 14:20:21.500  INFO --- [main] ${record.appName}: Started in 1.499 seconds (process running for 2.1)
2025-03-10 14:20:22.000  INFO --- [health] Actuator: GET /actuator/health -> {"status":"UP","components":{"db":{"status":"UP"},"redis":{"status":"UP"}}}`;
    streamLog(startupLog);
  }

  function streamLog(fullLog: string) {
    clearStreamTimer();
    const lines = fullLog.split('\n');
    let i = 0;
    logDrawer.value.loading = true;
    streamTimer = setInterval(() => {
      if (i < lines.length) {
        logLines.value.push(lines[i++]);
        if (logDrawer.value.autoScroll) {
          nextTick(() => {
            if (logContainer.value) logContainer.value.scrollTop = logContainer.value.scrollHeight;
          });
        }
      } else {
        clearStreamTimer();
        logDrawer.value.loading = false;
      }
    }, 80);
  }

  function clearStreamTimer() {
    if (streamTimer) { clearInterval(streamTimer); streamTimer = null; }
  }

  function reloadLog() {
    const app = logDrawer.value.app;
    if (!app) return;
    logLines.value = [];
    if (logDrawer.value.type === 'build') viewBuildLog(app);
    else viewStartupLog(app);
  }

  function clearLog() {
    clearStreamTimer();
    logLines.value = [];
    logDrawer.value.loading = false;
  }

  function handleLogScroll() {
    const el = logContainer.value;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    logDrawer.value.autoScroll = isAtBottom;
  }

  function getLogLineClass(line: string): string {
    if (line.includes('ERROR') || line.includes('FAILURE') || line.includes('FAILED')) return 'text-red-400';
    if (line.includes('WARN')) return 'text-yellow-400';
    if (line.includes('SUCCESS') || line.includes('✅') || line.includes('Finished: SUCCESS')) return 'text-green-300 font-semibold';
    if (line.includes('[Pipeline]') || line.includes('stage(')) return 'text-blue-300';
    if (line.startsWith('  .   ____') || line.startsWith(' /\\')) return 'text-cyan-400 font-bold';
    return '';
  }

  onBeforeUnmount(clearStreamTimer);
  loadList();
</script>