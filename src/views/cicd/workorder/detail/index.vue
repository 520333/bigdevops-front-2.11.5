<template>
  <PageWrapper :title="detail?.title || '发布工单详情'" @back="router.back()" content="">
    <template #extra>
      <Space>
        <Button type="primary" ghost @click="message.info('发起评审')">发起评审</Button>
        <Button @click="message.info('打印工单')">打印</Button>
        <Dropdown>
          <Button>更多 <DownOutlined /></Button>
          <template #overlay>
            <Menu>
              <MenuItem @click="message.info('申请回滚')">申请回滚</MenuItem>
              <MenuItem @click="message.info('复制工单')">复制工单</MenuItem>
              <MenuDivider />
              <MenuItem danger @click="message.warning('关闭工单')">关闭工单</MenuItem>
            </Menu>
          </template>
        </Dropdown>
      </Space>
    </template>

    <Spin :spinning="loading">
      <!-- 基础信息卡片 -->
      <Card class="mb-3" :bordered="false">
        <a-descriptions title="基础信息" :column="2" size="small" bordered>
          <a-descriptions-item label="计划发布日期">
            <span class="font-medium">{{ detail?.planAt }}</span>
          </a-descriptions-item>
          <a-descriptions-item label="发布类型">
            <span>{{ detail?.type }}</span>
          </a-descriptions-item>
          <a-descriptions-item label="发布环境">
            <Tag :color="envColorMap[detail?.envKey || ''] || 'default'">{{ detail?.env }}</Tag>
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">
            <span>{{ detail?.createdAt }}</span>
          </a-descriptions-item>
          <a-descriptions-item label="创建者">
            <span>{{ detail?.creator }}</span>
          </a-descriptions-item>
          <a-descriptions-item label="当前状态">
            <Badge
              :status="statusBadgeMap[detail?.status || 'pending']"
              :text="detail?.statusText"
              class="font-medium"
            />
          </a-descriptions-item>
        </a-descriptions>
      </Card>


      <!-- Tab 内容区 -->
      <Card :bordered="false" size="small">
        <Tabs v-model:activeKey="activeTab" type="card">
          <TabPane key="desc" tab="发布方案描述">
            <TabDesc v-if="detail" :description="detail.description" />
          </TabPane>

          <TabPane key="apps" force-render>
            <template #tab>
              应用清单
              <Badge v-if="detail?.apps?.length" :count="detail.apps.length" class="ml-1" :number-style="{ backgroundColor: '#1890ff' }" />
            </template>
            <TabAppList v-if="detail" :apps="detail.apps" />
          </TabPane>

          <TabPane key="nacos" force-render>
            <template #tab>
              NACOS列表
              <Badge v-if="detail?.nacosChanges?.length" :count="detail.nacosChanges.length" class="ml-1" :number-style="{ backgroundColor: '#fa8c16' }" />
            </template>
            <TabNacos v-if="detail" :nacosChanges="detail.nacosChanges" />
          </TabPane>

          <TabPane key="sql" force-render>
            <template #tab>
              SQL列表
              <Badge v-if="detail?.sqlChanges?.length" :count="detail.sqlChanges.length" class="ml-1" :number-style="{ backgroundColor: '#52c41a' }" />
            </template>
            <TabSql
              v-if="detail"
              :sqlChanges="detail.sqlChanges"
              :esChanges="detail.esChanges"
              :mqChanges="detail.mqChanges"
            />
          </TabPane>

          <TabPane key="es" tab="ES列表">
            <TabSql v-if="detail" :sqlChanges="[]" :esChanges="detail.esChanges" :mqChanges="[]" />
          </TabPane>

          <TabPane key="mq" tab="MQ列表">
            <TabSql v-if="detail" :sqlChanges="[]" :esChanges="[]" :mqChanges="detail.mqChanges" />
          </TabPane>
        </Tabs>
      </Card>
    </Spin>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { message, Card, Spin, Row, Col, Tag, Badge, Tabs, Space, Button, Dropdown, Menu } from 'ant-design-vue';
  import { DownOutlined } from '@ant-design/icons-vue';
  import { PageWrapper } from '@/components/Page';
  import { getWorkorderDetail } from '@/api/cicd/cicd.mock';
  import TabDesc from './TabDesc.vue';
  import TabAppList from './TabAppList.vue';
  import TabNacos from './TabNacos.vue';
  import TabSql from './TabSql.vue';

  const TabPane = Tabs.TabPane;
  const MenuItem = Menu.Item;
  const MenuDivider = Menu.Divider;

  const router = useRouter();
  const route = useRoute();

  const loading = ref(false);
  const detail = ref<any>(null);
  const activeTab = ref('desc');

  const envColorMap: Record<string, string> = {
    dev: 'green', test: 'blue', pre: 'orange', prod: 'red',
  };

  const statusBadgeMap: Record<string, any> = {
    pending: 'warning',
    releasing: 'processing',
    success: 'success',
    rollback: 'error',
  };

  async function loadDetail() {
    loading.value = true;
    try {
      const id = route.params.id as string;
      detail.value = await getWorkorderDetail(id);
    } finally {
      loading.value = false;
    }
  }

  onMounted(loadDetail);
</script>
