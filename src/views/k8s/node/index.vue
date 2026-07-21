<template>
  <PageWrapper dense contentFullHeight fixedHeight class="p-4">
    <div class="flex h-full gap-3">
      <!-- 左侧集群侧边栏 -->
      <div
        v-show="showSidebar"
        class="w-64 bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm h-full flex flex-col border border-gray-100 dark:border-gray-700 transition-all duration-300 flex-shrink-0"
      >
        <!-- 头部标题与操控按钮 -->
        <div class="flex justify-between items-center mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
          <div class="flex items-center font-bold text-base text-gray-800 dark:text-gray-200 truncate">
            <ClusterOutlined class="mr-2 text-primary" />
            <span>K8s 集群列表</span>
          </div>
          <div class="flex items-center space-x-1">
            <a-button type="text" size="small" title="刷新列表" @click="fetchClusters">
              <template #icon><ReloadOutlined /></template>
            </a-button>
            <a-button type="text" size="small" title="隐藏侧边栏" @click="showSidebar = false">
              <template #icon><MenuFoldOutlined /></template>
            </a-button>
          </div>
        </div>

        <!-- 集群菜单 -->
        <a-spin :spinning="loading">
          <a-menu
            v-if="clusterList.length > 0"
            v-model:selectedKeys="selectedKeys"
            mode="inline"
            class="border-r-0 flex-1 overflow-y-auto"
            @select="handleClusterSelect"
          >
            <a-menu-item v-for="item in clusterList" :key="item.value">
              <template #icon>
                <CloudServerOutlined />
              </template>
              <span>{{ item.label }}</span>
            </a-menu-item>
          </a-menu>
          <a-empty v-else description="暂无集群数据" class="mt-8" />
        </a-spin>
      </div>

      <!-- 右侧 Node 节点表格数据 -->
      <div class="flex-1 overflow-hidden bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
        <BasicTable @register="registerTable">
          <template #toolbar>
            <a-button @click="showSidebar = !showSidebar">
              <template #icon>
                <MenuUnfoldOutlined v-if="!showSidebar" />
                <MenuFoldOutlined v-else />
              </template>
              {{ showSidebar ? '隐藏集群菜单' : '显示集群菜单' }}
            </a-button>

            <!-- 批量允许调度 -->
            <a-button
              type="primary"
              ghost
              :disabled="!hasSelected"
              @click="handleBatchSchedule(true)"
            >
              <template #icon><CheckCircleOutlined /></template>
              批量允许调度
            </a-button>

            <!-- 批量停止调度 -->
            <a-button
              danger
              ghost
              :disabled="!hasSelected"
              @click="handleBatchSchedule(false)"
            >
              <template #icon><StopOutlined /></template>
              批量停止调度
            </a-button>

            <!-- 批量修改标签 -->
            <a-button
              :disabled="!hasSelected"
              @click="handleBatchLabel"
            >
              <template #icon><TagsOutlined /></template>
              批量修改标签
            </a-button>

            <!-- 批量修改污点 -->
            <a-button
              :disabled="!hasSelected"
              @click="handleBatchTaint"
            >
              <template #icon><WarningOutlined /></template>
              批量修改污点
            </a-button>

            <!-- 批量驱逐节点 -->
            <a-button
              danger
              :disabled="!hasSelected"
              @click="handleBatchDrain"
            >
              <template #icon><DisconnectOutlined /></template>
              批量驱逐节点
            </a-button>

            <a-button type="primary" @click="handleReload">
              刷新节点
            </a-button>
          </template>

          <template #bodyCell="{ column, record }">
            <!-- 🚀 点击 Pod 数量 Tag 弹出单独的完整 Pod 列表弹窗 -->
            <template v-if="column.key === 'podNum'">
              <div @click.stop="handleOpenPodModal(record)">
                <a-tag color="processing" class="cursor-pointer hover:opacity-80">
                  {{ record.podNum || 0 }} 个
                </a-tag>
              </div>
            </template>

            <template v-else-if="column.key === 'action'">
              <div @click.stop>
                <TableAction
                  :actions="[
                    {
                      icon: 'ant-design:eye-outlined',
                      tooltip: '查看节点详情',
                      onClick: handleDetail.bind(null, record, 'conditions'),
                    },
                    {
                      icon: 'ant-design:tags-outlined',
                      tooltip: '修改节点标签',
                      onClick: handleSingleLabel.bind(null, record),
                    },
                    {
                      icon: 'ant-design:warning-outlined',
                      tooltip: '修改节点污点',
                      onClick: handleSingleTaint.bind(null, record),
                    },
                    {
                      icon: record.scheduleEnable ? 'ant-design:stop-outlined' : 'ant-design:check-circle-outlined',
                      color: record.scheduleEnable ? 'warning' : 'success',
                      tooltip: record.scheduleEnable ? '停止调度 (Cordon)' : '允许调度 (Uncordon)',
                      popConfirm: {
                        title: `确定要${record.scheduleEnable ? '停止调度 (Cordon)' : '允许调度 (Uncordon)'}节点 [${record.name}] 吗？`,
                        confirm: handleSingleSchedule.bind(null, record),
                      },
                    },
                    {
                      icon: 'ant-design:disconnect-outlined',
                      color: 'error',
                      tooltip: '驱逐节点 (Drain Pods)',
                      popConfirm: {
                        title: `确定要驱逐节点 [${record.name}] 上的所有应用 Pod 吗？(将设为禁止调度并安全迁移 Pod)`,
                        confirm: handleSingleDrain.bind(null, record),
                      },
                    },
                  ]"
                />
              </div>
            </template>
          </template>
        </BasicTable>
      </div>
    </div>

    <NodeDetailDrawer @register="registerDrawer" />
    <NodeLabelModal @register="registerLabelModal" @success="handleReload" />
    <NodeTaintModal @register="registerTaintModal" @success="handleReload" />
    <NodePodListModal @register="registerPodModal" />
  </PageWrapper>
