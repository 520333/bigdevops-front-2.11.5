<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    :title="`镜像版本列表 - ${repoName}`"
    width="850px"
    :showOkBtn="false"
  >
    <div class="p-2">
      <!-- 顶部提示 -->
      <div class="bg-gray-50 border border-gray-200 rounded p-3 mb-4 flex justify-between items-center">
        <div>
          <span class="font-bold text-gray-700">镜像仓库地址：</span>
          <code class="bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-mono">{{ fullRepoPath }}</code>
        </div>
        <Button size="small" type="primary" preIcon="ant-design:reload-outlined" :loading="loading" @click="fetchArtifacts">
          刷新
        </Button>
      </div>

      <!-- 版本列表 -->
      <Table
        :columns="columns"
        :data-source="artifactList"
        :loading="loading"
        row-key="id"
        size="middle"
        :pagination="{ pageSize: 10, showTotal: (total: number) => `共 ${total} 个镜像版本` }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'tags'">
            <div class="flex flex-wrap gap-1">
              <template v-if="record.tags && record.tags.length > 0">
                <Tag v-for="tag in record.tags" :key="tag.id" color="blue" class="font-mono">
                  {{ tag.name }}
                </Tag>
              </template>
              <Tag v-else color="default">
                &lt;无Tag标签&gt;
              </Tag>
            </div>
          </template>

          <template v-else-if="column.key === 'size'">
            <span>{{ formatBytes(record.size) }}</span>
          </template>

          <template v-else-if="column.key === 'digest'">
            <Tooltip :title="record.digest">
              <span class="font-mono text-xs text-gray-500 cursor-pointer">
                {{ truncateDigest(record.digest) }}
              </span>
            </Tooltip>
          </template>

          <template v-else-if="column.key === 'push_time'">
            <span>{{ formatDate(record.push_time) }}</span>
          </template>

          <template v-else-if="column.key === 'action'">
            <Space>
              <!-- 复制拉取命令 -->
              <Button
                size="small"
                type="link"
                @click="handleCopyPullCmd(record)"
                :disabled="!record.tags || record.tags.length === 0"
              >
                复制Pull命令
              </Button>

              <!-- 删除此版本 -->
              <Popconfirm
                title="确定要彻底删除该镜像版本吗？此操作不可逆！"
                ok-text="确认删除"
                cancel-text="取消"
                ok-type="danger"
                @confirm="handleDeleteArtifact(record)"
              >
                <Button size="small" type="link" danger>
                  删除
                </Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </div>
  </BasicDrawer>
</template>

<script lang="ts" setup>
  import { ref, computed } from 'vue';
  import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
  import { Table, Tag, Tooltip, Space, Button, Popconfirm, message } from 'ant-design-vue';
  import {
    getHarborArtifactsApi,
    deleteHarborArtifactApi,
    HarborArtifact,
  } from '@/api/artifactory/harbor';
  import { copyText } from '@/utils/copyTextToClipboard';

  const emit = defineEmits(['success', 'register']);

  const projectName = ref('');
  const repoName = ref('');
  const harborHost = ref('');
  const loading = ref(false);
  const artifactList = ref<HarborArtifact[]>([]);

  const fullRepoPath = computed(() => {
    const host = harborHost.value ? harborHost.value.replace(/^https?:\/\//, '') : 'harbor.cathayquantum.net';
    return `${host}/${repoName.value}`;
  });

  const columns = [
    { title: '版本标签 (Tags)', key: 'tags', width: 220 },
    { title: '大小', key: 'size', width: 100 },
    { title: 'Digest 签名', key: 'digest', width: 140 },
    { title: '推送时间', key: 'push_time', width: 170 },
    { title: '操作', key: 'action', width: 180, align: 'center' },
  ];

  const [registerDrawer] = useDrawerInner(async (data) => {
    projectName.value = data.projectName;
    repoName.value = data.repoName;
    harborHost.value = data.harborHost || '';
    await fetchArtifacts();
  });

  async function fetchArtifacts() {
    if (!projectName.value || !repoName.value) return;
    try {
      loading.value = true;
      const res = await getHarborArtifactsApi({
        projectName: projectName.value,
        repoName: repoName.value,
        pageSize: 100,
      });
      artifactList.value = res || [];
    } catch (e: any) {
      message.error(e?.message || '获取镜像版本列表失败');
    } finally {
      loading.value = false;
    }
  }

  function handleCopyPullCmd(record: HarborArtifact) {
    if (!record.tags || record.tags.length === 0) return;
    const tag = record.tags[0].name;
    const cmd = `docker pull ${fullRepoPath.value}:${tag}`;
    copyText(cmd, `已复制拉取命令: ${cmd}`);
  }

  async function handleDeleteArtifact(record: HarborArtifact) {
    try {
      const refName = record.tags && record.tags.length > 0 ? record.tags[0].name : record.digest;
      await deleteHarborArtifactApi({
        projectName: projectName.value,
        repoName: repoName.value,
        reference: refName,
      });
      message.success('删除成功');
      await fetchArtifacts();
      emit('success');
    } catch (e: any) {
      message.error(e?.message || '删除失败');
    }
  }

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  }

  function truncateDigest(digest: string) {
    if (!digest) return '-';
    if (digest.length <= 19) return digest;
    return digest.substring(0, 19) + '...';
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('zh-CN', { hour12: false });
    } catch {
      return dateStr;
    }
  }
</script>
