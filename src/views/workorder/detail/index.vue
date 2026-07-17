<template>
  <div class="p-4 bg-gray-50 min-h-full">
    <div class="bg-white p-6 rounded-lg shadow-sm max-w-5xl mx-auto">
      <div class="flex justify-between items-center mb-6 pb-4 border-b">
        <div class="text-xl font-bold text-gray-800">工单流转详情</div>
        <a-button @click="goBack">返回列表</a-button>
      </div>

      <div v-if="loading" class="text-center py-20">
        <a-spin size="large" tip="正在加载工单数据..." />
      </div>

      <div v-else-if="detailData" class="space-y-8">
        
        <div>
          <div class="font-bold text-base mb-3 border-l-4 border-blue-500 pl-2">基础信息</div>
          <a-descriptions bordered :column="2" size="small">
            <a-descriptions-item label="工单标题" :span="2">
              <span class="font-semibold">{{ detailData.title }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="当前状态">
              <a-tag color="blue">{{ detailData.status }}</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="申请人">{{ detailData.createUserName }}</a-descriptions-item>
            <a-descriptions-item label="期望完成时间" :span="2">
              {{ detailData.desireFinishTime || '无' }}
            </a-descriptions-item>
          </a-descriptions>
        </div>

        <div>
          <div class="font-bold text-base mb-3 border-l-4 border-blue-500 pl-2">表单填写内容</div>
          <div class="bg-gray-100 p-4 rounded border">
            <pre class="whitespace-pre-wrap text-sm text-gray-700">{{ parsedFormData }}</pre>
          </div>
        </div>

        <div>
          <div class="font-bold text-base mb-6 border-l-4 border-blue-500 pl-2">审批流转时间轴</div>
          <div class="pl-4">
            <a-steps direction="vertical" :current="currentStep">
              <a-step 
                v-for="(node, index) in parsedFlowNodes" 
                :key="index" 
                :title="node.type"
              >
                <template #description>
                  <div class="text-gray-500 text-sm mt-1">目标处理：{{ node.defineUserOrGroup }}</div>
                  <div v-if="node.actualUser" class="text-blue-600 text-sm mt-1">
                    实际操作：{{ node.actualUser }} 
                    <span v-if="node.outPut" class="text-gray-700 ml-1 font-semibold">
                      [{{ node.outPut }}]
                    </span>
                  </div>
                  <div v-if="node.endTime" class="text-xs text-gray-400 mt-1">
                    处理时间：{{ node.endTime }}
                  </div>
                </template>
              </a-step>
            </a-steps>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { useRoute } from 'vue-router';
  import { useGo } from '@/hooks/web/usePage';
  import { 
    Descriptions as ADescriptions, 
    DescriptionsItem as ADescriptionsItem, 
    Spin as ASpin, 
    Steps as ASteps, 
    Step as AStep, 
    Tag as ATag, 
    Button as AButton 
  } from 'ant-design-vue';
  import { getWorkOrderInstanceDetail } from '@/api/demo/system';

  const route = useRoute();
  const go = useGo();
  
  const loading = ref(false);
  const detailData = ref<any>(null);

  // 解析表单 JSON 供人类阅读
  const parsedFormData = computed(() => {
    if (!detailData.value?.actualApiJsonData) return '无表单数据';
    try {
      const obj = JSON.parse(detailData.value.actualApiJsonData);
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return detailData.value.actualApiJsonData;
    }
  });

  // 解析流转节点 JSON
  const parsedFlowNodes = computed(() => {
    if (!detailData.value?.actualFlowData) return [];
    try {
      return JSON.parse(detailData.value.actualFlowData);
    } catch (e) {
      return [];
    }
  });

  // 动态计算当前步数
  const currentStep = computed(() => {
    const nodes = parsedFlowNodes.value;
    const index = nodes.findIndex((n: any) => !n.actualUser);
    return index === -1 ? nodes.length : index;
  });

  onMounted(async () => {
    // 从 URL 查询参数中获取工单 ID
    const id = route.query.id as string;
    if (id) {
      loading.value = true;
      try {
        const res = await getWorkOrderInstanceDetail(id);
        detailData.value = res.result || res;
      } catch (error) {
        console.error('获取详情失败:', error);
      } finally {
        loading.value = false;
      }
    }
  });

  function goBack() {
    go('/workOrder/search');
  }
</script>