import path from "path";
import fs from "fs";
import { notExistsToCreateFile, readJsonFileSync } from "../utils.js";
import { IJson, IRegisterLanguageCacheFile } from "../../types";

/**
 * 和翻译缓存json文件对比 返回存在更改的json文件
 * @param {object} cacheObject 已经缓存的对象
 * @param {object} translateObject 需要翻译的对象
 * @returns {object} 存在修改的对象
 */
export const translateJSONDiffToJson = (
  cacheObject: IJson,
  translateObject: IJson
) => {
  if (Object.values(cacheObject).length === 0) return translateObject;
  // json文件内容diff
  const pendingTranslateMap: IJson = {};
  Object.entries(translateObject).forEach(([key, value]) => {
    //不存在该key 是新增的key
    if (!cacheObject[key]) {
      pendingTranslateMap[key] = value;
    }
    // 存在缓存key但是内容不一样 需要重新翻译
    else if (translateObject[key] !== cacheObject[key]) {
      pendingTranslateMap[key] = value;
    }
  });

  return pendingTranslateMap;
};

/**
 * 获取缓存文件
 * @param {string} filePath 缓存文件路径
 * @returns {Promise<{key:value}>}
 */
export const getCacheFileSync = async (filePath: string): Promise<IJson> => {
  if (fs.existsSync(filePath)) {
    return await readJsonFileSync(filePath);
  } else {
    return {};
  }
};

/**
 * 注册语言缓存文件
 * @param {string} language
 */
export const registerLanguageCacheFile = async (
  params: IRegisterLanguageCacheFile
) => {
  const { jsonMap, sourceFilePath, fileName, language, folderName } = params;
  const cacheFilePath = path.join(folderName, language, fileName);
  const sourceObject = await readJsonFileSync(sourceFilePath);
  const cacheObject = await readJsonFileSync(cacheFilePath);

  Object.entries(jsonMap).forEach(([key, value]) => {
    cacheObject[key] = sourceObject[key];
  });

  if (Object.values(jsonMap).length === 0) return;
  notExistsToCreateFile(folderName);
  notExistsToCreateFile(`${folderName}/${language}`);
  await fs.writeFileSync(
    cacheFilePath,
    JSON.stringify(cacheObject, null, 2),
    "utf8"
  );
};
