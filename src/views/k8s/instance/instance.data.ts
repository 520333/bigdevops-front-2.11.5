import { BasicColumn, FormSchema } from '@/components/Table';
import dayjs from 'dayjs';
import {
  getStreeNodeSelect,
  getClusterForSelect,
  getK8sProjectList,
  getK8sAppList,
} from '@/api/demo/system';

// ================= Project Data =================
export const projectColumns: BasicColumn[] = [
  {
    title: '集群',
    dataIndex: 'cluster',
    width: 160,
  },
  {
    title: '英文名称',
    dataIndex: 'name',
    width: 180,
  },
  {
    title: '中文名称',
    dataIndex: 'nameZh',
    width: 180,
  },
  {
    title: '绑定的服务树',
    dataIndex: 'nodePath',
    width: 240,
    slot: 'nodePathSlot',
  },
  {
    title: '应用数量',
    dataIndex: 'appNum',
    width: 100,
  },
  {
    title: '创建人',
    dataIndex: 'createUserName',
    width: 140,
  },
  {
    title: '创建时间',
    dataIndex: 'CreatedAt',
    format: (text) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'),
    width: 160,
  },
];

export const projectSearchFormSchema: FormSchema[] = [
  {
    field: 'name',
    label: '项目名称',
    component: 'Input',
    componentProps: { placeholder: '请输入项目名称' },
    colProps: { span: 6 },
  },
  {
    field: 'cluster',
    label: '绑定集群',
    component: 'Input',
    componentProps: { placeholder: '请输入集群名称' },
    colProps: { span: 6 },
  },
  {
    field: 'createUserName',
    label: '创建人',
    component: 'Input',
    componentProps: { placeholder: '请输入创建人姓名' },
    colProps: { span: 6 },
  },
];

export const projectFormSchema: FormSchema[] = [
  { field: 'id', label: 'ID', component: 'Input', show: false },
  {
    field: 'name',
    label: '英文名称',
    component: 'Input',
    required: true,
    componentProps: { placeholder: '如: umipay-project' },
  },
  {
    field: 'nameZh',
    label: '中文名称',
    component: 'Input',
    required: true,
    componentProps: { placeholder: '如: umipay项目' },
  },
  {
    field: 'cluster',
    label: '绑定集群',
    component: 'ApiSelect',
    required: true,
    componentProps: {
      showSearch: true,
      optionFilterProp: 'label',
      api: getClusterForSelect,
      labelField: 'label',
      valueField: 'value',
      placeholder: '请选择绑定的 K8s 集群',
    },
  },
  {
    field: 'treeNodeId',
    label: '绑定服务树',
    component: 'ApiSelect',
    required: true,
    componentProps: {
      showSearch: true,
      optionFilterProp: 'label',
      api: getStreeNodeSelect,
      labelField: 'nodePath',
      valueField: 'id',
      resultField: 'items',
      placeholder: '请选择绑定服务树节点 (第3层级)',
      params: {
        levelNum: 3,
      },
    },
  },
];

// ================= App Data =================
export const appColumns: BasicColumn[] = [
  {
    title: '英文名',
    dataIndex: 'name',
    width: 180,
  },
  {
    title: '集群命名空间',
    dataIndex: 'clusterNamespace',
    width: 220,
    align: 'center',
    slot: 'clusterNamespaceSlot',
  },
  {
    title: '绑定的服务树',
    dataIndex: 'nodePath',
    width: 260,
    slot: 'nodePathSlot',
  },
  {
    title: '创建人',
    dataIndex: 'createUserName',
    width: 140,
  },
  {
    title: '创建时间',
    dataIndex: 'CreatedAt',
    format: (text) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'),
    width: 160,
  },
];

export const appSearchFormSchema: FormSchema[] = [
  {
    field: 'name',
    label: '应用名称',
    component: 'Input',
    componentProps: { placeholder: '请输入应用名称' },
    colProps: { span: 6 },
  },
  {
    field: 'k8sProjectId',
    label: '项目ID',
    component: 'Input',
    componentProps: { placeholder: '请输入所属项目ID' },
    colProps: { span: 6 },
  },
  {
    field: 'createUserName',
    label: '创建人',
    component: 'Input',
    componentProps: { placeholder: '请输入创建人姓名' },
    colProps: { span: 6 },
  },
];

