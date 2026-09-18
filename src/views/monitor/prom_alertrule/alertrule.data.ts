import { BasicColumn, FormSchema } from '@/components/Table';
import dayjs from 'dayjs';
import { getMonitorAlertManagerSendGroupList, getMonitorPromScrapePoolList, getStreeNodeSelect, setMonitorPromAlertRuleStatus } from '@/api/demo/system';
import { h } from 'vue';
import { Switch } from 'ant-design-vue';
import { useMessage } from '@/hooks/web/useMessage';

// ================== 表格列配置 ==================
export const columns: BasicColumn[] = [
  {
    title: '告警规则名称',
    dataIndex: 'name',
    width: 220,
  },
  {
    title: '关联采集实例',
    dataIndex: 'poolNames',
    width: 200,
  },
  {
    title: '关联发送组',
    dataIndex: 'sendGroupName',
    width: 120,
  },
  {
    title: '告警级别',
    dataIndex: 'severity',
    width: 100,
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
    helpMessage: '开启后会在关联的prometheus集群告警规则文件中增加',
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

          setMonitorPromAlertRuleStatus(record.id, newEnable)
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
    auth: 'POST:/api/monitor/setMonitorPromAlertRuleStatus'
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
    label: '告警规则名称',
    component: 'Input',
    colProps: { span: 6 },
    componentProps: { placeholder: '请输入告警规则名称' }
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
    helpMessage: '开启后会在关联的prometheus集群告警规则文件中增加',
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
    label: '告警规则名称',
    labelWidth: 130,
    required: true,
    component: 'Input',
    componentProps: {
      placeholder: '告警规则名称，给prometheus使用',
    }
  },
  {
    field: 'severity',
    label: '告警级别',
    labelWidth: 130,
    required: true,
    component: 'Select',
    componentProps: {
      options: [
        { label: '严重的', value: 'critical' },
        { label: '一般的', value: 'warning' },
        { label: '通知的', value: 'info' },

      ]
    }
  },
  {
    field: 'forTime',
    label: '触发持续时间',
    labelWidth: 130,
    defaultValue: '1m',
    required: true,
    component: 'Input',
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
    field: 'grafanaLink',
    label: 'grafana大板地址',
    labelWidth: 130,
    required: true,
    component: 'Input'
  },
  {
    field: 'poolIds',
    label: '绑定采集实例',
    labelWidth: 130,
    component: 'ApiSelect',
    defaultValue: [],
    componentProps: {
      api: getMonitorPromScrapePoolList,
      mode: 'multiple',
      labelField: 'name',
      valueField: 'id',
      resultField: 'items',
      showSearch: true,
      optionFilterProp: 'label',
      placeholder: '请选择关联采集实例(可多选)'
    },
    rules: [
      {
        required: true,
        validator: async (_, value) => {
          if (!value || (Array.isArray(value) && value.length === 0)) {
            return Promise.reject('请选择至少一个prometheus实例');
          }
          return Promise.resolve();
        },
        trigger: 'blur'
      }
    ],
  },
  {
    field: 'sendGroupId',
    label: '绑定发送组',
    labelWidth: 130,
    component: 'ApiSelect',
    defaultValue: [],
    componentProps: {
      api: getMonitorAlertManagerSendGroupList,
      labelField: 'name',
      valueField: 'id',
      resultField: 'items',
      showSearch: true,
      optionFilterProp: 'label',
      placeholder: '请选择关联发送组'
    },
    rules: [
      {
        required: true,
        validator: async (_, value) => {
          if (!value || (Array.isArray(value) && value.length === 0)) {
            return Promise.reject('请选择至少一个alertmanager实例');
          }
          return Promise.resolve();
        },
        trigger: 'blur'
      }
    ],
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