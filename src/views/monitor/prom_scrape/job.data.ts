import { BasicColumn, FormSchema } from '@/components/Table';
import dayjs from 'dayjs';
import { getLeafStreeNodes, getMonitorPromScrapePoolList, setMonitorPromScrapeJobStatus } from '@/api/demo/system';
import { h } from 'vue';
import { Switch, Tag } from 'ant-design-vue';
import { useMessage } from '@/hooks/web/useMessage';

// ================== 列表列配置 ==================
export const columns: BasicColumn[] = [
  {
    title: '采集任务名称',
    dataIndex: 'name',
    width: 250,
  },
  {
    title: '服务发现类型',
    dataIndex: 'serviceDiscoveryType',
    width: 200,
  },
  {
    title: '关联采集池',
    dataIndex: 'poolNames',
    width: 220,
    customRender: ({ record }) => {
      const poolNames = (record.poolNames && record.poolNames.length > 0)
        ? record.poolNames
        : (record.poolName ? [record.poolName] : []);
      if (!poolNames || poolNames.length === 0) {
        return h('span', { class: 'text-gray-400' }, '未关联');
      }
      return h(
        'div',
        { class: 'flex flex-wrap gap-1' },
        poolNames.map((name: string) => h(Tag, { color: 'blue' }, () => name)),
      );
    },
  },
  {
    title: '状态',
    dataIndex: 'enable',
    width: 120,
    helpMessage: '开启后会在关联的prometheus集群主配置文件中增加该Job',
    customRender: ({ record }) => {
      if (!Reflect.has(record, 'pendingStatus')) {
        record.pendingStatus = false;
      }
      return h(Switch, {
        checked: record.enable === 1,

        checkedChildren: '启用',
        unCheckedChildren: '禁用',

        loading: record.pendingStatus,
        onChange(checked: boolean) {
          record.pendingStatus = true;

          const newEnable = checked ? 1 : 2;
          const { createMessage } = useMessage();

          setMonitorPromScrapeJobStatus(record.id, newEnable)
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
    auth: 'POST:/api/monitor/setMonitorPromScrapeJobStatus'
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
    label: '采集任务名称',
    component: 'Input',
    colProps: { span: 8 },
    componentProps: { placeholder: '请输入采集任务名称' }
  },
  {
    field: 'createUserName',
    label: '创建人',
    component: 'Input',
    colProps: { span: 8 },
    componentProps: { placeholder: '请输入创建人' }
  },
  {
    field: 'enable',
    label: '状态',
    component: 'Select',
    colProps: { span: 8 },
    componentProps: {
      placeholder: '请选择状态',
      options: [
        { label: '启用', value: 1 },
        { label: '禁用', value: 2 },
      ],
    },
  }
];

// ================== 新增/编辑弹窗表单配置 ==================
export const formSchema: FormSchema[] = [
  {
    field: 'name',
    label: '采集任务名称',
    labelWidth: 120,
    required: true,
    component: 'Input',
    colProps: { span: 11 },
    componentProps: {
      placeholder: '请输入采集任务名称，例如：mysql-exporter'
    }
  },
  {
    field: 'poolIds',
    label: '绑定采集池',
    labelWidth: 120,
    component: 'ApiSelect',
    colProps: { span: 9 },
    defaultValue: [],
    componentProps: {
      api: getMonitorPromScrapePoolList,
      mode: 'multiple',
      labelField: 'name',
      valueField: 'id',
      resultField: 'items',
      showSearch: true,
      optionFilterProp: 'label',
      placeholder: '请选择关联采集池(可多选)'
    },
    rules: [
      {
        required: true,
        validator: async (_, value) => {
          if (!value || (Array.isArray(value) && value.length === 0)) {
            return Promise.reject('请选择至少一个采集池');
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
    colProps: { span: 4 },
    componentProps: {
      checkedValue: 1,
      checkedChildren: '启用',
      unCheckedValue: 2,
      unCheckedChildren: '禁用',

    },
    defaultValue: 1
  },
  {
    field: 'metricsPath',
    label: '采集路径',
    labelWidth: 120,
    colProps: { span: 6 },
    component: 'Input',
    defaultValue: '/metrics',
    componentProps: {
      placeholder: '默认 /metrics',
      style: { width: '100%' }
    }
  },
  {
    field: 'scheme',
    label: '采集协议',
    colProps: { span: 6 },
    component: 'Select',
    defaultValue: 'http',
    componentProps: {
      placeholder: '默认 http',
      options: [
        { label: 'http', value: 'http' },
        { label: 'https', value: 'https' },
        { label: 'none (无协议前缀，用于TCP/ICMP)', value: 'none' },
      ]
    }
  },
  {
    field: 'scrapeInterval',
    label: '采集间隔(s)',
    colProps: { span: 6 },
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
    colProps: { span: 6 },
    component: 'InputNumber',
    defaultValue: 5,
    componentProps: {
      placeholder: '默认 5',
      style: { width: '100%' }
    }
  },
  {
    field: 'relabelConfigsYamlString',
    label: '自定义relabel配置',
    labelWidth: 120,
    component: 'Input',
    slot: 'relabelSlot',
    colProps: { span: 24 },
    itemProps: {
      htmlFor: 'codemirror_relabel_input',
    },
    componentProps: {
      placeholder: '请输入自定义relabel配置，YAML格式',
    }
  },
  {
    field: 'serviceDiscoveryType',
    label: '服务发现类型',
    labelWidth: 120,
    required: true,
    component: 'Select',
    colProps: { span: 24 },
    componentProps: ({ formActionType }) => ({
      placeholder: '请选择服务发现类型',
      options: [
        { label: 'HTTP (服务树主机发现)', value: 'http' },
        { label: 'Blackbox-DNS (服务树域名探测)', value: 'blackbox_dns' },
        { label: 'Kubernetes (K8s发现)', value: 'kubernetes' },
      ],
      onChange: (val: any) => {
        if (val === 'blackbox_dns') {
          formActionType.setFieldsValue({ metricsPath: '/probe', scheme: 'https' });
        } else if (val === 'http') {
          formActionType.setFieldsValue({ metricsPath: '/metrics', scheme: 'http' });
        }
      }
    }),
  },
  {
    field: 'kubernetesSdRole',
    label: '服务发现角色',
    labelWidth: 120,
    component: 'Select',
    ifShow: ({ values }) => values.serviceDiscoveryType === 'kubernetes',
    colProps: { span: 12 },
    componentProps: {
      placeholder: '请选择Kubernetes服务发现角色',
      style: { width: '100%' },
      options: [
        { label: 'node', value: 'node' },
        { label: 'pod', value: 'pod' },
        { label: 'service', value: 'service' },
        { label: 'endpoints', value: 'endpoints' },
      ]
    },
  },
  {
    field: 'kubeConfigFilePath',
    label: 'config 文件路径',
    labelWidth: 120,
    component: 'Input',
    ifShow: ({ values }) => values.serviceDiscoveryType === 'kubernetes',
    componentProps: {
      placeholder: '请输入 kubeconfig 文件路径，例如：/etc/kubernetes/kubeconfig.yaml',
      style: { width: '100%' }
    }
  },
  {
    field: 'tlsCaFilePath',
    label: 'TLS CA 文件路径',
    labelWidth: 120,
    component: 'Input',
    ifShow: ({ values }) => values.serviceDiscoveryType === 'kubernetes',
    componentProps: {
      placeholder: '请输入 TLS CA 文件路径，例如：/etc/kubernetes/tls/ca.crt',
      style: { width: '100%' }
    }
  },
  {
    field: 'bearerTokenFile',
    label: 'Token 文件路径',
    labelWidth: 120,
    component: 'Input',
    ifShow: ({ values }) => values.serviceDiscoveryType === 'kubernetes',
    componentProps: {
      placeholder: '请输入 Bearer Token 文件路径，例如：/etc/kubernetes/tls/bearer.token',
      style: { width: '100%' }
    }
  },
  {
    field: 'apiServer',
    label: 'API 服务器地址',
    labelWidth: 120,
    component: 'Input',
    ifShow: ({ values }) => values.serviceDiscoveryType === 'kubernetes',
    componentProps: {
      placeholder: '请输入 API 服务器地址，例如：https://kubernetes.default.svc',
      style: { width: '100%' }
    }
  },
  {
    field: 'tlsCaContent',
    label: 'TLS CA 内容',
    labelWidth: 120,
    component: 'Input',
    ifShow: ({ values }) => values.serviceDiscoveryType === 'kubernetes',
    componentProps: {
      placeholder: '请输入 TLS CA 内容，例如：-----BEGIN CERTIFICATE-----\n...',
      style: { width: '100%' }
    }
  },
  {
    field: 'bearerToken',
    label: 'Token内容',
    labelWidth: 120,
    component: 'Input',
    ifShow: ({ values }) => values.serviceDiscoveryType === 'kubernetes',
    componentProps: {
      placeholder: '请输入 Bearer Token，例如：eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      style: { width: '100%' }
    }
  },
  {
    field: 'port',
    label: '端口',
    labelWidth: 120,
    required: true,
    colProps: { span: 12 },
    component: 'InputNumber',
    ifShow: ({ values }) => values.serviceDiscoveryType === 'http' || (values.serviceDiscoveryType === 'blackbox_dns' && values.probeModule === 'tcp_connect'),
    componentProps: ({ formModel }) => ({
      placeholder: formModel?.serviceDiscoveryType === 'blackbox_dns' ? 'TCP探测端口，例如 443、80、3306' : '例如 9100、9200',
      style: { width: '100%' },
    })
  },
  {
    field: 'refreshInterval',
    label: 'sd刷新间隔(s)',
    labelWidth: 120,
    colProps: { span: 12 },
    ifShow: ({ values }) => values.serviceDiscoveryType === 'http' || values.serviceDiscoveryType === 'blackbox_dns',
    component: 'InputNumber',
    defaultValue: 5,
    componentProps: {
      placeholder: '默认 5',
      style: { width: '100%' }
    }
  },
  {
    field: 'treeNodeIds',
    label: '绑定叶子节点ID',
    labelWidth: 120,
    required: true,
    colProps: { span: 24 },
    component: 'ApiSelect',
    ifShow: ({ values }) => values.serviceDiscoveryType === 'http' || values.serviceDiscoveryType === 'blackbox_dns',
    componentProps: {
      api: getLeafStreeNodes,
      mode: 'multiple',
      labelField: 'nodePath',
      valueField: 'id',
      resultField: 'items',
      showSearch: true,
      optionFilterProp: 'label',
      placeholder: '请选择关联实例',
    },

  },


  {
    field: 'blackboxAddress',
    label: 'Blackbox地址',
    labelWidth: 120,
    required: true,
    colProps: { span: 12 },
    component: 'Input',
    // defaultValue: '192.168.50.200:9115',
    ifShow: ({ values }) => values.serviceDiscoveryType === 'blackbox_dns',
    componentProps: {
      placeholder: '例如：192.168.50.200:9115',
      style: { width: '100%' }
    }
  },
  {
    field: 'probeModule',
    label: '探测模块',
    labelWidth: 120,
    required: true,
    colProps: { span: 12 },
    component: 'Select',
    defaultValue: 'http_2xx',
    ifShow: ({ values }) => values.serviceDiscoveryType === 'blackbox_dns',
    componentProps: ({ formActionType, formModel }) => ({
      options: [
        { label: 'http_2xx (检测 HTTP/HTTPS 状态码2xx)', value: 'http_2xx' },
        { label: 'tcp_connect (检测 TCP 端口是否连通)', value: 'tcp_connect' },
        { label: 'icmp (网络 Ping 探测)', value: 'icmp' },
      ],
      style: { width: '100%' },
      onChange: (val: any) => {
        // 关键守卫：只有当服务发现类型确实为 blackbox_dns 时才联动修改 scheme
        if (formModel?.serviceDiscoveryType !== 'blackbox_dns') {
          return;
        }
        if (val === 'tcp_connect') {
          formActionType.setFieldsValue({ scheme: 'none', port: 443 });
        } else if (val === 'icmp') {
          formActionType.setFieldsValue({ scheme: 'none' });
        } else if (val === 'http_2xx') {
          formActionType.setFieldsValue({ scheme: 'https' });
        }
      }
    }),
  },
];