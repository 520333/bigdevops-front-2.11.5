<template>
  <div class="p-4 bg-gray-50 h-full flex flex-col overflow-hidden">
    <div class="flex justify-between items-center pb-3 border-b mb-4 bg-white p-4 rounded shadow-sm">
      <span class="text-lg font-bold text-gray-800">工单服务门户：请选择要办理的业务</span>
    </div>

    <div class="flex-1 overflow-y-auto px-2">
      <a-row :gutter="[16, 16]">
        <a-col :span="8" v-for="item in cardContents" :key="item.id">
          <a-card :bordered="false" class="hover:shadow-lg transition-shadow cursor-pointer" @click="clickCard(item)">
            <template #title>
              <span class="font-bold text-base text-gray-700">
                <Icon icon="ant-design:layout-outlined" class="mr-2 text-blue-500" />
                {{ item.name }}
              </span>
            </template>
            
            <div class="text-gray-500 space-y-1 mb-4 text-sm">
              <div><span class="font-semibold text-gray-600">关联审批：</span>{{ item.processName || '暂无' }}</div>
              <div><span class="font-semibold text-gray-600">创建人员：</span>{{ item.createUserName || '系统管理员' }}</div>
            </div>

            <a-button type="primary" block>
              发起申请
            </a-button>
          </a-card>
        </a-col>
      </a-row>
      
      <div v-if="cardContents.length === 0" class="text-center py-20 text-gray-400">
        暂无可用工单模板，请先去【工单模板管理】中创建。
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { Row as ARow, Col as ACol, Card as ACard, Button as AButton } from 'ant-design-vue';
  import { useGo } from '@/hooks/web/usePage';
  import { useMessage } from '@/hooks/web/useMessage';
  import Icon from '@/components/Icon/Icon.vue';
  
  import { getWorkOrderTemplateList } from '@/api/demo/system';

  const go = useGo();
  const { createMessage } = useMessage();
  const cardContents = ref<any[]>([]); 

  onMounted(async () => {
    try {
      const res = await getWorkOrderTemplateList({ page: 1, pageSize: 1000 });
      cardContents.value = res.items || res.result || res || [];
    } catch (e) {
      createMessage.error('加载工单模板门户失败，请检查后端服务');
    }
  });

  // 🚨 核心逻辑：点击卡片，携带 templateId 跳转到 create 页面
  function clickCard(item: any) {
    go(`create?templateId=${item.id}`);
  }
</script>