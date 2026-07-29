import { BasicColumn, FormSchema } from '@/components/Table';
import { Tag, Tooltip } from 'ant-design-vue';
import { h } from 'vue';

export const searchFormSchema: FormSchema[] = [
  {
    field: 'clusterName',
    label: '目标集群',
    component: 'Select',
    colProps: { span: 6 },
    componentProps: {
      placeholder: '请选择 K8s 集群',
      showSearch: true,
      options: [],
    },
  },
  {
    field: 'namespace',
    label: '命名空间',
    component: 'Select',
    colProps: { span: 6 },
    componentProps: {
      placeholder: '请选择 Namespace',
      showSearch: true,
      options: [],
    },
  },
  {
    field: 'keyword',
    label: '搜索名称',
    component: 'Input',
    colProps: { span: 8 },
    componentProps: {
      placeholder: '搜索 Deployment 名称 / 镜像',
    },
  },
];

export const columns: BasicColumn[] = [
  {
    title: 'Deployment 名称',
    dataIndex: 'name',
    width: 220,
    ellipsis: true,
  },
  {
    title: '命名空间',
    dataIndex: 'namespace',
    width: 130,
    customRender: ({ record }) => {
      return h(Tag, { color: 'blue' }, () => record.namespace || '-');
    },
  },
  {
    title: '就绪副本',
    dataIndex: 'ready',
    width: 110,
    customRender: ({ record }) => {
      const isReady = record.readyReplicas === record.replicas && record.replicas > 0;
      const color = isReady ? 'green' : record.replicas === 0 ? 'default' : 'orange';
      return h(Tag, { color }, () => record.ready || '0/0');
    },
  },
  {
    title: '更新/可用副本',
    dataIndex: 'replicasStatus',
    width: 140,
    customRender: ({ record }) => {
      return `已更新: ${record.updatedReplicas || 0} | 可用: ${record.availableReplicas || 0}`;
    },
  },
  {
    title: '部署策略',
    dataIndex: 'strategy',
    width: 130,
    customRender: ({ record }) => {
      const strategy = record.strategy || 'RollingUpdate';
      const color = strategy === 'RollingUpdate' ? 'purple' : 'cyan';
      return h(Tag, { color }, () => strategy);
    },
  },
  {
    title: '容器镜像',
    dataIndex: 'images',
    width: 240,
    ellipsis: true,
    customRender: ({ record }) => {
      const images: string[] = record.images || [];
      if (images.length === 0) return '-';
      const tooltipVNode = h(
        'div',
        { style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
        images.map((img, idx) =>
          h('div', { key: idx, style: { whiteSpace: 'nowrap' } }, img),
        ),
      );
      return h(
        Tooltip,
        {
          overlayStyle: { maxWidth: 'none' },
          overlayInnerStyle: { whiteSpace: 'nowrap' },
        },
        {
          title: () => tooltipVNode,
          default: () => h('span', { class: 'cursor-pointer hover:text-blue-500' }, images.join(', ')),
        },
      );
    },
  },
  {
    title: '存活时间',
    dataIndex: 'age',
    width: 110,
    customRender: ({ record }) => record.age || '-',
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    width: 160,
    customRender: ({ record }) => record.createdAt || '-',
  },
];
