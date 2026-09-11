<template>
  <div>
    <PageWrapper title="异步服务树" :content="`当前路径：${thisNodePath}`">
      <Row :gutter="16" type="flex" class="align-stretch">
        <!-- 服务树列表 -->
        <Col :span="isTreeCollapsed ? 0 : 6" v-show="!isTreeCollapsed" class="flex flex-col">
        <div
          class="bg-white dark:bg-[#151515] p-4 rounded-md border border-gray-100 dark:border-zinc-800 h-full flex flex-col">
          <div class="flex justify-between items-center mb-4 pb-4 border-b border-gray-100 dark:border-zinc-800">
            <span class="text-base font-medium text-gray-800 dark:text-gray-200">节点树</span>
            <a-button type="primary" size="small" preIcon="ant-design:plus-outlined" @click="addTopNode()"
              v-auth="'POST:/api/stree/createStreeNode'">添加顶级节点</a-button>
          </div>

          <a-directory-tree :tree-data="treeData" multiple block-node :load-data="onLoadData" @select="onSelect"
            v-if="isShow" v-model:expandedKeys="expandedKeys" v-model:selectedKeys="selectedKeys"
            :field-names="{ title: 'title', key: 'id' }">
            <template #title="{ key: treeKey, title, id, level, children, isLeaf }">
              <a-dropdown :trigger="['contextmenu']">
                <span class="block w-full select-none truncate">{{ title }}</span>
                <template #overlay>
                  <a-menu
                    @click="({ key: menuKey }) => onContextMenuClick(title, menuKey, id, level, children, isLeaf)">
                    <a-menu-item key="1" v-if="!isLeaf && hasPermission('POST:/api/stree/createStreeNode')">
                      <Icon icon="ant-design:plus-outlined" class="mr-2" color="#55D187" />新增节点
                    </a-menu-item>
                    <a-menu-item key="4" v-if="!isLeaf && hasPermission('POST:/api/stree/createStreeNode')">
                      <Icon icon="ant-design:thunderbolt-outlined" class="mr-2" color="#1890FF" />批量添加叶子节点
                    </a-menu-item>
                    <a-menu-item key="2" v-if="hasPermission('DELETE:/api/stree/deleteStreeNode/:id')">
                      <Icon icon="ant-design:delete-outlined" class="mr-2" color="#F56C6C" />删除节点
                    </a-menu-item>
                    <a-menu-item key="3" v-if="hasPermission('POST:/api/stree/updateStreeNode')">
                      <Icon icon="clarity:note-edit-line" class="mr-2" color="#E6A23C" />编辑节点
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </template>
          </a-directory-tree>
          <a-empty v-if="isShow && treeData.length === 0" description="暂无节点数据" class="mt-10" />
        </div>
        </Col>
        <!-- 资源列表 -->
        <Col :span="isTreeCollapsed ? 24 : 18" class="flex flex-col">
        <Card title="服务树和关联资源详情展示" :bordered="false" class="h-full flex flex-col">

          <template #extra>
            <a-button type="link" @click="isTreeCollapsed = !isTreeCollapsed" class="flex items-center gap-1">
              <Icon :icon="isTreeCollapsed ? 'ant-design:menu-unfold-outlined' : 'ant-design:menu-fold-outlined'" />
              {{ isTreeCollapsed ? '展开服务树' : '收起服务树' }}
            </a-button>
          </template>

          <a-tabs v-model:activeKey="activeKey">
            <a-tab-pane key="1">
              <template #tab><span><info-circle-outlined />节点详情</span></template>
              <div class="mt-4" v-if="currentNode.id && activeKey === '1'">
                <div class="flex justify-between items-center mb-4">
                  <span class="text-base font-semibold text-gray-800 dark:text-gray-200">详细信息</span>
                  <div class="flex items-center gap-2">
                    <a-button v-if="!currentNode.isLeaf && hasPermission('POST:/api/stree/createStreeNode')"
                      type="primary" ghost preIcon="ant-design:thunderbolt-outlined" @click="handleOpenInitModal">
                      批量添加叶子节点
                    </a-button>
                    <a-button type="primary" @click="showNodeModal">修改节点属性</a-button>
                  </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                  <!-- 左侧：关联资源统计 Card -->
                  <Card title="关联资源统计" size="small" :bordered="true"
                    class="shadow-sm dark:bg-zinc-900/40 flex flex-col h-full">
                    <div class="grid grid-cols-2 gap-4 py-2 flex-1 align-middle">
                      <!-- ECS Card -->
                      <div
                        class="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-lg flex flex-col items-center justify-center border border-blue-100 dark:border-blue-900/30">
                        <span
                          class="text-blue-500 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">ECS
                          实例</span>
                        <div class="flex items-baseline gap-1 mt-1">
                          <span class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ currentNode.ecsNum || 0
                          }}</span>
                          <span class="text-xs text-blue-400 dark:text-blue-500">台</span>
                        </div>
                      </div>

                      <!-- ELB Card -->
                      <div
                        class="bg-orange-50/50 dark:bg-orange-950/20 p-4 rounded-lg flex flex-col items-center justify-center border border-orange-100 dark:border-orange-900/30">
                        <span
                          class="text-orange-500 dark:text-orange-400 text-xs font-semibold uppercase tracking-wider mb-1">ELB
                          负载均衡</span>
                        <div class="flex items-baseline gap-1 mt-1">
                          <span class="text-2xl font-bold text-orange-600 dark:text-orange-400">{{ currentNode.elbNum ||
                            0
                          }}</span>
                          <span class="text-xs text-orange-400 dark:text-orange-500">个</span>
                        </div>
                      </div>

                      <!-- RDS Card -->
                      <div
                        class="bg-green-50/50 dark:bg-green-950/20 p-4 rounded-lg flex flex-col items-center justify-center border border-green-100 dark:border-green-900/30">
                        <span
                          class="text-green-500 dark:text-green-400 text-xs font-semibold uppercase tracking-wider mb-1">RDS
                          数据库</span>
                        <div class="flex items-baseline gap-1 mt-1">
                          <span class="text-2xl font-bold text-green-600 dark:text-green-400">{{ currentNode.rdsNum || 0
                          }}</span>
                          <span class="text-xs text-green-400 dark:text-green-500">个</span>
                        </div>
                      </div>

                      <!-- DNS Card -->
                      <div
                        class="bg-cyan-50/50 dark:bg-cyan-950/20 p-4 rounded-lg flex flex-col items-center justify-center border border-cyan-100 dark:border-cyan-900/30">
                        <span
                          class="text-cyan-500 dark:text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">DNS
                          域名</span>
                        <div class="flex items-baseline gap-1 mt-1">
                          <span class="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{{ currentNode.dnsNum || 0
                          }}</span>
                          <span class="text-xs text-cyan-400 dark:text-cyan-500">条</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <!-- 右侧：基本属性 Card -->
                  <Card title="基本属性" size="small" :bordered="true"
                    class="shadow-sm dark:bg-zinc-900/40 flex flex-col h-full">
                    <div class="flex flex-col gap-3 py-1 flex-1">
                      <div class="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 pb-2">
                        <span class="text-gray-500 dark:text-gray-400">节点名称:</span>
                        <span class="font-medium text-gray-800 dark:text-gray-200">{{ currentNode.title }}</span>
                      </div>
                      <div class="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 pb-2">
                        <span class="text-gray-500 dark:text-gray-400">节点等级:</span>
                        <span class="font-medium text-gray-800 dark:text-gray-200">{{ currentNode.level }}</span>
                      </div>
                      <div class="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 pb-2">
                        <span class="text-gray-500 dark:text-gray-400">运维负责人:</span>
                        <div class="flex flex-wrap gap-1 justify-end">
                          <Tag v-for="(user, index) in currentNode.ops_admin_users" :key="index" color="orange"
                            class="text-sm px-2 py-0.5 m-0">
                            {{ user }}
                          </Tag>
                          <span v-if="!currentNode.ops_admin_users || currentNode.ops_admin_users.length === 0"
                            class="text-gray-400 dark:text-gray-500 text-xs">
                            暂无配置
                          </span>
                        </div>
                      </div>
                      <div class="flex flex-col gap-1">
                        <span class="text-gray-500 dark:text-gray-400">节点描述:</span>
                        <span
                          class="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-zinc-800/60 p-2 rounded text-xs min-h-[40px] mt-1 whitespace-pre-wrap">
                          {{ currentNode.desc || '暂无描述' }}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>
                <div class="mt-4" v-if="currentNode.id">
                  <div
                    class="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 border-l-4 border-blue-500 pl-2">
                    资源分布统计</div>
                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <!-- ECS 资源分布 Card -->
                    <Card title="ECS 资源分布" size="small" :bordered="true" class="shadow-sm dark:bg-zinc-900/40">
                      <div class="p-2">
                        <EcsVendorChart :node="currentNode" />
                      </div>
                    </Card>

                    <!-- ELB 资源分布 Card -->
                    <Card title="ELB 资源分布" size="small" :bordered="true" class="shadow-sm dark:bg-zinc-900/40">
                      <div class="p-2">
                        <ElbVendorChart :node="currentNode" />
                      </div>
                    </Card>

                    <!-- RDS 资源分布 Card -->
                    <Card title="RDS 资源分布" size="small" :bordered="true" class="shadow-sm dark:bg-zinc-900/40">
                      <div class="p-2">
                        <RdsVendorChart :node="currentNode" />
                      </div>
                    </Card>

                    <!-- DNS 资源分布 Card -->
                    <Card title="DNS 资源分布" size="small" :bordered="true" class="shadow-sm dark:bg-zinc-900/40">
                      <div class="p-2">
                        <DnsVendorChart :node="currentNode" />
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </a-tab-pane>

            <a-tab-pane key="2">
              <template #tab>
                <span>
                  <cloud-server-outlined /> ECS列表
                  <Tag v-if="currentNode.ecsNum" color="blue"
                    class="ml-1 px-1.5 py-0 text-xs font-semibold leading-tight rounded-full">
                    {{ currentNode.ecsNum }}
                  </Tag>
                </span>
              </template>
              <div class="p-4 overflow-hidden">
                <!-- 顶部操作栏 -->
                <div class="flex justify-between items-center mb-4 pb-3 border-b border-gray-100 dark:border-zinc-800">
                  <a-space v-if="isLeaf">
                    <a-button type="primary" preIcon="ant-design:link-outlined" @click="showEcsBindTranfer"
                      v-auth="'POST:/api/stree/bindEcsToStreeNode'">
                      关联 ECS 资源
                    </a-button>
                    <a-button danger preIcon="ant-design:disconnect-outlined" @click="showEcsUnBindTranfer"
                      v-auth="'POST:/api/stree/unBindEcsToStreeNode'">
                      批量解绑
                    </a-button>
                  </a-space>
                  <div v-else class="text-gray-400 flex items-center text-sm flex-wrap gap-2">
                    <span class="flex items-center"><info-circle-outlined
                        class="mr-1.5 text-amber-500" />请在左侧服务树中选择【叶子节点】进行资产管理</span>
                    <a-button v-if="hasPermission('POST:/api/stree/createStreeNode')" type="link" size="small"
                      class="flex items-center text-blue-500 p-0 h-auto" @click="handleOpenInitModal">
                      <Icon icon="ant-design:thunderbolt-outlined" class="mr-1" />一键为此项目初始化标准组件节点
                    </a-button>
                  </div>

                  <div v-if="isLeaf" class="text-xs text-gray-500 dark:text-gray-400">
                    当前节点已绑定 <strong class="text-blue-600 dark:text-blue-400 text-sm font-semibold">{{ currentNode.ecsNum
                      || 0
                    }}</strong> 台主机
                  </div>
                </div>

                <!-- 弹窗 1：关联绑定 ECS 资源 (表格多选，告别右箭头) -->
                <EcsBindModal @register="registerEcsBindModal" @success="handleEcsBindSuccess" />

                <!-- 弹窗 2：批量解绑 ECS 资源 (表格多选解绑，免去右箭头穿梭框) -->
                <EcsUnbindModal @register="registerEcsUnbindModal" @success="handleEcsUnbindSuccess" />

                <!-- 表格主体全高展示 -->
                <div v-if="currentNode.id && activeKey === '2'">
                  <EcsTable :nodeId="currentNode.id" :refreshKey="ecsTableRefreshKey" />
                </div>
              </div>
            </a-tab-pane>

            <a-tab-pane key="3">
              <template #tab>
                <span>
                  <database-outlined /> ELB列表
                  <Tag v-if="currentNode.elbNum" color="orange"
                    class="ml-1 px-1.5 py-0 text-xs font-semibold leading-tight rounded-full">
                    {{ currentNode.elbNum }}
                  </Tag>
                </span>
              </template>
              <div class="p-4 overflow-hidden">
                <!-- 顶部操作栏 -->
                <div class="flex justify-between items-center mb-4 pb-3 border-b border-gray-100 dark:border-zinc-800">
                  <a-space v-if="isLeaf">
                    <a-button type="primary" preIcon="ant-design:link-outlined" @click="showElbBindTranfer"
                      v-auth="'POST:/api/stree/bindElbToStreeNode'">
                      关联 ELB 资源
                    </a-button>
                    <a-button danger preIcon="ant-design:disconnect-outlined" @click="showElbUnBindTranfer"
                      v-auth="'POST:/api/stree/unBindElbToStreeNode'">
                      批量解绑
                    </a-button>
                  </a-space>
                  <div v-else class="text-gray-400 flex items-center text-sm">
                    <info-circle-outlined class="mr-1.5 text-amber-500" />请在左侧服务树中选择【叶子节点】进行资产管理
                  </div>

                  <div v-if="isLeaf" class="text-xs text-gray-500 dark:text-gray-400">
                    当前节点已绑定 <strong class="text-orange-600 dark:text-orange-400 text-sm font-semibold">{{
                      currentNode.elbNum ||
                      0 }}</strong> 个负载均衡
                  </div>
                </div>

                <!-- 弹窗 1：关联绑定 ELB 资源 (表格多选，告别右箭头) -->
                <ElbBindModal @register="registerElbBindModal" @success="handleElbBindSuccess" />

                <!-- 弹窗 2：批量解绑 ELB 资源 (表格多选解绑) -->
                <ElbUnbindModal @register="registerElbUnbindModal" @success="handleElbUnbindSuccess" />

                <!-- 表格主体全高展示 -->
                <div v-if="currentNode.id && activeKey === '3'">
                  <ElbTable :nodeId="currentNode.id" :refreshKey="elbTableRefreshKey" />
                </div>
              </div>
            </a-tab-pane>

            <a-tab-pane key="4">
              <template #tab>
                <span>
                  <global-outlined /> DNS列表
                  <Tag v-if="currentNode.dnsNum" color="cyan"
                    class="ml-1 px-1.5 py-0 text-xs font-semibold leading-tight rounded-full">
                    {{ currentNode.dnsNum }}
                  </Tag>
                </span>
              </template>
              <div class="p-4 overflow-hidden">
                <!-- 顶部操作栏 -->
                <div class="flex justify-between items-center mb-4 pb-3 border-b border-gray-100 dark:border-zinc-800">
                  <a-space v-if="isLeaf">
                    <a-button type="primary" preIcon="ant-design:link-outlined" @click="showDnsBindTranfer"
                      v-auth="'POST:/api/stree/bindDnsToStreeNode'">
                      关联 DNS 资源
                    </a-button>
                    <a-button danger preIcon="ant-design:disconnect-outlined" @click="showDnsUnBindTranfer"
                      v-auth="'POST:/api/stree/unBindDnsToStreeNode'">
                      批量解绑
                    </a-button>
                  </a-space>
                  <div v-else class="text-gray-400 flex items-center text-sm">
                    <info-circle-outlined class="mr-1.5 text-amber-500" />请在左侧服务树中选择【叶子节点】进行资产管理
                  </div>

                  <div v-if="isLeaf" class="text-xs text-gray-500 dark:text-gray-400">
                    当前节点已绑定 <strong class="text-cyan-600 dark:text-cyan-400 text-sm font-semibold">{{ currentNode.dnsNum
                      || 0
                      }}</strong> 条域名记录
                  </div>
                </div>

                <!-- 弹窗 1：关联绑定 DNS 资源 (表格多选，告别右箭头) -->
                <DnsBindModal @register="registerDnsBindModal" @success="handleDnsBindSuccess" />

                <!-- 弹窗 2：批量解绑 DNS 资源 (表格多选解绑) -->
                <DnsUnbindModal @register="registerDnsUnbindModal" @success="handleDnsUnbindSuccess" />

                <!-- 表格主体全高展示 -->
                <div v-if="currentNode.id && activeKey === '4'">
                  <DnsTable :nodeId="currentNode.id" :refreshKey="dnsTableRefreshKey" />
                </div>
              </div>
            </a-tab-pane>

            <a-tab-pane key="5">
              <template #tab>
                <span>
                  <database-outlined /> RDS列表
                  <Tag v-if="currentNode.rdsNum" color="green"
                    class="ml-1 px-1.5 py-0 text-xs font-semibold leading-tight rounded-full">
                    {{ currentNode.rdsNum }}
                  </Tag>
                </span>
              </template>
              <div class="p-4 overflow-hidden">
                <!-- 顶部操作栏 -->
                <div class="flex justify-between items-center mb-4 pb-3 border-b border-gray-100 dark:border-zinc-800">
                  <a-space v-if="isLeaf">
                    <a-button type="primary" preIcon="ant-design:link-outlined" @click="showRdsBindTranfer"
                      v-auth="'POST:/api/stree/bindRdsToStreeNode'">
                      关联 RDS 资源
                    </a-button>
                    <a-button danger preIcon="ant-design:disconnect-outlined" @click="showRdsUnBindTranfer"
                      v-auth="'POST:/api/stree/unBindRdsToStreeNode'">
                      批量解绑
                    </a-button>
                  </a-space>
                  <div v-else class="text-gray-400 flex items-center text-sm">
                    <info-circle-outlined class="mr-1.5 text-amber-500" />请在左侧服务树中选择【叶子节点】进行资产管理
                  </div>

                  <div v-if="isLeaf" class="text-xs text-gray-500 dark:text-gray-400">
                    当前节点已绑定 <strong class="text-green-600 dark:text-green-400 text-sm font-semibold">{{
                      currentNode.rdsNum || 0
                      }}</strong> 个数据库实例
                  </div>
                </div>

                <!-- 弹窗 1：关联绑定 RDS 资源 (表格多选，告别右箭头) -->
                <RdsBindModal @register="registerRdsBindModal" @success="handleRdsBindSuccess" />

                <!-- 弹窗 2：批量解绑 RDS 资源 (表格多选解绑) -->
                <RdsUnbindModal @register="registerRdsUnbindModal" @success="handleRdsUnbindSuccess" />

                <!-- 表格主体全高展示 -->
                <div v-if="currentNode.id && activeKey === '5'">
                  <RdsTable :nodeId="currentNode.id" :refreshKey="rdsTableRefreshKey" />
                </div>
              </div>
            </a-tab-pane>

          </a-tabs>
        </Card>
        </Col>
      </Row>
    </PageWrapper>
    <TreeNodeModal @register="registerModal" @success="handlerSuccess" />
    <StreeDrawer @register="registerDrawer" @success="handlerSuccess" />
    <InitStandardNodesModal @register="registerInitModal" @success="handleInitSuccess" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, nextTick, onMounted, onActivated } from 'vue';
