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
export { generateCache, deleteBatchCache } from "./lib/cache/index.js";
const DEFAULT_OPENAI_CONFIG = {};
export class CwalletTranslate {
    constructor(params) {
        var _a, _b, _c, _d;
        this.client = null;
        this.createOpenAIClient = () => {
            /** Initialize OpenAI */
            const client = new OpenAI(this.openaiClientConfig);
            this.client = client;
        };
        /**
         * Translate all supported language folders and files in the entry file
         */
        this.translate = () => __awaiter(this, void 0, void 0, function* () {
            console.log("🚀 Starting translation");
            console.log(`🚀 Model being used: ${this.chatCompletionCreateParams.model} 🚀`);
            console.log(`🚀 Fine-tuning: ${this.fineTune} 🚀`);
            const translateFolderPath = path.join(this.ENTRY_ROOT_PATH, this.SOURCE_LANGUAGE);
            // Translate all json files under the source language folder
            const translateFolders = yield readFileOfDirSync(translateFolderPath);
            console.log("🚀 ~ Files to be translated:", translateFolders);
            // Create progress bar
            const multiBar = new cliProgress.MultiBar({
                clearOnComplete: false,
                hideCursor: true,
                format: colors.cyan("{bar}") +
                    "| {percentage}% || {filename} {value}/{total} ",
            }, cliProgress.Presets.legacy);
            let promises = [];
            const arr = [];
            for (const item of this.supportLanguages) {
                // Source language does not need translation
                if (item.code === this.SOURCE_LANGUAGE)
                    continue;
                for (const fileName of translateFolders) {
                    const translateJson = yield this.getTranslateContent(item.code, fileName);
                    if (!translateJson) {
                        console.log(`${item.code}:${fileName} has no content to translate`);
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
            console.log("🚀 Translation completed");
        });
        /**
         * Translate a single file
         * @param params
         * @returns
         */
        this.singleTranslate = (params) => __awaiter(this, void 0, void 0, function* () {
            const { 
            /** Language to be translated */
            language, 
            /** File name to be translated */
            fileName, translateJson, multiBar, callback, } = params;
            try {
                // Array waiting for translation
                const jsonMap = {};
                // Generate chat loop code
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
         * Use OpenAI for translation
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
                        throw new Error(`Unsupported language: ${language}`);
                    }
                    if (!originLanguage) {
                        throw new Error(`Unsupported language: ${this.SOURCE_LANGUAGE}`);
                    }
                    setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                        var _a, _b;
                        const chatCompletion = yield this.client.chat.completions.create(Object.assign(Object.assign({ model: "gpt-4o" }, this.chatCompletionCreateParams), { stream: false, messages: [
                                ...this.fineTune.map((val) => ({
                                    role: "system",
                                    content: val,
                                })),
                                {
                                    role: "system",
                                    content: `Please translate ${originLanguage.name} to ${targetLanguage.name}`,
                                },
                                {
                                    role: "system",
                                    content: `After translation is complete, directly output the corresponding meaning without any irrelevant content`,
                                },
                                {
                                    role: "user",
                                    content: value,
                                },
                            ] }));
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
         * Compare cache files to get content that needs translation
         * @param language
         * @param fileName
         * @returns
         */
        this.getTranslateContent = (language, fileName) => __awaiter(this, void 0, void 0, function* () {
            const translateFilePath = path.join(this.ENTRY_ROOT_PATH, this.SOURCE_LANGUAGE, fileName);
            /** Cache file path */
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
                    });
                }
                return;
            }
            return diffObject;
        });
        /**
         * Output language file
         * @param {Object} jsonMap
         */
        this.outputLanguageFile = (params) => __awaiter(this, void 0, void 0, function* () {
            const { folderName, fileName, jsonMap } = params;
            const outputFilePath = path.join(this.outputPath, folderName, fileName);
            // Create output folder
            notExistsToCreateFile(this.outputPath);
            // Create output language folder
            notExistsToCreateFile(`${this.outputPath}/${folderName}`);
            let oldJsonData = "";
            // Check if file exists
            if (!fs.existsSync(outputFilePath)) {
                oldJsonData = yield fs.readFileSync(path.join(this.ENTRY_ROOT_PATH, this.SOURCE_LANGUAGE, fileName), "utf8");
            }
            else {
                oldJsonData = yield fs.readFileSync(outputFilePath, "utf8");
            }
            const oldJsonMap = JSON.parse(oldJsonData);
            const newJsonMap = Object.assign(oldJsonMap, jsonMap);
            yield fs.writeFileSync(path.resolve(outputFilePath), JSON.stringify(newJsonMap, null, 2), "utf8");
            // Register cache
            registerLanguageCacheFile({
                sourceFilePath: path.join(this.ENTRY_ROOT_PATH, this.SOURCE_LANGUAGE, fileName),
                jsonMap: newJsonMap,
                fileName,
                language: folderName,
                folderName: this.CACHE_ROOT_PATH,
            });
        });
        this.OPENAI_KEY = params.key;
        this.CACHE_ROOT_PATH = params.cacheFileRootPath;
        this.ENTRY_ROOT_PATH = params.fileRootPath;
        this.openaiClientConfig =
            (_a = params.openaiClientConfig) !== null && _a !== void 0 ? _a : DEFAULT_OPENAI_CONFIG;
        this.chatCompletionCreateParams =
            (_b = params.chatCompletionCreateParams) !== null && _b !== void 0 ? _b : {
                model: "gpt-4o",
            };
        this.SOURCE_LANGUAGE = (_c = params.sourceLanguage) !== null && _c !== void 0 ? _c : "en";
        this.OUTPUT_ROOT_PATH = params.outputRootPath;
        this.fineTune = params.fineTune;
        this.languages = (_d = params.languages) !== null && _d !== void 0 ? _d : [];
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
