import { BasicColumn, FormSchema } from '@/components/Table';
import dayjs from 'dayjs';
import { getAccountList, getMonitorAlertManagerPoolList, getMonitorOndutyGroupList, setAlertManagerSendGroupStatus } from '@/api/demo/system';
import { h } from 'vue';
import { Switch } from 'ant-design-vue';
import { useMessage } from '@/hooks/web/useMessage';

// ================== 列表列配置 ==================
export const columns: BasicColumn[] = [
  {
    title: '发送组名称',
    dataIndex: 'name',
    width: 220,
  },
  {
    title: '分组中文名称',
    dataIndex: 'nameZh',
    width: 180,
  },
  {
    title: '关联的告警实例',
    dataIndex: 'poolName',
    width: 120,
  },
  {
    title: '关联值班组',
    dataIndex: 'onDutyGroupName',
    width: 120,
  },

  {
    title: '默认重复发送间隔',
    dataIndex: 'repeatInterval',
    width: 130,
  },
  {
    title: '是否发送恢复消息',
    dataIndex: '',
    width: 130,
  },
  {
    title: '飞书群token',
    dataIndex: 'feiShuQunRobotToken',
    width: 320,
  },
  {
    title: '告警首次升级人',
    dataIndex: 'firstUpgradeUsers',
    width: 150,
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

  {
    title: '是否启用',
    dataIndex: 'enable',
    width: 130,
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

          setAlertManagerSendGroupStatus(record.id, newEnable)
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
    auth: 'POST:/api/monitor/setAlertManagerSendGroupStatus'
  },



];

// ================== 顶部搜索配置 ==================
export const searchFormSchema: FormSchema[] = [
  {
    field: 'name',
    label: '发送组名称',
    component: 'Input',
    colProps: { span: 6 },
    componentProps: { placeholder: '请输入发送组名称' }
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
const needUpgrade = (needUpgrade: number) => needUpgrade === 1;
export const formSchema: FormSchema[] = [
  {
    field: 'name',
    label: '英文名称',
    labelWidth: 130,
    required: true,
    component: 'Input',
    componentProps: {
      placeholder: '发送组名称，给alertmanager使用',
    }
  },
  {
    field: 'nameZh',
    label: '中文名称',
    labelWidth: 130,
    required: true,
    component: 'Input',
    componentProps: {
      placeholder: '发送组名称，给alertmanager使用',
    }
  },
  {
    field: 'poolId',
    label: '关联告警实例',
    labelWidth: 130,
    component: 'ApiSelect',
    defaultValue: [],
    componentProps: {
      api: getMonitorAlertManagerPoolList,
      labelField: 'name',
      valueField: 'id',
      resultField: 'items',
      showSearch: true,
      optionFilterProp: 'label',
      placeholder: '请选择关联告警实例'
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
    field: 'enable',
    label: '是否开启',
    component: 'Switch',
    helpMessage: '开启后会在关联的alertmanager集群主配置routes中增加',
    componentProps: {
      checkedValue: 1,
      checkedChildren: '启用',
      unCheckedValue: 2,
      unCheckedChildren: '禁用',
    },
    defaultValue: 1
  },
  {
    field: 'repeatInterval',
    label: '默认重复发送间隔(s)',
    labelWidth: 130,
    component: 'Input',
    defaultValue: '5s',
    componentProps: {
      placeholder: '默认 4s',
    }
  },
  {
    field: 'feiShuQunRobotToken',
    label: '飞书群组token',
    labelWidth: 130,
    component: 'Input',
    required: true,
    defaultValue: '',
    componentProps: {
      placeholder: '输入飞书群自定义机器人webhook token地址',
    }
  },
  {
    field: 'onDutyGroupId',
    label: '关联值班组',
    labelWidth: 130,
    component: 'ApiSelect',
    defaultValue: [],
    componentProps: {
      api: getMonitorOndutyGroupList,
      labelField: 'name',
      valueField: 'id',
      resultField: 'items',
      showSearch: true,
      optionFilterProp: 'label',
      placeholder: '请选择关联值班组'
    },
    rules: [
      {
        required: true,
        validator: async (_, value) => {
          if (!value || (Array.isArray(value) && value.length === 0)) {
            return Promise.reject('请选择至少一个值班组');
          }
          return Promise.resolve();
        },
        trigger: 'blur'
      }
    ],
  },

  {
    field: 'sendResolved',
    label: '是否发送恢复消息',
    labelWidth: 130,
    component: 'Switch',
    componentProps: {
      checkedValue: 1,
      checkedChildren: '启用',
      unCheckedValue: 2,
      unCheckedChildren: '禁用',

    },
    defaultValue: 1
  },

  {
    field: 'needUpgrade',
    label: '开启告警升级',
    labelWidth: 130,
    component: 'Switch',
    componentProps: {
      checkedValue: 1,
      checkedChildren: '升级',
      unCheckedValue: 2,
      unCheckedChildren: '不升级',

    },
    defaultValue: 2
  },
  {
    field: 'firstUserNames',
    label: '第一升级人列表',
    labelWidth: 130,
    component: 'ApiSelect',
    ifShow: ({ values }) => needUpgrade(values.needUpgrade),

    componentProps: {
      api: getAccountList,
      mode: 'multiple',
      showSearch: true,
      labelField: "realName",
      valueField: "userName",
      resultField: 'items',

      placeholder: '请选择第一升级人',

    },
    rules: [
      {
        required: true,
        validator: async (_, value) => {
          if (!value || (Array.isArray(value) && value.length === 0)) {
            return Promise.reject('请选择至少一个发送人');
          }
          return Promise.resolve();
        },
        trigger: 'blur'
      }
    ],
  },
  {
    field: 'upgradeMinutes',
    label: '告警升级间隔',
    labelWidth: 130,
    component: 'InputNumber',
    ifShow: ({ values }) => needUpgrade(values.needUpgrade),
    defaultValue: 30,
    componentProps: {
      placeholder: '默认 30',
    }
  },

];