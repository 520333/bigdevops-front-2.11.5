<template>
  <BasicModal
    v-bind="$attrs"
    @register="register"
    :title="`配置文件修改 Diff 对比确认 - [${filePath}]`"
    ok-text="确认并提交保存"
    cancel-text="放弃修改"
    @ok="handleConfirm"
    width="960px"
  >
    <div class="py-2">
      <div class="mb-3 flex justify-between items-center text-sm font-bold bg-gray-100 p-2 rounded">
        <span class="text-red-600 flex items-center gap-1">
          <span>🔴</span> 原有版本 (修改前)
        </span>
        <span class="text-green-600 flex items-center gap-1">
          <span>🟢</span> 新版本 (修改后)
        </span>
      </div>

      <div class="diff-container bg-gray-900 text-gray-200 font-mono text-xs p-3 rounded overflow-y-auto max-h-520px leading-relaxed border border-gray-700 select-text">
        <div
          v-for="(line, index) in diffLines"
          :key="index"
          :class="[
            'flex py-0.5 px-2 font-mono text-xs rounded-xs',
            line.type === 'del' ? 'bg-red-950 text-red-300' : '',
            line.type === 'add' ? 'bg-green-950 text-green-300' : '',
            line.type === 'normal' ? 'hover:bg-gray-800 text-gray-300' : '',
          ]"
        >
          <!-- 旧行号 -->
          <span class="w-10 select-none opacity-40 text-right pr-2 border-r border-gray-800">{{ line.oldLine || '' }}</span>
          <!-- 新行号 -->
          <span class="w-10 select-none opacity-40 text-right pr-3 border-r border-gray-800">{{ line.newLine || '' }}</span>
          <!-- 符号 -->
          <span class="w-6 select-none text-center font-bold" :class="line.type === 'del' ? 'text-red-400' : line.type === 'add' ? 'text-green-400' : 'opacity-20'">
            {{ line.sign }}
          </span>
          <!-- 行内容 -->
          <span class="whitespace-pre-wrap break-all flex-1">{{ line.text }}</span>
        </div>
      </div>
    </div>
  </BasicModal>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import { BasicModal, useModalInner } from '@/components/Modal';

  interface DiffLine {
    type: 'add' | 'del' | 'normal';
    sign: string;
    text: string;
    oldLine?: number;
    newLine?: number;
  }

  export default defineComponent({
    name: 'DiffModal',
    components: { BasicModal },
    emits: ['confirm', 'register'],
    setup(_, { emit }) {
      const filePath = ref('');
      const diffLines = ref<DiffLine[]>([]);
      const confirmLoading = ref(false);

      // 计算简易高效的逐行 Diff 对比算法
      const computeLineDiff = (oldStr: string, newStr: string): DiffLine[] => {
        const oldLines = (oldStr || '').split('\n');
        const newLines = (newStr || '').split('\n');
        const result: DiffLine[] = [];

        let i = 0;
        let j = 0;
        let oldLineNum = 1;
        let newLineNum = 1;

        while (i < oldLines.length || j < newLines.length) {
          if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
            result.push({
              type: 'normal',
              sign: ' ',
              text: oldLines[i],
              oldLine: oldLineNum++,
              newLine: newLineNum++,
            });
            i++;
            j++;
          } else {
            let foundInNew = -1;
            if (i < oldLines.length) {
              for (let k = j; k < Math.min(j + 8, newLines.length); k++) {
                if (oldLines[i] === newLines[k]) {
                  foundInNew = k;
                  break;
                }
              }
            }

            if (foundInNew !== -1) {
              while (j < foundInNew) {
                result.push({
                  type: 'add',
                  sign: '+',
                  text: newLines[j],
                  newLine: newLineNum++,
                });
                j++;
              }
            } else if (i < oldLines.length) {
              result.push({
                type: 'del',
                sign: '-',
                text: oldLines[i],
                oldLine: oldLineNum++,
              });
              i++;
            } else if (j < newLines.length) {
              result.push({
                type: 'add',
                sign: '+',
                text: newLines[j],
                newLine: newLineNum++,
              });
              j++;
            }
          }
        }

        return result;
      };

      const [register, { setModalProps, closeModal }] = useModalInner((data) => {
        filePath.value = data.path || '';
        const oldContent = data.originalContent || '';
        const newContent = data.fileContent || '';
        diffLines.value = computeLineDiff(oldContent, newContent);
        setModalProps({ confirmLoading: false });
      });

      const handleConfirm = () => {
        emit('confirm');
        closeModal();
      };

      return {
        register,
        filePath,
        diffLines,
        confirmLoading,
        handleConfirm,
      };
    },
  });
</script>
