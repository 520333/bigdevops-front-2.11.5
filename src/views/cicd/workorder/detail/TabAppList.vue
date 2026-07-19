<template>
  <div class="p-3">
    <div class="mb-3 flex items-center justify-between">
      <Alert
        type="warning"
        show-icon
        class="flex-1"
        message="说明：应用的顺序即发布时顺序，请注意业务服务依赖顺序。"
      />
      <div class="ml-3 flex gap-2">
        <Switch v-model:checked="autoRefresh" checked-children="自动刷新" un-checked-children="手动" />
        <Button size="small" type="primary" ghost @click="emit('addBaseline')">
          添加代码基线
        </Button>
      </div>
    </div>

    <!-- 应用列表主表格 -->
    <Table
      :dataSource="apps"
      :columns="appColumns"
      row-key="id"
      :expandedRowKeys="expandedKeys"
      @expand="handleExpand"
      bordered
      size="small"
      :pagination="false"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'seq'">
          <div class="flex items-center gap-1">
            <Button size="small" type="text" @click="moveApp(record, -1)"><UpOutlined /></Button>
            <span class="w-5 text-center">{{ record.seq }}</span>
            <Button size="small" type="text" @click="moveApp(record, 1)"><DownOutlined /></Button>
          </div>
        </template>
        <template v-if="column.key === 'baselineTag'">
          <Tooltip :title="record.baselineTag">
            <span class="text-xs font-mono text-gray-500">{{ record.baselineTag.slice(0, 20) }}...</span>
          </Tooltip>
        </template>
        <template v-if="column.key === 'latestTag'">
          <Tooltip :title="record.latestTag">
            <span class="text-xs font-mono text-blue-500 cursor-pointer hover:underline">{{ record.latestTag.slice(0, 20) }}...</span>
          </Tooltip>
        </template>
        <template v-if="column.key === 'execStatus'">
          <Tag :color="statusColor[record.execStatus]">{{ record.execStatusText }}</Tag>
        </template>
        <template v-if="column.key === 'action'">
          <Space>
            <a class="text-xs">一键部署</a>
            <Divider type="vertical" />
            <a class="text-xs">修改tag</a>
            <Divider type="vertical" />
            <a class="text-xs text-green-600">完成</a>
            <Divider type="vertical" />
            <a class="text-xs text-gray-400">更多</a>
          </Space>
        </template>
      </template>

      <!-- 展开行：实例列表 -->
      <template #expandedRowRender="{ record }">
        <Table
          :dataSource="record.instances"
          :columns="instanceColumns"
          row-key="id"
          :pagination="false"
          size="small"
          class="bg-blue-50 dark:bg-blue-900/10"
        >
          <template #bodyCell="{ column: col, record: inst }">
            <template v-if="col.key === 'deployStatus'">
              <Tag :color="deployStatusColor[inst.deployStatus]">{{ inst.deployStatusText }}</Tag>
            </template>
            <template v-if="col.key === 'progress'">
              <div class="flex items-center gap-1">
                <template v-for="(step, idx) in progressSteps" :key="step.key">
                  <div class="flex flex-col items-center">
                    <div
                      :class="[
                        'w-3 h-3 rounded-full border-2 flex items-center justify-center',
                        idx < inst.currentStep ? 'bg-green-500 border-green-500' :
                        idx === inst.currentStep ? 'bg-blue-500 border-blue-500 animate-pulse' :
                        'bg-gray-200 border-gray-300 dark:bg-gray-600'
                      ]"
                    />
                    <span class="text-xs mt-0.5 whitespace-nowrap" :class="idx <= inst.currentStep ? 'text-green-600' : 'text-gray-400'">
                      {{ step.label }}
                    </span>
                  </div>
                  <div v-if="idx < progressSteps.length - 1" :class="['h-0.5 w-8 mb-3', idx < inst.currentStep ? 'bg-green-400' : 'bg-gray-200']" />
                </template>
              </div>
            </template>
            <template v-if="col.key === 'instAction'">
              <Space>
                <a class="text-xs text-blue-500" @click="viewLog(inst)">执行日志</a>
                <Divider type="vertical" />
                <a class="text-xs">构建部署</a>
                <Divider type="vertical" />
                <a class="text-xs text-orange-500">手工检查</a>
              </Space>
            </template>
          </template>
        </Table>
      </template>
    </Table>

    <!-- 底部保存按钮 -->
    <div class="mt-3 text-right">
      <Button type="primary" @click="message.success('已保存发布顺序')">保存发布顺序</Button>
    </div>

    <!-- 日志抽屉 -->
    <Drawer
      v-model:open="logDrawerVisible"
      title="执行日志"
      placement="right"
      width="780"
      :destroyOnClose="true"
    >
      <div class="bg-gray-900 rounded-lg p-4 font-mono text-xs text-green-400 h-[calc(100vh-120px)] overflow-auto" ref="logContainer">
        <div v-for="(line, i) in logLines" :key="i" class="leading-5">{{ line }}</div>
        <div v-if="logLoading" class="flex items-center gap-2 text-yellow-400 mt-2">
          <span class="animate-pulse">▶</span>
          <span>正在加载日志...</span>
        </div>
      </div>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
  import { ref, nextTick } from 'vue';
  import { message, Table, Button, Tag, Space, Divider, Alert, Switch, Tooltip, Drawer } from 'ant-design-vue';
  import { UpOutlined, DownOutlined } from '@ant-design/icons-vue';

  const props = defineProps<{ apps: any[] }>();
  const emit = defineEmits(['addBaseline']);

  const autoRefresh = ref(false);
  const expandedKeys = ref<number[]>([]);
  const logDrawerVisible = ref(false);
  const logLines = ref<string[]>([]);
  const logLoading = ref(false);
  const logContainer = ref<HTMLElement | null>(null);

  const progressSteps = [
    { key: 'offline', label: '下线' },
    { key: 'deploying', label: '部署中' },
    { key: 'online', label: '上线' },
    { key: 'health', label: '健康检查' },
  ];

  const statusColor: Record<string, string> = {
    success: 'success', pending: 'default', running: 'processing', failed: 'error',
  };
  const deployStatusColor: Record<string, string> = {
    success: 'success', pending: 'default', running: 'processing', failed: 'error',
  };

  const appColumns = [
    { title: '序号', key: 'seq', width: 80 },
    { title: '应用名称', dataIndex: 'appName', key: 'appName', width: 160 },
    { title: '应用类型', dataIndex: 'appType', key: 'appType', width: 100 },
    { title: '测试完成基线tag', dataIndex: 'baselineTag', key: 'baselineTag', width: 160 },
    { title: '最新tag', dataIndex: 'latestTag', key: 'latestTag', width: 160 },
    { title: '迭代应用', dataIndex: 'iterApp', key: 'iterApp', ellipsis: true },
    { title: '执行状态', key: 'execStatus', width: 90 },
    { title: '操作', key: 'action', width: 200, fixed: 'right' },
  ];

  const instanceColumns = [
    { title: '部署类型', dataIndex: 'clusterType', key: 'clusterType', width: 90 },
    { title: '环境类型', dataIndex: 'envType', key: 'envType', width: 90 },
    { title: 'profile', dataIndex: 'profile', key: 'profile', width: 100 },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip', width: 130 },
    { title: '发布状态', key: 'deployStatus', width: 90 },
    { title: '进度监控', key: 'progress', width: 340 },
    { title: '操作', key: 'instAction', width: 180, fixed: 'right' },
  ];

  function handleExpand(expanded: boolean, record: any) {
    if (expanded) {
      expandedKeys.value = [...expandedKeys.value, record.id];
    } else {
      expandedKeys.value = expandedKeys.value.filter((k) => k !== record.id);
    }
  }

  function moveApp(record: any, dir: number) {
    message.info(`调整应用顺序：${record.appName}`);
  }

  function viewLog(inst: any) {
    logDrawerVisible.value = true;
    logLoading.value = true;
    logLines.value = [];
    const fullLog = `[2025-03-10 14:20:01] 开始部署 ${inst.ip}
[2025-03-10 14:20:02] 执行健康检查下线...
[2025-03-10 14:20:05] 下线成功，开始部署新镜像
[2025-03-10 14:20:06] docker pull registry.cn/devops/user-mr-data:latest
[2025-03-10 14:20:15] 镜像拉取完成
[2025-03-10 14:20:16] 停止旧容器 user-mr-data-pre
[2025-03-10 14:20:18] 启动新容器...
[2025-03-10 14:20:20] 容器启动成功，等待服务就绪
[2025-03-10 14:20:25] GET /actuator/health → 200 {"status":"UP"}
[2025-03-10 14:20:25] 注册上线到服务注册中心
[2025-03-10 14:20:26] ✅ 部署完成！用时 25 秒`.split('\n');

    let i = 0;
    const timer = setInterval(() => {
      if (i < fullLog.length) {
        logLines.value.push(fullLog[i++]);
        nextTick(() => {
          if (logContainer.value) logContainer.value.scrollTop = logContainer.value.scrollHeight;
        });
      } else {
        clearInterval(timer);
        logLoading.value = false;
      }
    }, 120);
  }
</script>
