<template>
  <PageWrapper :title="pageTitle" :content="pageContent">
    <div class="calendar-card">

      <div class="member-list-bar mb-4 p-3 border-rounded">
        <div class="flex items-center flex-wrap gap-2">
          <span class="text-sm font-bold text-gray-700 mr-2">团队成员：</span>

          <template v-for="user in groupMembers" :key="user.id">
            <Tag :color="user.realName === todayDutyName ? 'error' : 'default'"
              :class="[user.realName === todayDutyName ? 'active-member' : '', 'px-3 py-1 text-sm']">
              <template #icon v-if="user.realName === todayDutyName">
                <span>🥇</span>
              </template>
              {{ user.realName }}
              <span v-if="user.realName === todayDutyName" class="font-bold"> (今日值班)</span>
            </Tag>
          </template>

          <span v-if="!groupMembers.length" class="text-xs text-gray-400">暂无成员数据</span>
        </div>

      </div>
      <div class="bg-white dark:bg-[#151515] p-4 mb-4 rounded shadow-sm border border-gray-100 dark:border-zinc-800">


        <div class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 border-b dark:border-zinc-800 pb-2">本月个人值班统计</div>
        <div class="flex flex-wrap gap-4">
          <div v-for="(dates, name) in monthlyDutyStats" :key="name" class="text-sm">
            <span class="font-bold text-blue-600 dark:text-blue-400">{{ name }}:</span>
            <span class="text-gray-600 dark:text-gray-300 ml-1">{{ dates.length }} 天</span>
            <div class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ dates.join(', ') }}</div>
          </div>
          <div v-if="Object.keys(monthlyDutyStats).length === 0" class="text-gray-400 dark:text-gray-500 text-sm">
            本月暂无排班数据
          </div>
        </div>
      </div>

      <a-calendar v-model:value="value" @panelChange="onPanelChange">
        <template #dateCellRender="{ current }">
          <ul class="events">
            <li v-for="item in getListData(current)" :key="item.content" @click.stop="openChangeModal(current, item)"
              class="cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 p-1 rounded transition-colors">
              <a-popover placement="right" trigger="hover">

                <template #title>
                  <div class="font-bold text-gray-800 dark:text-gray-200 pb-1 border-b border-gray-100 dark:border-zinc-800">
                    📅 排班详情
                  </div>
                </template>

                <template #content>
                  <div class="w-48 text-sm text-gray-800 dark:text-gray-300">
                    <div class="flex justify-between py-1">
                      <span class="text-gray-500 dark:text-gray-400">当前值班：</span>
                      <span class="font-medium text-blue-600 dark:text-blue-400">{{ item.realName }}</span>
                    </div>

                    <template v-if="item.originUser">
                      <div class="flex justify-between py-1">
                        <span class="text-gray-500 dark:text-gray-400">原定值班：</span>
                        <span class="line-through text-gray-400 dark:text-gray-500">{{ item.originUser }}</span>
                      </div>
                      <div class="mt-2 pt-2 border-t border-gray-100 dark:border-zinc-800" v-if="item.remark">
                        <div class="text-gray-500 dark:text-gray-400 mb-1">换班原因：</div>
                        <div class="bg-gray-50 dark:bg-zinc-800 p-2 rounded text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ item.remark }}</div>
                      </div>
                    </template>

                    <template v-else>
                      <div class="text-gray-400 dark:text-gray-500 mt-1 text-xs">按计划正常轮值，无换班变动。</div>
                    </template>
                  </div>
                </template>

                <!-- 日历上显示的徽标 -->
                <div class="w-full overflow-hidden text-ellipsis whitespace-nowrap">
                  <a-badge :status="item.type" :text="item.content" />
                </div>

              </a-popover>
            </li>
          </ul>
          <!-- <div v-if="getMonthData(current)" class="text-center mt-4">
            <Tag color="blue">已排班: {{ getMonthData(current) }} 天</Tag>
          </div> -->
        </template>

      </a-calendar>
    </div>

    <OndutyChangeModal @register="registerModal" @success="handleModalSuccess" />
  </PageWrapper>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { Calendar, Badge, Tag, Popover, Select, message } from 'ant-design-vue';
