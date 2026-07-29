<template>
  <div class="p-4">
    <!-- 顶部 Tabs 切换栏 (同 Workload / DeploymentList 格式) -->
    <div class="bg-white dark:bg-gray-800 px-4 pt-2 mb-3 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
      <a-tabs v-model:activeKey="activeTab" :animated="false">
        <a-tab-pane key="project" tab="项目管理" />
        <a-tab-pane key="app" tab="应用配置" />
        <a-tab-pane key="instance" tab="实例部署" />
      </a-tabs>
    </div>

    <!-- 选项卡 1：项目管理 -->
    <div v-show="activeTab === 'project'" class="flex-1 min-h-0">
      <BasicTable @register="registerProjectTable">
        <template #toolbar>
          <div class="flex items-center space-x-3 flex-wrap gap-y-2">
            <Button type="primary" @click="handleCreateProject">
              <template #icon><PlusOutlined /></template>
              新增项目
            </Button>
          </div>
        </template>
        <template #expandedRowRender="{ record }">
          <div class="p-3 bg-blue-500/10 dark:bg-blue-500/15 rounded border border-blue-500/20">
            <div class="flex items-center justify-between mb-2">
              <span class="font-bold text-gray-800 dark:text-gray-100 text-xs">
                项目【{{ record.nameZh || record.name }}】下关联的应用列表 (共 {{ (record.k8sApps || record.K8sApps)?.length || 0 }} 个)
              </span>
              <span class="text-blue-600 dark:text-blue-400 text-xs">💡 点击以下应用 Tag 可快速跳转至应用管理并自动过滤</span>
            </div>
            <div v-if="(record.k8sApps || record.K8sApps) && (record.k8sApps || record.K8sApps).length > 0" class="flex flex-wrap gap-2">
              <Tag
                v-for="app in (record.k8sApps || record.K8sApps)"
                :key="app.id"
                color="processing"
                class="cursor-pointer hover:scale-105 transition-all py-0.5 px-2.5"
                @click.stop="handleJumpToApp(app, record)"
              >
                <template #icon><AppstoreOutlined /></template>
                {{ app.name }} <span class="text-xs opacity-75">({{ app.namespace || 'default' }})</span>
              </Tag>
            </div>
            <div v-else class="text-gray-500 dark:text-gray-400 text-xs py-1">该项目下暂无关联应用</div>
          </div>
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'nodePath'">
            <Tag color="blue">{{ record.nodePath || (record.treeNodeId ? 'Node: ' + record.treeNodeId : '-') }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <div @click.stop>
              <TableAction
                :actions="[
                  {
                    icon: 'ant-design:edit-outlined',
                    tooltip: '编辑项目',
                    onClick: handleEditProject.bind(null, record),
                  },
                  {
                    icon: 'ant-design:delete-outlined',
                    color: 'error',
                    tooltip: '删除项目',
                    popConfirm: {
                      title: '是否确认删除该项目？',
                      confirm: handleDeleteProject.bind(null, record),
                    },
                  },
                ]"
              />
            </div>
          </template>
        </template>
      </BasicTable>
    </div>

    <!-- 选项卡 2：应用管理 -->
    <div v-show="activeTab === 'app'" class="flex-1 min-h-0">
      <BasicTable @register="registerAppTable">
        <template #toolbar>
          <div class="flex items-center space-x-3 flex-wrap gap-y-2">
            <Button type="primary" @click="handleCreateApp">
              <template #icon><PlusOutlined /></template>
              新增应用
            </Button>
          </div>
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'clusterNamespace'">
            <div class="flex items-center justify-center gap-1">
              <Tag color="purple" v-if="record.clusterName || (record.clusterNamespace && record.clusterNamespace.includes('/'))">
                {{ record.clusterName || (record.clusterNamespace ? record.clusterNamespace.split('/')[0].trim() : '-') }}
              </Tag>
              <Tag color="green">
                {{ record.namespace || 'default' }}
              </Tag>
            </div>
          </template>
          <template v-if="column.key === 'nodePath'">
            <Tag color="blue">{{ record.nodePath || (record.treeNodeId ? 'Node: ' + record.treeNodeId : '-') }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <TableAction
              :actions="[
                {
                  icon: 'ant-design:edit-outlined',
                  tooltip: '编辑应用',
                  onClick: handleEditApp.bind(null, record),
                },
                {
                  icon: 'ant-design:delete-outlined',
                  color: 'error',
                  tooltip: '删除应用',
                  popConfirm: {
                    title: '是否确认删除该应用？',
                    confirm: handleDeleteApp.bind(null, record),
                  },
                },
              ]"
            />
          </template>
        </template>
      </BasicTable>
    </div>

    <!-- 选项卡 3：实例部署 -->
    <div v-show="activeTab === 'instance'" class="flex-1 min-h-0">
      <BasicTable @register="registerInstanceTable">
        <template #toolbar>
          <div class="flex items-center space-x-3 flex-wrap gap-y-2">
            <Button type="primary" @click="handleCreateInstance">
              <template #icon><PlusOutlined /></template>
              新增实例
            </Button>
          </div>
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'workloadType'">
            <Tag :color="getWorkloadColor(record.workloadType)">
              {{ record.workloadType || 'Deployment' }}
            </Tag>
          </template>
          <template v-if="column.key === 'env'">
            <Tag :color="getEnvColor(record.env)">
              {{ (record.env || 'prod').toUpperCase() }}
            </Tag>
          </template>
          <template v-if="column.key === 'clusterStatus'">
            <Tag :color="record.clusterStatus && record.clusterStatus.includes('Ready') ? 'green' : 'orange'">
              {{ record.clusterStatus || '未同步' }}
            </Tag>
          </template>
          <template v-if="column.key === 'action'">
            <TableAction
              :actions="[
                {
                  icon: 'ant-design:rocket-outlined',
                  tooltip: '部署/同步到 K8s 集群',
                  onClick: handleDeployInstance.bind(null, record),
                },
                {
                  icon: 'ant-design:edit-outlined',
                  tooltip: '编辑实例',
                  onClick: handleEditInstance.bind(null, record),
                },
                {
                  icon: 'ant-design:delete-outlined',
                  color: 'error',
                  tooltip: '删除实例',
                  popConfirm: {
                    title: '是否确认删除该实例及集群关联资源？',
                    confirm: handleDeleteInstance.bind(null, record),
                  },
                },
              ]"
            />
          </template>
        </template>
      </BasicTable>
    </div>

    <!-- Modals -->
    <ProjectModal @register="registerProjectModal" @success="reloadProjectTable" />
    <AppModal @register="registerAppModal" @success="reloadAppTable" />
    <InstanceModal @register="registerInstanceModal" @success="reloadInstanceTable" />
  </div>
