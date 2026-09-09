import { BasicColumn, FormSchema } from '@/components/Table';
import dayjs from 'dayjs';
import { getResourceEcsList } from '@/api/demo/system';
import { h } from 'vue';
import { Tag } from 'ant-design-vue';
import { RightCircleOutlined } from '@ant-design/icons-vue';
// ================== 列表列配置 ==================
export const columns: BasicColumn[] = [
  {
    title: '集群名称',
    dataIndex: 'name',
    width: 250,
  },
  {
    title: '远程写入地址',
    dataIndex: 'remoteWriteUrl',
    width: 200,
  },
  {
    title: '采集器实例',
    dataIndex: 'prometheus_instances',
    width: 250,
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
    title: '采集器标签',
    dataIndex: 'externalLabels',
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
    label: '采集池名称',
    component: 'Input',
    colProps: { span: 8 },
    componentProps: { placeholder: '请输入采集池名称' }
  },
  {
    field: 'createUserName',
    label: '创建人',
    component: 'Input',
    colProps: { span: 8 },
    componentProps: { placeholder: '请输入创建人' }
  }
];

// ================== 新增/编辑弹窗表单配置 ==================
const supperAlert = (supperAlert: number) => supperAlert === 1;
const supperRecord = (supperRecord: number) => supperRecord === 1;
export const formSchema: FormSchema[] = [
  {
    field: 'name',
    label: '采集池名称',
    required: true,
    component: 'Input',
    colProps: { span: 24 },
    componentProps: {
      placeholder: '请输入采集池名称，例如：prod-web-pool'
    }
  },
  {
    field: 'remoteWriteUrl',
    label: '远程存储地址',
    component: 'Input',
    colProps: { span: 12 },
    componentProps: {
      placeholder: '选填，留空则使用本地TSDB存储。例如：http://192.168.50.200:8428/api/v1/write'
    },
    rules: [
      { required: false, type: 'url', message: '请输入正确的 URL 格式 (必须以 http:// 或 https:// 开头)', trigger: 'blur' },
    ],
  },
  {
    field: 'remoteTimeoutSeconds',
    label: '远程存储超时(s)',
    colProps: { span: 12 },
    component: 'InputNumber',
    defaultValue: 30,
    componentProps: {
      placeholder: '默认 30',
      style: { width: '100%' }
    }
  },
  {
    field: 'scrapeInterval',
    label: '采集间隔(s)',
    colProps: { span: 12 },
    component: 'InputNumber',
    defaultValue: 15,
    componentProps: {
      placeholder: '默认 15',
      style: { width: '100%' }
    }
  },
  {
    field: 'scrapeTimeout',
    label: '采集超时(s)',
    colProps: { span: 12 },
    component: 'InputNumber',
    defaultValue: 5,
    componentProps: {
      placeholder: '默认 5',
      style: { width: '100%' }
    }
  },
  {
    field: 'prometheus_instances',
    label: '关联实例',
    component: 'ApiSelect',
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
    field: 'externalLabels',
    label: '采集器标签',
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
    field: 'supperAlert',
    label: '告警规则配置',
    labelWidth: 150,
    component: 'Switch',
    helpMessage: '开启后主配置文件rule_files中注入；以及注入到rule.yml规则文件中',
    componentProps: {
      checkedValue: 1,
      checkedChildren: '开启',
      unCheckedValue: 2,
      unCheckedChildren: '关闭',

    },
    defaultValue: 2
  },
  {
    field: 'alertManagerUrl',
    label: '告警实例地址',
    labelWidth: 150,
    component: 'Input',
    ifShow: ({ values }) => supperAlert(values.supperAlert),
    componentProps: {
      placeholder: '例如：192.168.50.200:9093',
      style: { width: '100%' }
    }
  },
  {
    field: 'remoteReadUrl',
    label: '远程读取地址',
    labelWidth: 150,
    component: 'Input',
    ifShow: ({ values }) => supperAlert(values.supperAlert),
    componentProps: {
      placeholder: '例如：http://192.168.50.200:8428/api/v1/read',
      style: { width: '100%' }
    }
  },
  {
    field: 'ruleFilePath',
    label: '告警规则文件路径',
    labelWidth: 150,
    component: 'Input',
    ifShow: ({ values }) => supperAlert(values.supperAlert),
    componentProps: {
      placeholder: '例如：/opt/app/prometheus/rule.yml',
      style: { width: '100%' }
    }
  },
  {
    field: 'supperRecord',
    label: '聚合规则配置',
    labelWidth: 150,
    component: 'Switch',
    helpMessage: '开启后会在主配置文件rule_files中注入；以及注入到record.yml规则文件中',
    componentProps: {
      checkedValue: 1,
      checkedChildren: '开启',
      unCheckedValue: 2,
      unCheckedChildren: '关闭',

    },
    defaultValue: 2
  },
  {
    field: 'recordFilePath',
    label: '聚合规则文件路径',
    labelWidth: 150,
    component: 'Input',
    ifShow: ({ values }) => supperRecord(values.supperRecord),
    componentProps: {
      placeholder: '例如：/opt/app/prometheus/record.yml',
      style: { width: '100%' }
    }
  },
];