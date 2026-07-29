<template>
  <div class="flex flex-col items-center justify-center h-screen">
    <Spin size="large" tip="正在通过 Keycloak 单点登录授权中，请稍候..." />
  </div>
</template>

<script lang="ts" setup>
  import { onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useUserStore } from '@/store/modules/user';
  import { defHttp } from '@/utils/http/axios';
  import { Spin, message } from 'ant-design-vue';

  const route = useRoute();
  const router = useRouter();
  const userStore = useUserStore();

  onMounted(async () => {
    // 兼容 Hash 模式下 code 在 hash 内或 hash 外的情况
    const urlParams = new URLSearchParams(window.location.search);
    const code = (route.query.code as string) || urlParams.get('code') || '';
    const state = (route.query.state as string) || urlParams.get('state') || '';

    if (!code) {
      message.error('授权失败，未获取到 code');
      router.push('/login');
      return;
    }

    try {
      // 1. 请求后端换取 Token
      const res = await defHttp.post({
        url: '/auth/oidc/callback',
        data: { code, state },
      });

      // 2. 将 token 存入 userStore
      const { token } = res;
      userStore.setToken(token);

      // 3. 执行登录后的常规操作 (获取用户信息、初始化动态路由并跳转)
      await userStore.afterLoginAction(true);
      message.success('Keycloak SSO 登录成功！');
    } catch (err: any) {
      message.error(err.message || 'SSO 认证失败');
      router.push('/login');
    }
  });
</script>
