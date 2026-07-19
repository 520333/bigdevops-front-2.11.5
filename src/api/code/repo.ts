import { defHttp } from '@/utils/http/axios';

enum Api {
  getCodeGitRepoList = "/api/code/getCodeGitRepoList",
  createCodeGitRepo = "/api/code/createCodeGitRepo",
  updateCodeGitRepo = "/api/code/updateCodeGitRepo",
  getRepoMembers = "/api/code/getRepoMembers", 
  addRepoMember = "/api/code/addRepoMember", 
  removeRepoMember = "/api/code/removeRepoMember",
  getRepoBranches = "/api/code/getRepoBranches",
  getGitNamespaces= "/api/code/getGitNamespaces",
  createGitNamespace = "/api/code/createGitNamespace",
  updateGitNamespace = "/api/code/updateGitNamespace",
  getGitUsers = "/api/code/getGitUsers",
  createGitUser = "/api/code/createGitUser",
  updateGitUser = "/api/code/updateGitUser",

  getMergeRequests = "/api/code/getMergeRequests",
  createMergeRequest = "/api/code/createMergeRequest",
  mergeMergeRequest = "/api/code/mergeMergeRequest",
  closeMergeRequest = "/api/code/closeMergeRequest",
}

export const getCodeGitRepoList = (params?: any) =>
  defHttp.get({ url: Api.getCodeGitRepoList, params });

export const createCodeGitRepo = (data?: any) =>
  defHttp.post({ url: Api.createCodeGitRepo, data });

export const updateCodeGitRepo = (data?: any) =>
  defHttp.post({ url: Api.updateCodeGitRepo, data });



export const getRepoMembers = (params?: any) =>
  defHttp.get({ url: Api.getRepoMembers, params }); 
  
export const addRepoMember = (data?: any) =>
  defHttp.post({ url: Api.addRepoMember, data });

export const removeRepoMember = (data?: any) =>
  defHttp.delete({ url: Api.removeRepoMember, data });

export const getRepoBranches = (params?: any) =>
  defHttp.get({ url: Api.getRepoBranches, params });

export const getGitNamespaces = (params?: any) =>
  defHttp.get({ url: Api.getGitNamespaces, params });

export const createGitNamespace = (data?: any) =>
  defHttp.post({ url: Api.createGitNamespace, data });

export const updateGitNamespace = (data?: any) =>
  defHttp.post({ url: Api.updateGitNamespace, data });



export const getGitUsers = (params?: any) =>
  defHttp.get({ url: Api.getGitUsers, params });

export const createGitUser = (data?: any) =>
  defHttp.post({ url: Api.createGitUser, data });

export const updateGitUser = (data?: any) =>
  defHttp.post({ url: Api.updateGitUser, data });

export const getMergeRequests = (params?: any) =>
  defHttp.get({ url: Api.getMergeRequests, params });

export const createMergeRequest = (data?: any) =>
  defHttp.post({ url: Api.createMergeRequest, data });

export const mergeMergeRequest = (data?: any) =>
  defHttp.post({ url: Api.mergeMergeRequest, data });

export const closeMergeRequest = (data?: any) =>
  defHttp.post({ url: Api.closeMergeRequest, data });