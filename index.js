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
// Get the current file's path (__filename equivalent)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**源语言文件 */
const SOURCE_LANGUAGE_FOLDER = "en";
/** 入口路径 */
const ENTRY_PATH = path.resolve(__dirname, "../src/langs");
/** 缓存路径 */
const CACHE_PATH = path.resolve(__dirname, "../src/cache");
/** 出口路径 */
const OUTPUT_PATH = path.resolve(__dirname, "../src/output");
/**
 *
 * @param {string} language
 * @param {string} fileName
 * @param {MultiBar} multiBar
 * @returns
 */
const translate = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { 
    /** 待翻译的语言 */
    language, 
    /** 待翻译的文件名 */
    fileName, translateJson, multiBar, callback, } = params;
    try {
        /** 待翻译的文件路径 */
        const translateFilePath = path.join(ENTRY_PATH, SOURCE_LANGUAGE_FOLDER, fileName);
        /** 初始化openAi */
        const client = new OpenAI({
            apiKey: "",
        });
        // 等待翻译的数组
        const jsonMap = {};
        // 生成chat循环代码
        const promiseList = Object.entries(translateJson).map(([key, value], index) => () => translateChat({
            key,
            value,
            client,
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
        outputLanguageFile({
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
const translateChat = (params) => {
    return new Promise((resolve) => {
        const { key, value, client, language, index, fileName } = params;
        try {
            if (!client)
                new Error("Connection failed");
            const targetLanguage = SUPPORT_LANGUAGE_MAP[language];
            const originLanguage = SUPPORT_LANGUAGE_MAP[SOURCE_LANGUAGE_FOLDER];
            setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
                var _a, _b;
                const chatCompletion = yield client.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "system",
                            content: `我们是一个区块链行业钱包，请使用区块链专业领域的术语通俗的将${originLanguage.name}翻译成${targetLanguage.name},翻译完成直接输出后对应意思的内容不要携带任何无关内容`,
                        },
                        {
                            role: "user",
                            content: value,
                        },
                    ],
                });
                resolve({
                    key,
                    value: (_b = (_a = chatCompletion === null || chatCompletion === void 0 ? void 0 : chatCompletion.choices[0]) === null || _a === void 0 ? void 0 : _a.message.content) !== null && _b !== void 0 ? _b : value,
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
 * 输出语言文件
 * @param {Object} jsonMap
 */
const outputLanguageFile = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { folderName, fileName, jsonMap, translateFilePath } = params;
    if (Object.values(jsonMap).length === 0) {
        yield fs.writeFileSync(path.resolve(`${OUTPUT_PATH}/${folderName}/${fileName}`), JSON.stringify({}, null, 2), "utf8");
        return;
    }
    //创建输出文件夹
    notExistsToCreateFile(OUTPUT_PATH);
    //创建输出的语言文件夹
    notExistsToCreateFile(`${OUTPUT_PATH}/${folderName}`);
    // 不存在翻译文件 则直接写入
    if (!fs.existsSync(`${OUTPUT_PATH}/${folderName}/${fileName}`)) {
        yield fs.writeFileSync(path.resolve(`${OUTPUT_PATH}/${folderName}/${fileName}`), JSON.stringify(jsonMap, null, 2), "utf8");
        // 注册缓存
    }
    const oldJsonData = yield fs.readFileSync(`${OUTPUT_PATH}/${folderName}/${fileName}`, "utf8");
    const oldJsonMap = JSON.parse(oldJsonData);
    const newJsonMap = Object.assign(oldJsonMap, jsonMap);
    yield fs.writeFileSync(path.resolve(`${OUTPUT_PATH}/${folderName}/${fileName}`), JSON.stringify(newJsonMap, null, 2), "utf8");
    // 注册缓存
    registerLanguageCacheFile({
        sourceFilePath: translateFilePath,
        jsonMap: newJsonMap,
        fileName,
        language: folderName,
        folderName: CACHE_PATH,
    });
});
const getTranslateContent = (language, fileName) => __awaiter(void 0, void 0, void 0, function* () {
    const translateFilePath = path.join(ENTRY_PATH, SOURCE_LANGUAGE_FOLDER, fileName);
    /** 缓存文件路径 */
    const cacheFilePath = path.join(CACHE_PATH, language, fileName);
    if (!fs.existsSync(translateFilePath)) {
        console.dir(`File not found: ${translateFilePath}`);
        return;
    }
    const translateFileObject = yield readJsonFileSync(translateFilePath);
    const cacheObject = yield getCacheFileSync(cacheFilePath);
    const diffObject = translateJSONDiffToJson(cacheObject, translateFileObject);
    if (Object.values(diffObject).length === 0) {
        if (Object.keys(translateFileObject).length === 0) {
            outputLanguageFile({
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
const init = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("🚀 ------------------------- translate starts ------------------------- 🚀");
    const translateFolderPath = path.join(ENTRY_PATH, SOURCE_LANGUAGE_FOLDER);
    // 翻译源语言问价夹下的所有json文件
    const translateFolders = yield readFileOfDirSync(translateFolderPath);
    // 创建进度条
    const multiBar = new cliProgress.MultiBar({
        clearOnComplete: false,
        hideCursor: true,
        format: colors.cyan("{bar}") + "| {percentage}% || {filename} {value}/{total} ",
    }, cliProgress.Presets.legacy);
    let promises = [];
    const arr = [];
    for (const language of Object.keys(SUPPORT_LANGUAGE_MAP)) {
        // 源语言不翻译
        if (language === SOURCE_LANGUAGE_FOLDER)
            continue;
        for (const fileName of translateFolders) {
            const translateJson = yield getTranslateContent(language, fileName);
            if (!translateJson) {
                console.log(`${language}:${fileName} 没有需要翻译的内容`);
                continue;
            }
            arr.push(() => translate({
                language: language,
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
