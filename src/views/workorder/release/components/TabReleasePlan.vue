<template>
  <div class="space-y-5 p-2">
    <!-- 基础发版信息表单 -->
    <div class="bg-white dark:bg-[#151515] p-5 rounded-lg border border-gray-100 dark:border-zinc-800 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
        <div class="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-200">
          <span class="w-1.5 h-4 bg-blue-600 rounded"></span>
          <span>1. 发布概览与窗口时间</span>
        </div>
        <Tag color="processing">规范发布流程</Tag>
      </div>

      <Form layout="vertical">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormItem label="发布工单标题" required>
            <Input v-model:value="model.title" placeholder="请输入发布工单标题" />
          </FormItem>

          <FormItem label="发布目标环境" required>
            <Select v-model:value="model.env">
              <SelectOption value="prod">生产环境 (Production)</SelectOption>
              <SelectOption value="stage">预发环境 (Staging)</SelectOption>
              <SelectOption value="test">测试环境 (Testing)</SelectOption>
            </Select>
          </FormItem>

          <FormItem label="发布类型" required>
            <Select v-model:value="model.releaseType">
              <SelectOption value="normal">常规迭代发布</SelectOption>
              <SelectOption value="emergency">紧急故障修复</SelectOption>
              <SelectOption value="gray">灰度金丝雀发布</SelectOption>
            </Select>
          </FormItem>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem label="计划发布窗口时间">
            <div class="flex items-center gap-2">
              <Input v-model:value="model.windowStartTime" placeholder="开始时间" />
              <span class="text-gray-400">至</span>
              <Input v-model:value="model.windowEndTime" placeholder="结束时间" />
            </div>
          </FormItem>

          <FormItem label="紧急联络与值班负责人" required>
            <Input v-model:value="model.emergencyContact" placeholder="姓名 / 电话" />
          </FormItem>
        </div>

        <FormItem label="发布内容概述与核心改动">
          <Textarea v-model:value="model.overview" :rows="3" placeholder="简述本次发版的核心功能与改造要点" />
        </FormItem>

        <FormItem label="影响业务范围与系统依赖">
          <Textarea v-model:value="model.scope" :rows="2" placeholder="评估受影响的前端端、上下游服务及第三方调用" />
        </FormItem>
      </Form>
    </div>

    <!-- 回滚方案与应急预案 -->
    <div class="bg-white dark:bg-[#151515] p-5 rounded-lg border border-gray-100 dark:border-zinc-800 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
        <div class="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-200">
          <span class="w-1.5 h-4 bg-orange-500 rounded"></span>
          <span>2. 回滚策略与应急预案</span>
        </div>
        <Tag color="warning">安全兜底机制</Tag>
      </div>

      <Alert
        message="回滚红线标准"
        description="如遇发版后系统核心接口报错率 > 0.5%、P99 延迟突破阈值或出现严重脏数据，必须立即中止发版并启动回滚预案。"
        type="warning"
        show-icon
      />

      <Form layout="vertical">
        <FormItem label="回滚步骤与操作指引" required>
          <Textarea v-model:value="model.rollbackPlan" :rows="4" placeholder="详细列出代码回退、配置回退与数据补偿步骤" />
        </FormItem>
      </Form>
    </div>

    <!-- 发布前与发布后验证 Checklist -->
    <div class="bg-white dark:bg-[#151515] p-5 rounded-lg border border-gray-100 dark:border-zinc-800 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
        <div class="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-200">
          <span class="w-1.5 h-4 bg-green-500 rounded"></span>
          <span>3. 发布卡点与验收检查清单 (Checklist)</span>
        </div>
        <Button size="small" type="dashed" @click="handleAddChecklist">添加检查项</Button>
      </div>

      <div class="space-y-2">
        <div
          v-for="(item, index) in model.checklist"
          :key="item.id"
          class="flex items-center justify-between p-3 rounded bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800"
        >
          <div class="flex items-center gap-3">
            <Checkbox v-model:checked="item.checked" />
            <Input v-model:value="item.content" class="w-[450px]" size="small" />
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs text-gray-400">负责人:</span>
            <Input v-model:value="item.owner" class="w-32" size="small" />
            <Button type="link" danger size="small" @click="handleRemoveChecklist(index)">删除</Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { PropType } from 'vue';
  import {
    Form,
    FormItem,
    Input,
    Textarea,
    Select,
    SelectOption,
    Tag,
    Alert,
    Button,
    Checkbox,
  } from 'ant-design-vue';
  import type { ReleasePlan } from '../types';

  const props = defineProps({
    modelValue: {
      type: Object as PropType<ReleasePlan>,
      required: true,
    },
  });

  const model = props.modelValue;

  const handleAddChecklist = () => {
    model.checklist.push({
      id: String(Date.now()),
      content: '新增验证事项...',
      checked: false,
      owner: '待指定',
    });
  };

  const handleRemoveChecklist = (index: number) => {
    model.checklist.splice(index, 1);
  };
</script>
