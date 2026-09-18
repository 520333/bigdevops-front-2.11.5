<script setup lang="ts">
  import { h, onMounted } from 'vue';
  import { Modal } from 'ant-design-vue';
  import { getSystemSetting } from '@/api/system/setting';

  const VERSION_STORAGE_KEY = 'sys_upgrade_last_version';
  const DATE_STORAGE_KEY = 'sys_upgrade_last_date';
  const SESSION_STORAGE_KEY = 'sys_upgrade_session_shown';

  function markShown(timing: string, version: string, today: string) {
    if (timing === 'version_once') {
      localStorage.setItem(VERSION_STORAGE_KEY, version);
    } else if (timing === 'day_once') {
      localStorage.setItem(DATE_STORAGE_KEY, today);
    } else if (timing === 'every_login') {
      sessionStorage.setItem(SESSION_STORAGE_KEY, '1');
    }
  }

  onMounted(async () => {
    try {
      const setting = await getSystemSetting();
      if (!setting || !setting.upgradePromptEnabled) {
        return;
      }

      const timing = setting.upgradePromptTiming || 'version_once';
      if (timing === 'never') {
        return;
      }

      const currentVersion = setting.upgradePromptVersion || 'v1.0.0';
      const todayStr = new Date().toISOString().slice(0, 10);

      if (timing === 'version_once') {
        const lastVersion = localStorage.getItem(VERSION_STORAGE_KEY);
        if (lastVersion === currentVersion) {
          return;
        }
      } else if (timing === 'day_once') {
        const lastDate = localStorage.getItem(DATE_STORAGE_KEY);
        if (lastDate === todayStr) {
          return;
        }
      } else if (timing === 'every_login') {
        if (sessionStorage.getItem(SESSION_STORAGE_KEY)) {
          return;
        }
      }

      // 触发弹窗展示
      Modal.info({
        title: setting.upgradePromptTitle || '系统公告',
        width: 520,
        content: h('div', { class: 'pt-2' }, [
          setting.upgradePromptVersion
            ? h(
                'div',
                { class: 'mb-2 text-xs text-gray-500 font-mono' },
                `版本标识: ${setting.upgradePromptVersion}`,
              )
            : null,
          h(
            'div',
            {
              style: {
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '360px',
                overflowY: 'auto',
                lineHeight: '1.6',
              },
            },
            setting.upgradePromptContent || '系统已升级至最新版本。',
          ),
        ]),
        okText: '我知道了',
        onOk() {
          markShown(timing, currentVersion, todayStr);
        },
      });

      // 弹起时记录已展示
      markShown(timing, currentVersion, todayStr);
    } catch (e) {
      console.warn('获取系统公告/升级弹窗配置失败:', e);
    }
  });
</script>

<template></template>
