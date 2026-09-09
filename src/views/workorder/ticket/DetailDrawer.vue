<template>
  <a-drawer v-model:open="visible" title="工单流转详情" placement="right" width="1100" :destroyOnClose="true">
    <div v-if="loading" class="text-center py-20 text-gray-400">
      <a-spin tip="正在加载工单数据..." size="large" />
    </div>

    <div v-else-if="detailData" class="flex flex-row h-full">

      <div class="flex-1 pr-6 border-r border-gray-100 dark:border-zinc-800 overflow-y-auto">
        <div class="space-y-6">

          <div>
            <div class="font-bold text-sm mb-3 border-l-4 border-blue-500 pl-2 text-gray-700 dark:text-gray-200">基础信息
            </div>
            <a-descriptions bordered :column="2" size="small">
              <a-descriptions-item label="工单标题" :span="2">
                <span class="font-semibold">{{ detailData.title }}</span>
              </a-descriptions-item>
              <a-descriptions-item label="当前状态">
                <a-tag :color="getStatusColor(detailData.status)">
                  {{ getStatusText(detailData.status) }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="申请人">{{ detailData.createUserName }}</a-descriptions-item>
              <a-descriptions-item label="期望完成" :span="2">
                {{ detailData.desireFinishTime || '无' }}
              </a-descriptions-item>
            </a-descriptions>
          </div>

          <div>
            <a-tabs v-model:activeKey="activeTabKey" type="line">
              <a-tab-pane key="form" tab="表单填写内容">
                <div
                  class="bg-gray-50/60 dark:bg-zinc-900/60 p-4 rounded border border-gray-200/80 dark:border-zinc-800 mt-2">
                  <VFormCreate v-if="hasFormConfig" :key="detailData.id" :form-config="dynamicFormConfig"
                    v-model:formModel="dynamicFormData" />
                  <div v-else class="text-center text-gray-400 dark:text-gray-500 py-4">
                    该工单未配置动态表单，或暂无表单数据
                  </div>
                </div>
              </a-tab-pane>

              <a-tab-pane key="comment" :tab="`沟通与评论 (${parsedComments.length})`">
                <div class="space-y-4 my-4">
                  <div v-for="(item, idx) in parsedComments" :key="idx" class="flex space-x-3">
                    <a-avatar class="bg-blue-500 flex-shrink-0 mt-1">
                      {{ item._name.charAt(0).toUpperCase() }}
                    </a-avatar>
                    <div
                      class="flex-1 bg-gray-50 dark:bg-zinc-900 p-3 rounded-lg border border-gray-100 dark:border-zinc-800">
                      <div class="flex justify-between items-center mb-1">
                        <span class="font-bold text-sm text-gray-700 dark:text-gray-200">{{ item._name }}</span>
                        <span class="text-xs text-gray-400 dark:text-gray-500">{{ item._time }}</span>
                      </div>
                      <div class="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{{
                        item.comment }}</div>
                    </div>
                  </div>

                  <div v-if="parsedComments.length === 0"
                    class="text-center text-gray-400 dark:text-gray-500 py-6 bg-gray-50 dark:bg-zinc-900/40 rounded-lg border border-dashed border-gray-200 dark:border-zinc-800">
                    暂无沟通记录，有问题可以在下方留言说明~
                  </div>
                </div>

                <div class="flex flex-col items-end mt-4">
                  <a-textarea v-model:value="newCommentText" :rows="3" placeholder="输入评论或补充信息..." class="mb-3" />
                  <a-button type="primary" :loading="submittingComment" @click="submitComment">
                    发表评论
                  </a-button>
                </div>
              </a-tab-pane>
            </a-tabs>
          </div>

        </div>
      </div>

      <div class="w-[380px] pl-6 flex-shrink-0 overflow-y-auto">
        <div class="font-bold text-sm mb-5 border-l-4 border-blue-500 pl-2 text-gray-700 dark:text-gray-200">进度追踪</div>
        <div class="pl-2">
          <a-timeline>
            <a-timeline-item v-for="(node, index) in parsedFlowNodes" :key="index" :color="getNodeColor(node, index)">
              <template #dot>
                <div class="w-3 h-3 rounded-full border-2 bg-white dark:bg-zinc-950"
                  :class="getNodeBorderClass(node, index)"></div>
              </template>

              <div class="ml-1 mb-5">
                <div class="flex items-center space-x-2 text-sm">
                  <span class="text-gray-800 dark:text-gray-200 font-bold">{{ node.type }}</span>
                  <span class="text-gray-500 dark:text-gray-400 text-xs">· {{ node.endTime || '待处理' }}</span>
                </div>

                <div v-if="node.type !== '结束节点' && node.type !== 'Stop'"
                  class="text-gray-500 dark:text-gray-400 text-xs mt-1">
                  指派给: {{ node.defineUserOrGroup }}
                </div>

                <div v-if="node.actualUser" class="mt-2">
                  <div class="mb-1">
                    <a-tag :color="node.isPassOrIsSuccess ? 'blue' : 'red'">
                      执行人: {{ node.actualUser }}
                    </a-tag>
                    <span v-if="!node.isPassOrIsSuccess && node.outPut"
                      class="text-red-500 dark:text-red-400 text-xs font-semibold ml-1">
                      (拒绝/失败)
                    </span>
                  </div>
                  <div
                    class="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded p-2 text-gray-600 dark:text-gray-300 text-xs whitespace-pre-wrap mt-2">
                    {{ node.outPut || '（未填写意见）' }}
                  </div>
                </div>

                <div
                  v-if="detailData.status === 'finished' && ((node.type === '结束节点' || node.type === 'Stop') || index === parsedFlowNodes.length - 1)"
                  class="mt-2 text-green-600 dark:text-green-400 text-xs font-bold">
                  流程已顺利结束
                </div>
                <div v-else-if="detailData.status === 'approvalReject' || detailData.status === 'cancelled'"
                  class="mt-1 text-gray-400 dark:text-gray-500 text-xs italic">
                  流程已终止
                </div>
                <div v-else class="mt-1 text-gray-400 dark:text-gray-500 text-xs italic">
                  等待处理中...
                </div>
              </div>
            </a-timeline-item>
          </a-timeline>
        </div>
      </div>

    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import {
  Drawer as ADrawer,
  Descriptions as ADescriptions,
  DescriptionsItem as ADescriptionsItem,
  Spin as ASpin,
  Timeline as ATimeline,
  TimelineItem as ATimelineItem,
  Tag as ATag,
  Avatar as AAvatar,
  Textarea as ATextarea,
  Button as AButton,
  Tabs as ATabs,
  TabPane as ATabPane
} from 'ant-design-vue';
import { useMessage } from '@/hooks/web/useMessage';

