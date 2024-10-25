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
import colors from "ansi-colors";
import { OpenAI } from "openai";
import cliProgress from "cli-progress";
import { chunkArray, getRandomNumber, notExistsToCreateFile, readFileOfDirSync, readJsonFileSync, } from "./lib/utils.js";
import { getCacheFileSync, registerLanguageCacheFile, translateJSONDiffToJson, } from "./lib/cache/index.js";
import { logErrorToFile } from "./lib/log/index.js";
import { SUPPORT_LANGUAGE_MAP } from "./lib/support.js";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_OPENAI_CONFIG = {
    model: "gpt-4o",
};
export class CwalletTranslate {
    constructor(params) {
        var _a, _b, _c;
        this.client = null;
        this.createOpenAIClient = () => {
            /** 初始化openAi */
            const client = new OpenAI({
                apiKey: this.OPENAI_KEY,
            });
            this.client = client;
        };
        /** 翻译入口文件的所有支持的语言文件夹和其中的文件 */
        this.translate = () => __awaiter(this, void 0, void 0, function* () {
            console.log("🚀 ------------------------- translate starts ------------------------- 🚀");
            const translateFolderPath = path.join(this.ENTRY_ROOT_PATH, this.SOURCE_LANGUAGE);
            // 翻译源语言问价夹下的所有json文件
            const translateFolders = yield readFileOfDirSync(translateFolderPath);
            // 创建进度条
            const multiBar = new cliProgress.MultiBar({
                clearOnComplete: false,
                hideCursor: true,
                format: colors.cyan("{bar}") +
                    "| {percentage}% || {filename} {value}/{total} ",
            }, cliProgress.Presets.legacy);
            let promises = [];
            const arr = [];
            for (const item of this.supportLanguages) {
                // 源语言不翻译
                if (item.code === this.SOURCE_LANGUAGE)
                    continue;
                for (const fileName of translateFolders) {
                    const translateJson = yield this.getTranslateContent(item.code, fileName);
                    if (!translateJson) {
                        console.log(`${item.code}:${fileName} 没有需要翻译的内容`);
                        continue;
                    }
                    arr.push(() => this.singleTranslate({
                        language: item.code,
                        fileName,
                        multiBar,
                        translateJson,
                    }));
                }
            }
            promises = chunkArray(arr, 8);
            for (const chunk of promises) {
                yield Promise.all(chunk.map((fn) => fn()));
            }
            multiBar.stop();
            console.log("🚀 ------------------------- translate end ------------------------- 🚀");
        });
        /**
         * 翻译单个文件
         * @param params
         * @returns
         */
        this.singleTranslate = (params) => __awaiter(this, void 0, void 0, function* () {
            const { 
            /** 待翻译的语言 */
            language, 
            /** 待翻译的文件名 */
            fileName, translateJson, multiBar, callback, } = params;
            try {
                /** 待翻译的文件路径 */
                const translateFilePath = path.join(this.ENTRY_ROOT_PATH, language, fileName);
                // 等待翻译的数组
                const jsonMap = {};
                // 生成chat循环代码
                const promiseList = Object.entries(translateJson).map(([key, value], index) => () => this.translateChat({
                    key,
                    value,
                    language,
                    index,
                    fileName,
                }));
                const progressBar = multiBar.create(promiseList.length, 0);
                for (const fn of promiseList) {
                    const result = yield fn();
                    jsonMap[result.key] = result.value;
                    progressBar.update(result.index + 1, {
                        filename: `${language}:${fileName}`,
                    });
                }
                this.outputLanguageFile({
                    jsonMap,
                    folderName: language,
                    fileName,
                    translateFilePath,
                });
                callback && callback();
            }
            catch (error) {
                logErrorToFile({
                    error: error,
                    language,
                    fileName,
                    key: "",
                });
                return;
            }
        });
        /**
         * 使用open ai 进行翻译
         * @param {string} key
         * @param {string} value
         * @param {OpenAI} client
         * @param {string} language
         * @returns
         */
        this.translateChat = (params) => {
            return new Promise((resolve) => {
                const { key, value, language, index, fileName } = params;
                try {
                    if (!this.client)
                        throw new Error("Connection failed");
                    const targetLanguage = this.searchLanguage(language);
                    const originLanguage = this.searchLanguage(this.SOURCE_LANGUAGE);
                    if (!targetLanguage) {
                        throw new Error(`不支持的语言：${language}`);
                    }
                    if (!originLanguage) {
                        throw new Error(`不支持的语言：${this.SOURCE_LANGUAGE}`);
                    }
                    setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                        var _a, _b, _c;
                        const chatCompletion = yield this.client.chat.completions.create({
                            model: (_a = this.openaiConfig) === null || _a === void 0 ? void 0 : _a.model,
                            messages: [
                                ...this.fineTune.map((val) => ({
                                    role: "system",
                                    content: val,
                                })),
                                {
                                    role: "system",
                                    content: `请将${originLanguage.name}翻译成${targetLanguage.name}`,
                                },
                                {
                                    role: "system",
                                    content: `翻译完成直接输出后对应意思的内容不要携带任何无关内容`,
                                },
                                {
                                    role: "user",
                                    content: value,
                                },
                            ],
                        });
                        resolve({
                            key,
                            value: (_c = (_b = chatCompletion === null || chatCompletion === void 0 ? void 0 : chatCompletion.choices[0]) === null || _b === void 0 ? void 0 : _b.message.content) !== null && _c !== void 0 ? _c : value,
                            index,
                        });
                    }), getRandomNumber(200, 300));
                }
                catch (error) {
                    logErrorToFile({ error: error, key, fileName, language });
                    resolve({
                        key,
                        value,
                        index,
                        error: error,
                    });
                }
            });
        };
        /**
         * 对比缓存文件 获取需要翻译的内容
         * @param language
         * @param fileName
         * @returns
         */
        this.getTranslateContent = (language, fileName) => __awaiter(this, void 0, void 0, function* () {
            const translateFilePath = path.join(this.ENTRY_ROOT_PATH, this.SOURCE_LANGUAGE, fileName);
            /** 缓存文件路径 */
            const cacheFilePath = path.join(this.CACHE_ROOT_PATH, language, fileName);
            if (!fs.existsSync(translateFilePath)) {
                console.dir(`File not found: ${translateFilePath}`);
                return;
            }
            const translateFileObject = yield readJsonFileSync(translateFilePath);
            const cacheObject = yield getCacheFileSync(cacheFilePath);
            const diffObject = translateJSONDiffToJson(cacheObject, translateFileObject);
            if (Object.values(diffObject).length === 0) {
                if (Object.keys(translateFileObject).length === 0) {
                    this.outputLanguageFile({
                        jsonMap: {},
                        folderName: language,
                        fileName,
                        translateFilePath,
                    });
                }
                return;
            }
            return diffObject;
        });
        /**
         * 输出语言文件
         * @param {Object} jsonMap
         */
        this.outputLanguageFile = (params) => __awaiter(this, void 0, void 0, function* () {
            const { folderName, fileName, jsonMap, translateFilePath } = params;
            const outputFilePath = path.join(this.outputPath, folderName, fileName);
            //创建输出文件夹
            notExistsToCreateFile(this.outputPath);
            //创建输出的语言文件夹
            notExistsToCreateFile(`${this.outputPath}/${folderName}`);
            let oldJsonData = "";
            // 检查是否存在文件
            if (!fs.existsSync(outputFilePath)) {
                oldJsonData = yield fs.readFileSync(path.join(this.ENTRY_ROOT_PATH, this.SOURCE_LANGUAGE, fileName), "utf8");
            }
            else {
                oldJsonData = yield fs.readFileSync(outputFilePath, "utf8");
            }
            const oldJsonMap = JSON.parse(oldJsonData);
            const newJsonMap = Object.assign(oldJsonMap, jsonMap);
            yield fs.writeFileSync(path.resolve(outputFilePath), JSON.stringify(newJsonMap, null, 2), "utf8");
            // 注册缓存
            registerLanguageCacheFile({
                sourceFilePath: path.join(this.ENTRY_ROOT_PATH, this.SOURCE_LANGUAGE, fileName),
                jsonMap: newJsonMap,
                fileName,
                language: folderName,
                folderName: this.CACHE_ROOT_PATH,
            });
        });
        this.OPENAI_KEY = params.key;
        this.CACHE_ROOT_PATH = path.resolve(__dirname, params.cacheFileRootPath);
        this.ENTRY_ROOT_PATH = path.resolve(__dirname, params.fileRootPath);
        this.openaiConfig = (_a = params.openaiConfig) !== null && _a !== void 0 ? _a : DEFAULT_OPENAI_CONFIG;
        this.SOURCE_LANGUAGE = (_b = params.sourceLanguage) !== null && _b !== void 0 ? _b : "en";
        this.OUTPUT_ROOT_PATH = params.outputRootPath
            ? path.resolve(__dirname, params.outputRootPath)
            : undefined;
        this.fineTune = params.fineTune;
        this.languages = (_c = params.languages) !== null && _c !== void 0 ? _c : [];
        this.createOpenAIClient();
    }
    get supportLanguages() {
        return Object.entries(SUPPORT_LANGUAGE_MAP)
            .map(([key, val]) => val)
            .filter(({ code }) => this.languages.includes(code) || code === this.SOURCE_LANGUAGE);
    }
    get outputPath() {
        var _a;
        return (_a = this.OUTPUT_ROOT_PATH) !== null && _a !== void 0 ? _a : this.ENTRY_ROOT_PATH;
    }
    searchLanguage(code) {
        return this.supportLanguages.find((item) => item.code === code);
    }
}
