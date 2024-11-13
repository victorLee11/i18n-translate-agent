import path from "path";
import fs from "fs";
import {
  intersection,
  notExistsToCreateFile,
  readJsonFileSync,
} from "../utils.js";
import {
  ICacheFile,
  IDeleteSingleCacheParams,
  IGenerateCacheParams,
  IJson,
  IRegisterLanguageCacheFile,
} from "../../types";

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

/**
 * 根据已翻译文件生成缓存
 */
export const generateCache = async (params: IGenerateCacheParams) => {
  const { sourceFolderPath, languages, exportFolderPath, sourceLanguage } =
    params;

  if (!languages || !Array.isArray(languages) || languages.length === 0) return;

  // 读取源文件夹下的所有文件
  const sourceFileData = readAllFilesOfFolder(
    path.resolve(sourceFolderPath, sourceLanguage)
  );
  // 源文件数据map
  const sourceFileMap: Record<string, ICacheFile> = {};

  sourceFileData.forEach((item) => {
    sourceFileMap[item.fileName] = item;
  });

  languages.forEach((language) => {
    // 获取当前语言的文件数据
    const currentFileData = readAllFilesOfFolder(
      path.join(sourceFolderPath, language)
    );

    currentFileData.forEach(({ data, fileName }) => {
      const translated: Record<string, string> = {};
      // 遍历文件中的已经翻译的内容
      Object.entries(data).forEach(([key, value]) => {
        if (value) {
          translated[key] = sourceFileMap[fileName].data[key];
        }
      });

      notExistsToCreateFile(path.resolve(exportFolderPath, language));
      fs.writeFileSync(
        path.resolve(exportFolderPath, language, fileName),
        JSON.stringify(translated, null, 2),
        "utf-8"
      );
    });
  });
};
/**
 * 读取文件夹下的所有文件 并返回string类型的内容
 * @param sourceFolderPath
 * @returns
 */
const readAllFilesOfFolder = (sourceFolderPath: string) => {
  try {
    if (!fs.existsSync(sourceFolderPath)) return [];
    const sourceFiles = fs.readdirSync(sourceFolderPath);
    return sourceFiles.map((fileName) => {
      return readFile(sourceFolderPath, fileName);
    });
  } catch (error) {
    console.error("read folder error:", error);
    return [];
  }
};

const readFile = (sourceFolderPath: string, fileName: string): ICacheFile => {
  const filePath = path.resolve(sourceFolderPath, fileName);

  try {
    const jsonData = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(jsonData) as Record<string, string>;
    return {
      fileName,
      filePath,
      data,
    };
  } catch (error) {
    console.error("read file error:", error);

    return {
      fileName,
      filePath,
      data: {},
    };
  }
};
/**
 * 批量删除指定语言的缓存信息
 * @param params
 */
export const deleteBatchCache = (params: IDeleteSingleCacheParams) => {
  const { keys, cacheFolderPath, languages, cacheFileName } = params;
  let deleteLanguages: string[] = [];
  const localLanguages = fs.readdirSync(cacheFolderPath);

  if (!languages || !Array.isArray(languages) || languages.length === 0) {
    deleteLanguages = localLanguages;
  } else {
    deleteLanguages = intersection(localLanguages, languages);
  }

  if (deleteLanguages.length === 0) return;

  deleteLanguages.forEach((language) => {
    const jsonData = fs.readFileSync(
      path.resolve(cacheFolderPath, language, cacheFileName),
      "utf-8"
    );
    const data = JSON.parse(jsonData);

    keys.forEach((key) => {
      delete data[key];
    });

    fs.writeFileSync(
      path.resolve(cacheFolderPath, language, cacheFileName),
      JSON.stringify(data, null, 2),
      "utf-8"
    );
  });
};
