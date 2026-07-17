import { defHttp } from '@/utils/http/axios';

enum Api {
  getDeployList = '/cicd/deploy/getDeployList',
  createDeploy = '/cicd/deploy/createDeploy',
  updateDeployList = '/cicd/deploy/updateDeployList',
  deleteDeployList = '/cicd/deploy/deleteDeployList',
}

export const getDeployList = (params?: any) => 
  defHttp.get({ url: Api.getDeployList, params });

export const createDeploy = (data?: any) =>
  defHttp.get({ url: Api.createDeploy, data });

export const updateDeployList = (data: any) =>
  defHttp.post({ url: Api.updateDeployList, data });

export const deleteDeployList = (id: number | string) => 
  defHttp.delete({ url: Api.deleteDeployList+"/"+id });
