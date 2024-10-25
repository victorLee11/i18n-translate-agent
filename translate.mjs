import { CwalletTranslate } from "./index.js";

const client = new CwalletTranslate({
  key: "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",
  sourceLanguage: "en",
  cacheFileRootPath: "./src/cache",
  fileRootPath: "./src/langs",
  fineTune: ["我们是一个区块链钱包", "请更加专业更加通俗的翻译"],
  languages: ["zh-CN", "zh-TW", "ja", "ko", "ar"],
  outputRootPath: "./src/output",
});

client.translate();