import { getWorkOrderInstanceDetail } from '@/api/demo/system';
import { commentWorkOrderInstance } from '@/api/demo/system';
import VFormCreate from '@/views/form-design/components/VFormCreate/index.vue';

const { createMessage } = useMessage();
const visible = ref(false);
const loading = ref(false);
const detailData = ref<any>(null);

const dynamicFormConfig = ref<any>(null);
const dynamicFormData = ref<any>({});

const activeTabKey = ref('form');
const newCommentText = ref('');
const submittingComment = ref(false);

const hasFormConfig = computed(() => {
  return dynamicFormConfig.value &&
    dynamicFormConfig.value.schemas &&
    dynamicFormConfig.value.schemas.length > 0;
});

const parsedFlowNodes = computed(() => {
  if (!detailData.value?.actualFlowData) return [];
  try {
    return JSON.parse(detailData.value.actualFlowData);
  } catch (e) {
    return [];
  }
});

// 🚨 真实对接：适配后端的 userNameTime 和 comment 字段
const parsedComments = computed(() => {
  if (!detailData.value?.comments) return [];
  try {
    const raw = typeof detailData.value.comments === 'string'
      ? JSON.parse(detailData.value.comments)
      : detailData.value.comments;

    return raw.map((c: any) => {
      // 从 "admin 2026-06-14 10:00:00" 中拆分出名字和时间
      const parts = (c.userNameTime || '').split(' ');
      const name = parts[0] || 'U';
      const time = parts.slice(1).join(' ') || '';

      return {
        ...c,
        _name: name,
        _time: time
      };
    });
  } catch (e) {
    console.error('评论解析失败', e);
    return [];
  }
});

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    'pendingApproval': '待审批',
    'pendingAction': '待执行',
    'finished': '已完成',
    'approvalReject': '已驳回',
    'cancelled': '已取消'
  };
  return map[status] || status;
};

const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    'pendingApproval': 'warning',
    'pendingAction': 'processing',
    'finished': 'success',
    'approvalReject': 'error',
    'cancelled': 'default'
  };
  return map[status] || 'blue';
};

