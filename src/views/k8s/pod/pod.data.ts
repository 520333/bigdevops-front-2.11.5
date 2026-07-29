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
      placeholder: '搜索 Pod 名称 / IP / 节点',
    },
  },
];

export const columns: BasicColumn[] = [
  {
    title: 'Pod 名称',
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
    title: '就绪',
    dataIndex: 'ready',
    width: 90,
    customRender: ({ record }) => {
      const isAllReady = record.readyContainer === record.totalContainer && record.totalContainer > 0;
      const color = isAllReady ? 'green' : 'orange';
      return h(Tag, { color }, () => record.ready || '-');
    },
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 140,
    customRender: ({ record }) => {
      const status = record.status || 'Unknown';
      let color = 'default';
      if (status === 'Running') {
        color = 'green';
      } else if (status === 'Pending') {
        color = 'orange';
      } else if (status === 'Completed' || status === 'Succeeded') {
        color = 'cyan';
      } else if (['Terminating', 'Failed', 'CrashLoopBackOff', 'ImagePullBackOff', 'ErrImagePull'].includes(status)) {
        color = 'red';
      }
      return h(Tag, { color }, () => status);
    },
  },
  {
    title: '重启次数',
    dataIndex: 'restarts',
    width: 150,
    customRender: ({ record }) => {
      const restarts = record.restarts || 0;
      const color = restarts > 0 ? 'volcano' : 'green';
      const text = restarts > 0 ? `${restarts} 次 ${record.lastRestartAgo || ''}` : '0 次';
      return h(Tag, { color }, () => text);
    },
  },
  {
    title: '存活时间',
    dataIndex: 'age',
    width: 110,
    customRender: ({ record }) => record.age || '-',
  },
  {
    title: 'Pod IP',
    dataIndex: 'podIP',
    width: 130,
    customRender: ({ record }) => record.podIP || '-',
  },
  {
    title: '所在节点',
    dataIndex: 'nodeName',
    key: 'nodeName',
    width: 200,
  },
  {
    title: '容器镜像',
    dataIndex: 'images',
    width: 200,
    ellipsis: true,
    customRender: ({ record }) => {
      const images: string[] = record.images || [];
      if (images.length === 0) return '-';
      const displayStr = images.length === 1 ? images[0] : `${images.length}个镜像: ${images[0]}`;
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
          default: () =>
            h(
              Tag,
              {
                color: 'purple',
                style: { maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'bottom' },
              },
              () => displayStr,
            ),
        },
      );
    },
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    width: 160,
  },
];
