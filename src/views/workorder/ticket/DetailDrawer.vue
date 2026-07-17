<template>
  <a-drawer
    v-model:open="visible"
    title="工单流转详情"
    placement="right"
    width="1100" 
    :destroyOnClose="true"
  >
    <div v-if="loading" class="text-center py-20 text-gray-400">
      <a-spin tip="正在加载工单数据..." size="large" />
    </div>
    
    <div v-else-if="detailData" class="flex flex-row h-full">
      
      <div class="flex-1 pr-6 border-r border-gray-100 overflow-y-auto">
        <div class="space-y-6">
          
          <div>
            <div class="font-bold text-sm mb-3 border-l-4 border-blue-500 pl-2 text-gray-700">基础信息</div>
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
            <div class="font-bold text-sm mb-3 border-l-4 border-blue-500 pl-2 text-gray-700">表单填写内容</div>
            <div class="bg-gray-50 p-4 rounded border">
              <VFormCreate 
                v-if="hasFormConfig"
                :key="detailData.id" 
                :form-config="dynamicFormConfig" 
                v-model:formModel="dynamicFormData" 
              />
              <div v-else class="text-center text-gray-400 py-4">
                该工单未配置动态表单，或暂无表单数据
              </div>
            </div>
          </div>

          <div class="pt-2 border-t border-gray-200">
            <div class="font-bold text-sm mb-3 border-l-4 border-blue-500 pl-2 text-gray-700">沟通与评论</div>
            
            <div class="space-y-4 mb-4">
              <div v-for="(item, idx) in parsedComments" :key="idx" class="flex space-x-3">
                <a-avatar class="bg-blue-500 flex-shrink-0 mt-1">
                  {{ item._name.charAt(0).toUpperCase() }}
                </a-avatar>
                <div class="flex-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div class="flex justify-between items-center mb-1">
                    <span class="font-bold text-sm text-gray-700">{{ item._name }}</span>
                    <span class="text-xs text-gray-400">{{ item._time }}</span>
                  </div>
                  <div class="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{{ item.comment }}</div>
                </div>
              </div>
              
              <div v-if="parsedComments.length === 0" class="text-center text-gray-400 py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                暂无沟通记录，有问题可以在下方留言说明~
              </div>
            </div>

            <div class="flex flex-col items-end mt-4">
              <a-textarea 
                v-model:value="newCommentText" 
                :rows="3" 
                placeholder="输入评论或补充信息..." 
                class="mb-3"
              />
              <a-button type="primary" :loading="submittingComment" @click="submitComment">
                发表评论
              </a-button>
            </div>
          </div>
          
        </div>
      </div>

      <div class="w-[380px] pl-6 flex-shrink-0 overflow-y-auto">
        <div class="font-bold text-sm mb-5 border-l-4 border-blue-500 pl-2 text-gray-700">进度追踪</div>
        <div class="pl-2">
          <a-timeline>
            <a-timeline-item 
              v-for="(node, index) in parsedFlowNodes" 
              :key="index"
              :color="getNodeColor(node)"
            >
              <template #dot>
                <div 
                  class="w-3 h-3 rounded-full border-2 bg-white"
                  :class="getNodeBorderClass(node)"
                ></div>
              </template>

              <div class="ml-1 mb-5">
                <div class="flex items-center space-x-2 text-sm">
                  <span class="text-gray-800 font-bold">{{ node.type }}</span>
                  <span class="text-gray-500 text-xs">· {{ node.endTime || '待处理' }}</span>
                </div>
                
                <div v-if="node.type !== '结束节点' && node.type !== 'Stop'" class="text-gray-500 text-xs mt-1">
                  指派给: {{ node.defineUserOrGroup }}
                </div>

                <div v-if="node.actualUser" class="mt-2">
                  <div class="mb-1">
                    <a-tag :color="node.isPassOrIsSuccess ? 'blue' : 'red'">
                      执行人: {{ node.actualUser }}
                    </a-tag>
                    <span v-if="!node.isPassOrIsSuccess && node.outPut" class="text-red-500 text-xs font-semibold ml-1">
                      (拒绝/失败)
                    </span>
                  </div>
                  <div class="bg-gray-50 border border-gray-200 rounded p-2 text-gray-600 text-xs whitespace-pre-wrap mt-2">
                    {{ node.outPut || '（未填写意见）' }}
                  </div>
                </div>
                
                <div v-else-if="(node.type === '结束节点' || node.type === 'Stop') && detailData.status === 'finished'" class="mt-2 text-green-600 text-xs font-bold">
                  ✅ 流程已顺利结束
                </div>
                <div v-else-if="detailData.status === 'approvalReject' || detailData.status === 'cancelled'" class="mt-1 text-gray-400 text-xs italic">
                  流程已终止
                </div>
                <div v-else class="mt-1 text-gray-400 text-xs italic">
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
  import { ref, computed } from 'vue';
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
    Button as AButton      
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

  const getNodeColor = (node: any) => {
    if (node.actualUser) return node.isPassOrIsSuccess ? 'blue' : 'red'; 
    if ((node.type === '结束节点' || node.type === 'Stop') && detailData.value?.status === 'finished') return 'green';
    return 'gray'; 
  };

  const getNodeBorderClass = (node: any) => {
    if (node.actualUser) return node.isPassOrIsSuccess ? 'border-blue-500' : 'border-red-500';
    if ((node.type === '结束节点' || node.type === 'Stop') && detailData.value?.status === 'finished') return 'border-green-500';
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

  const openDrawer = async (id: string | number) => {
    visible.value = true;
    loading.value = true;
    detailData.value = null;
    dynamicFormConfig.value = null;
    dynamicFormData.value = {};
    newCommentText.value = ''; 

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
          parsedConfig.schemas.forEach((schema: any) => {
            if (!schema.componentProps) {
              schema.componentProps = {};
            }
            schema.componentProps.disabled = true; 

            const dateComponents = ['DatePicker', 'MonthPicker', 'WeekPicker', 'TimePicker', 'RangePicker'];
            if (dateComponents.includes(schema.component)) {
              schema.component = 'Input';
              const rawVal = dynamicFormData.value[schema.field];
              if (rawVal && typeof rawVal === 'string' && rawVal.includes('T')) {
                dynamicFormData.value[schema.field] = rawVal.replace('T', ' ').split('.')[0];
              }
            }
          });
        }
        dynamicFormConfig.value = parsedConfig;
      }

    } catch (error) {
      console.error('获取详情失败:', error);
    } finally {
      loading.value = false;
    }
  };

  defineExpose({ openDrawer });
</script>

<style scoped>
  .ant-timeline :deep(.ant-timeline-item-content) {
    cursor: default !important;
  }
</style>