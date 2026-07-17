<template>
  <div>
    <PageWrapper title="服务树展示">
      <div class="mt-4">

          <a-button 
            type="primary" 
            size="small"
            preIcon="ant-design:plus-outlined"
            @click="addTopNode()"
          >添加顶级节点</a-button>
      </div>
    
      <a-row>
        <a-col :span="8">
          <a-directory-tree :tree-data="treeData" multiple block-node v-if="isShow"
            v-model:expandedKeys="expandedKeys"
            :field-names="{ title: 'title', key: 'id' }"
            >
            
            <template #title="{ key: treeKey, title, id, level, children, isLeaf }">
              
              <a-dropdown :trigger="['contextmenu']">
                <span class="block w-full select-none truncate">{{ title }}</span>
                <template #overlay>
                  <a-menu @click="({ key: menuKey }) => onContextMenuClick(title, menuKey, id, level, children, isLeaf)">
                    <a-menu-item key="1" v-if="!isLeaf"><Icon icon="ant-design:plus-outlined" class="mr-2" color="#55D187" />新增节点</a-menu-item>
                    <a-menu-item key="2"><Icon icon="ant-design:delete-outlined" class="mr-2" color="#F56C6C" />删除节点</a-menu-item>
                    <a-menu-item key="3"><Icon icon="clarity:note-edit-line" class="mr-2" color="#E6A23C" />编辑节点</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </template>
          </a-directory-tree>
        </a-col>
      </a-row>
    </PageWrapper>
    <StreeDrawer @register="registerDrawer" @success="handlerSuccess" />
  </div>
</template>

<!-- <template>
  <div>
    <PageWrapper title="服务树展示" content="在这里管理您的基础架构和服务节点层级。">
      
      <a-row :gutter="16">
        <a-col :span="5">
          <div class="bg-white p-4 rounded-md shadow-sm min-h-[600px]">
            
            <div class="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <span class="text-base font-medium">节点树</span>
              <a-button 
                type="primary" 
                size="small"
                preIcon="ant-design:plus-outlined"
                @click="addTopNode()"
              >添加顶级节点</a-button>
            </div>

            <a-directory-tree 
              :tree-data="treeData" 
              multiple 
              block-node 
              v-if="isShow"
              v-model:expandedKeys="expandedKeys" 
            >
              <template #title="{ key: treeKey, title, id, level, children }">
                <a-dropdown :trigger="['contextmenu']">
                  <span class="block w-full select-none truncate">{{ title }}</span>
                  <template #overlay>
                    <a-menu @click="({ key: menuKey }) => onContextMenuClick(title, menuKey, id, level, children)">
                      <a-menu-item key="1"><Icon icon="ant-design:plus-outlined" class="mr-2" color="#55D187" />新增节点</a-menu-item>
                      <a-menu-item key="2"><Icon icon="ant-design:delete-outlined" class="mr-2" color="#F56C6C" />删除节点</a-menu-item>
                      <a-menu-item key="3"><Icon icon="clarity:note-edit-line" class="mr-2" color="#E6A23C" />编辑节点</a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </template>
            </a-directory-tree>
            
            <a-empty v-if="isShow && treeData.length === 0" description="暂无节点数据" class="mt-10" />
          </div>
        </a-col>

        <a-col :span="19">
          <div class="bg-white p-4 rounded-md shadow-sm flex items-center justify-center min-h-[600px]">
            <a-empty description="请在左侧选择服务节点以查看或配置详情" />
          </div>
        </a-col>
      </a-row>

    </PageWrapper>

    <StreeDrawer @register="registerDrawer" @success="handlerSuccess" />
  </div>
</template> -->


<script lang="ts">
import { defineComponent,  ref } from 'vue';
import { PageWrapper } from '@/components/Page';
import { Row, Col, Tree, Dropdown, Menu, Space, Empty } from 'ant-design-vue';
import Icon from '@/components/Icon/Icon.vue';
import { deleteStreeNode, getStreeNodeList } from '@/api/demo/system';
import type { TreeItem } from '@/components/Tree';
import StreeDrawer from './StreeDrawer.vue';
import { useDrawer } from '@/components/Drawer';
import { useMessage } from '@/hooks/web/useMessage';

export default defineComponent({
  name: 'DemoTree',
  components: {
    ARow: Row,
    ACol: Col,
    ADirectoryTree: Tree.DirectoryTree, // DirectoryTree 是 Tree 的子属性
    ADropdown: Dropdown,
    AMenu: Menu,
    AMenuItem: Menu.Item,
    AEmpty: Empty,
    PageWrapper,
    Icon,
    Space,
    StreeDrawer
  },
  setup() {
    const isShow = ref(false);
    const treeData = ref<TreeItem[]>([]);
    const expandedKeys = ref<string[]>(['0-0', '0-1','0-2']);
    // const selectedKeys = ref<string[]>([]);

    const [ registerDrawer, { openDrawer } ] = useDrawer();
    const { createMessage } = useMessage();

    /**
     * 🌟 核心：实现类似 Vben 的 reload 方法
     * 作用：重新获取后端数据并更新树形视图
     */
    async function reload() {
      try {
        // 开启加载状态（如果需要可以加 loading 变量）
        const res = await getStreeNodeList();
        treeData.value = res.data || res;
        isShow.value = true;
      } catch (error) {
        createMessage.error('获取服务树数据失败');
      }
    }


    async function addTopNode(): Promise<void> {
      openDrawer(true, {
        level: 1,
        pid: 0
      });
    };


    getStreeNodeList().then((res) => {
      treeData.value = res.data || res; // 根据实际返回结构调整
      isShow.value = true; // 数据加载完成后显示树组件
    })


    function handlerSuccess(){
      reload();
    }

    const onContextMenuClick = (treeKey, menuKey, id, level, children, isLeaf) => {
      if (menuKey=="1"){
        if (isLeaf) {
          createMessage.warning("该节点是叶子节点，不允许新增子节点");
          return;
        }
        // 新增节点
        openDrawer(true, {
          level: level + 1,
          pid: id,
          title: treeKey
        });
      }
      console.log(`treeKey: ${treeKey}, menuKey: ${menuKey} id: ${id} level: ${level} children: ${children}`);
      if (menuKey=="2"){
        if(children != null){
          createMessage.error("存在子节点，请先删除子节点");
          return
        }
        // 删除节点
        deleteStreeNode(id).then(() => {
          createMessage.success(`删除节点成功 ${treeKey} id=${id}`);
          reload();
        }).catch(() => {
          createMessage.error(`删除节点失败 ${treeKey} id=${id}`);
        })
      }
      
    };

    return {
      isShow,
      treeData,
      onContextMenuClick,
      expandedKeys,
      registerDrawer,
      addTopNode,
      handlerSuccess,
      reload
    };
  },
});
</script>



<style scoped>
/* 1. 统一调整箭头和内容区的高度，使用原生行高完美居中，不破坏DOM结构 */
:deep(.ant-tree-switcher),
:deep(.ant-tree-node-content-wrapper) {
  line-height: 38px !important;
  min-height: 38px !important;
}

/* 2. 核心修复：内容区必须是 inline-flex（保证跟在箭头同行），并且宽度减去箭头的 24px，防止被挤到下一行 */
:deep(.ant-tree-node-content-wrapper) {
  display: inline-flex !important;
  align-items: center;
  width: calc(100% - 24px) !important; 
}

/* 3. 标题区域占满剩余空间，支持文字省略并触发右键热区 */
:deep(.ant-tree-title) {
  flex: 1;
  width: 0;
}



</style>