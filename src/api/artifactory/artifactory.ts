import { defHttp } from '@/utils/http/axios';

enum Api {
  Repos = '/api/artifactory/repos',
  Info = '/api/artifactory/info',
  Tree = '/api/artifactory/tree',
  Content = '/api/artifactory/content',
  Save = '/api/artifactory/save',
  Upload = '/api/artifactory/upload',
  Delete = '/api/artifactory/delete',
  Download = '/api/artifactory/download',
}


export interface ArtifactoryRepoInfo {
  key: string;
  type: string;
  description: string;
  packageType: string;
  url: string;
}

export interface ArtifactoryChecksums {
  sha1: string;
  sha256: string;
  md5: string;
}

export interface ArtifactoryFileDetail {
  repo: string;
  path: string;
  repoPath: string;
  downloadUri: string;
  created: string;
  createdBy: string;
  lastModified: string;
  modifiedBy: string;
  size: number;
  sizeFormatted: string;
  mimeType: string;
  checksums: ArtifactoryChecksums;
  downloads: number;
  lastDownloaded: string;
  lastDownloadedBy: string;
}

export interface ArtifactoryItem {
  uri: string;
  path?: string;
  folder: boolean;
  size?: number;
  created?: string;
  lastModified?: string;
  children?: ArtifactoryItem[];
}

export interface ArtifactoryStorageResponse {
  uri: string;
  repo: string;
  path: string;
  created: string;
  lastModified: string;
  folder: boolean;
  children: ArtifactoryItem[];
  size: string;
}

export const getArtifactoryReposApi = () => {
  return defHttp.get<ArtifactoryRepoInfo[]>({ url: Api.Repos });
};

export const getArtifactoryTreeApi = (params: { project: string; path?: string }) => {
  return defHttp.get<ArtifactoryStorageResponse>({ url: Api.Tree, params });
};

export const getArtifactoryFileInfoApi = (params: { project: string; path: string }) => {
  return defHttp.get<ArtifactoryFileDetail>({ url: Api.Info, params });
};

export const getArtifactoryContentApi = (params: { project: string; path: string }) => {
  return defHttp.get<string>({ url: Api.Content, params });
};

export const saveArtifactoryContentApi = (data: { project: string; path: string; content: string }) => {
  return defHttp.post<void>({ url: Api.Save, data });
};

export const deleteArtifactoryFileApi = (data: { project: string; path: string }) => {
  return defHttp.post<void>({ url: Api.Delete, data });
};


export const uploadArtifactoryFileApi = (params: { project: string; path?: string; file: File }) => {
  const formData = new FormData();
  formData.append('project', params.project);
  if (params.path) {
    formData.append('path', params.path);
  }
  formData.append('file', params.file);

  return defHttp.post<void>({
    url: Api.Upload,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const downloadArtifactoryFileApi = async (params: { project: string; path: string }, filename?: string) => {
  const res = await defHttp.get(
    {
      url: Api.Download,
      params,
      responseType: 'blob',
    },
    {
      isTransformResponse: false,
    },
  );

  const name = filename || params.path.substring(params.path.lastIndexOf('/') + 1);
  const blob = new Blob([res], { type: 'application/octet-stream' });
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = blobUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(blobUrl);
};
