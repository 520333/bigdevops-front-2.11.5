<template>
  <div class="space-y-4 p-2">
    <div class="flex items-center justify-between">
      <div class="text-sm font-bold text-gray-700 dark:text-gray-200">
        Nacos 动态配置变更清单 (共 {{ list.length }} 个配置项)
      </div>
      <Space>
        <Button type="primary" size="small" @click="handleAddItem">
          添加配置变更项
        </Button>
      </Space>
    </div>

    <Table
      :data-source="list"
      :columns="columns"
      row-key="id"
      :pagination="false"
      size="middle"
      bordered
      class="bg-white dark:bg-[#151515] rounded border border-gray-100 dark:border-zinc-800"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'instanceName'">
          <Input v-model:value="record.instanceName" size="small" class="w-36" />
        </template>

        <template v-else-if="column.key === 'namespace'">
          <Input v-model:value="record.namespace" size="small" class="w-28 font-mono" />
        </template>

        <template v-else-if="column.key === 'group'">
          <Input v-model:value="record.group" size="small" class="w-36 font-mono" />
        </template>

        <template v-else-if="column.key === 'dataId'">
          <Input v-model:value="record.dataId" size="small" class="font-mono" />
        </template>

        <template v-else-if="column.key === 'changeType'">
          <Select v-model:value="record.changeType" size="small" style="width: 100px">
            <SelectOption value="modify"><Tag color="processing">配置修改</Tag></SelectOption>
            <SelectOption value="add"><Tag color="success">新增配置</Tag></SelectOption>
            <SelectOption value="delete"><Tag color="error">删除配置</Tag></SelectOption>
          </Select>
        </template>

        <template v-else-if="column.key === 'status'">
          <Tag :color="record.status === 'synced' ? 'success' : 'warning'">
            {{ record.status === 'synced' ? '已生效' : '待同步' }}
          </Tag>
        </template>

        <template v-else-if="column.key === 'action'">
          <Space>
            <Button type="link" size="small" @click="handleOpenDiff(record)">
              对比 Diff
            </Button>
            <Button
              type="link"
              size="small"
              :disabled="record.status === 'synced'"
              @click="handleSyncConfig(record)"
            >
              一键发布
            </Button>
            <Button type="link" danger size="small" @click="handleRemoveItem(index)">
              移除
            </Button>
          </Space>
        </template>
      </template>
    </Table>

    <!-- 差异对比弹窗 -->
    <Modal
      v-model:open="diffModalVisible"
      :title="`Nacos 配置变更对比 - ${currentRecord?.dataId || ''}`"
      width="900px"
      :footer="null"
    >
      <div class="grid grid-cols-2 gap-4 py-2">
        <div>
          <div class="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-red-500"></span>
            变更前原始配置 (线上当前版本)
          </div>
          <div class="bg-gray-900 text-red-300 font-mono text-xs p-3 rounded h-[350px] overflow-y-auto whitespace-pre select-text">
            {{ currentRecord?.oldContent || '# 原始配置为空' }}
          </div>
        </div>

        <div>
          <div class="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-green-500"></span>
            本次发版目标配置 (变更后版本)
          </div>
          <div class="bg-gray-900 text-green-300 font-mono text-xs p-3 rounded h-[350px] overflow-y-auto whitespace-pre select-text">
            {{ currentRecord?.newContent || '# 目标配置' }}
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script lang="ts" setup>
  import { ref, PropType } from 'vue';
  import {
    Table,
    Input,
    Select,
    SelectOption,
    Tag,
    Button,
    Space,
    Modal,
    message,
  } from 'ant-design-vue';
  import type { NacosConfigItem } from '../types';

  const props = defineProps({
    modelValue: {
      type: Array as PropType<NacosConfigItem[]>,
      required: true,
    },
  });

  const list = props.modelValue;
  const diffModalVisible = ref(false);
  const currentRecord = ref<NacosConfigItem | null>(null);

  const columns = [
    { title: 'Nacos 实例', key: 'instanceName', width: 160 },
    { title: '命名空间', key: 'namespace', width: 130 },
    { title: '配置分组 (Group)', key: 'group', width: 160 },
    { title: '配置 DataID', key: 'dataId', minWidth: 200 },
    { title: '变更类型', key: 'changeType', width: 120, align: 'center' as const },
    { title: '发布状态', key: 'status', width: 100, align: 'center' as const },
    { title: '操作', key: 'action', width: 190, align: 'center' as const },
  ];

  const handleAddItem = () => {
    list.push({
      id: String(Date.now()),
      instanceName: '生产主 Nacos 集群',
      namespace: 'prod-huahua',
      group: 'DEFAULT_GROUP',
      dataId: 'new-service-config.yaml',
      changeType: 'modify',
      oldContent: '# 线上旧版本配置',
      newContent: '# 本次发版配置内容',
      status: 'pending',
    });
  };

  const handleOpenDiff = (record: NacosConfigItem) => {
    currentRecord.value = record;
    diffModalVisible.value = true;
  };

  const handleSyncConfig = (record: NacosConfigItem) => {
    message.loading({ content: `正在同步发布 Nacos [${record.dataId}]...`, key: record.id });
    setTimeout(() => {
      record.status = 'synced';
      message.success({ content: `配置 [${record.dataId}] 已成功下发至 Nacos 集群！`, key: record.id });
    }, 1200);
  };

  const handleRemoveItem = (index: number) => {
    list.splice(index, 1);
  };
</script>
