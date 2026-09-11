import { BasicColumn, FormSchema } from '@/components/Table';
import dayjs from 'dayjs';
import { getResourceEcsList, getMonitorAlertManagerSendGroupList } from '@/api/demo/system';
import { h } from 'vue';
import { Tag } from 'ant-design-vue';
import { RightCircleOutlined } from '@ant-design/icons-vue';

// ================== 列表列配置 ==================
export const columns: BasicColumn[] = [
  {
    title: '集群名称',
    dataIndex: 'name',
    width: 150,
  },
  {
    title: '实例IP',
    dataIndex: 'alertManagerInstances',
    width: 150,
    customRender: ({ text }) => {
      if (!text || !Array.isArray(text)) return '';
      return h(
        'div',
        { style: { display: 'flex', flexWrap: 'wrap', gap: '4px' } },
        text.map((ip: string) =>
          h(Tag,
            {
              color: 'processing',
              style: { cursor: 'pointer', display: 'flex', alignItems: 'center' },
              onClick: () => { }
            },
            () => [
              ip,
              h(RightCircleOutlined, { style: { marginLeft: '4px' } })
            ]
          )
        )
      );
    },
  },
  {
    title: '默认恢复时间',
    dataIndex: 'resolveTimeout',
    width: 100,
  },
  {
    title: '默认分组第一次等待时间',
    dataIndex: 'groupWait',
    width: 180,
  },
  {
    title: '默认分组间隔',
    dataIndex: 'groupInterval',
    width: 100,
  },
  {
    title: '默认重复发送间隔',
    dataIndex: 'repeatInterval',
    width: 140,
  },
  {
    title: '兜底接收者',
    dataIndex: 'receiver',
    width: 100,
  },
  {
    title: '分组标签',
    dataIndex: 'groupBy',
    width: 250,
    customRender: ({ text }) => {
      if (!text || !Array.isArray(text)) return '';
      return h(
        'div',
        { style: { display: 'flex', flexWrap: 'wrap', gap: '4px' } },
        text.map((label: string) => h(Tag, { color: 'success' }, () => label))
      );
    },
  },
  {
    title: '创建人',
    dataIndex: 'createUserName',
    width: 120,
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
    label: '实例名称',
    component: 'Input',
    colProps: { span: 6 },
    componentProps: { placeholder: '请输入实例名称' }
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
    field: 'name',
    label: '实例名称',
    labelWidth: 120,
    required: true,
    component: 'Input',
    colProps: { span: 18 },
    componentProps: {
      placeholder: '请输入实例名称，例如：xxx项目',
    }
  },
  {
    field: 'enable',
    label: '是否开启',
    labelWidth: 100,
    component: 'Switch',
    colProps: { span: 6 },
    componentProps: {
      checkedValue: 1,
      checkedChildren: '启用',
      unCheckedValue: 2,
      unCheckedChildren: '禁用',
    },
    defaultValue: 1,
  },

  {
    field: 'groupWait',
    label: '默认分组第一次等待时间',
    labelWidth: 180,
    component: 'Input',
    defaultValue: '15s',
    colProps: { span: 24 },
    componentProps: {
      placeholder: '默认 15s',
    }
  },
  {
    field: 'receiver',
    label: '默认接收者',
    labelWidth: 130,
    component: 'ApiSelect',
    colProps: { span: 24 },
    componentProps: {
      api: getMonitorAlertManagerSendGroupList,
      labelField: 'name',
      valueField: 'name',
      resultField: 'items',
      showSearch: true,
      optionFilterProp: 'label',
      placeholder: '请选择关联发送组'
    },
    required: true

  },
  {
    field: 'resolveTimeout',
    label: '默认恢复时间(s)',
    labelWidth: 130,
    component: 'Input',
    defaultValue: '30s',
    colProps: { span: 8 },
    componentProps: {
      placeholder: '默认 30s',
      style: { width: '100%' }
    }
  },
  {
    field: 'groupInterval',
    label: '默认分组间隔(s)',
    labelWidth: 130,
    component: 'Input',
    defaultValue: '5s',
    colProps: { span: 8 },
    componentProps: {
      placeholder: '默认 5s',
      style: { width: '100%' }
    }
  },
  {
    field: 'repeatInterval',
    label: '默认重复发送间隔(s)',
    labelWidth: 150,
    component: 'Input',
    defaultValue: '5s',
    colProps: { span: 8 },
    componentProps: {
      placeholder: '默认 5s',
      style: { width: '100%' }
    }
  },

  {
    field: 'alertManagerInstances',
    label: '关联实例',
    labelWidth: 120,
    component: 'ApiSelect',
    colProps: { span: 24 },
    componentProps: {
      api: async (params: any) => {
        const res = await getResourceEcsList(params);
        if (res && res.items) {
          res.items.forEach((item: any) => {
            const ip = item.PrivateIpAddress?.[0] || '无私网IP';
            item.titleWithIp = `${item.title} (${ip})`;
            item.submitIpValue = ip;
          });
        }
        return res;
      },
      mode: 'multiple',
      labelField: 'titleWithIp',
      valueField: 'submitIpValue',
      resultField: 'items',
      showSearch: true,
      optionFilterProp: 'label',
      placeholder: '请选择关联实例'
    },
    rules: [
      {
        required: true,
        validator: async (_, value) => {
          if (!value || (Array.isArray(value) && value.length === 0)) {
            return Promise.reject('请选择至少一个关联实例');
          }
          return Promise.resolve();
        },
        trigger: 'blur'
      }
    ],
  },

  {
    field: 'groupBy',
    label: '分组标签',
    labelWidth: 120,
    required: false,
    colProps: { span: 24 },
    component: 'InputTextArea',
    componentProps: {
      placeholder: '请输入标签名，多个标签请换行输入。\n例如：\nalertname\ninstance\njob',
      rows: 4
    },
    rules: [
      {
        message: '格式错误！必须为合法标签名（英文字母/下划线开头），多个标签请【换行】输入',
        pattern: /^([a-zA-Z_][a-zA-Z0-9_]*)(\n+[a-zA-Z_][a-zA-Z0-9_]*)*$/
      },
    ],
  },
];