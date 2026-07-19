<template>
  <div class="p-4 leading-relaxed">
    <div class="prose dark:prose-invert max-w-none">
      <!-- 发布方案标题 -->
      <div v-for="block in parsedBlocks" :key="block.key">
        <h3 v-if="block.type === 'h2'" class="text-base font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2 flex items-center gap-2">
          <span class="inline-block w-1 h-4 bg-blue-500 rounded-sm"></span>
          {{ block.text }}
        </h3>
        <h4 v-else-if="block.type === 'h3'" class="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-3 mb-1">
          {{ block.text }}
        </h4>
        <ol v-else-if="block.type === 'ol'" class="list-decimal list-inside space-y-1">
          <li v-for="(item, i) in block.items" :key="i" class="text-sm text-gray-600 dark:text-gray-400">{{ item }}</li>
        </ol>
        <ul v-else-if="block.type === 'ul'" class="list-none space-y-1">
          <li v-for="(item, i) in block.items" :key="i" class="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-1">
            <span>{{ item }}</span>
          </li>
        </ul>
        <p v-else class="text-sm text-gray-600 dark:text-gray-400 mb-2">{{ block.text }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  const props = defineProps<{ description: string }>();

  // 简单 Markdown 解析（支持 ##、###、有序/无序列表）
  const parsedBlocks = computed(() => {
    const lines = (props.description || '').split('\n');
    const blocks: any[] = [];
    let olItems: string[] = [];
    let ulItems: string[] = [];
    let key = 0;

    const flushOl = () => {
      if (olItems.length) { blocks.push({ key: key++, type: 'ol', items: [...olItems] }); olItems = []; }
    };
    const flushUl = () => {
      if (ulItems.length) { blocks.push({ key: key++, type: 'ul', items: [...ulItems] }); ulItems = []; }
    };

    lines.forEach((line) => {
      if (line.startsWith('## ')) {
        flushOl(); flushUl();
        blocks.push({ key: key++, type: 'h2', text: line.slice(3) });
      } else if (line.startsWith('### ')) {
        flushOl(); flushUl();
        blocks.push({ key: key++, type: 'h3', text: line.slice(4) });
      } else if (/^\d+\.\s/.test(line)) {
        flushUl();
        olItems.push(line.replace(/^\d+\.\s/, ''));
      } else if (line.startsWith('- ') || line.startsWith('⚠️') || line.startsWith('🔁')) {
        flushOl();
        ulItems.push(line.replace(/^-\s/, ''));
      } else if (line.trim()) {
        flushOl(); flushUl();
        blocks.push({ key: key++, type: 'p', text: line });
      }
    });
    flushOl(); flushUl();
    return blocks;
  });
</script>
