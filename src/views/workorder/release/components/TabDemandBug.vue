<template>
  <div class="space-y-4 p-2">
    <div class="flex items-center justify-between">
      <div class="text-sm font-bold text-gray-700 dark:text-gray-200">
        关联需求与缺陷清单 (共 {{ list.length }} 项)
      </div>
      <Space>
        <Button type="primary" size="small" @click="handleAddItem">
          添加需求 / BUG
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
        <template v-if="column.key === 'code'">
          <Input v-model:value="record.code" size="small" class="w-32 font-mono" />
        </template>

        <template v-else-if="column.key === 'title'">
          <Input v-model:value="record.title" size="small" />
        </template>

        <template v-else-if="column.key === 'type'">
          <Select v-model:value="record.type" size="small" style="width: 105px">
            <SelectOption value="demand">业务需求</SelectOption>
            <SelectOption value="bug">缺陷修复</SelectOption>
            <SelectOption value="refactor">架构重构</SelectOption>
          </Select>
        </template>

        <template v-else-if="column.key === 'priority'">
          <Select v-model:value="record.priority" size="small" style="width: 80px">
            <SelectOption value="P0"><Tag color="error">P0</Tag></SelectOption>
            <SelectOption value="P1"><Tag color="warning">P1</Tag></SelectOption>
            <SelectOption value="P2"><Tag color="processing">P2</Tag></SelectOption>
            <SelectOption value="P3"><Tag color="default">P3</Tag></SelectOption>
          </Select>
        </template>

        <template v-else-if="column.key === 'owner'">
          <Input v-model:value="record.owner" size="small" class="w-24" />
        </template>

        <template v-else-if="column.key === 'tester'">
          <Input v-model:value="record.tester" size="small" class="w-24" />
        </template>

        <template v-else-if="column.key === 'status'">
          <Select v-model:value="record.status" size="small" style="width: 110px">
            <SelectOption value="passed"><Tag color="success">测试通过</Tag></SelectOption>
            <SelectOption value="testing"><Tag color="processing">测试中</Tag></SelectOption>
            <SelectOption value="rejected"><Tag color="error">已挂起</Tag></SelectOption>
          </Select>
        </template>

        <template v-else-if="column.key === 'action'">
          <Button type="link" danger size="small" @click="handleRemoveItem(index)">
            删除
          </Button>
        </template>
      </template>
    </Table>
  </div>
</template>

<script lang="ts" setup>
  import { PropType } from 'vue';
  import {
    Table,
    Input,
    Select,
    SelectOption,
    Tag,
    Button,
    Space,
  } from 'ant-design-vue';
  import type { DemandBugItem } from '../types';

  const props = defineProps({
    modelValue: {
      type: Array as PropType<DemandBugItem[]>,
      required: true,
    },
  });

  const list = props.modelValue;

  const columns = [
    { title: '编号 / ID', key: 'code', width: 140 },
    { title: '需求 / 缺陷标题', key: 'title', minWidth: 260 },
    { title: '类型', key: 'type', width: 120, align: 'center' as const },
    { title: '优先级', key: 'priority', width: 100, align: 'center' as const },
    { title: '经办人', key: 'owner', width: 110, align: 'center' as const },
    { title: '验收人', key: 'tester', width: 110, align: 'center' as const },
    { title: '验收状态', key: 'status', width: 130, align: 'center' as const },
    { title: '操作', key: 'action', width: 80, align: 'center' as const },
  ];

  const handleAddItem = () => {
    list.push({
      id: String(Date.now()),
      code: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      title: '新需求或缺陷说明...',
      type: 'demand',
      priority: 'P1',
      owner: '当前用户',
      tester: '测试人员',
      status: 'passed',
    });
  };

  const handleRemoveItem = (index: number) => {
    list.splice(index, 1);
  };
</script>
