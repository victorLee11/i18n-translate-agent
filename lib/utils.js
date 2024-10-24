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
/**
 * 不存在的文件夹则创建
 * @param {string} path
 */
export const notExistsToCreateFile = (path) => {
    if (fs.existsSync(path))
        return;
    fs.mkdirSync(path);
};
/**
 * 获取json文件 并返回 [[key,value],[key,value]...]]
 * @param {*} path
 * @returns
 */
export const readJsonFileSync = (path) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!fs.existsSync(path))
            return {};
        const jsonStr = yield fs.readFileSync(path, "utf8");
        // 将JSON字符串解析为对象
        return JSON.parse(jsonStr);
    }
    catch (error) {
        console.error("解析JSON时出错:", error);
        return {};
    }
});
/**
 * 创建json文件
 * @param {string} fileName 文件名
 * @param {string} folderName  文件夹名
 * @param {string} language 语言环境
 * @param {object} jsonData 文件数据
 */
export const createJsonFile = (params) => {
    const { fileName, folderName, jsonData, language } = params;
    notExistsToCreateFile(folderName);
    notExistsToCreateFile(path.resolve(`${folderName}/${language}`));
    fs.writeFileSync(path.resolve(`${folderName}/${language}/${fileName}`), JSON.stringify(jsonData, null, 2), "utf8");
};
export const getRandomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
export const isDirectoryPath = (path) => {
    if (!fs.existsSync(path))
        return false;
    return fs.statSync(path).isDirectory();
};
export const readFileOfDirSync = (dirPath) => {
    if (!isDirectoryPath(dirPath))
        return [];
    const files = fs.readdirSync(dirPath);
    // 筛选出所有文件夹
    return files.filter((file) => path.extname(file) === ".json");
};
export function chunkArray(array, chunkSize) {
    const result = [];
    let index = 0;
    while (index < array.length) {
        result.push(array.slice(index, index + chunkSize));
        index += chunkSize;
    }
    return result;
}
