<template>
  <a-drawer
    v-model:open="visible"
    title="任务执行详情"
    placement="right"
    width="1200"
    :destroyOnClose="true"
  >
    <div v-if="loading" class="text-center py-20 text-gray-400">
      <a-spin tip="正在加载任务数据..." size="large" />
    </div>

    <div v-else-if="detailData" class="h-full flex flex-col">
      <a-tabs v-model:activeKey="activeKey" class="flex-1" @change="handleTabChange">
        
        <a-tab-pane key="1" tab="任务概览">
          <div class="flex flex-row h-full overflow-hidden">
            <div class="flex-1 pr-6 border-r border-gray-100 overflow-y-auto">
              <div class="space-y-6">
                <div>
                  <div class="font-bold text-sm mb-3 border-l-4 border-blue-500 pl-2 text-gray-700">基础信息</div>
                  <a-descriptions bordered :column="2" size="small">
                    <a-descriptions-item label="任务名称" :span="2">{{ detailData.title }}</a-descriptions-item>
                    <a-descriptions-item label="创建人">{{ detailData.createUserName }}</a-descriptions-item>
                    <a-descriptions-item label="执行账号">{{ detailData.account }}</a-descriptions-item>
                  </a-descriptions>
                </div>
                
                <div>
                  <div class="font-bold text-sm mb-3 border-l-4 border-blue-500 pl-2 text-gray-700">目标机器</div>
                  <div class="bg-gray-50 p-3 rounded border max-h-32 overflow-y-auto">
                    <template v-if="parsedIps.length > 0">
                      <a-tag v-for="ip in parsedIps" :key="ip" color="blue" class="mb-1">{{ ip }}</a-tag>
                    </template>
                  </div>
                </div>

                <div>
                  <div class="font-bold text-sm mb-3 border-l-4 border-blue-500 pl-2 text-gray-700">脚本内容</div>
                  <div class="border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
                    <Codemirror 
                      :key="detailData.lang"
                      v-model="detailData.scriptContent"
                      :disabled="true"
                      :style="{ height: '300px' }"
                      :extensions="getEditorExtensions(detailData.lang)"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div class="w-[320px] pl-6 flex-shrink-0 overflow-y-auto">
              <div class="font-bold text-sm mb-5 border-l-4 border-blue-500 pl-2 text-gray-700">任务进度追踪</div>
              <a-timeline>
                <a-timeline-item color="blue">
                  <div class="flex flex-col">
                    <span class="font-bold text-xs">任务创建</span>
                    <span class="text-gray-400 text-xs">{{ formatTime(detailData.CreatedAt) }}</span>
                  </div>
                </a-timeline-item>
                
                <a-timeline-item 
                  v-for="(node, index) in parsedFlowNodes" 
                  :key="index" 
                  :color="node.isPassOrIsSuccess ? 'green' : 'red'"
                >
                  <div class="flex flex-col">
                    <span class="font-bold text-xs text-gray-800">{{ node.type }}</span>
                    <span class="text-gray-500 text-xs">{{ formatTime(node.endTime) }}</span>
                    <span class="text-gray-400 text-xs">执行人: {{ node.actualUser || '系统' }}</span>
                    <div v-if="node.outPut" class="mt-1 p-2 bg-gray-100 rounded text-[10px] text-gray-600 border">
                      {{ node.outPut }}
                    </div>
                  </div>
                </a-timeline-item>
              </a-timeline>
            </div>
          </div>
        </a-tab-pane>

        <a-tab-pane key="2" tab="机器执行明细">
          <div class="h-[700px]" v-if="activeKey === '2'">
            <BasicTable @register="registerResultTable">
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'status'">
                  <a-tag :color="getResultStatusColor(record.status)">{{ record.status || 'pending' }}</a-tag>
                </template>
                <template v-if="column.key === 'action'">
                  <a-button type="link" size="small" @click="handleViewLog(record)">查看日志</a-button>
                </template>
              </template>
            </BasicTable>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>
    
    <a-modal v-model:open="logModalVisible" title="执行日志" width="2000px" :footer="null">
      <div class="bg-gray-900 text-green-400 p-4 rounded h-[500px] overflow-auto text-xs font-mono whitespace-pre-wrap">
        {{ currentLogContent || '（暂无日志）' }}
      </div>
    </a-modal>

  </a-drawer>
