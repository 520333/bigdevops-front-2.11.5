import { defHttp } from '@/utils/http/axios';

enum Api {
  getJenkinsPipelineList = '/api/jenkins/getJenkinsPipelineList',
  createJenkinsPipeline = '/api/jenkins/createJenkinsPipeline',
  updateJenkinsPipeline = '/api/jenkins/updateJenkinsPipeline',
  deleteJenkinsPipeline = '/api/jenkins/deleteJenkinsPipeline',

  getJenkinsStageList = '/api/jenkins/getJenkinsStageList',
  createJenkinsStage = '/api/jenkins/createJenkinsStage',
  updateJenkinsStage = '/api/jenkins/updateJenkinsStage',
  deleteJenkinsStage = '/api/jenkins/deleteJenkinsStage',

  getJenkinsEnvList = '/api/jenkins/getJenkinsEnvList',
  createJenkinsEnv = '/api/jenkins/createJenkinsEnv',
  updateJenkinsEnv = '/api/jenkins/updateJenkinsEnv',
  deleteJenkinsEnv = '/api/jenkins/deleteJenkinsEnv',

  getJenkinsParamList = '/api/jenkins/getJenkinsParamList',
  createJenkinsParam = '/api/jenkins/createJenkinsParam',
  updateJenkinsParam = '/api/jenkins/updateJenkinsParam',
  deleteJenkinsParam = '/api/jenkins/deleteJenkinsParam',
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
  defHttp.post({ url: '/api/jenkins/validateJenkinsPipeline', data });

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