export const appFormSchema: FormSchema[] = [
  { field: 'id', label: 'ID', component: 'Input', show: false },
  {
    field: 'name',
    label: '应用英文名',
    component: 'Input',
    required: true,
    componentProps: { placeholder: '如: order-service' },
  },
  {
    field: 'k8sProjectId',
    label: '所属项目',
    component: 'ApiSelect',
    required: true,
    componentProps: {
      showSearch: true,
      optionFilterProp: 'label',
      api: getK8sProjectList,
      resultField: 'items',
      labelField: 'nameZh',
      valueField: 'id',
      placeholder: '请选择所属 K8s 项目',
    },
  },
  {
    field: 'namespace',
    label: '命名空间',
    component: 'Input',
    defaultValue: 'default',
    required: true,
    componentProps: { placeholder: '如: default / prod' },
  },
  {
    field: 'treeNodeId',
    label: '绑定服务树节点',
    component: 'ApiSelect',
    componentProps: {
      showSearch: true,
      optionFilterProp: 'label',
      api: getStreeNodeSelect,
      labelField: 'nodePath',
      valueField: 'id',
      resultField: 'items',
      placeholder: '请选择服务树节点 (第4层级)',
      params: {
        levelNum: 4,
      },
    },
  },
  {
    field: 'commands',
    label: '启动命令',
    component: 'Input',
    componentProps: { placeholder: '如: /app/main' },
  },
  {
    field: 'args',
    label: '启动参数',
    component: 'Input',
    componentProps: { placeholder: '如: --port=8080 --env=prod' },
  },
  {
    field: 'cpuRequest',
    label: 'CPU Request',
    component: 'Input',
    componentProps: { placeholder: '如: 100m' },
  },
  {
    field: 'cpuLimit',
    label: 'CPU Limit',
    component: 'Input',
    componentProps: { placeholder: '如: 500m' },
  },
  {
    field: 'memoryRequest',
    label: 'Memory Request',
    component: 'Input',
    componentProps: { placeholder: '如: 128Mi' },
  },
  {
    field: 'memoryLimit',
    label: 'Memory Limit',
    component: 'Input',
    componentProps: { placeholder: '如: 512Mi' },
  },
];

// ================= Instance Data =================
export const instanceColumns: BasicColumn[] = [
  {
    title: '实例名称',
    dataIndex: 'name',
    width: 160,
  },
  {
    title: '控制器类型',
    dataIndex: 'workloadType',
    width: 130,
    slot: 'workloadTypeSlot',
  },
  {
    title: '部署环境',
    dataIndex: 'env',
    width: 110,
    slot: 'envSlot',
  },
  {
    title: '集群运行状态',
    dataIndex: 'clusterStatus',
    width: 140,
    slot: 'clusterStatusSlot',
  },
  {
    title: '所属应用',
    dataIndex: 'appName',
    width: 160,
    customRender: ({ record }) => record.appName || record.k8sAppId || '-',
  },
  {
    title: '镜像',
    dataIndex: 'image',
    width: 220,
  },
  {
    title: '副本数',
    dataIndex: 'replicas',
    width: 80,
  },
  {
    title: 'Ingress 域名',
    dataIndex: 'ingressHost',
    width: 180,
    customRender: ({ record }) => record.ingressHost || '-',
  },
  {
    title: '创建人',
    dataIndex: 'createUserName',
    width: 120,
  },
  {
    title: '创建时间',
    dataIndex: 'CreatedAt',
    format: (text) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'),
    width: 160,
  },
];

export const instanceSearchFormSchema: FormSchema[] = [
  {
    field: 'name',
    label: '实例名称',
    component: 'Input',
    componentProps: { placeholder: '请输入实例名称' },
    colProps: { span: 6 },
  },
  {
    field: 'k8sAppId',
    label: '应用ID',
    component: 'Input',
    componentProps: { placeholder: '请输入所属应用ID' },
    colProps: { span: 6 },
  },
  {
    field: 'createUserName',
    label: '创建人',
    component: 'Input',
    componentProps: { placeholder: '请输入创建人姓名' },
    colProps: { span: 6 },
  },
];

