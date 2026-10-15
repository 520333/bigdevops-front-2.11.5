import { BasicColumn, FormSchema } from '@/components/Table';
import { DescItem } from '@/components/Description';
import { h } from 'vue';
import { Tag } from 'ant-design-vue';
import dayjs from 'dayjs';
import { getArcheryInstancesApi, getArcheryGroupsApi } from '@/api/workorder/archery';

// Archery 9 大原生工单状态
export const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '已正常结束', value: 'workflow_finish' },
  { label: '人工终止流程', value: 'workflow_abort' },
  { label: '等待审核人审核', value: 'workflow_manreviewing' },
  { label: '审核通过', value: 'workflow_review_pass' },
  { label: '定时执行', value: 'workflow_timingtask' },
  { label: '排队中', value: 'workflow_queuing' },
  { label: '执行中', value: 'workflow_executing' },
  { label: '自动审核不通过', value: 'workflow_autoreviewwrong' },
  { label: '执行有异常', value: 'workflow_exception' },
];

export const getStatusText = (status?: string): string => {
  switch (status) {
    case 'workflow_finish':
      return '已正常结束';
    case 'workflow_abort':
      return '人工终止流程';
    case 'workflow_manreviewing':
      return '等待审核人审核';
    case 'workflow_review_pass':
      return '审核通过';
    case 'workflow_timingtask':
      return '定时执行';
    case 'workflow_queuing':
      return '排队中';
    case 'workflow_executing':
      return '执行中';
    case 'workflow_autoreviewwrong':
      return '自动审核不通过';
    case 'workflow_exception':
      return '执行有异常';
    default:
      return status || '未知状态';
  }
};

export const getStatusColor = (status?: string): string => {
  switch (status) {
    case 'workflow_finish':
      return 'success';
    case 'workflow_executing':
      return 'processing';
    case 'workflow_review_pass':
      return 'cyan';
    case 'workflow_timingtask':
      return 'purple';
    case 'workflow_queuing':
      return 'gold';
    case 'workflow_manreviewing':
      return 'warning';
    case 'workflow_autoreviewwrong':
    case 'workflow_abort':
    case 'workflow_exception':
      return 'error';
    default:
      return 'default';
  }
};

// Vben 规范表格列配置
export const columns: BasicColumn[] = [
  {
    title: '工单号',
    dataIndex: 'workflow_id',
    width: 90,
    customRender: ({ record }) => {
      return record.workflow_id || record.id || '-';
    },
  },
  {
    title: '工单标题',
    dataIndex: 'workflow_name',
    minWidth: 200,
    ellipsis: true,
    customRender: ({ record }) => {
      return h(
        'span',
        { class: 'text-blue-600 font-medium cursor-pointer hover:underline' },
        record.workflow?.workflow_name || '-',
      );
    },
  },
  {
    title: '目标数据库',
    dataIndex: 'db_name',
    width: 220,
    customRender: ({ record }) => {
      const dbName = record.workflow?.db_name;
      const groupName = record.workflow?.group_name;
      return h('div', { class: 'flex items-center gap-1.5 flex-wrap' }, [
        h(Tag, { color: 'cyan', class: 'font-mono' }, () => dbName || '-'),
        groupName ? h('span', { class: 'text-xs text-gray-400 dark:text-gray-500' }, `(${groupName})`) : null,
      ]);
    },
  },
  {
    title: '类型',
    dataIndex: 'syntax_type',
    width: 100,
    customRender: ({ record }) => {
      const isDdl = record.workflow?.syntax_type === 1;
      return h(
        Tag,
        { color: isDdl ? 'purple' : 'blue' },
        () => (isDdl ? 'DDL 结构' : 'DML 数据'),
      );
    },
  },
  {
    title: '发起人',
    dataIndex: 'engineer',
    width: 130,
    customRender: ({ record }) => {
      return record.workflow?.engineer_display || record.workflow?.engineer || '-';
    },
  },
  {
    title: '工单状态',
    dataIndex: 'status',
    width: 140,
    customRender: ({ record }) => {
      const status = record.workflow?.status;
      return h(
        Tag,
        { color: getStatusColor(status) },
        () => getStatusText(status),
      );
    },
  },
  {
    title: '备份',
    dataIndex: 'is_backup',
    width: 75,
    customRender: ({ record }) => {
      const isBackup = record.workflow?.is_backup;
      return h(
        Tag,
        { color: isBackup ? 'green' : 'default' },
        () => (isBackup ? '是' : '否'),
      );
    },
  },
  {
    title: '提交时间',
    dataIndex: 'create_time',
    width: 170,
    customRender: ({ record }) => {
      const t = record.workflow?.create_time;
      if (!t) return '-';
      return t.replace('T', ' ').substring(0, 19);
    },
  },
];

