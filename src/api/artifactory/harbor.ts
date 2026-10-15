import { defHttp } from '@/utils/http/axios';

enum Api {
  Config = '/api/harbor/config',
  Projects = '/api/harbor/projects',
  CreateProject = '/api/harbor/createProject',
  Repositories = '/api/harbor/repositories',
  Artifacts = '/api/harbor/artifacts',
  DeleteArtifact = '/api/harbor/deleteArtifact',
}

export interface HarborConfigInfo {
  enable: boolean;
  baseUrl: string;
}

export interface HarborProject {
  project_id: number;
  name: string;
  repo_count: number;
  creation_time: string;
  update_time: string;
}

export interface HarborRepo {
  id: number;
  name: string;
  project_id: number;
  artifact_count: number;
  pull_count: number;
  creation_time: string;
  update_time: string;
}

export interface HarborTag {
  id: number;
  name: string;
  artifact_id: number;
  push_time: string;
  pull_time: string;
  signed: boolean;
}

export interface HarborArtifact {
  id: number;
  type: string;
  digest: string;
  size: number;
  tags?: HarborTag[];
  push_time: string;
  pull_time: string;
  extra_attrs?: Record<string, any>;
}

export const getHarborConfigApi = () => {
  return defHttp.get<HarborConfigInfo>({ url: Api.Config });
};

export const getHarborProjectsApi = (params?: { page?: number; pageSize?: number; name?: string }) => {
  return defHttp.get<HarborProject[]>({ url: Api.Projects, params });
};

export const getHarborRepositoriesApi = (params: { projectName: string; page?: number; pageSize?: number; query?: string }) => {
  return defHttp.get<HarborRepo[]>({ url: Api.Repositories, params });
};

export const getHarborArtifactsApi = (params: { projectName: string; repoName: string; page?: number; pageSize?: number }) => {
  return defHttp.get<HarborArtifact[]>({ url: Api.Artifacts, params });
};

export const createHarborProjectApi = (data: { projectName: string; isPublic?: boolean; storageLimit?: number }) => {
  return defHttp.post<any>({ url: Api.CreateProject, data });
};

export const deleteHarborArtifactApi = (params: { projectName: string; repoName: string; reference: string }) => {
  return defHttp.post<any>({ url: Api.DeleteArtifact, data: params });
};
