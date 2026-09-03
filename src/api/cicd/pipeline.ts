import { defHttp } from '@/utils/http/axios';

enum Api {
  getJenkinsPipelineList = '/api/cicd/getJenkinsPipelineList',
  createJenkinsPipeline = '/api/cicd/createJenkinsPipeline',
  updateJenkinsPipeline = '/api/cicd/updateJenkinsPipeline',
  deleteJenkinsPipeline = '/api/cicd/deleteJenkinsPipeline',

  getJenkinsStageList = '/api/cicd/getJenkinsStageList',
  createJenkinsStage = '/api/cicd/createJenkinsStage',
  updateJenkinsStage = '/api/cicd/updateJenkinsStage',
  deleteJenkinsStage = '/api/cicd/deleteJenkinsStage',

  getJenkinsEnvList = '/api/cicd/getJenkinsEnvList',
  createJenkinsEnv = '/api/cicd/createJenkinsEnv',
  updateJenkinsEnv = '/api/cicd/updateJenkinsEnv',
  deleteJenkinsEnv = '/api/cicd/deleteJenkinsEnv',

  getJenkinsParamList = '/api/cicd/getJenkinsParamList',
  createJenkinsParam = '/api/cicd/createJenkinsParam',
  updateJenkinsParam = '/api/cicd/updateJenkinsParam',
  deleteJenkinsParam = '/api/cicd/deleteJenkinsParam',
}

// Pipeline CRUD
export const getJenkinsPipelineList = (params?: { lang?: string; keyword?: string }) =>
  defHttp.get({ url: Api.getJenkinsPipelineList, params });

export const createJenkinsPipeline = (data: any) =>
  defHttp.post({ url: Api.createJenkinsPipeline, data });

export const updateJenkinsPipeline = (data: any) =>
  defHttp.post({ url: Api.updateJenkinsPipeline, data });

export const deleteJenkinsPipeline = (id: number) =>
  defHttp.delete({ url: `${Api.deleteJenkinsPipeline}?id=${id}` });

export const validateJenkinsPipeline = (data: { pipelineScript: string; instanceId?: number }) =>
  defHttp.post({ url: '/api/cicd/validateJenkinsPipeline', data });

// Stage CRUD
export const getJenkinsStageList = (params?: { category?: string; keyword?: string }) =>
  defHttp.get({ url: Api.getJenkinsStageList, params });

export const createJenkinsStage = (data: any) =>
  defHttp.post({ url: Api.createJenkinsStage, data });

export const updateJenkinsStage = (data: any) =>
  defHttp.post({ url: Api.updateJenkinsStage, data });

export const deleteJenkinsStage = (id: number) =>
  defHttp.delete({ url: `${Api.deleteJenkinsStage}?id=${id}` });

// Env CRUD
export const getJenkinsEnvList = (params?: { group?: string; keyword?: string }) =>
  defHttp.get({ url: Api.getJenkinsEnvList, params });

export const createJenkinsEnv = (data: any) =>
  defHttp.post({ url: Api.createJenkinsEnv, data });

export const updateJenkinsEnv = (data: any) =>
  defHttp.post({ url: Api.updateJenkinsEnv, data });

export const deleteJenkinsEnv = (id: number) =>
  defHttp.delete({ url: `${Api.deleteJenkinsEnv}?id=${id}` });

// Param CRUD
export const getJenkinsParamList = (params?: { type?: string; keyword?: string }) =>
  defHttp.get({ url: Api.getJenkinsParamList, params });

export const createJenkinsParam = (data: any) =>
  defHttp.post({ url: Api.createJenkinsParam, data });

export const updateJenkinsParam = (data: any) =>
  defHttp.post({ url: Api.updateJenkinsParam, data });

export const deleteJenkinsParam = (id: number) =>
  defHttp.delete({ url: `${Api.deleteJenkinsParam}?id=${id}` });