import { PageWrapper } from '@/components/Page';
import { useModal } from '@/components/Modal';
import OndutyChangeModal from './OndutyChangeModal.vue';
import { getMonitorOndutyGroupFuturePlan, getMonitorOndutyGroupOne } from '@/api/demo/system';
export default defineComponent({
  name: 'MonitorOnDutyGroupPlan',
  components: {
    ACalendar: Calendar,
    ABadge: Badge,
    Tag,
    PageWrapper,
    OndutyChangeModal,
    APopover: Popover,
    ASelect: Select
  },
  setup() {
    const route = useRoute();
    const targetGroupId = ref(route.query.id as string || '1');

    const [registerModal, { openModal }] = useModal();

    const value = ref<Dayjs>(dayjs());
    const ondutyMap = ref<Record<string, any>>({});
    const groupInfo = ref<Record<string, any>>({});
    const badgeTypes = ['success', 'processing', 'error', 'warning', 'default'];

    const pageTitle = computed(() => {
      const name = groupInfo.value.name || groupInfo.value.Name;
      return name ? `排班计划 - ${name}` : '排班计划';
    });

    const pageContent = computed(() => {
      const name = groupInfo.value.name || groupInfo.value.Name;
      return name ? `当前正在查看【${name}】的轮值安排与未来规划。` : '在此处查看值班人员安排与轮值计划。';
    });

    const groupMembers = computed(() => {
      return groupInfo.value.members || groupInfo.value.Members || [];
    });

    const todayDutyName = computed(() => {
      const todayStr = dayjs().format('YYYY-MM-DD');
      return ondutyMap.value[todayStr]?.name || '';
    });


    watch(
      () => route.query.id,
      (newId) => {
        if (newId) {
          targetGroupId.value = newId as string;
          fetchGroupInfo();
          fetchPlanData(value.value);
        }
      }
    );

    async function fetchGroupInfo() {
      try {
        const res = await getMonitorOndutyGroupOne(targetGroupId.value);
        groupInfo.value = res?.result || res || {};
      } catch (error) {
        console.error('【排班调试】获取组信息失败:', error);
      }
    }

    async function fetchPlanData(targetDate: Dayjs) {
      const startDay = targetDate.startOf('month').subtract(7, 'day').format('YYYY-MM-DD');
      const endDay = targetDate.endOf('month').add(7, 'day').format('YYYY-MM-DD');

      try {
        const res = await getMonitorOndutyGroupFuturePlan({ id: targetGroupId.value, startDay, endDay });
        const details = res?.details || res?.result?.details;

        if (!details || !Array.isArray(details)) {
          ondutyMap.value = {};
          return;
        }

        const tempMap: Record<string, any> = {};
        details.forEach((item: any) => {
          if (item && item.date && item.user) {
            tempMap[item.date] = {
              name: item.user.realName,
              userId: item.user.id,
              userName: item.user.username || item.user.userName,
              originUser: item.originUser,
              remark: item.remark,
              type: badgeTypes[item.user.id % badgeTypes.length]
            };
          }
        });

        ondutyMap.value = tempMap;
      } catch (error) {
        console.error('【排班调试】请求排班接口报错:', error);
      }
    }

    onMounted(() => {
      fetchGroupInfo();
      fetchPlanData(value.value);
    });

    const onPanelChange = (val: Dayjs) => {
      value.value = val;
      fetchPlanData(val);
    };

    const getListData = (currentValue: Dayjs) => {
      const dayString = currentValue.format('YYYY-MM-DD');
      const duty = ondutyMap.value[dayString];
      if (duty) {
        let displayContent = `值班: ${duty.name}`;
        if (duty.originUser) {
          displayContent += ` (替: ${duty.originUser})`;
        }

        return [
          {
            type: duty.type,
            content: displayContent,
            userId: duty.userId,
            userName: duty.userName,
            realName: duty.name,
            originUser: duty.originUser,
            remark: duty.remark
          }
        ];
      }
      return [];
    };



    const monthlyDutyStats = computed(() => {
      const stats: Record<string, string[]> = {};

      // 遍历整个月的排班数据
      Object.keys(ondutyMap.value).forEach((date) => {
        const duty = ondutyMap.value[date];
        const name = duty.name;

        if (!stats[name]) {
          stats[name] = [];
        }
        stats[name].push(date);
      });
      return stats;
    });

    const openChangeModal = (currentDate: Dayjs, item: any) => {
      if (currentDate.isBefore(dayjs(), 'day')) {
        message.warning('历史值班记录已归档，无法修改！');
        return;
      }

      openModal(true, {
        groupId: Number(targetGroupId.value),
        dateString: currentDate.format('YYYY-MM-DD'),
        originUserName: item.userName,
        originRealName: item.realName,
        allowedMembers: groupMembers.value,
      });
    };

    const handleModalSuccess = () => {
      fetchPlanData(value.value);
    };

    return {
      value,
      getListData,
      onPanelChange,
      pageTitle,
      pageContent,
      groupMembers,
      monthlyDutyStats,
      todayDutyName,
      registerModal,
      openChangeModal,
      handleModalSuccess,

    };
  },
});
</script>

<style scoped>
.calendar-card {
  padding: 16px;
  background: #fff;
  border-radius: 4px;
}
html[data-theme='dark'] .calendar-card {
  background: #151515;
}

.member-list-bar {
  background-color: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}
html[data-theme='dark'] .member-list-bar {
  background-color: #1f1f1f;
  border-color: #303030;
}

.active-member {
  font-weight: 500;
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.15);
  transition: all 0.3s ease;
}

.events {
  margin: 0;
  padding: 0;
  list-style: none;
}

.events .ant-badge-status {
  width: 100%;
  overflow: hidden;
  font-size: 12px;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>