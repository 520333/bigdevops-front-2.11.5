import { BasicColumn, FormSchema } from '@/components/Table';
import { h } from 'vue';
import { Tag } from 'ant-design-vue';
import { oneDark } from '@codemirror/theme-one-dark';
import { Decoration, ViewPlugin, EditorView } from '@codemirror/view';
import type { DecorationSet, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { foldService } from '@codemirror/language';
import dayjs from 'dayjs';

export const langOptions = [
  { label: 'Vue/TS', value: 'Vue/TS' },
  { label: 'Java', value: 'Java' },
  { label: 'Go', value: 'Go' },
  { label: 'Python', value: 'Python' },
  { label: 'PHP', value: 'PHP' },
];

export const columns: BasicColumn[] = [
  {
    title: '模版名称',
    dataIndex: 'name',
    key: 'name',
    width: 200,
    align: 'left',
    customRender: ({ record }) => {
      return h('span', { class: 'font-bold text-gray-800 dark:text-gray-100 font-mono text-sm' }, record.name || '-');
    },
  },
  {
    title: '适用语言栈',
    dataIndex: 'lang',
    key: 'lang',
    width: 140,
    align: 'center',
    customRender: ({ text }) => {
      const lang = text || 'Vue/TS';
      const color =
        lang === 'Java' ? 'orange' : lang === 'Vue/TS' ? 'green' : lang === 'Go' ? 'blue' : lang === 'Python' ? 'purple' : 'cyan';
      return h(Tag, { color, class: 'font-semibold rounded px-2' }, () => lang);
    },
  },
  {
    title: '描述说明',
    dataIndex: 'description',
    key: 'description',
    align: 'left',
    ellipsis: true,
    customRender: ({ text }) => {
      return text ? h('span', { class: 'text-gray-600 dark:text-gray-300 text-xs' }, text) : h('span', { class: 'text-gray-400 text-xs italic' }, '暂无描述');
    },
  },
  {
    title: '创建时间',
    dataIndex: 'CreatedAt',
    format: (text) => {
      return text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '';
    },
    width: 150,
  },
];

export const searchFormSchema: FormSchema[] = [
  {
    field: 'lang',
    label: '语言栈',
    component: 'Select',
    colProps: { span: 6 },
    componentProps: {
      placeholder: '筛选适用语言',
      allowClear: true,
      options: [{ label: '全部语言', value: '' }, ...langOptions],
    },
  },
  {
    field: 'keyword',
    label: '关键字',
    component: 'Input',
    colProps: { span: 8 },
    componentProps: {
      placeholder: '搜索模版名称/描述说明',
      allowClear: true,
    },
  },
];

export const formSchema: FormSchema[] = [
  {
    field: 'name',
    label: '模版名称',
    component: 'Input',
    required: true,
    colProps: { span: 12 },
    componentProps: {
      placeholder: '例如: Standard-Vue-TS-Build-Pipeline',
    },
  },
  {
    field: 'lang',
    label: '适用语言栈',
    component: 'Select',
    required: true,
    defaultValue: 'Vue/TS',
    colProps: { span: 6 },
    componentProps: {
      options: langOptions,
    },
  },
  {
    field: 'description',
    label: '描述说明',
    component: 'InputTextArea',
    colProps: { span: 24 },
    componentProps: {
      rows: 2,
      placeholder: '简述该流水线模版的适用场景、依赖插件与编译流程说明',
    },
  },
  {
    field: 'pipelineScript',
    label: '',
    component: 'Input',
    colProps: { span: 24 },
    slot: 'pipelineScriptSlot',
  },
];

// 公共 CodeMirror 扩展（Groovy 语法高亮与折叠）
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

const braceFolder = foldService.of((state, lineStart) => {
  const line = state.doc.lineAt(lineStart);
  const text = line.text;
  const openBrace = text.indexOf('{');
  if (openBrace === -1) return null;

  let braceCount = 0;
  const pos = lineStart + openBrace;
  const docLength = state.doc.length;

  for (let i = pos; i < docLength; i++) {
    const char = state.doc.sliceString(i, i + 1);
    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      if (braceCount === 0) {
        return { from: pos + 1, to: i };
      }
    }
  }
  return null;
});

export const pipelineEditorExtensions = [oneDark, keywordTheme, jenkinsHighlighter, braceFolder];

export const defaultTemplateScript = `pipeline {
    agent any

    options {
        timeout(time: 1, unit: 'HOURS')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('拉取代码 (Checkout)') {
            steps {
                echo "1. 正在从 Git 仓库拉取最新发布分支..."
            }
        }

        stage('编译构建 (Build & Compile)') {
            steps {
                echo "2. 执行依赖安装与编译构建打包..."
            }
        }

        stage('镜像打包与推送 (Docker Push)') {
            steps {
                echo "3. 构建 Container 镜像并推送到云端镜像仓库..."
            }
        }

        stage('云端发布部署 (Cloud Deploy)') {
            steps {
                echo "4. 执行 Kubernetes 零停机滚动更新集群应用..."
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}`;
