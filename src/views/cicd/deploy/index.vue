<template>
  <PageWrapper dense contentFullHeight contentClass="flex">
    <BasicTable @register="registerTable" class="w-full" :searchInfo="searchInfo">
      <!-- Toolbar extra button -->
      <template #toolbar>
        <Button type="primary" @click="handleCreate">创建部署单</Button>
      </template>

      <!-- Custom body cell renders -->
      <template #bodyCell="{ column, record }">
        <!-- Environment Tag -->
        <template v-if="column.key === 'envName'">
          <Tag :color="envColorMap[record.envKey] || 'default'">{{ record.envName }}</Tag>
        </template>

        <!-- Status Badge -->
        <template v-if="column.key === 'statusText'">
          <Badge :status="statusBadgeMap[record.status] || 'default'" :text="record.statusText" />
        </template>

        <!-- Progress Steps -->
        <template v-if="column.key === 'progress'">
          <div class="flex items-center gap-1 py-1">
            <template v-for="(step, idx) in record.steps" :key="step">
              <div class="flex flex-col items-center">
                <div
                  :class="[
                    'w-2.5 h-2.5 rounded-full border flex items-center justify-center',
                    idx < record.currentStep ? 'bg-green-500 border-green-500' :
                    idx === record.currentStep && record.status === 'releasing' ? 'bg-blue-500 border-blue-500 animate-pulse' :
                    idx === record.currentStep && record.status === 'failed' ? 'bg-red-500 border-red-500' :
                    idx <= record.currentStep && record.status === 'success' ? 'bg-green-500 border-green-500' :
                    'bg-gray-200 border-gray-300 dark:bg-gray-600'
                  ]"
                />
                <span
                  class="text-[10px] scale-90 mt-0.5 whitespace-nowrap"
                  :class="[
                    idx < record.currentStep ? 'text-green-600 font-medium' :
                    idx === record.currentStep && record.status === 'releasing' ? 'text-blue-500 font-medium' :
                    idx === record.currentStep && record.status === 'failed' ? 'text-red-500 font-medium' :
                    idx <= record.currentStep && record.status === 'success' ? 'text-green-600 font-medium' :
                    'text-gray-400'
                  ]"
                >
                  {{ step }}
                </span>
              </div>
              <div
                v-if="idx < record.steps.length - 1"
                :class="[
                  'h-[1.5px] w-6 mb-3 transition-colors duration-500',
                  idx < record.currentStep ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'
                ]"
              />
            </template>
          </div>
        </template>

        <!-- Actions -->
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                label: '详情',
                onClick: handleView.bind(null, record),
              },
              {
                label: '一键部署',
                show: record.status === 'pending' || record.status === 'failed',
                onClick: startDeployment.bind(null, record),
              },
              {
                label: '回滚',
                show: record.status === 'success',
                color: 'warning',
                popConfirm: {
                  title: '是否确认执行回滚？',
                  placement: 'left',
                  confirm: startRollback.bind(null, record),
                },
              },
              {
                label: '日志',
                onClick: viewLog.bind(null, record),
              },
              {
                label: '删除',
                color: 'error',
                popConfirm: {
                  title: '是否确认删除该部署单',
                  placement: 'left',
                  confirm: handleDelete.bind(null, record),
                },
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>

    <DeployModal @register="registerModal" @success="handleSuccess" />

    <!-- Log Drawer -->
    <Drawer
      v-model:open="logDrawer.visible"
      :title="logDrawer.title"
      placement="right"
      width="780"
      :destroyOnClose="true"
    >
      <div class="bg-gray-900 rounded-lg p-4 font-mono text-xs text-green-400 h-[calc(100vh-120px)] overflow-auto" ref="logContainer">
        <div v-for="(line, i) in logLines" :key="i" class="leading-5">{{ line }}</div>
        <div v-if="logDrawer.loading" class="flex items-center gap-2 text-yellow-400 mt-2">
          <LoadingOutlined spin />
          <span>部署执行日志同步中...</span>
        </div>
      </div>
    </Drawer>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { ref, reactive, nextTick } from 'vue';
  import { Button, Tag, Badge, Drawer } from 'ant-design-vue';
  import { LoadingOutlined } from '@ant-design/icons-vue';
  import { BasicTable, useTable, TableAction } from '@/components/Table';
  import { getDeployList, deleteDeployList } from '@/api/cicd/cicd.mock';
  import { PageWrapper } from '@/components/Page';
  import DeployModal from './DeployModal.vue';
  import { useModal } from '@/components/Modal';
  import { useMessage } from '@/hooks/web/useMessage';
  import { useRouter } from 'vue-router';

  const router = useRouter();
  const [registerModal, { openModal }] = useModal();
  const searchInfo = reactive<Recordable>({});

  const envColorMap: Record<string, string> = {
    dev: 'green',
    test: 'blue',
    pre: 'orange',
    prod: 'red',
  };

  const statusBadgeMap: Record<string, any> = {
    pending: 'default',
    releasing: 'processing',
    success: 'success',
    failed: 'error',
    rollback: 'warning',
  };

  const [registerTable, { reload }] = useTable({
    title: '发布部署单',
    api: getDeployList,
    rowKey: 'id',
    columns: [
      { title: '发布单号', dataIndex: 'deployNo', key: 'deployNo', width: 140 },
      { title: '关联工单', dataIndex: 'orderNo', key: 'orderNo', width: 140 },
      { title: '应用名称', dataIndex: 'appName', key: 'appName', width: 140 },
      { title: '部署环境', dataIndex: 'envName', key: 'envName', width: 110 },
      { title: '发布版本', dataIndex: 'version', key: 'version', width: 150 },
      { title: '发布状态', dataIndex: 'statusText', key: 'statusText', width: 100 },
      { title: '发布进度', key: 'progress', width: 280 },
      { title: '耗时', dataIndex: 'duration', key: 'duration', width: 80 },
      { title: '执行人', dataIndex: 'operator', key: 'operator', width: 100 },
      { title: '发布时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
      { title: '操作', key: 'action', width: 240, fixed: 'right' },
    ],
    formConfig: {
      labelWidth: 120,
      schemas: [
        {
          field: 'appName',
          label: '应用名称',
          component: 'Input',
          colProps: { span: 8 },
        },
        {
          field: 'envKey',
          label: '部署环境',
          component: 'Select',
          componentProps: {
            options: [
              { label: '开发环境', value: 'dev' },
              { label: '测试环境', value: 'test' },
              { label: '预生产环境', value: 'pre' },
              { label: '生产环境', value: 'prod' },
            ],
          },
          colProps: { span: 8 },
        },
      ],
      autoSubmitOnEnter: true,
    },
    useSearchForm: true,
    showTableSetting: true,
    bordered: true,
    canResize: false,
  });

  const logDrawer = ref({
    visible: false,
    title: '部署日志',
    loading: false,
  });
  const logLines = ref<string[]>([]);
  const logContainer = ref<HTMLElement | null>(null);

  function handleCreate() {
    openModal(true, {
      isUpdate: false,
    });
  }

  function handleSuccess() {
    reload();
  }

  function handleView(record: Recordable) {
    // Navigate to the release order detail
    router.push(`/cicd/workorder/detail/${record.id || 1}`);
  }

  async function handleDelete(record: Recordable) {
    const { createMessage } = useMessage();
    try {
      await deleteDeployList(record.id);
      createMessage.success('发布单删除成功');
      reload();
    } catch {
      createMessage.error('发布单删除失败');
    }
  }

  // Active steps simulation
  function startDeployment(record: Recordable) {
    record.status = 'releasing';
    record.statusText = '部署中';
    record.currentStep = 0;
    record.duration = '0s';

    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 3;
      record.duration = `${elapsed}s`;
      if (record.currentStep < 3) {
        record.currentStep += 1;
      } else {
        clearInterval(interval);
        record.status = 'success';
        record.statusText = '成功';
        const { createMessage } = useMessage();
        createMessage.success(`应用 ${record.appName} 部署成功！`);
      }
    }, 3000);
  }

  function startRollback(record: Recordable) {
    const { createMessage } = useMessage();
    record.status = 'releasing';
    record.statusText = '回滚中';
    record.currentStep = 1; // back to deploying

    setTimeout(() => {
      record.status = 'failed';
      record.statusText = '已回滚';
      record.currentStep = 0; // offlined
      createMessage.warning(`应用 ${record.appName} 已成功回滚至前一版本`);
    }, 4000);
  }

  function viewLog(record: Recordable) {
    logDrawer.value.visible = true;
    logDrawer.value.title = `发布日志 - ${record.deployNo} (${record.appName})`;
    logDrawer.value.loading = true;
    logLines.value = [];

    const fullLog = `[2025-03-10 14:20:00] 开始部署单 ${record.deployNo} (${record.appName})
[2025-03-10 14:20:01] 正在准备部署镜像: registry.cn/devops/${record.appName}:${record.version}
[2025-03-10 14:20:02] 连接至目标 Kubernetes 集群环境...
[2025-03-10 14:20:05] [Step 1] 服务准备下线，停止容器流量负载
[2025-03-10 14:20:08] 流量停止成功。
[2025-03-10 14:20:09] [Step 2] 拉取镜像中...
[2025-03-10 14:20:14] 镜像拉取完成，开始滚动替换容器
[2025-03-10 14:20:18] [Step 3] 启动容器实例并等待就绪健康检测
[2025-03-10 14:20:22] 容器探测 HTTP GET /actuator/health...
[2025-03-10 14:20:24] 探测响应 200 OK {"status":"UP"}
[2025-03-10 14:20:25] [Step 4] 服务上线，流量切换生效
[2025-03-10 14:20:25] 注册节点到网关路由
[2025-03-10 14:20:26] ✅ 部署完成！总耗时 ${record.duration || '25s'}`.split('\n');

    let i = 0;
    const timer = setInterval(() => {
      if (i < fullLog.length) {
        logLines.value.push(fullLog[i++]);
        nextTick(() => {
          if (logContainer.value) logContainer.value.scrollTop = logContainer.value.scrollHeight;
        });
      } else {
        clearInterval(timer);
        logDrawer.value.loading = false;
      }
    }, 200);
  }
</script>