</template>

<script lang="ts" setup>
  import { ref, nextTick } from 'vue';
  import {
    Tabs as ATabs,
    TabPane as ATabPane,
    Button,
    Tag,
  } from 'ant-design-vue';
  import { AppstoreOutlined, PlusOutlined } from '@ant-design/icons-vue';
  import { BasicTable, useTable, TableAction } from '@/components/Table';
  import { useModal } from '@/components/Modal';
  import { useMessage } from '@/hooks/web/useMessage';

  import {
    getK8sProjectList,
    deleteK8sProject,
    getK8sAppList,
    deleteK8sApp,
    getK8sInstanceList,
    deleteK8sInstance,
    deployK8sInstance,
  } from '@/api/demo/system';

  import {
    projectColumns,
    projectSearchFormSchema,
    appColumns,
    appSearchFormSchema,
    instanceColumns,
    instanceSearchFormSchema,
  } from './instance.data';

  import ProjectModal from './ProjectModal.vue';
  import AppModal from './AppModal.vue';
  import InstanceModal from './InstanceModal.vue';

  const activeTab = ref('project');

  const { createMessage } = useMessage();

  // Modals hooks
  const [registerProjectModal, { openModal: openProjectModal }] = useModal();
  const [registerAppModal, { openModal: openAppModal }] = useModal();
  const [registerInstanceModal, { openModal: openInstanceModal }] = useModal();

  function getWorkloadColor(type?: string) {
    switch (type) {
      case 'StatefulSet': return 'purple';
      case 'DaemonSet': return 'cyan';
      case 'Pod': return 'orange';
      default: return 'blue';
    }
  }

  function getEnvColor(env?: string) {
    switch (env) {
      case 'dev': return 'green';
      case 'test': return 'blue';
      case 'staging': return 'orange';
      default: return 'red';
    }
  }

  // Project Table
  const [registerProjectTable, { reload: reloadProjectTable }] = useTable({
    title: 'K8s 项目列表',
    api: getK8sProjectList,
    columns: projectColumns,
    formConfig: {
      schemas: projectSearchFormSchema,
      autoSubmitOnEnter: true,
    },
    rowKey: 'id',
    expandRowByClick: true,
    scroll: { x: 'max-content' },
    useSearchForm: true,
    showTableSetting: true,
    bordered: true,
    showIndexColumn: false,
    actionColumn: {
      width: 120,
      title: '操作',
      dataIndex: 'action',
      fixed: 'right',
    },
  });

  // App Table
  const [registerAppTable, { reload: reloadAppTable, getForm: getAppForm }] = useTable({
    title: '应用配置列表',
    api: getK8sAppList,
    columns: appColumns,
    formConfig: {
      schemas: appSearchFormSchema,
      autoSubmitOnEnter: true,
    },
    scroll: { x: 'max-content' },
    useSearchForm: true,
    showTableSetting: true,
    bordered: true,
    showIndexColumn: false,
    actionColumn: {
      width: 120,
      title: '操作',
      dataIndex: 'action',
      fixed: 'right',
    },
  });

  async function handleJumpToApp(app: Recordable, _project: Recordable) {
    activeTab.value = 'app';
    await nextTick();
    await getAppForm().setFieldsValue({ name: app.name });
    reloadAppTable();
  }

  // Instance Table
  const [registerInstanceTable, { reload: reloadInstanceTable }] = useTable({
    title: '实例部署列表',
    api: getK8sInstanceList,
    columns: instanceColumns,
    formConfig: {
      schemas: instanceSearchFormSchema,
      autoSubmitOnEnter: true,
    },
    scroll: { x: 'max-content' },
    useSearchForm: true,
    showTableSetting: true,
    bordered: true,
    showIndexColumn: false,
    actionColumn: {
      width: 160,
      title: '操作',
      dataIndex: 'action',
      fixed: 'right',
    },
  });

  // Project Handlers
  function handleCreateProject() {
    openProjectModal(true, { isUpdate: false });
  }

  function handleEditProject(record: Recordable) {
    openProjectModal(true, { record, isUpdate: true });
  }

  async function handleDeleteProject(record: Recordable) {
    await deleteK8sProject(record.id);
    createMessage.success('删除项目成功');
    reloadProjectTable();
  }

  // App Handlers
  function handleCreateApp() {
    openAppModal(true, { isUpdate: false });
  }

  function handleEditApp(record: Recordable) {
    openAppModal(true, { record, isUpdate: true });
  }

  async function handleDeleteApp(record: Recordable) {
    await deleteK8sApp(record.id);
    createMessage.success('删除应用成功');
    reloadAppTable();
  }

  // Instance Handlers
  function handleCreateInstance() {
    openInstanceModal(true, { isUpdate: false });
  }

  function handleEditInstance(record: Recordable) {
    openInstanceModal(true, { record, isUpdate: true });
  }

  async function handleDeleteInstance(record: Recordable) {
    await deleteK8sInstance(record.id);
    createMessage.success('删除实例成功');
    reloadInstanceTable();
  }

  async function handleDeployInstance(record: Recordable) {
    try {
      createMessage.loading({ content: '正在同步部署资源至 K8s 集群...', key: 'deploy_msg' });
      await deployK8sInstance(record.id);
      createMessage.success({ content: `实例 ${record.name} 及关联 Service/Ingress 已成功同步部署至集群！`, key: 'deploy_msg' });
      reloadInstanceTable();
    } catch (err: any) {
      createMessage.error({ content: `部署失败: ${err?.message || err}`, key: 'deploy_msg' });
    }
  }
</script>
