import { BasicColumn } from '@/components/Table';
import dayjs from 'dayjs';

export const onlineColumns: BasicColumn[] = [
  {
    title: '用户名',
    dataIndex: 'userName',
    width: 140,
  },
  {
    title: '真实姓名',
    dataIndex: 'realName',
    width: 140,
    customRender: ({ record }) => record.realName || '-',
  },
  {
    title: '用户角色',
    dataIndex: 'roles',
    width: 200,
  },
  {
    title: '登录IP',
    dataIndex: 'ip',
    width: 150,
    customRender: ({ text }) => {
      if (!text) return '-';
      return String(text).replace(/^::ffff:/, '');
    },
  },
  {
    title: '客户端 / 浏览器',
    dataIndex: 'browser',
    width: 180,
    customRender: ({ record }) => {
      const b = record.browser || '未知浏览器';
      const o = record.os || '';
      return o ? `${b} / ${o}` : b;
    },
  },
  {
    title: '登录时间',
    dataIndex: 'loginTime',
    width: 180,
    customRender: ({ text }) => {
      return text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-';
    },
  },
  {
    title: '最近活跃时间',
    dataIndex: 'lastActiveTime',
    width: 180,
    customRender: ({ text }) => {
      return text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-';
    },
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 100,
  },
];
