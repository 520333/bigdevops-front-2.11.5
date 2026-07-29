<template>
  <div class="p-4">
    <BasicTable @register="registerTable">
      <template #toolbar>
        <Button type="primary" class="bg-blue-600 hover:bg-blue-500 border-0 shadow-md font-semibold"
          @click="handleCreatePipeline">
          新建流水线模版
        </Button>
        <Button @click="reload"> 刷新状态 </Button>
      </template>

      <!-- Custom Body Cells -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <div @click.stop>
            <TableAction :actions="[
              {
                label: '编辑模版',
                icon: 'ant-design:edit-outlined',
                onClick: handleEditPipeline.bind(null, record),
              },
              {
                label: '语法校验',
                icon: 'ant-design:check-circle-outlined',
                onClick: handleValidatePipeline.bind(null, record),
              },
              {
                label: '删除',
                icon: 'ant-design:delete-outlined',
                color: 'error',
                popConfirm: {
                  title: `确定要彻底删除流水线模版 [${record.name}] 吗？`,
                  confirm: handleDeletePipeline.bind(null, record),
                },
              },
            ]" />
          </div>
        </template>
      </template>

      <!-- Expand Row Slot: Show Groovy Pipeline Script -->
      <template #expandedRowRender="{ record }">
        <div class="p-3 bg-slate-900 rounded-lg text-white border border-slate-700 font-mono shadow-inner my-1">
          <div class="flex items-center justify-between text-xs text-slate-400 mb-2 pb-2 border-b border-slate-800">
            <span class="flex items-center gap-2">
              <Icon icon="ant-design:code-outlined" class="text-cyan-400 text-base" />
              <span class="font-bold text-slate-200 font-sans">流水线 Groovy 定义: {{ record.name }}</span>
              <Tag color="blue" class="font-mono text-xs font-semibold">Node: {{ record.agentNode || 'master' }}</Tag>
            </span>
            <span class="text-slate-500">点击行可折叠 / 展开</span>
          </div>
          <div class="rounded overflow-hidden">
            <Codemirror :model-value="record.pipelineScript || '// 暂无定义代码'"
              :style="{ height: '280px', fontSize: '13px' }" :extensions="extensions" :disabled="true" />
          </div>
        </div>
      </template>
    </BasicTable>

    <!-- Create & Edit Pipeline Drawer -->
    <PipelineDrawer @register="registerDrawer" @success="reload" />
  </div>
</template>

<script lang="ts" setup>
import { Tag, Modal } from 'ant-design-vue';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon/Icon.vue';
import { BasicTable, useTable, TableAction } from '@/components/Table';
import { useDrawer } from '@/components/Drawer';
import {
  getJenkinsPipelineList,
  deleteJenkinsPipeline,
  validateJenkinsPipeline,
} from '@/api/cicd/pipeline';
import { useMessage } from '@/hooks/web/useMessage';
import { columns, searchFormSchema } from './pipeline.data';
import PipelineDrawer from './PipelineDrawer.vue';

// Codemirror imports for syntax-highlighted preview
import { Codemirror } from 'vue-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { Decoration, ViewPlugin, EditorView } from '@codemirror/view';
import type { DecorationSet, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

defineOptions({ name: 'JenkinsPipelineManagement' });

const { createMessage } = useMessage();
const [registerDrawer, { openDrawer }] = useDrawer();

const keywordTheme = EditorView.baseTheme({
  '.cm-jenkins-keyword': { color: '#c678dd', fontWeight: 'bold' },
  '.cm-jenkins-string': { color: '#98c379' },
  '.cm-jenkins-comment': { color: '#5c6370', fontStyle: 'italic' },
  '.cm-jenkins-step': { color: '#61afef' },
});

const jC = Decoration.mark({ class: 'cm-jenkins-comment' });
const jS = Decoration.mark({ class: 'cm-jenkins-string' });
const jK = Decoration.mark({ class: 'cm-jenkins-keyword' });
const jT = Decoration.mark({ class: 'cm-jenkins-step' });

const jenkinsHighlighter = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = this.getDeco(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.getDeco(update.view);
      }
    }
    getDeco(view: EditorView) {
      const builder = new RangeSetBuilder<Decoration>();
      for (const { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to);
        const regex =
          /(\/\/.*)|(\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*")|('(?:\\.|[^'\\])*')|(\b(?:pipeline|agent|stages|stage|steps|environment|parameters|options|post|always|success|failure|any|none|when|expression|withCredentials|cleanWs|checkout|scmGit|groovyScript|booleanParam|string|choice)\b)|(\b(?:sh|echo|git|docker|curl|ansible|wrap|returnStdout|trim)\b)/g;
        let match;
        while ((match = regex.exec(text))) {
          const start = from + match.index;
          const end = start + match[0].length;
          if (match[1] || match[2]) {
            builder.add(start, end, jC);
          } else if (match[3] || match[4]) {
            builder.add(start, end, jS);
          } else if (match[5]) {
            builder.add(start, end, jK);
          } else if (match[6]) {
            builder.add(start, end, jT);
          }
        }
      }
      return builder.finish();
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);

const extensions = [oneDark, keywordTheme, jenkinsHighlighter];

const [registerTable, { reload }] = useTable({
  title: '流水线模版定义列表',
  api: async (params) => {
    const res: any = await getJenkinsPipelineList({
      lang: params?.lang,
      keyword: params?.keyword,
    });
    return res?.items || res || [];
  },
  columns,
  showIndexColumn: false,
  formConfig: {
    labelWidth: 80,
    schemas: searchFormSchema,
    autoSubmitOnEnter: true,
  },
  useSearchForm: true,
  showTableSetting: true,
  bordered: false,
  expandRowByClick: true,
  pagination: {
    current: 1,
    pageSize: 10,
    showQuickJumper: true,
    showSizeChanger: true,
  },
  rowKey: 'id',
  actionColumn: { width: 290, title: '操作选项', dataIndex: 'action', key: 'action', fixed: 'right' },
});

function handleCreatePipeline() {
  openDrawer(true, { isUpdate: false });
}

function handleEditPipeline(record: any) {
  openDrawer(true, { isUpdate: true, record });
}

async function handleValidatePipeline(record: any) {
  if (!record?.pipelineScript) {
    createMessage.warning('该模版未配置 Groovy 脚本');
    return;
  }
  try {
    const res: any = await validateJenkinsPipeline({
      pipelineScript: record.pipelineScript,
    });
    if (res && res.valid) {
      Modal.success({
        title: 'Linter 语法检测通过 ✔',
        content: `流水线模版 [${record.name}] 脚本格式完全符合 Jenkins Groovy 规范。`,
      });
    } else {
      const errors = Array.isArray(res?.errors) ? res.errors.join('\n') : res?.errors || '语法检测错误';
      Modal.error({
        title: `流水线模版 [${record.name}] 语法校验未通过 ✖`,
        width: 580,
        content: `报错信息如下：\n\n${errors}`,
      });
    }
  } catch (err) {
    createMessage.error('语法检测接口连线失败');
  }
}

async function handleDeletePipeline(record: any) {
  try {
    await deleteJenkinsPipeline(record.id);
    createMessage.success(`流水线模版 [${record.name}] 删除成功！`);
    reload();
  } catch (err) {
    createMessage.error('删除失败');
  }
}
</script>
