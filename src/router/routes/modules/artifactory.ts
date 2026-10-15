import type { AppRouteModule } from '@/router/types';
import { LAYOUT } from '@/router/constant';

const artifactory: AppRouteModule = {
  path: '/artifactory',
  name: 'ArtifactoryManagement',
  component: LAYOUT,
  redirect: '/artifactory/manage',
  meta: {
    orderNo: 50,
    icon: 'ant-design:folder-open-outlined',
    title: '制品与配置库',
  },
  children: [
    {
      path: 'manage',
      name: 'ArtifactoryManageIndex',
      component: () => import('@/views/artifactory/index.vue'),
      meta: {
        title: '构件与配置 (Artifactory)',
        icon: 'ant-design:code-outlined',
      },
    },
    {
      path: 'harbor',
      name: 'HarborIndex',
      component: () => import('@/views/artifactory/harbor/index.vue'),
      meta: {
        title: '镜像仓库 (Harbor)',
        icon: 'ant-design:cloud-server-outlined',
      },
    },
  ],
};

export default artifactory;
