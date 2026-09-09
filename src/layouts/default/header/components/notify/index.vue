<template>
  <div :class="prefixCls">
    <Popover v-model:open="popoverVisible" title="" trigger="click" :overlayClassName="`${prefixCls}__overlay`" @openChange="handleOpenChange">
      <Badge :count="count" dot :numberStyle="numberStyle">
        <BellOutlined />
      </Badge>
      <template #content>
        <Tabs>
          <template v-for="item in listData" :key="item.key">
            <Tabs.TabPane>
              <template #tab>
                {{ item.name }}
                <span v-if="getTabUnreadCount(item) !== 0">({{ getTabUnreadCount(item) }})</span>
              </template>
              <NoticeList :list="item.list" @title-click="onNoticeClick" />
              <div 
                v-if="item.list && item.list.length > 0" 
                class="flex justify-center items-center py-2 border-t dark:border-zinc-800 text-sm text-blue-500 hover:text-blue-600 cursor-pointer select-none"
                @click="clearCurrentTab(item)"
              >
                清空{{ item.name }}
              </div>
            </Tabs.TabPane>
          </template>
        </Tabs>
      </template>
    </Popover>
  </div>
</template>
<script lang="ts" setup>
  import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import { Popover, Tabs, Badge } from 'ant-design-vue';
  import { BellOutlined } from '@ant-design/icons-vue';
  import { ListItem, TabItem } from './data';
  import NoticeList from './NoticeList.vue';
  import { useDesign } from '@/hooks/web/useDesign';
  import { useGo } from '@/hooks/web/usePage';
  import {
    getWorkOrderNotificationList,
    markWorkOrderNotifyRead,
    clearWorkOrderNotifyTab,
  } from '@/api/demo/system';

  const { prefixCls } = useDesign('header-notify');
  const go = useGo();
  const route = useRoute();

  const listData = ref<TabItem[]>([]);
  const numberStyle = {};
  let timer: any = null;
  const popoverVisible = ref(false);

  function getTabUnreadCount(item: TabItem) {
    if (!item.list) return 0;
    return item.list.filter((i) => !i.read && !i.titleDelete).length;
  }

  const count = computed(() => {
    let unreadCount = 0;
    for (let i = 0; i < listData.value.length; i++) {
      unreadCount += getTabUnreadCount(listData.value[i]);
    }
    return unreadCount;
  });

  async function fetchNotificationList() {
    try {
      const res = await getWorkOrderNotificationList();
      let rawData: TabItem[] = [];
      if (Array.isArray(res)) {
        rawData = res;
      } else if (res && res.result && Array.isArray(res.result)) {
        rawData = res.result;
      }
      listData.value = rawData;
    } catch (e) {
      console.error('获取通知列表失败', e);
    }
  }

  function handleOpenChange(open: boolean) {
    popoverVisible.value = open;
    if (open) {
      fetchNotificationList();
    }
  }

  async function onNoticeClick(record: ListItem) {
    popoverVisible.value = false;
    record.titleDelete = true;
    record.read = true;
    if (record.id) {
      try {
        await markWorkOrderNotifyRead(record.id);
      } catch (e) {
        console.error('标记已读失败', e);
      }
    }

    let queryModel = 'all';

    if (record.extra === '待审批' || record.type === '3') {
      queryModel = 'Approval';
    } else if (record.extra === '待执行') {
      queryModel = 'Action';
    } else if (
      record.type === '2' ||
      (record.id && record.id.startsWith('msg-')) ||
      (record.title && record.title.includes('评论'))
    ) {
      queryModel = 'all';
    } else if (record.type === '1') {
      queryModel = 'all';
    }

    go(`/workOrder/search?queryModel=${queryModel}`);
  }

  async function clearCurrentTab(tab: TabItem) {
    if (tab.list && tab.list.length > 0) {
      const noticeIds = tab.list.map((item) => item.id).filter(Boolean) as string[];
      tab.list = [];
      if (noticeIds.length > 0) {
        try {
          await clearWorkOrderNotifyTab(noticeIds);
        } catch (e) {
          console.error('清空通知页签失败', e);
        }
      }
    }
  }

  // 监听路由变化自动更新通知
  watch(
    () => route.fullPath,
    () => {
      fetchNotificationList();
    }
  );

  onMounted(() => {
    fetchNotificationList();
    timer = setInterval(() => {
      fetchNotificationList();
    }, 15000);

    window.addEventListener('focus', fetchNotificationList);
  });

  onUnmounted(() => {
    if (timer) {
      clearInterval(timer);
    }
    window.removeEventListener('focus', fetchNotificationList);
  });
</script>

<style lang="less">
  @prefix-cls: ~'@{namespace}-header-notify';

  .@{prefix-cls} {
    padding-bottom: 1px;

    &__overlay {
      width: 460px !important;
      max-width: 90vw !important;

      .ant-popover-inner-content {
        width: 100%;
      }
    }

    .ant-tabs {
      width: 100%;
    }

    .ant-tabs-content {
      width: 100% !important;
    }

    .ant-badge {
      display: flex;
      align-items: center;
      font-size: 18px;

      .ant-badge-multiple-words {
        padding: 0 4px;
      }

      svg {
        width: 0.9em;
      }
    }
  }
</style>
