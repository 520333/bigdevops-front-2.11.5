import { defHttp } from '@/utils/http/axios';

enum Api {
  getInstanceList = '/api/nacos/getInstanceList',
  getInstanceDetail = '/api/nacos/getInstanceDetail',
  createInstance = '/api/nacos/createInstance',
  updateInstance = '/api/nacos/updateInstance',
  deleteInstance = '/api/nacos/deleteInstance',
  testInstanceConnection = '/api/nacos/testInstanceConnection',
}

export interface NacosInstanceItem {
  id: number;
  name: string;
  envKey: string;
  serverAddr: string;
  port: number;
  namespaceId: string;
  username?: string;
  password?: string;
  status: 'online' | 'offline' | 'untested';
  lastTestAt?: string;
  remark?: string;
}

// 获取 Nacos 实例列表
export const getNacosInstanceList = (params?: {
  page?: number;
  pageSize?: number;
  envKey?: string;
  status?: string;
  keyword?: string;
}) => defHttp.get<{ items: NacosInstanceItem[]; total: number }>({ url: Api.getInstanceList, params });

// 获取单个 Nacos 实例详情
export const getNacosInstanceDetail = (id: number | string) =>
  defHttp.get<NacosInstanceItem>({ url: `${Api.getInstanceDetail}?id=${id}` });

// 创建 Nacos 实例
export const createNacosInstance = (data: Partial<NacosInstanceItem>) =>
  defHttp.post({ url: Api.createInstance, data });

// 更新 Nacos 实例
export const updateNacosInstance = (id: number | string, data: Partial<NacosInstanceItem>) =>
  defHttp.post({ url: `${Api.updateInstance}?id=${id}`, data });

// 删除 Nacos 实例
export const deleteNacosInstance = (id: number | string) =>
  defHttp.delete({ url: `${Api.deleteInstance}?id=${id}` });

// 测试 Nacos 连通性 (禁用全局自动弹窗，交由页面通过 message key 进行平滑状态流转)
export const testNacosInstanceConnection = (id: number | string) =>
  defHttp.post({ url: Api.testInstanceConnection, data: { id } }, { errorMessageMode: 'none' });