const getNodeColor = (node: any, index: number) => {
  if ((node.type === '结束节点' || node.type === 'Stop') && detailData.value?.status === 'finished') return 'green';
  if (node.actualUser) {
    if (!node.isPassOrIsSuccess) return 'red';
    const isLastNode = index === parsedFlowNodes.value.length - 1;
    if (detailData.value?.status === 'finished' && isLastNode) return 'green';
    return 'blue';
  }
  return 'gray';
};

const getNodeBorderClass = (node: any, index: number) => {
  if ((node.type === '结束节点' || node.type === 'Stop') && detailData.value?.status === 'finished') return 'border-green-500';
  if (node.actualUser) {
    if (!node.isPassOrIsSuccess) return 'border-red-500';
    const isLastNode = index === parsedFlowNodes.value.length - 1;
    if (detailData.value?.status === 'finished' && isLastNode) return 'border-green-500';
    return 'border-blue-500';
  }
  return 'border-gray-300';
};

// 🚨 真实调用接口提交评论
const submitComment = async () => {
  if (!newCommentText.value.trim()) {
    createMessage.warning('评论内容不能为空！');
    return;
  }

  try {
    submittingComment.value = true;
    // 调用后端真实 API
    await commentWorkOrderInstance(detailData.value.id, newCommentText.value);
    createMessage.success('发表评论成功');
    newCommentText.value = '';

    // 提交成功后重新拉取详情，刷新页面数据
    await openDrawer(detailData.value.id);

  } catch (error) {
    console.error('发表评论失败:', error);
  } finally {
    submittingComment.value = false;
  }
};

const openDrawer = async (id: string | number, defaultTab: string = 'form') => {
  visible.value = true;
  loading.value = true;
  detailData.value = null;
  dynamicFormConfig.value = null;
  dynamicFormData.value = {};
  newCommentText.value = '';
  activeTabKey.value = defaultTab || 'form';

  try {
    const res = await getWorkOrderInstanceDetail(id);
    detailData.value = res.result || res;

    const dataStr = detailData.value?.actualApiJsonData;
    if (dataStr) {
      dynamicFormData.value = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
    }

    const configStr = detailData.value?.template?.formDesign?.formConfig;
    if (configStr) {
      let parsedConfig = typeof configStr === 'string' ? JSON.parse(configStr) : configStr;
      if (!parsedConfig.schemas) {
        parsedConfig.schemas = [];
      } else {
        parsedConfig.disabled = true;

        const disableSchema = (schemaList: any[]) => {
          if (!schemaList || !Array.isArray(schemaList)) return;
          schemaList.forEach((schema: any) => {
            if (!schema.componentProps) {
              schema.componentProps = {};
            }
            schema.componentProps.disabled = true;

            if (schema.columns && Array.isArray(schema.columns)) {
              schema.columns.forEach((col: any) => {
                if (col.children) {
                  disableSchema(col.children);
                }
              });
            }

            const dateComponents = ['DatePicker', 'MonthPicker', 'WeekPicker', 'TimePicker', 'RangePicker'];
            if (dateComponents.includes(schema.component)) {
              schema.component = 'Input';
              const rawVal = dynamicFormData.value[schema.field];
              if (rawVal && typeof rawVal === 'string' && rawVal.includes('T')) {
                dynamicFormData.value[schema.field] = rawVal.replace('T', ' ').split('.')[0];
              }
            }
          });
        };

        disableSchema(parsedConfig.schemas);
      }
      dynamicFormConfig.value = parsedConfig;
    }

  } catch (error) {
    console.error('获取详情失败:', error);
  } finally {
    loading.value = false;
    nextTick(() => {
      activeTabKey.value = defaultTab || 'form';
    });
  }
};

defineExpose({ openDrawer });
</script>

<style scoped>
.ant-timeline :deep(.ant-timeline-item-content) {
  cursor: default !important;
}

html[data-theme='dark'] :deep(.v-form-container),
html.dark :deep(.v-form-container) {
  background-color: transparent !important;
}

html[data-theme='dark'] :deep(.v-form-model),
html.dark :deep(.v-form-model) {
  background-color: transparent !important;
}

html[data-theme='dark'] :deep(.ant-input[disabled]),
html[data-theme='dark'] :deep(.ant-select-disabled .ant-select-selector),
html.dark :deep(.ant-input[disabled]),
html.dark :deep(.ant-select-disabled .ant-select-selector) {
  background-color: #1f1f1f !important;
  color: rgba(255, 255, 255, 0.75) !important;
  border-color: #303030 !important;
}

html[data-theme='dark'] :deep(.ant-form-item-label > label),
html.dark :deep(.ant-form-item-label > label) {
  color: rgba(255, 255, 255, 0.85) !important;
}
</style>