</template>

<script lang="ts">
  import { defineComponent, ref, reactive, computed, onMounted } from 'vue';
  import { Menu as AMenu, MenuItem as AMenuItem, Spin as ASpin, Empty as AEmpty, Button as AButton, Tag as ATag } from 'ant-design-vue';
  import {
    ClusterOutlined,
    CloudServerOutlined,
    ReloadOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    CheckCircleOutlined,
    StopOutlined,
    TagsOutlined,
    WarningOutlined,
    DisconnectOutlined,
  } from '@ant-design/icons-vue';
  import { PageWrapper } from '@/components/Page';
  import { BasicTable, useTable, TableAction } from '@/components/Table';
  import { useDrawer } from '@/components/Drawer';
  import { useModal } from '@/components/Modal';
  import { useMessage } from '@/hooks/web/useMessage';
  import { getK8sNodeList, getClusterForSelect, scheduleEnableSwitchK8sNodesOne, drainK8sNodes } from '@/api/demo/system';
  import { columns, searchFormSchema } from './node.data';
  import NodeDetailDrawer from './NodeDetailDrawer.vue';
  import NodeLabelModal from './NodeLabelModal.vue';
  import NodeTaintModal from './NodeTaintModal.vue';
  import NodePodListModal from './NodePodListModal.vue';

  export default defineComponent({
    name: 'K8sNodeManagement',
    components: {
      PageWrapper,
      BasicTable,
      TableAction,
      NodeDetailDrawer,
      NodeLabelModal,
      NodeTaintModal,
      NodePodListModal,
      ClusterOutlined,
      CloudServerOutlined,
      ReloadOutlined,
      MenuFoldOutlined,
      MenuUnfoldOutlined,
      CheckCircleOutlined,
      StopOutlined,
      TagsOutlined,
      WarningOutlined,
      DisconnectOutlined,
      AMenu,
      AMenuItem,
      ASpin,
      AEmpty,
      AButton,
      ATag,
    },
    setup() {
      const showSidebar = ref<boolean>(true);
      const loading = ref<boolean>(false);
      const clusterList = ref<Array<{ label: string; value: string }>>([]);
      const selectedKeys = ref<string[]>([]);
      const checkedKeys = ref<string[]>([]);
      const searchInfo = reactive<Recordable>({ cluster: '' });

      const { createMessage, createConfirm } = useMessage();
      const [registerDrawer, { openDrawer }] = useDrawer();
      const [registerLabelModal, { openModal: openLabelModal }] = useModal();
      const [registerTaintModal, { openModal: openTaintModal }] = useModal();
      const [registerPodModal, { openModal: openPodModal }] = useModal();

      const [registerTable, { reload, getDataSource, clearSelectedRowKeys }] = useTable({
        title: 'Node 节点列表',
        api: getK8sNodeList,
        searchInfo,
        columns,
        immediate: false,
        clickToRowSelect: true,
        rowKey: 'name',
        rowSelection: {
          type: 'checkbox',
          onChange: (keys: (string | number)[]) => {
            checkedKeys.value = keys as string[];
          },
        },
        formConfig: {
          labelWidth: 90,
          schemas: searchFormSchema,
          autoSubmitOnEnter: true,
        },
        useSearchForm: true,
        showTableSetting: true,
        bordered: true,
        showIndexColumn: true,
        actionColumn: {
          width: 180,
          title: '操作',
          dataIndex: 'action',
        },
      });

      const hasSelected = computed(() => checkedKeys.value.length > 0);

      // 拉取集群菜单列表
      async function fetchClusters() {
        loading.value = true;
        try {
          const res = await getClusterForSelect();
          const list = Array.isArray(res) ? res : res?.items || res?.result || [];
          clusterList.value = list.map((item: any) => ({
            label: item.label || item.nameZh || item.name,
            value: item.value || item.name,
          }));

          if (clusterList.value.length > 0 && (!selectedKeys.value.length || !selectedKeys.value[0])) {
            const firstValue = clusterList.value[0].value;
            selectedKeys.value = [firstValue];
            searchInfo.cluster = firstValue;
            reload();
          }
        } catch (e) {
          console.error('获取集群选择列表失败:', e);
        } finally {
          loading.value = false;
        }
      }

      // 切换集群选择
      function handleClusterSelect({ key }: { key: string }) {
        searchInfo.cluster = key;
        handleReload();
      }

      // 单节点修改标签
      function handleSingleLabel(record: Recordable) {
        openLabelModal(true, {
          clusterName: searchInfo.cluster,
          nodeNames: [record.name],
          labelPairs: record.labelPairs || {},
        });
      }

      // 批量修改标签
      function handleBatchLabel() {
        const keys = checkedKeys.value;
        if (!keys.length) return;

        const dataSource = getDataSource();
        const rows = dataSource.filter((item) => keys.includes(item.name));
        if (!rows.length) return;

        const nodeNames = rows.map((r) => r.name);

        let commonLabels: Record<string, string> = {};
        if (rows.length > 0 && rows[0].labelPairs) {
          commonLabels = { ...rows[0].labelPairs };
          for (let i = 1; i < rows.length; i++) {
            const currentLabels = rows[i].labelPairs || {};
            for (const key of Object.keys(commonLabels)) {
              if (!(key in currentLabels) || currentLabels[key] !== commonLabels[key]) {
                delete commonLabels[key];
              }
            }
          }
        }

        openLabelModal(true, {
          clusterName: searchInfo.cluster,
          nodeNames,
          labelPairs: commonLabels,
        });
      }

      // 单节点修改污点
      function handleSingleTaint(record: Recordable) {
        openTaintModal(true, {
          clusterName: searchInfo.cluster,
          nodeNames: [record.name],
          taints: record.taints || [],
        });
      }

      // 批量修改污点
      function handleBatchTaint() {
        const keys = checkedKeys.value;
        if (!keys.length) return;

        const dataSource = getDataSource();
        const rows = dataSource.filter((item) => keys.includes(item.name));
        if (!rows.length) return;

        const nodeNames = rows.map((r) => r.name);

        let commonTaints: Array<{ key: string; value?: string; effect: string }> = [];
        if (rows.length > 0 && rows[0].taints) {
          commonTaints = [...rows[0].taints];
          for (let i = 1; i < rows.length; i++) {
            const currentTaints = rows[i].taints || [];
            commonTaints = commonTaints.filter((ct) =>
              currentTaints.some(
                (t: any) => t.key === ct.key && (t.value || '') === (ct.value || '') && t.effect === ct.effect,
              ),
            );
          }
        }

        openTaintModal(true, {
          clusterName: searchInfo.cluster,
          nodeNames,
          taints: commonTaints,
        });
      }

      // 单节点驱逐 (Drain)
      async function handleSingleDrain(record: Recordable) {
        try {
          const res = await drainK8sNodes({
            clusterName: searchInfo.cluster,
            nodeNames: [record.name],
          });
          createMessage.success(res || `节点 [${record.name}] 驱逐处理完成`);
          handleReload();
        } catch (e: any) {
          console.error('节点驱逐失败:', e);
        }
      }

      // 批量节点驱逐 (Drain)
      function handleBatchDrain() {
        const keys = checkedKeys.value;
        if (!keys.length) return;

        const dataSource = getDataSource();
        const rows = dataSource.filter((item) => keys.includes(item.name));
        const nodeNames = rows.map((row) => row.name);

        createConfirm({
          iconType: 'warning',
          title: '批量驱逐节点 (Drain Nodes)',
          content: `确定要驱逐选中的 ${nodeNames.length} 个节点上的所有应用 Pod 吗？\n节点将自动被设为禁止调度并进行 Pod 迁移。\n节点列表: ${nodeNames.join(', ')}`,
          onOk: async () => {
            try {
              const res = await drainK8sNodes({
                clusterName: searchInfo.cluster,
                nodeNames,
              });
              createMessage.success(res || '批量节点驱逐处理完成');
              handleReload();
            } catch (e: any) {
              console.error('批量节点驱逐失败:', e);
            }
          },
        });
      }

      // 🚀 点击 Pod 数量 Tag 弹出单独的完整 Pod 列表弹窗
      function handleOpenPodModal(record: Recordable) {
        openPodModal(true, {
          clusterName: searchInfo.cluster,
          nodeName: record.name,
        });
      }

      // 单节点调度状态切换
      async function handleSingleSchedule(record: Recordable) {
        try {
          await scheduleEnableSwitchK8sNodesOne({
            clusterName: searchInfo.cluster,
            nodeNames: [record.name],
            targetEnable: !record.scheduleEnable,
          });
          createMessage.success(`节点 [${record.name}] 调度状态修改成功`);
          handleReload();
        } catch (e: any) {
          console.error('修改节点调度状态失败:', e);
        }
      }

      // 批量节点调度状态设置
      function handleBatchSchedule(targetEnable: boolean) {
        const keys = checkedKeys.value;
        if (!keys.length) return;

        const dataSource = getDataSource();
        const rows = dataSource.filter((item) => keys.includes(item.name));
        const nodeNames = rows.map((row) => row.name);
        const actionText = targetEnable ? '批量允许调度 (Uncordon)' : '批量停止调度 (Cordon)';

        createConfirm({
          iconType: 'warning',
          title: actionText,
          content: `确定要为选中的 ${nodeNames.length} 个节点执行 [${actionText}] 操作吗？\n节点列表: ${nodeNames.join(', ')}`,
          onOk: async () => {
            try {
              await scheduleEnableSwitchK8sNodesOne({
                clusterName: searchInfo.cluster,
                nodeNames,
                targetEnable,
              });
              createMessage.success(`${actionText} 执行成功`);
              handleReload();
            } catch (e: any) {
              console.error('批量更新节点调度状态失败:', e);
            }
          },
        });
      }

      onMounted(() => {
        fetchClusters();
      });

      function handleReload() {
        checkedKeys.value = [];
        clearSelectedRowKeys();
        reload();
      }

      function handleDetail(record: Recordable, activeTab = 'conditions') {
        openDrawer(true, {
          record,
          clusterName: searchInfo.cluster,
          activeTab,
        });
      }

      return {
        showSidebar,
        loading,
        clusterList,
        selectedKeys,
        hasSelected,
        registerTable,
        registerDrawer,
        registerLabelModal,
        registerTaintModal,
        registerPodModal,
        fetchClusters,
        handleClusterSelect,
        handleSingleLabel,
        handleBatchLabel,
        handleSingleTaint,
        handleBatchTaint,
        handleSingleDrain,
        handleBatchDrain,
        handleOpenPodModal,
        handleSingleSchedule,
        handleBatchSchedule,
        handleReload,
        handleDetail,
      };
    },
  });
</script>
