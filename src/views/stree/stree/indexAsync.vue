<template>
  <div>
    <PageWrapper title="异步服务树" :content="`当前路径：${thisNodePath}`">
      <Row :gutter="16" type="flex" class="align-stretch">
        <!-- 服务树列表 -->
        <Col :span="isTreeCollapsed ? 0 : 6" v-show="!isTreeCollapsed" class="flex flex-col">
          <div class="bg-white p-4 rounded-md shadow-sm h-full flex flex-col">
            <div class="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
              <span class="text-base font-medium">节点树</span>
              <a-button type="primary" size="small" preIcon="ant-design:plus-outlined" @click="addTopNode()" v-auth="'POST:/api/stree/createStreeNode'">添加顶级节点</a-button>
            </div>

            <a-directory-tree 
              :tree-data="treeData" multiple block-node :load-data="onLoadData"
              @select="onSelect" v-if="isShow" v-model:expandedKeys="expandedKeys" 
              :field-names="{ title: 'title', key: 'id' }"
            >
              <template #title="{ key: treeKey, title, id, level, children, isLeaf }">
                <a-dropdown :trigger="['contextmenu']">
                  <span class="block w-full select-none truncate">{{ title }}</span>
                  <template #overlay>
                    <a-menu @click="({ key: menuKey }) => onContextMenuClick(title, menuKey, id, level, children, isLeaf)">
                      <a-menu-item key="1" v-if="!isLeaf&&hasPermission('POST:/api/stree/createStreeNode')" ><Icon icon="ant-design:plus-outlined" class="mr-2" color="#55D187" />新增节点</a-menu-item>
                      <a-menu-item key="2" v-if="hasPermission('DELETE:/api/stree/deleteStreeNode/:id')"><Icon icon="ant-design:delete-outlined" class="mr-2" color="#F56C6C" />删除节点</a-menu-item>
                      <a-menu-item key="3" v-if="hasPermission('POST:/api/stree/updateStreeNode')"><Icon icon="clarity:note-edit-line" class="mr-2" color="#E6A23C" />编辑节点</a-menu-item>
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

            <a-tabs v-model:activeKey="activeKey" >
              <a-tab-pane key="1">
                <template #tab><span><info-circle-outlined />节点详情</span></template>
                <div class="mt-4" v-if="currentNode.id && activeKey === '1'">
                  <a-button type="primary" @click="showNodeModal">修改节点属性</a-button>
                  <a-descriptions title="详细信息" bordered :column="1" :labelStyle="{ width: '120px', textAlign: 'right' }" :contentStyle="{ background: '#fff' }">
                    <a-descriptions-item label="节点名称">{{ currentNode.title }}</a-descriptions-item>
                    <a-descriptions-item label="节点等级">{{ currentNode.level }}</a-descriptions-item>
                    <a-descriptions-item label="运维负责人">
                      <Tag v-for="(user, index) in currentNode.ops_admin_users" :key="index" color="orange">{{ user }}</Tag>
                    </a-descriptions-item>
                    <a-descriptions-item label="节点描述"><span class="text-gray-600">{{ currentNode.desc || '暂无描述' }}</span></a-descriptions-item>
                    <a-descriptions-item label="资源统计">
                      <div class="flex items-center gap-6">
                        <div><span class="text-gray-500 mr-2">ECS:</span><Tag color="cyan" v-if="currentNode.ecsNum > 0">{{ currentNode.ecsNum }} 台</Tag><span v-else class="text-gray-400">0 台</span></div>
                        <div><span class="text-gray-500 mr-2">ELB:</span><Tag color="orange" v-if="currentNode.elbNum > 0">{{ currentNode.elbNum }} 个</Tag><span v-else class="text-gray-400">0 个</span></div>
                        <div><span class="text-gray-500 mr-2">RDS:</span><Tag color="green" v-if="currentNode.rdsNum > 0">{{ currentNode.rdsNum }} 个</Tag><span v-else class="text-gray-400">0 个</span></div>
                        <div><span class="text-gray-500 mr-2">DNS:</span><Tag color="cyan" v-if="currentNode.dnsNum > 0">{{ currentNode.dnsNum }} 条</Tag><span v-else class="text-gray-400">0 条</span></div>
                      </div>
                    </a-descriptions-item>
                  </a-descriptions>
                  <div class="mt-4" v-if="currentNode.id"> 
                    <div class="text-base font-medium mb-4">资源分布统计</div>
                    <EcsVendorChart :node="currentNode" />
                    <a-divider />
                    <ElbVendorChart :node="currentNode" />
                    <RdsVendorChart :node="currentNode" />
                    <DnsVendorChart :node="currentNode" />
                    
                  </div>
                </div>
              </a-tab-pane>

              <a-tab-pane key="2">
                <template #tab><span><cloud-server-outlined /> ECS列表</span></template>
                <div class="p-4 overflow-hidden">
                  <a-space v-if="isLeaf && !showEcsBindTranferIf && !showEcsUnBindTranferIf">
                    <a-button type="primary" @click="showEcsBindTranfer" v-auth="'POST:/api/stree/bindEcsToStreeNode'">打开 ECS 资源绑定</a-button>
                    <a-button type="primary" danger @click="showEcsUnBindTranfer" v-auth="'POST:/api/stree/unBindEcsToStreeNode'">打开 ECS 资源解绑</a-button>
                  </a-space>
                  <div v-else-if="!isLeaf && !showEcsBindTranferIf && !showEcsUnBindTranferIf" class="text-gray-400 p-4">
                    <info-circle-outlined class="mr-2" />请在服务树中选择一个【叶子节点】来管理资源
                  </div>
                  
                  <a-transfer v-if="showEcsBindTranferIf" :titles="['待绑定','选中绑定']" :data-source="ecsListData" :render="record => record.title" show-search :filter-option="filterOption" :target-keys="ecsBindTargetKeys" @change="ecsBindHandleChange" @search="ecsBindHandleSelectChange" :list-style="{ width: '550px',height: '450px' }" />
                  <a-transfer v-if="showEcsUnBindTranferIf" :titles="['当前已绑定','选中解绑']" :data-source="ecsUnBindListData" :render="record => record.title" show-search :filter-option="filterOption" :target-keys="ecsUnBindTargetKeys" @change="ecsUnBindHandleChange" @search="ecsUnBindHandleSelectChange" :list-style="{ width: '550px', height: '450px' }" />
                  <a-divider v-if="showEcsBindTranferIf || showEcsUnBindTranferIf"/>
                  <a-space v-if="showEcsBindTranferIf"><a-button type="primary" @click="sendEcsBind">确认绑定</a-button><a-button @click="closeEcsBindTranfer">取消</a-button></a-space>
                  <a-space v-if="showEcsUnBindTranferIf"><a-button type="primary" danger @click="sendEcsUnBind">确认解绑</a-button><a-button @click="closeEcsUnBindTranfer">取消</a-button></a-space>
                  <div class="mt-4" v-if="currentNode.id && activeKey === '2'"><EcsTable :nodeId="currentNode.id" :refreshKey="ecsTableRefreshKey" /></div>
                </div>
              </a-tab-pane>

              <a-tab-pane key="3">
                <template #tab><span><database-outlined /> ELB列表</span></template>
                <div class="p-4 overflow-hidden">
                  <a-space v-if="isLeaf && !showElbBindTranferIf && !showElbUnBindTranferIf">
                    <a-button type="primary" @click="showElbBindTranfer" v-auth="'POST:/api/stree/bindElbToStreeNode'">打开 ELB 资源绑定</a-button>
                    <a-button type="primary" danger @click="showElbUnBindTranfer" v-auth="'POST:/api/stree/unBindElbToStreeNode'">打开 ELB 资源解绑</a-button>

                  </a-space>
                  <div v-else-if="!isLeaf && !showElbBindTranferIf && !showElbUnBindTranferIf" class="text-gray-400 p-4">
                    <info-circle-outlined class="mr-2" />请在服务树中选择一个【叶子节点】来管理资源
                  </div>

                  <a-transfer v-if="showElbBindTranferIf" :titles="['待绑定','选中绑定']" :data-source="elbListData" :render="record => record.title" show-search :filter-option="filterOption" :target-keys="elbBindTargetKeys" @change="elbBindHandleChange" @search="elbBindHandleSelectChange" :list-style="{ width: '550px',height: '450px' }" />
                  <a-transfer v-if="showElbUnBindTranferIf" :titles="['当前已绑定','选中解绑']" :data-source="elbUnBindListData" :render="record => record.title" show-search :filter-option="filterOption" :target-keys="elbUnBindTargetKeys" @change="elbUnBindHandleChange" @search="elbUnBindHandleSelectChange" :list-style="{ width: '550px', height: '450px' }" />
                  <a-divider v-if="showElbBindTranferIf || showElbUnBindTranferIf"/>
                  <a-space v-if="showElbBindTranferIf"><a-button type="primary" @click="sendElbBind">确认绑定</a-button><a-button @click="closeElbBindTranfer">取消</a-button></a-space>
                  <a-space v-if="showElbUnBindTranferIf"><a-button type="primary" danger @click="sendElbUnBind">确认解绑</a-button><a-button @click="closeElbUnBindTranfer">取消</a-button></a-space>
                  <div class="mt-4" v-if="currentNode.id && activeKey === '3'"><ElbTable :nodeId="currentNode.id" :refreshKey="elbTableRefreshKey" /></div>
                </div>
              </a-tab-pane>

              <a-tab-pane key="4">
                <template #tab><span><global-outlined /> DNS列表</span></template>
                <div class="p-4 overflow-hidden" v-if="currentNode.id && activeKey === '4'">
                  <DnsTable :nodeId="currentNode.id" :refreshKey="dnsTableRefreshKey" />
                </div>
              </a-tab-pane>

              <a-tab-pane key="5">
                <template #tab><span><database-outlined /> RDS列表</span></template>
                <div class="p-4 overflow-hidden">
                  <a-space v-if="isLeaf && !showRdsBindTranferIf && !showRdsUnBindTranferIf">
                    <a-button type="primary" @click="showRdsBindTranfer" v-auth="'POST:/api/stree/bindRdsToStreeNode'">打开 RDS 资源绑定</a-button>
                    <a-button type="primary" danger @click="showRdsUnBindTranfer" v-auth="'POST:/api/stree/unBindRdsToStreeNode'">打开 RDS 资源解绑</a-button>
                  </a-space>
                  <div v-else-if="!isLeaf && !showRdsBindTranferIf && !showRdsUnBindTranferIf" class="text-gray-400 p-4">
                    <info-circle-outlined class="mr-2" />请在服务树中选择一个【叶子节点】来管理资源
                  </div>

                  <a-transfer v-if="showRdsBindTranferIf" :titles="['待绑定','选中绑定']" :data-source="rdsListData" :render="record => record.title" show-search :filter-option="filterOption" :target-keys="rdsBindTargetKeys" @change="rdsBindHandleChange" @search="rdsBindHandleSelectChange" :list-style="{ width: '550px',height: '450px' }" />
                  <a-transfer v-if="showRdsUnBindTranferIf" :titles="['当前已绑定','选中解绑']" :data-source="rdsUnBindListData" :render="record => record.title" show-search :filter-option="filterOption" :target-keys="rdsUnBindTargetKeys" @change="rdsUnBindHandleChange" @search="rdsUnBindHandleSelectChange" :list-style="{ width: '550px', height: '450px' }" />
                  <a-divider v-if="showRdsBindTranferIf || showRdsUnBindTranferIf"/>
                  
                  <a-space v-if="showRdsBindTranferIf">
                    <a-button type="primary" @click="sendRdsBind" auth="POST:/api/stree/bindRdsToStreeNode">确认绑定</a-button>
                    <a-button @click="closeRdsBindTranfer">取消</a-button>
                  </a-space>
                  <a-space v-if="showRdsUnBindTranferIf">
                    <a-button type="primary" danger @click="sendRdsUnBind">确认解绑</a-button>
                    <a-button @click="closeRdsUnBindTranfer">取消</a-button>
                  </a-space>

                  <div class="mt-4" v-if="currentNode.id && activeKey === '5'">
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
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, nextTick } from 'vue';
import { PageWrapper } from '@/components/Page';
import { Row, Col, Tree, Dropdown, Menu, Space, Empty, Tabs, Card, Descriptions, Tag, Transfer, Divider } from 'ant-design-vue';
import { CloudServerOutlined, DatabaseOutlined, InfoCircleOutlined, GlobalOutlined } from '@ant-design/icons-vue';
import Icon from '@/components/Icon/Icon.vue';
import { usePermission } from '@/hooks/web/usePermission';
import { 
  deleteStreeNode, getTopStreeNodes, getChildrenStreeNodes, 
  getResourceEcsUnbindList, bindEcsToStreeNode, unBindEcsToStreeNode, 
  getResourceElbUnbindList, bindElbToStreeNode, unBindElbToStreeNode,
  getResourceRdsUnbindList, bindRdsToStreeNode, unBindRdsToStreeNode
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
import { useModal } from '@/components/Modal';
import EcsTable from './EcsTable.vue';
import ElbTable from './ElbTable.vue';
import DnsTable from './DnsTable.vue';
import RdsTable from './RdsTable.vue';

export default defineComponent({
  name: 'DemoTree',
  components: {
    ADirectoryTree: Tree.DirectoryTree, ADropdown: Dropdown,Col,Row,
    AMenu: Menu, AMenuItem: Menu.Item, AEmpty: Empty, ATabs: Tabs, ATabPane: Tabs.TabPane,
    Card, ADescriptions: Descriptions, ADescriptionsItem: Descriptions.Item,Tag,
    ATransfer: Transfer, ADivider: Divider, ASpace: Space, PageWrapper,
    Icon, Space, StreeDrawer, DatabaseOutlined, CloudServerOutlined, InfoCircleOutlined, GlobalOutlined,
    TreeNodeModal, EcsTable, ElbTable, DnsTable, RdsTable, EcsVendorChart, ElbVendorChart, DnsVendorChart, RdsVendorChart
  },
  setup() {
    const isTreeCollapsed = ref(false);
    const { hasPermission } = usePermission();
    // ================== ECS / ELB 变量保持不变 ==================
    const showEcsBindTranferIf = ref(false); const ecsListData = ref<any[]>([]); const ecsBindTargetKeys = ref<string[]>([]); const ecsBindselectedKeys = ref<string[]>([]);
    const showEcsUnBindTranferIf = ref(false); const ecsUnBindListData = ref<any[]>([]); const ecsUnBindTargetKeys = ref<string[]>([]); const ecsUnBindselectedKeys = ref<string[]>([]);
    const ecsTableRefreshKey = ref(0);

    const showElbBindTranferIf = ref(false); const elbListData = ref<any[]>([]); const elbBindTargetKeys = ref<string[]>([]); const elbBindselectedKeys = ref<string[]>([]);
    const showElbUnBindTranferIf = ref(false); const elbUnBindListData = ref<any[]>([]); const elbUnBindTargetKeys = ref<string[]>([]); const elbUnBindselectedKeys = ref<string[]>([]);
    const elbTableRefreshKey = ref(0);

    const dnsTableRefreshKey = ref(0);

    // 🌟 ================== 新增 RDS 相关变量 ==================
    const showRdsBindTranferIf = ref(false);
    const rdsListData = ref<any[]>([]);
    const rdsBindTargetKeys = ref<string[]>([]);
    const rdsBindselectedKeys = ref<string[]>([]);

    const showRdsUnBindTranferIf = ref(false);
    const rdsUnBindListData = ref<any[]>([]);
    const rdsUnBindTargetKeys = ref<string[]>([]);
    const rdsUnBindselectedKeys = ref<string[]>([]);
    const rdsTableRefreshKey = ref(0);

    // ================== 基础状态 ==================
    const activeKey = ref('1');
    const isShow = ref(false);
    const treeData = ref<TreeItem[]>([]);
    const expandedKeys = ref<string[]>(['0-0', '0-1','0-2']);
    const [registerModal, { openModal }] = useModal();
    const [registerDrawer,{openDrawer}] = useDrawer();
    const { createMessage } = useMessage();
    const currentNode = ref<any>({});
    const thisNodePath = ref<string>('请选择一个节点');
    
    const isCurrentNodeLeaf = computed(() => { return currentNode.value && currentNode.value.isLeaf === true; });
    const showNodeModal = () => { if (!currentNode.value.id) return createMessage.warning('请先选择一个节点'); openModal(true, { ...currentNode.value }); };
    const filterOption = (inputValue: string, option: any) => option.title.indexOf(inputValue) > -1;


    const ecsBindHandleChange = (nextTargetKeys: string[]) => { ecsBindTargetKeys.value = nextTargetKeys; };
    const ecsBindHandleSelectChange = (sourceSelectedKeys: string[], targetSelectedKeys: string[]) => { ecsBindselectedKeys.value = [...sourceSelectedKeys, ...targetSelectedKeys]; };
    const ecsUnBindHandleChange = (nextTargetKeys: string[]) => { ecsUnBindTargetKeys.value = nextTargetKeys; };
    const ecsUnBindHandleSelectChange = (sourceSelectedKeys: string[], targetSelectedKeys: string[]) => { ecsUnBindselectedKeys.value = [...sourceSelectedKeys, ...targetSelectedKeys]; };
    const showEcsBindTranfer = () => { if (!currentNode.value.id) return createMessage.warning('请选择节点'); getResourceEcsUnbindList().then(res => { ecsListData.value = res.map(item => ({ ...item, key: String(item.id), title: `${item.title || item.instanceName} [${item.PrivateIpAddress?.[0] || '无IP'}] ${item.account_name}` })); showEcsBindTranferIf.value = true; }); };
    const showEcsUnBindTranfer = () => { ecsUnBindListData.value = (currentNode.value.bind_ecss || []).map(item => ({ ...item, key: String(item.id), title: `${item.title || item.instanceName} [${item.PrivateIpAddress?.[0] || '无IP'}] ${item.account_name}` })); showEcsUnBindTranferIf.value = true; };
    const sendEcsBind = async () => { if (!ecsBindTargetKeys.value.length) return; await bindEcsToStreeNode({ node_id: currentNode.value.id, resource_ids: ecsBindTargetKeys.value }); createMessage.success('绑定成功'); closeEcsBindTranfer(); refreshCurrentNode(); ecsTableRefreshKey.value++; };
    const sendEcsUnBind = async () => { if (!ecsUnBindTargetKeys.value.length) return; await unBindEcsToStreeNode({ node_id: currentNode.value.id, resource_ids: ecsUnBindTargetKeys.value }); createMessage.success('解绑成功'); closeEcsUnBindTranfer(); refreshCurrentNode(); ecsTableRefreshKey.value++; };
    const closeEcsBindTranfer = () => { showEcsBindTranferIf.value = false; ecsBindTargetKeys.value = []; ecsBindselectedKeys.value = []; };
    const closeEcsUnBindTranfer = () => { showEcsUnBindTranferIf.value = false; ecsUnBindTargetKeys.value = []; ecsUnBindselectedKeys.value = []; };

    const elbBindHandleChange = (nextTargetKeys: string[]) => { elbBindTargetKeys.value = nextTargetKeys; };
    const elbBindHandleSelectChange = (s: string[], t: string[]) => { elbBindselectedKeys.value = [...s, ...t]; };
    const elbUnBindHandleChange = (nextTargetKeys: string[]) => { elbUnBindTargetKeys.value = nextTargetKeys; };
    const elbUnBindHandleSelectChange = (s: string[], t: string[]) => { elbUnBindselectedKeys.value = [...s, ...t]; };
    const showElbBindTranfer = () => { if (!currentNode.value.id) return createMessage.warning('请选择节点'); getResourceElbUnbindList().then(res => { elbListData.value = res.map(item => ({ ...item, key: String(item.id), title: `${item.loadBalancerName || item.id} [${item.PublicIpAddresses?.[0] || '内网'}] ${item.account_name}` })); showElbBindTranferIf.value = true; }); };
    const showElbUnBindTranfer = () => { elbUnBindListData.value = (currentNode.value.bind_elbs || []).map(item => ({ ...item, key: String(item.id), title: `${item.loadBalancerName || item.id} [${item.PublicIpAddresses?.[0] || '内网'}] ${item.account_name}` })); showElbUnBindTranferIf.value = true; };
    const closeElbBindTranfer = () => { showElbBindTranferIf.value = false; elbBindTargetKeys.value = []; };
    const closeElbUnBindTranfer = () => { showElbUnBindTranferIf.value = false; elbUnBindTargetKeys.value = []; };
    const sendElbBind = async () => { if (!elbBindTargetKeys.value.length) return; await bindElbToStreeNode({ node_id: currentNode.value.id, resource_ids: elbBindTargetKeys.value }); createMessage.success('绑定成功'); closeElbBindTranfer(); refreshCurrentNode(); elbTableRefreshKey.value++; };
    const sendElbUnBind = async () => { if (!elbUnBindTargetKeys.value.length) return; await unBindElbToStreeNode({ node_id: currentNode.value.id, resource_ids: elbUnBindTargetKeys.value }); createMessage.success('解绑成功'); closeElbUnBindTranfer(); refreshCurrentNode(); elbTableRefreshKey.value++; };

    // 🌟 ================== 新增 RDS 交互逻辑 ==================
    const rdsBindHandleChange = (nextTargetKeys: string[]) => { rdsBindTargetKeys.value = nextTargetKeys; };
    const rdsBindHandleSelectChange = (s: string[], t: string[]) => { rdsBindselectedKeys.value = [...s, ...t]; };
    const rdsUnBindHandleChange = (nextTargetKeys: string[]) => { rdsUnBindTargetKeys.value = nextTargetKeys; };
    const rdsUnBindHandleSelectChange = (s: string[], t: string[]) => { rdsUnBindselectedKeys.value = [...s, ...t]; };

    const showRdsBindTranfer = () => {
      if (!currentNode.value.id) return createMessage.warning('请先选择一个节点');
      getResourceRdsUnbindList().then((res) => {
        rdsListData.value = res.map(item => ({
          ...item,
          key: String(item.id),
          title: `${item.name || item.DBInstanceId} [${item.engine}] ${item.account_name}`
        }));
      });
      showRdsBindTranferIf.value = true;
    };

    const showRdsUnBindTranfer = () => {
      // 获取当前节点关联的 RDS 数据
      const rawData = currentNode.value.bind_rdss || []; 
      rdsUnBindListData.value = rawData.map(item => ({
        ...item,
        key: String(item.id),
        title: `${item.name || item.DBInstanceId} [${item.engine}] ${item.account_name}`
      }));
      showRdsUnBindTranferIf.value = true;
    };

    const closeRdsBindTranfer = () => { showRdsBindTranferIf.value = false; rdsBindTargetKeys.value = []; rdsBindselectedKeys.value = []; };
    const closeRdsUnBindTranfer = () => { showRdsUnBindTranferIf.value = false; rdsUnBindTargetKeys.value = []; rdsUnBindselectedKeys.value = []; };

    const sendRdsBind = async () => {
      if (rdsBindTargetKeys.value.length === 0) return createMessage.warning('请至少选择一个 RDS 资源进行绑定');
      try {
        await bindRdsToStreeNode({ node_id: currentNode.value.id, resource_ids: rdsBindTargetKeys.value });
        createMessage.success(`已成功绑定 ${rdsBindTargetKeys.value.length} 个 RDS`);
        closeRdsBindTranfer();
        await refreshCurrentNode();
        rdsTableRefreshKey.value += 1;
      } catch (error) {}
    };

    const sendRdsUnBind = async () => {
      if (rdsUnBindTargetKeys.value.length === 0) return createMessage.warning('请至少选择一个 RDS 资源进行解绑');
      try {
        await unBindRdsToStreeNode({ node_id: currentNode.value.id, resource_ids: rdsUnBindTargetKeys.value });
        createMessage.success(`已成功解绑 ${rdsUnBindTargetKeys.value.length} 个 RDS`);
        closeRdsUnBindTranfer();
        await refreshCurrentNode();
        rdsTableRefreshKey.value += 1;
      } catch (error) {}
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

    async function reload() {
      try {
        const res = await getTopStreeNodes();
        isShow.value = false; treeData.value = res;
        await nextTick(); isShow.value = true;
      } catch (error) { createMessage.error('获取服务树数据失败'); }
    }

    async function addTopNode(): Promise<void> { openDrawer(true, { level: 1, pid: 0 }); };
    getTopStreeNodes().then((res) => { treeData.value = res.data || res; isShow.value = true; });

    async function handlerSuccess() {
      await reload(); 
      if (currentNode.value.id) {
        const pid = currentNode.value.pId || 0;
        const res = await getChildrenStreeNodes(pid); 
        const updatedNode = res.find(item => item.id === currentNode.value.id);
        if (updatedNode) { currentNode.value = updatedNode; thisNodePath.value = updatedNode.nodePath || updatedNode.title; }
      }
    }

    const onSelect = (selectedKeys: any[], info: any) => {
      if (selectedKeys.length > 0) {
        const nodeData = info.node.dataRef;
        thisNodePath.value = nodeData.nodePath || nodeData.title;
        currentNode.value = nodeData;
      } else {
        thisNodePath.value = '请选择一个节点'; currentNode.value = {};
      }
      // 切换节点时关掉所有的弹窗
      closeEcsBindTranfer(); closeEcsUnBindTranfer();
      closeElbBindTranfer(); closeElbUnBindTranfer();
      closeRdsBindTranfer(); closeRdsUnBindTranfer(); // 🌟 关掉 RDS 弹窗
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
      if (menuKey=="1"){ if (isLeaf) return createMessage.warning("不允许新增"); openDrawer(true, { level: level + 1, pid: id, title: treeKey }); }
      if (menuKey=="2"){
        if (children && children.length > 0) return createMessage.error("请先删除子节点");
        deleteStreeNode(id).then(() => {
          createMessage.success(`删除成功`);
          if (currentNode.value.id === id) { currentNode.value = {}; thisNodePath.value = '请选择一个节点'; }
          reload();
        }).catch(() => createMessage.error(`删除失败`));
      }
      if (menuKey === '3') { openModal(true, { ...(currentNode.value.id === id ? currentNode.value : { id, title: treeKey, level }) }); }
    };

    return {
      isShow, treeData, onContextMenuClick, expandedKeys, registerDrawer, addTopNode, handlerSuccess, reload, onLoadData, onSelect, thisNodePath, currentNode, activeKey, registerModal, showNodeModal, filterOption, isLeaf: isCurrentNodeLeaf, isTreeCollapsed,

      // ECS
      showEcsBindTranfer, showEcsUnBindTranfer, closeEcsBindTranfer, closeEcsUnBindTranfer, showEcsBindTranferIf, showEcsUnBindTranferIf, ecsListData, ecsUnBindListData, ecsBindTargetKeys, ecsBindselectedKeys, ecsUnBindTargetKeys, ecsUnBindselectedKeys, ecsBindHandleChange, ecsUnBindHandleChange, ecsBindHandleSelectChange, ecsUnBindHandleSelectChange, sendEcsBind, sendEcsUnBind, ecsTableRefreshKey,

      // ELB
      showElbBindTranfer, showElbUnBindTranfer, closeElbBindTranfer, closeElbUnBindTranfer, showElbBindTranferIf, showElbUnBindTranferIf, elbListData, elbUnBindListData, elbBindTargetKeys, elbBindselectedKeys, elbUnBindTargetKeys, elbUnBindselectedKeys, elbBindHandleChange, elbUnBindHandleChange, elbBindHandleSelectChange, elbUnBindHandleSelectChange, sendElbBind, sendElbUnBind, elbTableRefreshKey, dnsTableRefreshKey,

      // 🌟 RDS
      showRdsBindTranfer, showRdsUnBindTranfer, closeRdsBindTranfer, closeRdsUnBindTranfer,
      showRdsBindTranferIf, showRdsUnBindTranferIf, rdsListData, rdsUnBindListData,
      rdsBindTargetKeys, rdsBindselectedKeys, rdsUnBindTargetKeys, rdsUnBindselectedKeys,
      rdsBindHandleChange, rdsUnBindHandleChange, rdsBindHandleSelectChange, rdsUnBindHandleSelectChange,
      sendRdsBind, sendRdsUnBind, rdsTableRefreshKey,
      hasPermission
    };
  },
});
</script>

<style scoped>
:deep(.ant-tree-switcher), :deep(.ant-tree-node-content-wrapper) { line-height: 38px !important; min-height: 38px !important; }
:deep(.ant-tree-node-content-wrapper) { display: inline-flex !important; align-items: center; width: calc(100% - 24px) !important; }
:deep(.ant-tree-title) { flex: 1; width: 0; }
</style>