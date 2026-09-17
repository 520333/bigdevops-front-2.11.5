<template>
  <div class="flex flex-col items-center justify-center h-screen bg-[#f0f2f5] dark:bg-[#151515]">
    <Spin size="large" tip="正在通过钉钉单点登录授权接入 BigDevOps，请稍候..." />
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
    // 兼容钉钉不同版本传参 (authCode 或 code，兼容 Hash 路由模式)
    const urlParams = new URLSearchParams(window.location.search);
    const code =
      (route.query.authCode as string) ||
      (route.query.code as string) ||
      urlParams.get('authCode') ||
      urlParams.get('code') ||
      '';
    const state = (route.query.state as string) || urlParams.get('state') || '';

    if (!code) {
      message.error('钉钉授权失败，未检测到授权凭据 authCode');
      router.push('/login');
      return;
    }

    try {
      // 1. 请求后端换取平台 Token
      const res = await defHttp.post({
        url: '/auth/dingtalk/callback',
        data: { code, state },
      });

      // 2. 将 token 存入 userStore
      const { token } = res;
      userStore.setToken(token);

      // 3. 执行登录后动作 (获取用户信息、初始化动态路由并跳转主页)
      await userStore.afterLoginAction(true);
      message.success('钉钉免密登录成功！');
    } catch (err: any) {
      message.error(err.message || '钉钉 SSO 认证换取 Token 失败');
      router.push('/login');
    }
  });
</script>
