# 心安之地

以「暮色书房」为主题的静态个人博客：记录文字、日常与思考，和窗边的小安一起安静待一会儿。站名来自对许嵩音乐的喜爱。

项目仓库为 [zh-Processor/Luck7](https://github.com/zh-Processor/Luck7)，站点地址为 [心安之地](https://zh-processor.github.io/Luck7/)。内容可以在本地写作和预览，推送到 `main` 后由 GitHub Actions 构建并发布。

## 本地运行

使用 Node.js **22.13+ 或 24+ 的 LTS 版本**和 npm，在项目目录运行：

```bash
npm ci
npm run dev
```

访问终端显示的地址。默认开发模式与正式站点一致，只展示已发布文章。

```bash
npm test
npm run build
npm run preview
```

`build` 执行类型检查、前端构建、静态预渲染及产物校验，输出目录为 `dist/`。`preview` 用本地服务器查看该产物，不会上传或发布网站。

默认内容包括一篇正式欢迎文章「欢迎来到心安之地」。碎碎念与友链初始为空；关于页保留站名来源和创站文字。此前五篇演示文章已移至 `examples/posts/`，不会进入网站、搜索或订阅。

`content/posts/first-post.md` 是已创建的空白起步草稿，可直接开始写作。它只在草稿预览模式显示，不会随正式站点发布。

## 日常内容维护

普通内容修改集中在 `content/`，无需编辑 TSX 组件：

| 内容 | 文件 | 主要字段或格式 |
| --- | --- | --- |
| 站名、简介、作者、首页文案、评论 | `content/site.yaml` | 顶层站点字段及 `author`、`home`、`comments` |
| 关于页正文 | `content/about.md` | Markdown |
| 文章 | `content/posts/*.md` | YAML frontmatter + Markdown |
| 作者公开碎碎念 | `content/notes.yaml` | `id`、`date`、`mood`、`text` 数组 |
| 友链 | `content/friends.yaml` | `name`、`description`、`url`、可选 `avatar` 数组 |
| 图片、头像 | `public/images/` | 在内容中使用 `/images/文件名` |

开发服务器会随文件修改更新页面。正式站点更新需要重新构建，之后将新的 `dist/` 部署到静态托管服务。

### 新建文章

```bash
npm run new:post -- --title "我的第一篇文章" --slug my-first-post
npm run new:post -- --title "一段新的思考" --slug a-new-thought --category 随想
```

命令创建 `content/posts/<slug>.md`，按 Asia/Shanghai 日期填写 `date`，默认 `draft: true`、`sample: false`、`comments: true`。已有同名文件时会报错，不覆盖原内容。`slug` 使用小写英文、数字及分隔用短横线，不能使用 Windows 保留文件名。

编辑生成的草稿，可补充摘要、标签和封面：

```markdown
---
title: 我的第一篇文章
slug: my-first-post
date: '2026-10-23'
description: 用一句话概括文章内容。
category: 随想
tags: [生活, 思考]
cover: window
featured: false
comments: true
sample: false
draft: true
---

## 开始写吧

在这里写下正文。
```

`description` 可以省略，填写时必须是非空文本。`date` 和可选 `updated` 使用有效的 `YYYY-MM-DD` 日期，更新时间不能早于发布日期。文章地址由唯一 `slug` 决定，发布后尽量保持稳定。

### 预览草稿与正式发布

```bash
npm run dev:drafts
```

此命令启动本机草稿预览：页面显示模式提示，草稿带有标记。预览中的草稿需要具备完整、有效的标题、日期、slug 和正文；未写完必要字段时，请先补全这些字段。

- `npm run dev` 排除草稿。
- `npm run dev:drafts` 在本地显示草稿和已发布文章。
- 正式构建始终排除 `draft: true` 的文章，包括页面、搜索、RSS 和 sitemap；即使生产构建的 mode 名为 `drafts`，也不会收录草稿。

确认文章内容后，将 `draft` 改为 `false`，再运行 `npm run build`。构建完成表示已生成可发布文件；真正上线还需要后续部署操作。

`draft` 控制网站构建的收录范围。提交到公开 GitHub 仓库的 Markdown 源文件仍可在仓库中查看，私人草稿应保留在仓库之外。自带的 `first-post.md` 仅为空白写作模板。

### Markdown 与图片

支持引用、列表、任务列表、表格、代码块和图片。代码块可复制；Markdown 中的原始 HTML 不执行。二、三级标题自动进入目录，重复标题会生成独立锚点。

图片放在 `public/images/`，正文使用 `![图片说明](/images/name.jpg)`。站内链接使用 `/posts/文章slug/`；项目会处理 GitHub Pages 仓库子路径，不要在内容里重复添加仓库前缀。

内置封面类型为 `landscape`、`autumn`、`code`、`music`、`window`。分类与标签从实际文章自动生成。

### 新增公开碎碎念

```bash
npm run new:note -- --text "写下一条想公开分享的短记录。"
npm run new:note -- --text "另一条记录。" --mood 随想
```

命令向 `content/notes.yaml` 追加记录，生成唯一 `id` 和 Asia/Shanghai 日期，默认心情词为“日常”。该文件是作者公开的时间线内容，重新构建并部署后会在网站显示。

也可以直接编辑 YAML：

```yaml
- id: first-moment
  date: '2026-10-23'
  mood: 日常
  text: 在这里写下自己的记录。
```

每条记录需有唯一的小写 `id`、有效日期、文本类型的 `mood` 和非空 `text`；`mood` 可留空字符串。同一天可以有多条记录。没有记录时保留 `[]`。

写作命令会校验参数和现有数据；文章创建不覆盖旧文件，碎碎念写入采用锁与临时文件替换，避免并发命令丢失记录。帮助命令为 `node scripts/author.mjs --help`。

### 个人资料、首页与友链

编辑 `content/site.yaml` 的 `author` 可修改昵称、简介、头像、GitHub 链接和邮箱；`home` 保存首页标题、介绍段落及短句。真实联系信息可以暂时留空，相应联系入口不会显示。关于页的正文直接编辑 `content/about.md`。

`content/friends.yaml` 的格式为：

```yaml
- name: 朋友的站名
  description: 一句话介绍。
  url: https://example.com
  avatar: /images/friend.png
```

友链地址使用完整 HTTPS URL，头像可省略。只添加已确认的站点；没有友链时保留 `[]`。页面会显示空列表状态。配置邮箱或可用的 Discussions 信息后，友链页会提供联系入口。

示例文章仅作排版和格式参考，详见 [examples/README.md](./examples/README.md)。若希望采用其中一篇，请主动复制到 `content/posts/`，先设为草稿并改成自己的内容。

## 已实现的博客功能

- 暖纸色、暮色夜间主题，系统配色、字号和减少动态的偏好记忆。
- 原创 SVG 书房、Q 版小安、猫与灯光；角色可关闭，点击可读一句原创短句。
- 文章全文搜索、分类、标签、年份筛选、分页与全站搜索（`Ctrl/⌘ K`）。
- 自动目录、阅读进度、专注模式、字号调节、代码复制、图片查看、分享链接、相邻及相关文章。
- 作者碎碎念时间线、Markdown 关于页、友链与本站名片复制。
- GitHub Discussions / giscus 评论配置、全站及单篇开关、按需载入与失败重试。
- 响应式页面、键盘可操作对话框、页面元信息、RSS、sitemap 和 404。
- 每个页面的完整 HTML 静态输出；文章地址可直接访问与刷新，站内导航由前端接管。

## 评论配置

仓库已开启 Discussions，公开仓库与分类标识保存在 `content/site.yaml`。目前 `comments.enabled: false`：为 `zh-Processor/Luck7` 安装 giscus App 后，将其改为 `true` 并推送即可启用。只有填写有效 `repo`、`repoId`、`categoryId` 并开启评论后，文章页才出现评论入口。

准备启用时：

1. 使用公开仓库，在仓库设置中启用 Discussions。
2. 在 [giscus 配置页](https://giscus.app/zh-CN) 安装 giscus GitHub App，选择仓库与分类。
3. 将生成的公开标识填入 `content/site.yaml` 的 `comments`：

```yaml
comments:
  enabled: true
  repo: owner/repository
  repoId: 从giscus复制
  category: Announcements
  categoryId: 从giscus复制
  reactions: false
```

以上占位文字需替换为 giscus 提供的实际值。也可通过 `.env.local` 中的 `VITE_GISCUS_REPO`、`VITE_GISCUS_REPO_ID`、`VITE_GISCUS_CATEGORY`、`VITE_GISCUS_CATEGORY_ID` 覆盖；非空环境变量优先于 YAML。

访客点击“打开评论”后才加载 giscus，发言需要 GitHub 登录。讨论以 `post:文章slug` 匹配，换域名不影响这一标识。评论删除、锁定和管理在 GitHub Discussions 中完成。

`comments.enabled: false` 关闭全站评论；文章 frontmatter 的 `comments: false` 关闭单篇评论。`reactions` 控制表情反应。配置文件和 `VITE_*` 变量都是公开数据，不放访问令牌或密码。

## 部署到 GitHub Pages

本仓库使用 GitHub Actions 发布。迁移到其他仓库时按以下步骤配置：

1. 创建自己的 GitHub 仓库并提交项目，默认发布分支为 `main`。其他分支需同步修改 `.github/workflows/deploy.yml`。
2. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 推送到 `main`，或手动运行 **Deploy blog to GitHub Pages** 工作流。
4. 工作流执行测试、构建并发布 `dist/`，从 Pages 配置读取正式地址与仓库子路径。

用户站点、仓库项目站点和已在 Pages 中配置的自定义域名都使用同一套工作流。如在 Actions 中配置评论，使用 Repository variables：`GISCUS_REPO`、`GISCUS_REPO_ID`、`GISCUS_CATEGORY`、`GISCUS_CATEGORY_ID`。

部署到其他静态服务器时，可在 `.env.local` 设置 `VITE_SITE_URL` 与 `VITE_BASE_PATH` 后重新构建。前者为含仓库路径的完整正式地址，例如 `https://username.github.io/blog`；后者对应 `/blog/`。也可以在 `content/site.yaml` 的 `url` 填写正式地址，非空 `VITE_SITE_URL` 优先。

尚未配置正式地址的本地构建使用 `http://localhost:4173` 生成 RSS 和 sitemap 链接。上线前填写真实地址，或由 GitHub Pages 工作流自动传入。

## 项目目录

```text
content/site.yaml      站点、作者、首页、评论的公开配置
content/about.md       关于页正文
content/notes.yaml     作者公开碎碎念
content/friends.yaml   友链列表
content/posts/         正式文章与草稿
examples/posts/        不参与构建的五篇参考文章
public/                图片、头像等静态资源
src/components/        导航、书房、阅读与评论组件
src/context/           阅读偏好
src/lib/               内容解析、数据校验、搜索与页面元信息
src/pages/             博客页面
src/styles.css         全站视觉、夜间与移动适配
scripts/author.mjs     新建草稿和公开碎碎念
scripts/prerender.mjs  输出 HTML、RSS、sitemap
scripts/verify-static.mjs  校验静态构建产物
tests/                 内容、写作命令、渲染与评论控制测试
.github/workflows/     检查与后续 GitHub Pages 发布
```

设计说明见 [DESIGN.md](./DESIGN.md)。
