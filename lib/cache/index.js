var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import path from "path";
import fs from "fs";
import { notExistsToCreateFile, readJsonFileSync } from "../utils.js";
/**
 * 和翻译缓存json文件对比 返回存在更改的json文件
 * @param {object} cacheObject 已经缓存的对象
 * @param {object} translateObject 需要翻译的对象
 * @returns {object} 存在修改的对象
 */
export const translateJSONDiffToJson = (cacheObject, translateObject) => {
    if (Object.values(cacheObject).length === 0)
        return translateObject;
    // json文件内容diff
    const pendingTranslateMap = {};
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
export const getCacheFileSync = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    if (fs.existsSync(filePath)) {
        return yield readJsonFileSync(filePath);
    }
    else {
        return {};
    }
});
/**
 * 注册语言缓存文件
 * @param {string} language
 */
export const registerLanguageCacheFile = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { jsonMap, sourceFilePath, fileName, language, folderName } = params;
    const cacheFilePath = path.join(folderName, language, fileName);
    const sourceObject = yield readJsonFileSync(sourceFilePath);
    const cacheObject = yield readJsonFileSync(cacheFilePath);
    Object.entries(jsonMap).forEach(([key, value]) => {
        cacheObject[key] = sourceObject[key];
    });
    if (Object.values(jsonMap).length === 0)
        return;
    notExistsToCreateFile(folderName);
    notExistsToCreateFile(`${folderName}/${language}`);
    yield fs.writeFileSync(cacheFilePath, JSON.stringify(cacheObject, null, 2), "utf8");
});
