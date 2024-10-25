import { IJson, IRegisterLanguageCacheFile } from "@/types";
/**
 * 和翻译缓存json文件对比 返回存在更改的json文件
 * @param {object} cacheObject 已经缓存的对象
 * @param {object} translateObject 需要翻译的对象
 * @returns {object} 存在修改的对象
 */
export declare const translateJSONDiffToJson: (cacheObject: IJson, translateObject: IJson) => IJson;
/**
 * 获取缓存文件
 * @param {string} filePath 缓存文件路径
 * @returns {Promise<{key:value}>}
 */
export declare const getCacheFileSync: (filePath: string) => Promise<IJson>;
/**
 * 注册语言缓存文件
 * @param {string} language
 */
export declare const registerLanguageCacheFile: (params: IRegisterLanguageCacheFile) => Promise<void>;
//# sourceMappingURL=index.d.ts.map