import { ICreateJsonFileParams } from "../types";
/**
 * 不存在的文件夹则创建
 * @param {string} path
 */
export declare const notExistsToCreateFile: (path: string) => void;
/**
 * 获取json文件 并返回 [[key,value],[key,value]...]]
 * @param {*} path
 * @returns
 */
export declare const readJsonFileSync: (path: string) => Promise<any>;
/**
 * 创建json文件
 * @param {string} fileName 文件名
 * @param {string} folderName  文件夹名
 * @param {string} language 语言环境
 * @param {object} jsonData 文件数据
 */
export declare const createJsonFile: (params: ICreateJsonFileParams) => void;
export declare const getRandomNumber: (min: number, max: number) => number;
export declare const isDirectoryPath: (path: string) => boolean;
export declare const readFileOfDirSync: (dirPath: string) => string[];
export declare function chunkArray<T extends object>(array: T[], chunkSize: number): T[][];
export declare function intersection<T>(arr1: T[], arr2: T[]): T[];
//# sourceMappingURL=utils.d.ts.map