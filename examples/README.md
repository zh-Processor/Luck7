# 内容参考

`posts/` 保存此前用于展示排版与阅读功能的五篇文章。这些文件不参与博客构建，不会出现在文章列表、搜索、RSS 或 sitemap 中。

正式内容位于 `content/posts/`，目前只有「欢迎来到心安之地」。参考文章中的个人叙述、技术选择和日常场景只是写作示例，采用时请改成自己的实际内容。

## 使用方法

通常直接使用写作命令创建草稿：

```bash
npm run new:post -- --title "文章标题" --slug my-post
```

需要参考某篇排版时，也可以主动复制 `examples/posts/` 下的 Markdown 文件到 `content/posts/`，然后：

1. 先在 frontmatter 中设置 `draft: true`。
2. 修改标题、唯一 slug、日期和正文；检查文章内的链接。
3. 保留 `sample: true` 可以显示示例标记；完成真实内容替换后改为 `sample: false`。
4. 用 `npm run dev:drafts` 在本地预览。
5. 确认后改为 `draft: false`，运行 `npm run build` 生成正式产物。

参考文件原有日期、slug 和示例标记会随复制保留。复制本身不会自动转换为新文章，也不会自动变为草稿；请在复制后先完成上述编辑。

图片资源应放在 `public/` 内。完整写作和配置说明见 [README.md](../README.md)。