import { PageWrapper } from '@/components/Page';
import { Row, Col, Tree, Dropdown, Menu, Space, Empty, Tabs, Card, Descriptions, Tag, Transfer, Divider, Radio, Select } from 'ant-design-vue';
import { CloudServerOutlined, DatabaseOutlined, InfoCircleOutlined, GlobalOutlined } from '@ant-design/icons-vue';
import Icon from '@/components/Icon/Icon.vue';
import { usePermission } from '@/hooks/web/usePermission';
import {
  deleteStreeNode, getTopStreeNodes, getChildrenStreeNodes
} from '@/api/demo/system';
import type { TreeItem } from '@/components/Tree';
import StreeDrawer from './StreeDrawer.vue';
import { useDrawer } from '@/components/Drawer';
import { useMessage } from '@/hooks/web/useMessage';
import TreeNodeModal from './TreeNodeModal.vue';
import EcsVendorChart from './EcsVendorChart.vue';
import ElbVendorChart from './ElbVendorChart.vue';
import DnsVendorChart from './DnsVendorChart.vue';
import RdsVendorChart from './RdsVendorChart.vue';
import { BasicModal, useModal } from '@/components/Modal';
import EcsTable from './EcsTable.vue';
import ElbTable from './ElbTable.vue';
import DnsTable from './DnsTable.vue';
import RdsTable from './RdsTable.vue';
import InitStandardNodesModal from './InitStandardNodesModal.vue';
import EcsBindModal from './EcsBindModal.vue';
import EcsUnbindModal from './EcsUnbindModal.vue';
import ElbBindModal from './ElbBindModal.vue';
import ElbUnbindModal from './ElbUnbindModal.vue';
import RdsBindModal from './RdsBindModal.vue';
import RdsUnbindModal from './RdsUnbindModal.vue';
import DnsBindModal from './DnsBindModal.vue';
import DnsUnbindModal from './DnsUnbindModal.vue';

