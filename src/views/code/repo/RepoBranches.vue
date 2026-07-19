<template>
  <div class="p-2 bg-gray-50 rounded-md">
    <div v-if="loading" class="text-gray-500">
      <LoadingOutlined class="mr-2" />
      正在加载分支...
    </div>
    <div v-else-if="error" class="text-red-500">
      加载失败: {{ error }}
    </div>
    <div v-else-if="branches.length === 0" class="text-gray-500">
      暂无分支
    </div>
    <div v-else class="flex flex-wrap gap-2">
      <span class="text-gray-600 font-bold mr-2">全部分支:</span>
      <Tag 
        v-for="b in branches" 
        :key="b.name"
        :color="b.name === record.defaultBranch ? 'blue' : 'default'"
      >
        <template v-if="b.name === record.defaultBranch">
          <StarOutlined class="mr-1" />
        </template>
        {{ b.name }}
      </Tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, PropType } from 'vue';
import { Tag } from 'ant-design-vue';
import { LoadingOutlined, StarOutlined } from '@ant-design/icons-vue';
import { getRepoBranches } from '@/api/code/repo';

const props = defineProps({
  record: {
    type: Object as PropType<any>,
    required: true,
  },
});

const branches = ref<any[]>([]);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    const res = await getRepoBranches({
      serverId: props.record.serverId,
      repoId: props.record.id,
      fullName: props.record.fullName,
    });
    branches.value = res || [];
  } catch (err: any) {
    error.value = err.message || '获取分支失败';
  } finally {
    loading.value = false;
  }
});
</script>
