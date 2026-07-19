<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate" v-auth="'POST:/api/jobexec/createJobExecTask'"> 新增任务 </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'clarity:info-standard-line',
                tooltip: '查看详情',
                onClick: () => handleViewDetail(record),
                auth: 'GET:/api/jobexec/getJobExecTaskOne/:id'
              },
              {
                icon: 'ant-design:play-circle-outlined',
                tooltip: '执行开始任务',
                color: 'success',
                ifShow: () => !record.status || record.status === 'pending',
                popConfirm: {
                  title: '确定要开始下发执行该任务吗？',
                  placement: 'left',
                  confirm: () => handleTaskAction(record, 'start', '启动'),
                },
                auth: 'GET:/api/jobexec/actionJobExecTaskOne/:id'
              },
              {
                icon: 'ant-design:pause-circle-outlined',
                tooltip: '暂停任务',
                color: 'warning',
                ifShow: () => record.status === 'running',
                popConfirm: {
                  title: '确定要暂停当前正在运行的任务吗？',
                  placement: 'left',
                  confirm: () => handleTaskAction(record, 'pause', '暂停'),
                },
                auth: 'POST:/api/jobexec/actionJobExecTaskOne/:id'
              },
              {
                icon: 'ant-design:caret-right-outlined',
                tooltip: '继续/恢复任务',
                color: 'success',
                ifShow: () => record.status === 'paused',
                popConfirm: {
                  title: '确定要恢复执行该任务吗？',
                  placement: 'left',
                  confirm: () => handleTaskAction(record, 'resume', '恢复'),
                },
                auth: 'POST:/api/jobexec/actionJobExecTaskOne/:id'
              },
            ]"
            :dropDownActions="[
              {
                icon: 'ant-design:stop-outlined',
                label: '强制停止',
                ifShow: () => record.status === 'running' || record.status === 'paused',
                popConfirm: {
                  title: '确定要将此任务标记为手动停止完工吗？',
                  placement: 'left',
                  confirm: () => handleTaskAction(record, 'stop', '停止'),
                },
                auth: 'POST:/api/jobexec/actionJobExecTaskOne/:id'
              },
              {
                icon: 'ant-design:close-circle-outlined',
                label: '强杀进程(Kill)',
                color: 'error',
                ifShow: () => record.status === 'running' || record.status === 'paused',
                popConfirm: {
                  title: '【危险操作】确定要强行强杀该异步任务的所有集群节点进程吗？',
                  placement: 'left',
                  confirm: () => handleTaskAction(record, 'kill', '终止'),
                },
                auth: 'POST:/api/jobexec/actionJobExecTaskOne/:id'
              },
              {
                icon: 'ant-design:delete-outlined',
                label: '删除记录',
                color: 'error',
                ifShow: () => record.status !== 'running' && record.status !== 'paused',
                popConfirm: {
                  title: '是否确认永久删除该任务流历史？',
                  placement: 'left',
                  confirm: () => handleDelete(record),
                },
                auth: 'DELETE:/api/jobexec/deleteJobExecTask/:id'

              },
            ]"
          />
        </template>
      </template>
    </BasicTable>
    
    <JobTaskCreateDrawer @register="registerDrawer" @success="handleSuccess" />
    
    <JobTaskDetailDrawer ref="detailDrawerRef" />
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { BasicTable, useTable, TableAction } from '@/components/Table';
  import { useDrawer } from '@/components/Drawer';
  import JobTaskCreateDrawer from './JobTaskCreateDrawer.vue';
  import JobTaskDetailDrawer from './JobTaskDetailDrawer.vue'; 
  import { columns, searchFormSchema } from './jobTask.data';
  import { useMessage } from '@/hooks/web/useMessage';

  import { getJobExecTaskList, deleteJobExecTask, actionJobExecTaskOne } from '@/api/demo/system';

  const { createMessage } = useMessage();
  
  const [registerDrawer, { openDrawer }] = useDrawer();
  
  const detailDrawerRef = ref();

  const [registerTable, { reload }] = useTable({
    title: '任务执行控制中心',
    api: getJobExecTaskList,
    columns,
    formConfig: {
      labelWidth: 100,
      schemas: searchFormSchema,
    },
    useSearchForm: true,
    showTableSetting: true,
    bordered: true,
    showIndexColumn: false,
    actionColumn: {
      width: 160, 
      title: '操作',
      dataIndex: 'action',
    },
  });

  function handleCreate() {
    openDrawer(true, {
      isUpdate: false,
    });
  }
  
  function handleViewDetail(record: Recordable) {
    // 💡 确保 ref 存在再调用
    if (detailDrawerRef.value) {
      detailDrawerRef.value.openDrawer(record.id);
    }
  }

  async function handleTaskAction(record: Recordable, actionType: string, actionLabel: string) {
    try {
      await actionJobExecTaskOne(record.id, actionType);
      createMessage.success(`任务指令【${actionLabel}】下发成功！`);
      reload(); 
    } catch (error) {
      console.error(`下发任务指令[${actionType}]失败:`, error);
    }
  }

  async function handleDelete(record: Recordable) {
    try {
      await deleteJobExecTask(record.id);
      createMessage.success('删除成功');
      reload();
    } catch (error) {
      console.error(error);
    }
  }

  function handleSuccess() {
    reload();
  }
</script>

<!-- <style lang="less">
.CodeMirror {
  background-color: var(--app-content-background) !important;
  color: var(--text-color-base) !important;
}
.editor-border {
  border: 1px solid var(--border-color) !important;
  border-radius: 4px;
}
</style> -->