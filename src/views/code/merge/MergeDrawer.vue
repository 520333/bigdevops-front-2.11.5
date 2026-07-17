<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    title="审查与合并 (Merge Request)"
    width="700px"
    showFooter
    :destroyOnClose="true"
  >
    <Description @register="registerDesc" class="mb-4" />

    <div class="bg-gray-50 p-4 rounded-md mb-6 border border-gray-200">
      <div class="flex items-center text-lg font-bold mb-2">
        <Icon icon="ant-design:info-circle-outlined" class="text-blue-500 mr-2" />
        准备合并
      </div>
      <div class="text-gray-600">
        将把 <Tag color="cyan">{{ recordData?.sourceBranch }}</Tag> 
        合并入 <Tag color="blue">{{ recordData?.targetBranch }}</Tag>，
        目前系统检测 <b>无代码冲突</b>，可自动合并。
      </div>
    </div>

    <BasicForm @register="registerForm" />

    <template #footer>
      <Space>
        <a-button @click="closeDrawer">取消</a-button>
        <a-button type="primary" danger @click="handleReject">拒绝 (Close MR)</a-button>
        <a-button 
          type="primary" 
          style="background-color: #52c41a; border-color: #52c41a;" 
          :loading="submitLoading" 
          @click="handleDoMerge"
        >
          确认合并 (Merge)
        </a-button>
      </Space>
    </template>
  </BasicDrawer>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { Space, Tag, message } from 'ant-design-vue';
  import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
  import { Description, useDescription } from '@/components/Description';
  import { BasicForm, useForm } from '@/components/Form';
  import Icon from '@/components/Icon/Icon.vue';

  const emit = defineEmits(['success', 'register']);
  const submitLoading = ref(false);
  const recordData = ref<Recordable | null>(null);

  // 1. 详情组件配置
  const [registerDesc, { setDescProps }] = useDescription({
    column: 2,
    schema: [
      { field: 'title', label: 'MR 标题', span: 2 },
      { field: 'author', label: '提交人' },
      { field: 'time', label: '提交时间' },
      { field: 'repo', label: '代码仓库', span: 2 },
    ],
  });

  // 2. 合并表单配置 (策略与操作)
  const [registerForm, { validate, resetFields }] = useForm({
    labelWidth: 120,
    baseColProps: { span: 24 },
    schemas: [
      {
        field: 'mergeStrategy',
        label: '合并策略',
        component: 'RadioGroup',
        defaultValue: 'merge',
        componentProps: {
          options: [
            { label: 'Create a merge commit (保留所有提交历史)', value: 'merge' },
            { label: 'Squash and merge (压缩为一个提交)', value: 'squash' },
          ]
        },
      },
      {
        field: 'deleteSource',
        label: '分支清理',
        component: 'Switch',
        defaultValue: true,
        helpMessage: '合并成功后，是否自动删除源分支？',
        componentProps: { checkedChildren: '是', unCheckedChildren: '否' }
      },
      {
        field: 'message',
        label: '合并留言',
        component: 'InputTextArea',
        componentProps: { rows: 3, placeholder: '可输入 Review 意见或合并备注...' }
      }
    ],
    showActionButtonGroup: false, // 隐藏默认按钮，使用 Drawer 的 footer
  });

  // 3. 抽屉数据初始化
  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
    resetFields();
    setDrawerProps({ confirmLoading: false });
    
    if (data?.record) {
      recordData.value = data.record;
      // 将列表传过来的数据注入 Description 组件
      setDescProps({ data: data.record });
    }
  });

  // 4. 执行合并操作
  async function handleDoMerge() {
    try {
      const values = await validate();
      submitLoading.value = true;

      // 组装传给后端的 Payload
      const payload = {
        mrId: recordData.value?.id,
        strategy: values.mergeStrategy,
        deleteSourceBranch: values.deleteSource,
        message: values.message
      };

      console.log('触发合并API，参数:', payload);
      
      // 模拟接口耗时
      setTimeout(() => {
        message.success(`分支 ${recordData.value?.sourceBranch} 已成功合并！`);
        submitLoading.value = false;
        closeDrawer();
        emit('success'); // 通知列表刷新
      }, 1000);

    } catch (error) {
      console.error('合并表单校验失败', error);
    }
  }

  // 5. 拒绝/关闭 MR
  function handleReject() {
    message.warning('已拒绝该合并请求');
    closeDrawer();
    emit('success');
  }
</script>