// Vben 规范搜索表单配置 (内置暗黑模式适配与响应式网格)
export const searchFormSchema: FormSchema[] = [
  {
    field: 'status',
    label: '工单状态',
    component: 'Select',
    componentProps: {
      options: statusOptions,
      placeholder: '全部工单状态',
      allowClear: true,
    },
    colProps: { xxl: 4, xl: 5, lg: 6, md: 8, sm: 12, xs: 24 },
  },
  {
    field: 'instanceId',
    label: '数据库实例',
    component: 'ApiSelect',
    componentProps: {
      api: getArcheryInstancesApi,
      labelField: 'label',
      valueField: 'value',
      showSearch: true,
      allowClear: true,
      optionFilterProp: 'label',
      placeholder: '全部数据库实例',
      dropdownMatchSelectWidth: false,
      dropdownStyle: { minWidth: '360px' },
      numberToString: false,
      afterFetch: (list: any[]) => {
        return (list || []).map((inst) => {
          const labelText = `${inst.instance_name} (${inst.host}:${inst.port} - ${inst.db_type})`;
          return {
            label: labelText,
            value: inst.id,
            instance_name: labelText,
            id: inst.id,
          };
        });
      },
    },
    colProps: { xxl: 5, xl: 6, lg: 7, md: 8, sm: 12, xs: 24 },
  },
  {
    field: 'groupId',
    label: '所属资源组',
    component: 'ApiSelect',
    componentProps: {
      api: getArcheryGroupsApi,
      labelField: 'name',
      valueField: 'id',
      showSearch: true,
      allowClear: true,
      optionFilterProp: 'label',
      placeholder: '全部所属组',
      dropdownMatchSelectWidth: false,
      dropdownStyle: { minWidth: '240px' },
      numberToString: false,
    },
    colProps: { xxl: 4, xl: 5, lg: 6, md: 8, sm: 12, xs: 24 },
  },
  {
    field: 'dateRange',
    label: '提交时间',
    component: 'RangePicker',
    defaultValue: [
      dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
      dayjs().format('YYYY-MM-DD'),
    ],
    componentProps: {
      format: 'YYYY-MM-DD',
      valueFormat: 'YYYY-MM-DD',
      placeholder: ['起始日期', '截止日期'],
      allowClear: true,
      allowEmpty: [true, true],
      presets: [
        { label: '全部', value: [] },
        { label: '今日', value: [dayjs(), dayjs()] },
        { label: '昨日', value: [dayjs().subtract(1, 'day'), dayjs().subtract(1, 'day')] },
        { label: '最近7日', value: [dayjs().subtract(6, 'day'), dayjs()] },
        { label: '最近30日', value: [dayjs().subtract(29, 'day'), dayjs()] },
        { label: '本月', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
        {
          label: '上个月',
          value: [
            dayjs().subtract(1, 'month').startOf('month'),
            dayjs().subtract(1, 'month').endOf('month'),
          ],
        },
      ],
    },
    colProps: { xxl: 6, xl: 7, lg: 8, md: 12, sm: 24, xs: 24 },
  },
  {
    field: 'search',
    label: '工单标题',
    component: 'Input',
    componentProps: {
      placeholder: '搜索工单标题关键字',
      allowClear: true,
    },
    colProps: { xxl: 5, xl: 6, lg: 7, md: 8, sm: 12, xs: 24 },
  },
];

// Vben 标准 Description Schema：工单基本信息
export const workflowDescSchema: DescItem[] = [
  {
    field: 'workflow_id',
    label: '工单编号',
    render: (val, data) => val || data?.id || '-',
  },
  {
    field: 'workflow.workflow_name',
    label: '工单标题',
    render: (val) => val || '-',
  },
  {
    field: 'workflow.db_name',
    label: '目标数据库',
    render: (val, data) => {
      return h('span', [
        h(Tag, { color: 'blue' }, () => val || '-'),
        h('span', { class: 'text-xs text-gray-400 ml-1' }, `(ID: ${data?.workflow?.instance || '-'})`),
      ]);
    },
  },
  {
    field: 'workflow.engineer_display',
    label: '发起人',
    render: (val, data) => val || data?.workflow?.engineer || '未知',
  },
  {
    field: 'workflow.status',
    label: '工单状态',
    render: (val) => h(Tag, { color: getStatusColor(val) }, () => getStatusText(val)),
  },
  {
    field: 'workflow.syntax_type',
    label: '工单类型',
    render: (val) => h(Tag, { color: 'purple' }, () => val === 1 ? 'DDL 结构变更' : 'DML 数据变更'),
  },
  {
    field: 'workflow.create_time',
    label: '提交时间',
    render: (val) => val ? val.replace('T', ' ').substring(0, 19) : '-',
  },
  {
    field: 'workflow.finish_time',
    label: '完成时间',
    render: (val) => val ? val.replace('T', ' ').substring(0, 19) : '尚未完成',
  },
  {
    field: 'workflow.is_backup',
    label: '备份策略',
    render: (val) => h(Tag, { color: val ? 'green' : 'default' }, () => val ? '自动备份' : '不备份'),
  },
];