export default defineComponent({
  name: 'DemoTree',
  components: {
    ADirectoryTree: Tree.DirectoryTree, ADropdown: Dropdown, Col, Row,
    AMenu: Menu, AMenuItem: Menu.Item, AEmpty: Empty, ATabs: Tabs, ATabPane: Tabs.TabPane,
    Card, ADescriptions: Descriptions, ADescriptionsItem: Descriptions.Item, Tag, ATag: Tag,
    ATransfer: Transfer, ADivider: Divider, ASpace: Space, BasicModal, PageWrapper,
    ARadioGroup: Radio.Group, ARadioButton: Radio.Button, ASelect: Select, ASelectOption: Select.Option,
    Icon, Space, StreeDrawer, DatabaseOutlined, CloudServerOutlined, InfoCircleOutlined, GlobalOutlined,
    TreeNodeModal, EcsTable, ElbTable, DnsTable, RdsTable, EcsVendorChart, ElbVendorChart, DnsVendorChart, RdsVendorChart,
    InitStandardNodesModal, EcsBindModal, EcsUnbindModal,
    ElbBindModal, ElbUnbindModal, RdsBindModal, RdsUnbindModal, DnsBindModal, DnsUnbindModal
  },
  setup() {
    const isTreeCollapsed = ref(false);
    const { hasPermission } = usePermission();
    const ecsTableRefreshKey = ref(0);
    const elbTableRefreshKey = ref(0);
    const rdsTableRefreshKey = ref(0);
    const dnsTableRefreshKey = ref(0);

    // ================== 基础状态 ==================
    const activeKey = ref('1');
    const isShow = ref(false);
    const treeData = ref<TreeItem[]>([]);
    const expandedKeys = ref<any[]>([]);
    const selectedKeys = ref<any[]>([]);
    const [registerModal, { openModal }] = useModal();
    const [registerInitModal, { openModal: openInitModal }] = useModal();
    const [registerDrawer, { openDrawer }] = useDrawer();
    const { createMessage } = useMessage();
    const currentNode = ref<any>({});
    const thisNodePath = ref<string>('请选择一个节点');

    const isCurrentNodeLeaf = computed(() => { return currentNode.value && currentNode.value.isLeaf === true; });
    const showNodeModal = () => { if (!currentNode.value.id) return createMessage.warning('请先选择一个节点'); openModal(true, { ...currentNode.value }); };
    const filterOption = (inputValue: string, option: any) => option.title.indexOf(inputValue) > -1;




    // ECS
    const [registerEcsBindModal, { openModal: openEcsBindModal }] = useModal();
    const [registerEcsUnbindModal, { openModal: openEcsUnbindModal }] = useModal();
    const showEcsBindTranfer = () => {
      (document.activeElement as HTMLElement)?.blur();
      if (!currentNode.value.id) return createMessage.warning('请选择节点');
      openEcsBindModal(true, currentNode.value);
    };
    const showEcsUnBindTranfer = () => {
      (document.activeElement as HTMLElement)?.blur();
      if (!currentNode.value.id) return createMessage.warning('请选择节点');
      openEcsUnbindModal(true, currentNode.value);
    };
    const handleEcsBindSuccess = () => {
      refreshCurrentNode();
      ecsTableRefreshKey.value++;
    };
    const handleEcsUnbindSuccess = () => {
      refreshCurrentNode();
      ecsTableRefreshKey.value++;
    };

    // ELB
    const [registerElbBindModal, { openModal: openElbBindModal }] = useModal();
    const [registerElbUnbindModal, { openModal: openElbUnbindModal }] = useModal();
    const showElbBindTranfer = () => {
      (document.activeElement as HTMLElement)?.blur();
      if (!currentNode.value.id) return createMessage.warning('请选择节点');
      openElbBindModal(true, currentNode.value);
    };
    const showElbUnBindTranfer = () => {
      (document.activeElement as HTMLElement)?.blur();
      if (!currentNode.value.id) return createMessage.warning('请选择节点');
      openElbUnbindModal(true, currentNode.value);
    };
    const handleElbBindSuccess = () => {
      refreshCurrentNode();
      elbTableRefreshKey.value++;
    };
    const handleElbUnbindSuccess = () => {
      refreshCurrentNode();
      elbTableRefreshKey.value++;
    };


    // 🌟 ================== 新增 RDS 交互逻辑 ==================
    const [registerRdsBindModal, { openModal: openRdsBindModal }] = useModal();
    const [registerRdsUnbindModal, { openModal: openRdsUnbindModal }] = useModal();
    const showRdsBindTranfer = () => {
      (document.activeElement as HTMLElement)?.blur();
      if (!currentNode.value.id) return createMessage.warning('请选择节点');
      openRdsBindModal(true, currentNode.value);
    };
    const showRdsUnBindTranfer = () => {
      (document.activeElement as HTMLElement)?.blur();
      if (!currentNode.value.id) return createMessage.warning('请选择节点');
      openRdsUnbindModal(true, currentNode.value);
    };
    const handleRdsBindSuccess = () => {
      refreshCurrentNode();
      rdsTableRefreshKey.value++;
    };
    const handleRdsUnbindSuccess = () => {
      refreshCurrentNode();
      rdsTableRefreshKey.value++;
    };


    // 🌟 ================== 新增 DNS 交互逻辑 ==================
    const [registerDnsBindModal, { openModal: openDnsBindModal }] = useModal();
    const [registerDnsUnbindModal, { openModal: openDnsUnbindModal }] = useModal();
    const showDnsBindTranfer = () => {
      (document.activeElement as HTMLElement)?.blur();
      if (!currentNode.value.id) return createMessage.warning('请选择节点');
      openDnsBindModal(true, currentNode.value);
    };
    const showDnsUnBindTranfer = () => {
      (document.activeElement as HTMLElement)?.blur();
      if (!currentNode.value.id) return createMessage.warning('请选择节点');
      openDnsUnbindModal(true, currentNode.value);
    };
    const handleDnsBindSuccess = () => {
      refreshCurrentNode();
      dnsTableRefreshKey.value++;
    };
    const handleDnsUnbindSuccess = () => {
      refreshCurrentNode();
      dnsTableRefreshKey.value++;
    };

    // ================== 树节点控制逻辑 ==================
    const updateNodeInTree = (list: any[], targetId: number, newData: any) => {
      for (const node of list) {
        if (node.id === targetId) { Object.assign(node, newData); return true; }
        if (node.children && node.children.length > 0) if (updateNodeInTree(node.children, targetId, newData)) return true;
      }
      return false;
    };

    const refreshCurrentNode = async () => {
      if (!currentNode.value.id) return;
      const pid = currentNode.value.pId || 0;
      let res = pid === 0 ? await getTopStreeNodes() : await getChildrenStreeNodes(pid);
      const list = Array.isArray(res) ? res : (res.data || []);
      const updatedNode = list.find((item: any) => item.id === currentNode.value.id);

      if (updatedNode) {
        Object.assign(currentNode.value, updatedNode);
        thisNodePath.value = updatedNode.nodePath || updatedNode.title;
        updateNodeInTree(treeData.value, updatedNode.id, updatedNode);
      }
    };

    const loadFirstNodeAndExpand = async (nodes: any[]) => {
      if (Array.isArray(nodes) && nodes.length > 0) {
        const firstNode = nodes[0];
        if (!firstNode.isLeaf && (!firstNode.children || firstNode.children.length === 0)) {
          try {
            const childRes = await getChildrenStreeNodes(firstNode.id);
            firstNode.children = Array.isArray(childRes) ? childRes : (childRes?.data || []);
          } catch (e) {
            console.error('加载子节点失败', e);
          }
        }
        expandedKeys.value = [firstNode.id];
        if (!currentNode.value.id) {
          selectedKeys.value = [firstNode.id];
          currentNode.value = firstNode;
          thisNodePath.value = firstNode.nodePath || firstNode.title;
        }
      }
    };

    async function reload() {
      try {
        const res = await getTopStreeNodes();
        const nodes = Array.isArray(res) ? res : (res?.data || []);
        await loadFirstNodeAndExpand(nodes);
        isShow.value = false;
        treeData.value = nodes;
        await nextTick();
        isShow.value = true;
      } catch (error) {
        createMessage.error('获取服务树数据失败');
      }
    }

    async function addTopNode(): Promise<void> { openDrawer(true, { level: 1, pid: 0 }); };

    onMounted(() => {
      reload();
    });

    onActivated(() => {
      if (treeData.value.length === 0) {
        reload();
      }
    });

    async function handlerSuccess() {
      await reload();
      if (currentNode.value.id) {
        const pid = currentNode.value.pId || 0;
        const res = await getChildrenStreeNodes(pid);
        const updatedNode = res.find(item => item.id === currentNode.value.id);
        if (updatedNode) { currentNode.value = updatedNode; thisNodePath.value = updatedNode.nodePath || updatedNode.title; }
      }
    }

    const onSelect = (keys: any[], info: any) => {
      selectedKeys.value = keys;
      if (keys.length > 0) {
        const nodeData = info.node.dataRef;
        thisNodePath.value = nodeData.nodePath || nodeData.title;
        currentNode.value = nodeData;
      } else {
        thisNodePath.value = '请选择一个节点'; currentNode.value = {};
      }

    };

    const onLoadData = (treeNode: any) => {
      return new Promise<void>((resolve) => {
        if (treeNode.dataRef.children) return resolve();
        getChildrenStreeNodes(treeNode.dataRef.id).then((res) => {
          treeNode.dataRef.children = res; treeData.value = [...treeData.value]; resolve();
        }).catch(() => resolve());
      });
    };

    const onContextMenuClick = (treeKey, menuKey, id, level, children, isLeaf) => {
      if (menuKey == "1") { if (isLeaf) return createMessage.warning("不允许新增"); openDrawer(true, { level: level + 1, pid: id, title: treeKey }); }
      if (menuKey == "2") {
        if (children && children.length > 0) return createMessage.error("请先删除子节点");
        deleteStreeNode(id).then(() => {
          createMessage.success(`删除成功`);
          if (currentNode.value.id === id) { currentNode.value = {}; thisNodePath.value = '请选择一个节点'; }
          reload();
        }).catch(() => createMessage.error(`删除失败`));
      }
      if (menuKey === '3') { openModal(true, { ...(currentNode.value.id === id ? currentNode.value : { id, title: treeKey, level }) }); }
      if (menuKey === '4') {
        if (isLeaf) return createMessage.warning("叶子节点无法初始化标准架构，请选择父节点");
        const nodeOpsAdmins = (currentNode.value.id === id ? currentNode.value.ops_admin_users : []) || [];
        openInitModal(true, { id, title: treeKey, level, ops_admin_users: nodeOpsAdmins });
      }
    };

    const handleOpenInitModal = () => {
      if (!currentNode.value.id) return createMessage.warning('请先在左侧选择一个项目节点');
      if (currentNode.value.isLeaf) return createMessage.warning('当前节点为叶子节点，只能在非叶子节点(如项目/服务组)上批量初始化');
      openInitModal(true, {
        id: currentNode.value.id,
        title: currentNode.value.title,
        level: currentNode.value.level,
        ops_admin_users: currentNode.value.ops_admin_users || []
      });
    };

    const handleInitSuccess = async ({ parentId }: any) => {
      await reload();
      if (parentId) {
        if (!expandedKeys.value.includes(parentId)) {
          expandedKeys.value = [...expandedKeys.value, parentId];
        }
        try {
          const childRes = await getChildrenStreeNodes(parentId);
          const childList = Array.isArray(childRes) ? childRes : (childRes?.data || []);
          updateNodeInTree(treeData.value, parentId, { children: childList });
        } catch (e) {
          console.error(e);
        }
      }
    };

    return {
      isShow, treeData, onContextMenuClick, expandedKeys, selectedKeys, registerDrawer, addTopNode, handlerSuccess, reload, onLoadData, onSelect, thisNodePath, currentNode, activeKey, registerModal, showNodeModal, filterOption, isLeaf: isCurrentNodeLeaf, isTreeCollapsed,
      registerInitModal, handleOpenInitModal, handleInitSuccess,

      // ECS
      registerEcsBindModal, handleEcsBindSuccess,
      registerEcsUnbindModal, handleEcsUnbindSuccess,
      showEcsBindTranfer, showEcsUnBindTranfer, ecsTableRefreshKey,

      // ELB
      registerElbBindModal, handleElbBindSuccess,
      registerElbUnbindModal, handleElbUnbindSuccess,
      showElbBindTranfer, showElbUnBindTranfer, elbTableRefreshKey,

      // 🌟 RDS
      registerRdsBindModal, handleRdsBindSuccess,
      registerRdsUnbindModal, handleRdsUnbindSuccess,
      showRdsBindTranfer, showRdsUnBindTranfer, rdsTableRefreshKey,

      // 🌟 DNS
      registerDnsBindModal, handleDnsBindSuccess,
      registerDnsUnbindModal, handleDnsUnbindSuccess,
      showDnsBindTranfer, showDnsUnBindTranfer, dnsTableRefreshKey,

      hasPermission
    };
  },
});
</script>

<style scoped>
:deep(.ant-tree-switcher),
:deep(.ant-tree-node-content-wrapper) {
  line-height: 38px !important;
  min-height: 38px !important;
}

:deep(.ant-tree-node-content-wrapper) {
  display: inline-flex !important;
  align-items: center;
  width: calc(100% - 24px) !important;
}

:deep(.ant-tree-title) {
  flex: 1;
  width: 0;
}

:deep(.dns-transfer .ant-transfer-list-content-item) {
  height: auto !important;
  min-height: 46px !important;
  padding: 6px 12px !important;
  border-bottom: 1px dashed rgba(128, 128, 128, 0.12);
  transition: all 0.2s ease;
}

:deep(.dns-transfer .ant-transfer-list-content-item:hover) {
  background-color: rgba(24, 144, 255, 0.07) !important;
}

:deep(.dns-transfer .ant-transfer-list-content-item-text) {
  overflow: hidden;
  width: 100%;
}

:deep(.ant-btn-dangerous:focus),
:deep(.ant-btn-dangerous:focus-visible) {
  border-color: #ff4d4f !important;
  color: #ff4d4f !important;
}
</style>