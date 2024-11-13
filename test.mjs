import path from "path";
import { deleteBatchCache, generateCache } from "./index.js";

// deleteBatchCache({
//   keys: ["10001", "10002"],
//   cacheFolderPath: path.resolve("./src/cache"),
//   cacheFileName: "common.json",
//   languages: [],
// });

generateCache({
  sourceFolderPath: path.resolve("./src/langs"),
  sourceLanguage: "en",
  exportFolderPath: path.resolve("./src/cache"),
  languages: ["ja", "zh-CN"],
});
