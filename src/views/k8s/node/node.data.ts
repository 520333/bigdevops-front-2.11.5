import { BasicColumn, FormSchema } from '@/components/Table';
import { Tag } from 'ant-design-vue';
import { h } from 'vue';

export const columns: BasicColumn[] = [
  {
    title: '节点名称',
    dataIndex: 'name',
    width: 180,
  },
  {
    title: '节点状态',
    dataIndex: 'status',
    width: 150,
    customRender: ({ record }) => {
      const statusStr = record.status || 'Unknown';
      const statusList = statusStr.split(',');
      return h(
        'div',
        { class: 'space-x-1' },
        statusList.map((item: string) => {
          let color = 'default';
          if (item === 'Ready') color = 'green';
          else if (item.startsWith('Not') || item === 'Unknown') color = 'red';
          else if (item === 'SchedulingDisabled') color = 'orange';
          return h(Tag, { color }, () => item);
        }),
      );
    },
  },
  {
    title: '可调度',
    dataIndex: 'scheduleEnable',
    key: 'scheduleEnable',
    width: 100,
    align: 'center',
  },
  {
    title: '节点角色',
    dataIndex: 'roles',
    width: 130,
    customRender: ({ record }) => {
      const roles: string[] = record.roles || [];
      if (roles.length === 0) return h(Tag, { color: 'default' }, () => 'worker');
      return h(
        'div',
        { class: 'space-x-1' },
        roles.map((role: string) => {
          const color = role.includes('master') || role.includes('control-plane') ? 'purple' : 'cyan';
          return h(Tag, { color }, () => role);
        }),
      );
    },
  },
  {
    title: '节点 IP',
    dataIndex: 'ip',
    width: 130,
  },
  {
    title: 'Pod 数量',
    dataIndex: 'podNum',
    key: 'podNum',
    width: 90,
  },
  {
    title: 'CPU 实时使用 (Usage)',
    dataIndex: 'cpuUsageInfo',
    width: 170,
    customRender: ({ record }) => {
      const info = record.cpuUsageInfo;
      if (!info || info.includes('未安装') || info.includes('未初始化') || info.includes('失败')) {
        return h(Tag, { color: 'default' }, () => '未安装 MetricsServer');
      }
      return h(Tag, { color: 'green' }, () => info);
    },
  },
  {
    title: 'CPU 申请 (Req)',
    dataIndex: 'cpuRequestInfo',
    width: 160,
  },
  {
    title: 'CPU 上限 (Limit)',
    dataIndex: 'cpuLimitInfo',
    width: 160,
  },
  {
    title: '内存 实时使用 (Usage)',
    dataIndex: 'memoryUsageInfo',
    width: 180,
    customRender: ({ record }) => {
      const info = record.memoryUsageInfo;
      if (!info || info.includes('未安装') || info.includes('未初始化') || info.includes('失败')) {
        return h(Tag, { color: 'default' }, () => '未安装 MetricsServer');
      }
      return h(Tag, { color: 'cyan' }, () => info);
    },
  },
  {
    title: '内存申请 (Req)',
    dataIndex: 'memoryRequestInfo',
    width: 170,
  },
  {
    title: '内存上限 (Limit)',
    dataIndex: 'memoryLimitInfo',
    width: 170,
  },
  {
    title: 'Kubelet 版本',
    dataIndex: 'kubeletVersion',
    width: 120,
  },
  {
    title: '操作系统',
    dataIndex: 'osVersion',
    width: 150,
  },
  {
    title: '存活时间',
    dataIndex: 'age',
    width: 90,
  },
];

export const searchFormSchema: FormSchema[] = [
  {
    field: 'name',
    label: '节点名称',
    component: 'Input',
    componentProps: {
      placeholder: '请输入节点名称搜索',
    },
    colProps: { span: 12 },
  },
];
