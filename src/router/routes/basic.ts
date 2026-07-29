import type { AppRouteRecordRaw } from '@/router/types';
import { t } from '@/hooks/web/useI18n';
import { REDIRECT_NAME, LAYOUT, EXCEPTION_COMPONENT, PAGE_NOT_FOUND_NAME } from '@/router/constant';

// 404 on a page
export const PAGE_NOT_FOUND_ROUTE: AppRouteRecordRaw = {
  path: '/:path(.*)*',
  name: PAGE_NOT_FOUND_NAME,
  component: LAYOUT,
  meta: {
    title: 'ErrorPage',
    hideBreadcrumb: true,
    hideMenu: true,
  },
  children: [
    {
      path: '/:path(.*)*',
      // name: PAGE_NOT_FOUND_NAME,
      name: 'PageNotFoundEx',
      component: EXCEPTION_COMPONENT,
      meta: {
        title: 'ErrorPage',
        hideBreadcrumb: true,
        hideMenu: true,
      },
    },
  ],
};

export const REDIRECT_ROUTE: AppRouteRecordRaw = {
  path: '/redirect',
  component: LAYOUT,
  name: 'RedirectTo',
  meta: {
    title: REDIRECT_NAME,
    hideBreadcrumb: true,
    hideMenu: true,
  },
  children: [
    {
      path: '/redirect/:path(.*)/:_redirect_type(.*)/:_origin_params(.*)?',
      name: REDIRECT_NAME,
      component: () => import('@/views/sys/redirect/index.vue'),
      meta: {
        title: REDIRECT_NAME,
        hideBreadcrumb: true,
      },
    },
  ],
};

export const ERROR_LOG_ROUTE: AppRouteRecordRaw = {
  path: '/error-log',
  name: 'ErrorLog',
  component: LAYOUT,
  redirect: '/error-log/list',
  meta: {
    title: 'ErrorLog',
    hideBreadcrumb: true,
    hideChildrenInMenu: true,
  },
  children: [
    {
      path: 'list',
      name: 'ErrorLogList',
      component: () => import('@/views/sys/error-log/index.vue'),
      meta: {
        title: t('routes.basic.errorLogList'),
        hideBreadcrumb: true,
        currentActiveMenu: '/error-log',
      },
    },
  ],
};

export const CICD_WORKORDER_DETAIL_ROUTE: AppRouteRecordRaw = {
  path: '/cicd/workorder/detail/:id',
  name: 'CicdWorkOrderDetail',
  component: LAYOUT,
  meta: {
    title: '工单详情',
    hideMenu: true,
  },
  children: [
    {
      path: '',
      name: 'CicdWorkOrderDetailPage',
      component: () => import('@/views/cicd/workorder/detail/index.vue'),
      meta: {
        title: '工单详情',
        hideMenu: true,
        currentActiveMenu: '/cicd/workorder',
      },
    },
  ],
};

export const OAUTH_CALLBACK_ROUTE = {
  path: '/oauth/callback',
  name: 'OauthCallback',
  component: () => import('@/views/sys/login/OauthCallback.vue'),
  meta: {
    title: 'SSO 登录回调',
    ignoreAuth: true, // 必须忽略 Auth 检查
  },
};