import path from "path";
import fs from "fs";
import { ICreateJsonFileParams } from "../types";

/**
 * 不存在的文件夹则创建
 * @param {string} path
 */
export const notExistsToCreateFile = (path: string) => {
  if (fs.existsSync(path)) return;
  fs.mkdirSync(path);
};

/**
 * 获取json文件 并返回 [[key,value],[key,value]...]]
 * @param {*} path
 * @returns
 */
export const readJsonFileSync = async (path: string) => {
  try {
    if (!fs.existsSync(path)) return {};
    const jsonStr = await fs.readFileSync(path, "utf8");
    // 将JSON字符串解析为对象
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("解析JSON时出错:", error);
    return {};
  }
};

/**
 * 创建json文件
 * @param {string} fileName 文件名
 * @param {string} folderName  文件夹名
 * @param {string} language 语言环境
 * @param {object} jsonData 文件数据
 */
export const createJsonFile = (params: ICreateJsonFileParams) => {
  const { fileName, folderName, jsonData, language } = params;
  notExistsToCreateFile(folderName);
  notExistsToCreateFile(path.resolve(`${folderName}/${language}`));
  fs.writeFileSync(
    path.resolve(`${folderName}/${language}/${fileName}`),
    JSON.stringify(jsonData, null, 2),
    "utf8"
  );
};

export const getRandomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const isDirectoryPath = (path: string) => {
  if (!fs.existsSync(path)) return false;
  return fs.statSync(path).isDirectory();
};

export const readFileOfDirSync = (dirPath: string) => {
  if (!isDirectoryPath(dirPath)) return [];
  const files = fs.readdirSync(dirPath);
  // 筛选出所有文件夹
  return files.filter((file) => path.extname(file) === ".json");
};

export function chunkArray<T extends object>(array: T[], chunkSize: number) {
  const result = [];
  let index = 0;

  while (index < array.length) {
    result.push(array.slice(index, index + chunkSize));
    index += chunkSize;
  }
  return result;
}

export function intersection<T>(arr1: T[], arr2: T[]): T[] {
  const setA = new Set(arr1);
  const setB = new Set(arr2);
  // 创建一个新的 Set 来存储交集
  let intersectionSet = new Set<T>();

  // 遍历较小的集合，检查每个元素是否在另一个集合中
  for (let item of setA) {
    if (setB.has(item)) {
      intersectionSet.add(item);
    }
  }

  return [...intersectionSet];
}
