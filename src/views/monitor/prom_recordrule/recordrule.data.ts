import { BasicColumn, FormSchema } from '@/components/Table';
import dayjs from 'dayjs';
import { getMonitorPromScrapePoolList, getStreeNodeSelect, setMonitorPromRecordRuleStatus } from '@/api/demo/system';
import { h } from 'vue';
import { Switch } from 'ant-design-vue';
import { useMessage } from '@/hooks/web/useMessage';

// ================== 表格列配置 ==================
export const columns: BasicColumn[] = [
  {
    title: '预聚合规则名称',
    dataIndex: 'name',
    width: 220,
  },
  {
    title: '聚合指标名称',
    dataIndex: 'recordName',
    width: 220,
  },
  {
    title: '关联采集实例',
    dataIndex: 'poolName',
    width: 150,
  },

  {
    title: '绑定主机节点',
    dataIndex: 'nodePath',
    width: 250,
  },
  {
    title: '是否启用',
    dataIndex: 'enable',
    width: 120,
    helpMessage: '开启后会在关联的prometheus集群预聚合规则文件中增加',
    customRender: ({ record }) => {
      if (!Reflect.has(record, 'pendingStatus')) {
        record.pendingStatus = false;
      }
      return h(Switch, {
        checked: record.enable === 1,

        checkedChildren: '启用',
        unCheckedChildren: '禁用',

        loading: record.pendingStatus,
        onClick: (checked: boolean | string | number, e: Event) => {
          e.stopPropagation();
        },

        onChange: (checked: boolean | string | number) => {
          record.pendingStatus = true;

          const newEnable = checked ? 1 : 2;
          const { createMessage } = useMessage();

          setMonitorPromRecordRuleStatus(record.id, newEnable)
            .then(() => {
              record.enable = newEnable;
              createMessage.success(`状态修改成功`);
            })
            .catch(() => {
              createMessage.error('状态修改失败');
            })
            .finally(() => {
              record.pendingStatus = false;
            });
        },
      });
    },
    auth: 'POST:/api/monitor/setMonitorPromRecordRuleStatus'
  },
  {
    title: '创建人',
    dataIndex: 'createUserName',
    width: 130,
  },
  {
    title: '创建时间',
    dataIndex: 'CreatedAt',
    format: (text) => {
      return text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '';
    },
    width: 160,
  },
];

// ================== 顶部搜索配置 ==================
export const searchFormSchema: FormSchema[] = [
  {
    field: 'name',
    label: '预聚合规则名称',
    component: 'Input',
    colProps: { span: 6 },
    componentProps: { placeholder: '请输入预聚合规则名称' }
  },
  {
    field: 'createUserName',
    label: '创建人',
    component: 'Input',
    colProps: { span: 6 },
    componentProps: { placeholder: '请输入创建人' }
  },
  {
    field: 'enable',
    label: '状态',
    component: 'Select',
    colProps: { span: 6 },
    componentProps: {
      placeholder: '请选择状态',
      options: [
        { label: '启用', value: 1 },
        { label: '禁用', value: 2 },
      ],
    }
  }
];

// ================== 新增/编辑弹窗表单配置 ==================
export const formSchema: FormSchema[] = [
  {
    field: 'enable',
    label: '是否开启',
    component: 'Switch',
    helpMessage: '开启后会在关联的prometheus集群预聚合规则文件中增加',
    componentProps: {
      checkedValue: 1,
      checkedChildren: '启用',
      unCheckedValue: 2,
      unCheckedChildren: '禁用',

    },
    defaultValue: 1
  },
  {
    field: 'name',
    label: '预聚合规则名称',
    labelWidth: 130,
    required: true,
    component: 'Input',
    componentProps: {
      placeholder: '预聚合规则名称，给prometheus使用',
    }
  },
  {
    field: 'recordName',
    label: '聚合指标名称',
    labelWidth: 130,
    required: true,
    component: 'Input',
    componentProps: {
      placeholder: '聚合指标名称，metrics指标名称在prometheus中使用',
    }
  },

  {
    field: 'expr',
    label: 'PromeQL语句',
    required: true,
    component: 'Input',
    slot: 'exprSlot',
    itemProps: {
      htmlFor: 'codemirror_relabel_input',
    },
  },
  {
    field: 'labelsFront',
    label: '标签组labels',
    required: false,
    colProps: { span: 24 },
    component: 'InputTextArea',
    componentProps: {
      placeholder: '请输入标签，必须为 k=v 格式，多个标签请换行输入。\n例如：\nenv=prod\ncluster=beijing',
      rows: 4,
    },
    rules: [
      {
        message: '格式错误！必须为 k=v 格式，多个标签请【换行】输入',
        pattern: /^([a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[^\n]+)(\n+[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[^\n]+)*$/
      },
    ],
  },
  {
    field: 'annotationsFront',
    label: '信息标签annotations',
    required: false,
    colProps: { span: 24 },
    component: 'InputTextArea',
    componentProps: {
      placeholder: '请输入标签，必须为 k=v 格式，多个标签请换行输入。\n例如：\nenv=prod\ncluster=beijing',
      rows: 4
    },
    rules: [
      {
        message: '格式错误！必须为 k=v 格式，多个标签请【换行】输入',
        pattern: /^([a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[^\n]+)(\n+[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[^\n]+)*$/
      },
    ],
  },


  {
    field: 'poolId',
    label: '绑定采集实例',
    labelWidth: 130,
    component: 'ApiSelect',
    componentProps: {
      api: getMonitorPromScrapePoolList,
      labelField: 'name',
      valueField: 'id',
      resultField: 'items',
      showSearch: true,
      optionFilterProp: 'label',
      placeholder: '请选择关联采集实例'
    },
    rules: [
      {
        required: true,
        message: '请选择关联采集实例',
        type: 'number'
      }
    ]
  },
  {
    field: 'treeNodeId',
    label: '绑定服务树节点',
    labelWidth: 130,
    component: 'ApiSelect',
    defaultValue: [],
    componentProps: {
      api: getStreeNodeSelect,
      labelField: 'nodePath',
      valueField: 'id',
      resultField: 'items',
      showSearch: true,
      optionFilterProp: 'label',
      placeholder: '请选择服务树节点',
    },

    rules: [
      {
        required: true,
        validator: async (_, value) => {
          if (!value || (Array.isArray(value) && value.length === 0)) {
            return Promise.reject('请选择至少一个服务树节点');
          }
          return Promise.resolve();
        },
        trigger: 'blur'
      }
    ],
  },
];