<template>
  <BasicModal
    v-bind="$attrs"
    @register="registerModal"
    title="从服务基线选择待发布应用"
    width="900px"
    @ok="handleConfirm"
  >
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <InputSearch
          v-model:value="searchKeyword"
          placeholder="搜索服务名、项目名称或构建任务名..."
          allow-clear
          class="flex-1"
          @search="handleSearch"
        />
        <Select
          v-model:value="filterEnv"
          placeholder="环境筛选"
          style="width: 150px"
          allow-clear
          @change="handleSearch"
        >
          <SelectOption value="prod">生产环境 (prod)</SelectOption>
          <SelectOption value="test">测试环境 (test)</SelectOption>
          <SelectOption value="dev">开发环境 (dev)</SelectOption>
        </Select>
      </div>

      <BasicTable @register="registerTable" />
    </div>
  </BasicModal>
</template>

<script lang="ts" setup>
  import { ref, h } from 'vue';
  import { BasicModal, useModalInner } from '@/components/Modal';
  import { BasicTable, useTable, BasicColumn } from '@/components/Table';
  import { getJenkinsJobList } from '@/api/cicd';
  import { InputSearch, Select, SelectOption, Tag } from 'ant-design-vue';

  const emit = defineEmits(['register', 'select-services']);

  const searchKeyword = ref('');
  const filterEnv = ref('prod');

  const columns: BasicColumn[] = [
    { title: '服务名称', dataIndex: 'serviceName', key: 'serviceName', width: 160 },
    { title: '所属项目', dataIndex: 'projectName', key: 'projectName', width: 150 },
    {
      title: '部署环境',
      dataIndex: 'deployEnv',
      width: 100,
      customRender: ({ text }) => {
        const color = text === 'prod' ? 'success' : text === 'test' ? 'warning' : 'processing';
        return h(Tag, { color }, () => text || 'prod');
      },
    },
    {
      title: '部署类型',
      dataIndex: 'deployType',
      width: 100,
      customRender: ({ text }) => h(Tag, { color: 'default' }, () => text || 'k8s'),
    },
    { title: '默认构建分支', dataIndex: 'gitBranch', width: 130 },
  ];

  const [registerTable, { getSelectRows, setSelectedRowKeys, reload }] = useTable({
    api: getJenkinsJobList,
    columns,
    rowKey: 'id',
    rowSelection: {
      type: 'checkbox',
    },
    pagination: { pageSize: 10 },
    beforeFetch: (params) => {
      params.keyword = searchKeyword.value;
      if (filterEnv.value) {
        params.deployEnv = filterEnv.value;
      }
      return params;
    },
  });

  const [registerModal, { closeModal }] = useModalInner(() => {
    setSelectedRowKeys([]);
    reload();
  });

  const handleSearch = () => {
    reload();
  };

  const handleConfirm = () => {
    const rows = getSelectRows();
    if (rows && rows.length > 0) {
      emit('select-services', rows);
    }
    closeModal();
  };
</script>