export const instanceFormSchema: FormSchema[] = [
  { field: 'id', label: 'ID', component: 'Input', show: false },
  {
    field: 'name',
    label: '实例名称',
    component: 'Input',
    required: true,
    componentProps: { placeholder: '如: ins-prod-01' },
  },
  {
    field: 'workloadType',
    label: '工作负载类型',
    component: 'Select',
    defaultValue: 'Deployment',
    required: true,
    componentProps: {
      options: [
        { label: 'Deployment (无状态副本)', value: 'Deployment' },
        { label: 'StatefulSet (有状态副本)', value: 'StatefulSet' },
        { label: 'DaemonSet (守护进程节点)', value: 'DaemonSet' },
        { label: 'Pod (独立单容器)', value: 'Pod' },
      ],
    },
  },
  {
    field: 'env',
    label: '部署环境',
    component: 'Select',
    defaultValue: 'prod',
    required: true,
    componentProps: {
      options: [
        { label: '生产环境 (Prod)', value: 'prod' },
        { label: '预发环境 (Staging)', value: 'staging' },
        { label: '测试环境 (Test)', value: 'test' },
        { label: '开发环境 (Dev)', value: 'dev' },
      ],
    },
  },
  {
    field: 'k8sAppId',
    label: '所属应用',
    component: 'ApiSelect',
    required: true,
    componentProps: {
      showSearch: true,
      optionFilterProp: 'label',
      api: getK8sAppList,
      resultField: 'items',
      labelField: 'name',
      valueField: 'id',
      placeholder: '请选择所属 K8s 应用',
    },
  },
  {
    field: 'image',
    label: '容器镜像',
    component: 'Input',
    required: true,
    componentProps: { placeholder: '如: nginx:latest 或 registry.xxx/app:v1.0.0' },
  },
  {
    field: 'replicas',
    label: '副本数量',
    component: 'InputNumber',
    defaultValue: 1,
    required: true,
    componentProps: { min: 1, max: 100 },
  },
  {
    field: 'enableSvc',
    label: '自动关联 Service',
    component: 'Switch',
    defaultValue: false,
  },
  {
    field: 'svcType',
    label: 'Service 类型',
    component: 'Select',
    defaultValue: 'ClusterIP',
    show: ({ values }) => !!values.enableSvc,
    componentProps: {
      options: [
        { label: 'ClusterIP (集群内部)', value: 'ClusterIP' },
        { label: 'NodePort (节点端口暴露)', value: 'NodePort' },
        { label: 'LoadBalancer (负载均衡器)', value: 'LoadBalancer' },
      ],
    },
  },
  {
    field: 'enableIngress',
    label: '自动关联 Ingress',
    component: 'Switch',
    defaultValue: false,
  },
  {
    field: 'ingressHost',
    label: 'Ingress 访问域名',
    component: 'Input',
    show: ({ values }) => !!values.enableIngress,
    componentProps: { placeholder: '如: order-service.company.com' },
  },
  {
    field: 'configMapName',
    label: '关联 ConfigMap',
    component: 'Input',
    componentProps: { placeholder: '如: cm-order-config' },
  },
  {
    field: 'secretName',
    label: '关联 Secret',
    component: 'Input',
    componentProps: { placeholder: '如: sec-db-credentials' },
  },
  {
    field: 'commands',
    label: '覆写启动命令',
    component: 'Input',
    componentProps: { placeholder: '可选，不填即使用应用层配置' },
  },
  {
    field: 'args',
    label: '覆写启动参数',
    component: 'Input',
    componentProps: { placeholder: '可选，不填即使用应用层配置' },
  },
  {
    field: 'cpuRequest',
    label: 'CPU Request 覆写',
    component: 'Input',
    componentProps: { placeholder: '如: 200m' },
  },
  {
    field: 'cpuLimit',
    label: 'CPU Limit 覆写',
    component: 'Input',
    componentProps: { placeholder: '如: 1000m' },
  },
  {
    field: 'memoryRequest',
    label: 'Memory Request 覆写',
    component: 'Input',
    componentProps: { placeholder: '如: 256Mi' },
  },
  {
    field: 'memoryLimit',
    label: 'Memory Limit 覆写',
    component: 'Input',
    componentProps: { placeholder: '如: 1Gi' },
  },
];
