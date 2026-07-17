# AI低代码平台

> **一句话描述**：告诉 AI 你想要什么页面，它就帮你做出来。然后你还能拖拽调整、一键导出。

**这不是一个玩具项目，而是一个真正可用的产品。**

一个完全独立开发、从零构建的 AI 驱动页面搭建平台。用户通过自然语言描述需求，AI 自动生成完整网页，支持拖拽编辑、多页面管理、页面跳转、一键导出 HTML。

![技术栈](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8) ![License](https://img.shields.io/badge/License-MIT-green)

---

## 🎯 这个项目解决了什么问题？

**传统低代码平台的痛点：**
- 学习成本高，需要理解复杂的组件系统和数据流
- 只能做预设的模板页面，定制化程度低
- 导出的代码难以直接使用，需要二次开发

**AI 低代码平台的解法：**
- **零学习成本**：用自然语言描述，AI 理解你的意图
- **高度定制**：AI 生成的是真正的页面结构，不是模板填充
- **即开即用**：导出的 HTML 文件可以直接部署，无需任何依赖

---

## 📸 效果展示

### 场景一：5 分钟搭建一个登录系统

```
用户输入：
"帮我做一个登录页面，包含用户名、密码输入框和登录按钮，
然后做一个主页，登录成功后跳转到主页，主页显示欢迎信息"

AI 输出：
✅ 自动创建两个页面（登录页、主页）
✅ 生成输入框、按钮、文本等元素
✅ 自动配置按钮跳转逻辑
✅ 导出后点击按钮即可跳转
```

**结果**：从想法到可部署的 HTML，全程 5 分钟。

### 场景二：快速原型验证

产品经理有一个想法，需要快速验证。传统流程：
1. 写 PRD（1 天）
2. 设计师出图（2 天）
3. 前端开发（3 天）
4. 联调测试（1 天）

使用 AI 低代码平台：
1. 描述需求（5 分钟）
2. AI 生成页面（30 秒）
3. 拖拽微调（10 分钟）
4. 导出分享（1 分钟）

**结果**：从想法到可交互原型，30 分钟内完成。

---

## ✨ 核心功能

### 🤖 AI 智能生成
- **自然语言输入**：用中文描述你想要的页面
- **流式响应**：实时看到 AI 生成过程
- **多轮对话**：不满意？继续说，AI 会修改
- **安全代理**：API Key 加密存储，永不暴露

### 🖱️ 可视化编辑
- **拖拽定位**：自由移动元素位置
- **缩放调整**：拖动边角改变大小
- **属性编辑**：双击打开面板，实时修改
- **多选对齐**：Ctrl+点击多选，支持 6 种对齐方式

### 📑 多页面管理
- **最多 20 个页面**：支持复杂项目
- **页面跳转**：按钮/链接可配置跳转目标
- **自动保存**：状态持久化到本地

### 📤 导出部署
- **单页 HTML**：直接下载，双击打开
- **多页 ZIP**：批量导出，页面间跳转正常
- **响应式设计**：自适应屏幕尺寸

---

## 🚀 快速开始

### 在线体验

🔗 **演示地址**：https://ailingye.vercel.app

无需安装，打开即用。游客模式每天可免费使用 1 次 AI 生成。

### 本地运行

```bash
# 克隆项目
git clone https://github.com/memoriessting-sys/ai-lowcode.git

# 安装依赖
cd ai-lowcode && npm install

# 复制环境变量配置
cp .env.example .env
# 编辑 .env 填入你的 Supabase 配置

# 启动开发服务器
npm run dev
```

### 配置说明

**前端环境变量** (`.env`)：
- `VITE_SUPABASE_URL` - Supabase 项目地址
- `VITE_SUPABASE_ANON_KEY` - Supabase 匿名密钥
- `VITE_POSTHOG_KEY` - PostHog 分析密钥（可选）

**后端环境变量**（部署在独立的后端服务中）：
- `API_URL` - AI API 地址
- `API_KEY` - API 密钥
- `MODEL_ID` - 模型 ID

支持的 API 提供商：DeepSeek、OpenAI、科大讯飞（自动识别格式）

---

## 📖 使用指南

### AI 生成页面

在左侧聊天面板输入描述：

```
帮我做一个电商首页，顶部导航栏，中间轮播图，下面商品列表
```

AI 会自动生成包含正确元素的页面结构。

### 编辑元素

| 操作 | 方法 |
|------|------|
| 选中 | 单击元素 |
| 多选 | Ctrl + 点击 |
| 移动 | 拖动 |
| 缩放 | 拖动边角 |
| 编辑 | 双击或右键菜单 |
| 删除 | Delete 键 |

### 配置页面跳转

1. 创建多个页面（如"登录页"、"主页"）
2. 选中按钮，双击打开属性面板
3. 在"跳转页面"下拉框中选择目标页面
4. 导出后，点击按钮即可跳转

### 导出页面

1. 点击顶部"导出"按钮
2. 选择导出当前页面或全部页面
3. 单页导出 HTML 文件，多页导出 ZIP 压缩包
4. 解压后用浏览器打开即可预览

---

## 🛠️ 技术架构

### 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.1.0 | 前端框架 |
| TypeScript | 5.8.3 | 类型安全 |
| Vite | 6.3.5 | 构建工具 |
| Zustand | 5.0.5 | 状态管理 |
| Tailwind CSS | 3.4.17 | 样式框架 |
| Supabase | - | 用户认证 |

### 核心设计

**Schema 驱动渲染**

页面结构用 JSON Schema 定义，渲染器根据类型动态渲染：

```typescript
interface Element {
  id: string;
  type: 'text' | 'button' | 'input' | ...;
  x: number;
  y: number;
  width: number;
  height: number;
  props: TextProps | ButtonProps | ...;
}
```

**AI 流式响应**

使用 SSE 实现流式输出，实时显示生成过程，用户体验更流畅。

**撤销/重做**

采用快照模式，支持 50 步历史记录。

---

## 📊 项目数据

| 指标 | 数值 |
|------|------|
| 支持元素类型 | 12 种 |
| 最大页面数 | 20 个 |
| 撤销历史 | 50 步 |
| 代码行数 | ~8000 行 |
| TypeScript 覆盖率 | 100% |

---

## 🎨 支持的元素类型

| 元素 | 可编辑属性 |
|------|------------|
| 文本 | 内容、字号、颜色、粗细、对齐 |
| 图片 | 地址、描述、填充方式 |
| 按钮 | 文字、背景色、文字颜色、圆角、跳转页面 |
| 输入框 | 占位符、边框颜色、背景色 |
| 容器 | 背景色、圆角、边框 |
| 视频 | URL、自动播放、循环、静音 |
| 音频 | URL、自动播放、循环 |
| 链接 | 文字、地址、颜色、字号、跳转页面 |
| 分割线 | 颜色、粗细、样式 |
| 图标 | 名称、大小、颜色 |
| 卡片 | 标题、内容、背景色、圆角 |
| 下拉框 | 选项列表、占位文字 |

---

## 🔧 开发指南

```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run preview  # 预览构建结果
npm run lint     # 代码检查
```

### 添加新元素类型

1. 在 `src/types/schema.ts` 添加类型定义
2. 在 `src/components/elements/` 创建组件
3. 在 `src/core/renderer/ElementRenderer.tsx` 添加渲染逻辑
4. 在 `src/utils/exportHtml.ts` 添加导出逻辑
5. 在 `src/components/editor/PropertyPanel.tsx` 添加属性编辑

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

---

## 🙏 致谢

- [React](https://react.dev/) - UI 框架
- [Zustand](https://zustand-demo.pmnd.rs/) - 状态管理
- [Tailwind CSS](https://tailwindcss.com/) - 样式框架
- [Supabase](https://supabase.com/) - 用户认证
- [DeepSeek](https://www.deepseek.com/) - AI 模型

---

⭐ 如果这个项目对你有帮助，请给一个 Star！
