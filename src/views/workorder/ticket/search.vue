<template>
  <div class="p-4 bg-gray-50 h-full flex flex-col">
    <div class="mb-4 bg-white p-3 rounded shadow-sm">
      <a-radio-group v-model:value="currentQueryModel" @change="handleModeChange" button-style="solid">
        <a-radio-button value="mine">我发起的</a-radio-button>
        <a-radio-button value="all">全部工单</a-radio-button>
        <a-radio-button value="Approval">待我审批</a-radio-button>
        <a-radio-button value="Action">待我执行</a-radio-button>
      </a-radio-group>
    </div>

    <BasicTable @register="registerTable">
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'action'">
          <TableAction
            :actions="[
              { 
                label: '详情', 
                icon: 'clarity:info-standard-line', 
                // 🚨 触发抽屉打开
                onClick: handleDetail.bind(null, record) 
              },
              // ==== 审批节点操作 ====
              {
                label: '同意',
                icon: 'ant-design:check-circle-outlined',
                color: 'success',
                ifShow: record.status === 'pendingApproval' && record.isRelatedWithMe,
                popConfirm: { 
                  title: '确认认领并同意该审批吗？', 
                  confirm: handleApprove.bind(null, record) 
                }
              },
              {
                label: '驳回',
                icon: 'ant-design:close-circle-outlined',
                color: 'warning',
                ifShow: record.status === 'pendingApproval' && record.isRelatedWithMe,
                // 🚨 改为 onClick 触发驳回弹窗
                onClick: handleOpenRejectModal.bind(null, record)
              },
              // ==== 🚨 执行节点操作 ====
              {
                label: '执行成功',
                icon: 'ant-design:play-circle-outlined',
                color: 'success',
                ifShow: record.status === 'pendingAction' && record.isRelatedWithMe,
                onClick: handleOpenActionModal.bind(null, record, true)
              },
              {
                label: '执行失败',
                icon: 'ant-design:stop-outlined',
                color: 'error',
                ifShow: record.status === 'pendingAction' && record.isRelatedWithMe,
                onClick: handleOpenActionModal.bind(null, record, false)
              },
              // ======================
              { 
                label: '删除', 
                icon: 'ant-design:delete-outlined', 
                color: 'error', 
                popConfirm: { title: '是否确认删除', confirm: handleDelete.bind(null, record) } 
              }
            ]"
          />
        </template>
      </template>
    </BasicTable>

    <a-modal
      v-model:open="actionModalVisible"
      :title="actionForm.isSuccess ? '确认执行 - 标记为成功' : '确认执行 - 标记为失败'"
      @ok="submitAction"
      :confirmLoading="actionLoading"
      destroyOnClose
    >
      <div class="mb-4 text-gray-600">
        请填写执行过程的输出或备注信息（必填）：
      </div>
      <a-textarea 
        v-model:value="actionForm.output" 
        :rows="4" 
        placeholder="例如：服务器已初始化完毕，IP: 192.168.1.10..." 
      />
    </a-modal>

    <a-modal
      v-model:open="rejectModalVisible"
      title="确认驳回该工单吗？"
      @ok="submitReject"
      :confirmLoading="rejectLoading"
      destroyOnClose
    >
      <div class="mb-4 text-gray-600">
        请填写驳回原因（选填）：
      </div>
      <a-textarea 
        v-model:value="rejectMessage" 
        :rows="4" 
        placeholder="例如：申请资源不合规，请修改后重新提交..." 
      />
    </a-modal>

    <DetailDrawer ref="detailDrawerRef" />
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive } from 'vue';
  import { Radio as ARadio, Modal as AModal, Input as AInput } from 'ant-design-vue';
  import { BasicTable, useTable, TableAction } from '@/components/Table';
  
  import { 
    getWorkOrderInstanceList, 
    deleteWorkOrderInstance, 
    approvalWorkOrderInstance,
    actionWorkOrderInstance 
  } from '@/api/demo/system';
  import { columns, searchFormSchema } from './search'; 
  import { useMessage } from '@/hooks/web/useMessage';
  
  // 引入子组件
  import DetailDrawer from './DetailDrawer.vue';
  
  const ARadioGroup = ARadio.Group;
  const ARadioButton = ARadio.Button;
  const ATextarea = AInput.TextArea;
  
  const { createMessage } = useMessage();
  const currentQueryModel = ref('all');

  // 声明子组件 Ref
  const detailDrawerRef = ref<any>(null);

  const searchInfo = reactive({
    queryModel: currentQueryModel.value,
  });

  const [registerTable, { reload }] = useTable({
    title: '工单记录',
    api: getWorkOrderInstanceList,
    columns: columns,
    useSearchForm: true,
    formConfig: {
      labelWidth: 80,
      schemas: searchFormSchema, 
    },
    searchInfo: searchInfo,
    actionColumn: { width: 300, title: '操作', dataIndex: 'action' }, 
  });

  function handleModeChange(e: any) {
    const newMode = e.target.value;
    currentQueryModel.value = newMode;
    searchInfo.queryModel = newMode;
    reload({ page: 1 }); 
  }

  function handleDetail(record: any) {
    if (detailDrawerRef.value) {
      detailDrawerRef.value.openDrawer(record.id);
    }
  }

  // ================= 审批操作：同意 =================
  async function handleApprove(record: any) {
    try {
      await approvalWorkOrderInstance(record.id, 'pass');
      createMessage.success('审批通过！');
      reload(); 
    } catch (error) {
      console.error('审批失败:', error);
    }
  }

  // ================= 🚨 新增：审批操作 - 驳回弹窗逻辑 =================
  const rejectModalVisible = ref(false);
  const rejectLoading = ref(false);
  const rejectRecord = ref<any>(null);
  const rejectMessage = ref('');

  // 打开驳回弹窗
  function handleOpenRejectModal(record: any) {
    rejectRecord.value = record;
    rejectMessage.value = ''; // 每次打开清空上次填写的理由
    rejectModalVisible.value = true;
  }

  // 提交驳回
  async function submitReject() {
    try {
      rejectLoading.value = true;
      // 传入第三个参数：驳回理由（注意确保你的 api 定义文件里支持传第三个参数 message）
      await approvalWorkOrderInstance(rejectRecord.value.id, 'reject', rejectMessage.value);
      createMessage.success('已驳回该工单！');
      rejectModalVisible.value = false;
      reload(); // 刷新表格
    } catch (error) {
      console.error('驳回失败:', error);
    } finally {
      rejectLoading.value = false;
    }
  }

  // ================= 基础操作 =================
  async function handleDelete(record: any) {
    try {
      await deleteWorkOrderInstance(record.id);
      createMessage.success('删除成功');
      reload();
    } catch (error) {
      console.error(error);
    }
  }

  // ================= 执行节点逻辑 =================
  const actionModalVisible = ref(false);
  const actionLoading = ref(false);
  const actionRecord = ref<any>(null);
  
  const actionForm = reactive({
    isSuccess: true,
    output: ''
  });

  function handleOpenActionModal(record: any, isSuccess: boolean) {
    actionRecord.value = record;
    actionForm.isSuccess = isSuccess;
    actionForm.output = ''; 
    actionModalVisible.value = true;
  }

  async function submitAction() {
    if (!actionForm.output.trim()) {
      createMessage.warning('必须填写执行输出或备注！');
      return;
    }

    try {
      actionLoading.value = true;
      await actionWorkOrderInstance(actionRecord.value.id, {
        isSuccess: actionForm.isSuccess,
        output: actionForm.output
      });
      createMessage.success('执行结果提交成功！');
      actionModalVisible.value = false;
      reload();
    } catch (error) {
      console.error('提交执行反馈失败:', error);
    } finally {
      actionLoading.value = false;
    }
  }
</script>