</template>

<script setup lang="ts">
  import { ref, computed, nextTick } from 'vue';
  import { Drawer as ADrawer, Spin as ASpin, Timeline as ATimeline, TimelineItem as ATimelineItem, Tabs as ATabs, TabPane as ATabPane, Tag as ATag, Modal as AModal, Button as AButton, Descriptions as ADescriptions, DescriptionsItem as ADescriptionsItem } from 'ant-design-vue';
  import { BasicTable, useTable } from '@/components/Table';
  import { getJobExecTaskOne, getJobExecResultByJobId } from '@/api/demo/system';
  import { Codemirror } from 'vue-codemirror';
  import { oneDark } from '@codemirror/theme-one-dark';
  import { javascript } from '@codemirror/lang-javascript';
  import { python } from '@codemirror/lang-python';
  import { yaml } from '@codemirror/lang-yaml';
  import { StreamLanguage } from '@codemirror/language';
  import { shell } from '@codemirror/legacy-modes/mode/shell';
  const visible = ref(false);
  const loading = ref(false);
  const detailData = ref<any>(null);
  const activeKey = ref('1');
  const currentJobId = ref<number>(0);
  const logModalVisible = ref(false);
  const currentLogIp = ref('');
  const currentLogContent = ref('');

  const parsedIps = computed(() => {
    if (!detailData.value?.hostsRaw) return [];
    try { return JSON.parse(detailData.value.hostsRaw); } catch { return detailData.value.hostsRaw.split('\n').filter(Boolean); }
  });

  const parsedFlowNodes = computed(() => {
    if (!detailData.value?.actualFlowData) return [];
    try { return JSON.parse(detailData.value.actualFlowData); } catch { return []; }
  });
  
  const formatTime = (t: string) => t ? t.replace('T', ' ').split('.')[0] : '无时间记录';

  const [registerResultTable, { reload: reloadResultTable }] = useTable({
    api: getJobExecResultByJobId,
    beforeFetch: (params) => { params.jobId = currentJobId.value; return params; },
    columns: [
      { title: '主机 IP', dataIndex: 'hostIP', width: 140 },
      { title: '状态', dataIndex: 'status', width: 100 },
      { title: '操作', dataIndex: 'action', width: 100 },
    ],
    bordered: true,
  });
  const getEditorExtensions = (lang: string) => {
    const ext = [oneDark];
    if (lang === 'shell') {
      ext.push(StreamLanguage.define(shell));
    } else if (lang === 'javascript' || lang === 'json') {
      ext.push(javascript());
    } else if (lang === 'python') {
      ext.push(python());
    } else if (lang === 'yaml' || lang === 'ansible') {
      ext.push(yaml());
    }
    return ext;
  };
  const getResultStatusColor = (status: string) => {
    const map: any = { success: 'success', failed: 'error', running: 'processing', pending: 'default' };
    return map[status] || 'default';
  };

  const handleViewLog = (record: any) => {
    currentLogIp.value = record.hostIP;
    currentLogContent.value = record.stdout + (record.stderr ? `\n\n--- STDERR ---\n${record.stderr}` : '');
    logModalVisible.value = true;
  };

  const handleTabChange = async (key: string) => {
    if (key === '2') { await nextTick(); reloadResultTable(); }
  };

  const openDrawer = async (id: string | number) => {
    visible.value = true;
    loading.value = true;
    currentJobId.value = Number(id);
    const res = await getJobExecTaskOne(id);
    detailData.value = res.result || res;
    loading.value = false;
  };

  defineExpose({ openDrawer });
</script>