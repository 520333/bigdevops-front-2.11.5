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
        title: '制品与配置在线管理',
        icon: 'ant-design:code-outlined',
      },
    },
  ],
};

export default artifactory;
