import { defHttp } from '@/utils/http/axios';


enum Api {
  getCodeGitServerList = "/api/code/getCodeGitServerList",
  createCodeGitServer = "/api/code/createCodeGitServer",
  updateCodeGitServer = "/api/code/updateCodeGitServer",
  deleteCodeGitServer = "/api/code/deleteCodeGitServer",
  pingCodeGitServer = "/api/code/pingCodeGitServer",

}

export const getCodeGitServerList = (params?: any) =>
  defHttp.get({ url: Api.getCodeGitServerList, params });

export const createCodeGitServer = (data?: any) =>
  defHttp.post({ url: Api.createCodeGitServer, data });

export const updateCodeGitServer = (data: any) =>
  defHttp.post({ url: Api.updateCodeGitServer, data });

export const deleteCodeGitServer = (id: number | string) =>
  defHttp.delete({ url: Api.deleteCodeGitServer + "/" + id });

export const pingCodeGitServer = (params?: any) =>
  defHttp.post({ url: Api.pingCodeGitServer, params });