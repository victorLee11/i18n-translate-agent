# cc-translate
一个基于Chat GPT的翻译库 🚀

## 特征
- 支持通过一种源语言翻译出多国语言
- 默认使用gpt-4o模型进行翻译，你也可以设置.gpt-4o性价比更高


## 安装

```bash

# 使用 npm
npm install cc-translate -D

# 或者使用 yarn
yarn add cc-translate -D

```

## 快速开始

```mjs
// translate.mjs
import {CwalletTranslate} from 'cc-translate';

// 获取当前文件的完整路径
const __dirname = import.meta.dirname;

// 创建一个translate实例
const client = new CwalletTranslate({
  key: "your api key",
  sourceLanguage: 'en',
  // 缓存文件路径
  cacheFileRootPath: path.resolve(__dirname, './cache'),
  // 翻译源文件路径
  fileRootPath: path.resolve(__dirname, './langs'),
  // 调整翻译语境，告诉gpt我们的翻译要求。提高翻译准确性！
  fineTune: ['我们是一个区块链钱包', '请使用行业专业术语并更切合生活的翻译',....],
  // 需要翻译的语言列表
  languages: [
    'zh-CN',
    'zh-TW',
    'ja',
    'ar',
    ...
  ],
  // 输出文件路径
  outputRootPath: path.resolve(__dirname, './langs'),
});

```