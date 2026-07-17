import { BasicColumn, FormSchema } from '@/components/Table';

// ================== 列表列配置 ==================
export const columns: BasicColumn[] = [
  {
    title: '告警名称',
    dataIndex: 'alertName',
    width: 230,
  },
  {
    title: '指纹',
    dataIndex: 'fingerPrint',
    width: 300,
  },

  {
    title: '关联告警规则',
    dataIndex: 'alertRuleName',
    width: 180,
  },
  {
    title: '关联发送组',
    dataIndex: 'sendGroupName',
    width: 120,
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 120,
  },
  {
    title: '告警发送次数',
    dataIndex: 'eventTimes',
    width: 130,
  },
  {
    title: '首次告警时间',
    dataIndex: 'createdTime',
    // customRender: ({ text }) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : ''),
    width: 160,
  },
  {
    title: '最后告警时间',
    dataIndex: 'updatedTime',
    // customRender: ({ text }) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : ''),
    width: 160,
  },
];

// ================== 顶部搜索配置 ==================
export const searchFormSchema: FormSchema[] = [
  {
    field: 'alertName',
    label: '告警名称',
    component: 'Input',
    colProps: { span: 6 },
    componentProps: { placeholder: '请输入告警名称' }
  },
  {
    field: 'status',
    label: '状态',
    component: 'Select',
    colProps: { span: 6 },
    componentProps: {
      placeholder: '请选择状态',
      options: [
        { label: 'Firing', value: 'firing' },
        { label: 'Resolved', value: 'resolved' },
        { label: 'Silenced', value: 'silenced' },
      ],
    }
  }
];

// ================== 告警屏蔽弹窗表单配置 ==================
export const formSchema: FormSchema[] = [
  {
    field: 'silenceTime',
    label: '屏蔽时间',
    labelWidth: 130,
    required: true,
    component: 'Input',
    defaultValue: '2h',
    componentProps: {
      placeholder: '例如: 30m, 2h, 1d',
    }
  },
  {
    field: 'byName',
    label: '按告警名称屏蔽',
    labelWidth: 130,
    required: true,
    defaultValue: false,
    component: 'RadioButtonGroup',
    componentProps: {
      options: [
        { label: '是', value: true },
        { label: '否', value: false },
      ]
    }
  },
];