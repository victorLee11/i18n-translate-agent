import path from "path";
import fs from "fs";
import colors from "ansi-colors";
import { OpenAI } from "openai";
import cliProgress from "cli-progress";
import {
  ICwalletTranslateParams,
  IJson,
  IOpenaiConfig,
  IOutputLanguageFile,
  ISingleTranslate,
  ITranslateChat,
  ITranslateChatResponse,
  SupportLanguageType,
} from "./types";
import {
  chunkArray,
  getRandomNumber,
  notExistsToCreateFile,
  readFileOfDirSync,
  readJsonFileSync,
} from "./lib/utils.js";
import {
  getCacheFileSync,
  registerLanguageCacheFile,
  translateJSONDiffToJson,
} from "./lib/cache/index.js";
import { logErrorToFile } from "./lib/log/index.js";
import { SUPPORT_LANGUAGE_MAP } from "./lib/support.js";

export { testCompletions } from "./test/index.js";
export { generateCache, deleteBatchCache } from "./lib/cache/index.js";

const DEFAULT_OPENAI_CONFIG: IOpenaiConfig = {
  model: "gpt-4o",
};

export class CwalletTranslate {
  /** open ai api key  */
  private OPENAI_KEY: string;
  /** */
  CACHE_ROOT_PATH: string;
  ENTRY_ROOT_PATH: string;
  /** default en */
  SOURCE_LANGUAGE: SupportLanguageType;
  OUTPUT_ROOT_PATH: string | undefined;
  languages: SupportLanguageType[];
  client: OpenAI | null = null;
  /** default model gpt-4o */
  openaiConfig: IOpenaiConfig;
  fineTune: string[];

  constructor(params: ICwalletTranslateParams) {
    this.OPENAI_KEY = params.key;
    this.CACHE_ROOT_PATH = params.cacheFileRootPath;
    this.ENTRY_ROOT_PATH = params.fileRootPath;
    this.openaiConfig = params.openaiConfig ?? DEFAULT_OPENAI_CONFIG;
    this.SOURCE_LANGUAGE = params.sourceLanguage ?? "en";
    this.OUTPUT_ROOT_PATH = params.outputRootPath;
    this.fineTune = params.fineTune;
    this.languages = params.languages ?? [];
    this.createOpenAIClient();
  }

  get supportLanguages() {
    return Object.entries(SUPPORT_LANGUAGE_MAP)
      .map(([key, val]) => val)
      .filter(
        ({ code }) =>
          this.languages.includes(code) || code === this.SOURCE_LANGUAGE
      );
  }

  get outputPath() {
    return this.OUTPUT_ROOT_PATH ?? this.ENTRY_ROOT_PATH;
  }

  searchLanguage(code: SupportLanguageType) {
    return this.supportLanguages.find((item) => item.code === code);
  }

  createOpenAIClient = () => {
    /** 初始化openAi */
    const client = new OpenAI({
      apiKey: this.OPENAI_KEY,
    });

    this.client = client;
  };
  /**
   * 翻译入口文件的所有支持的语言文件夹和其中的文件
   */
  translate = async () => {
    console.log("🚀 开始翻译");
    console.log(`🚀 使用的模型: ${this.openaiConfig.model} 🚀`);
    console.log(`🚀 微调: ${this.fineTune} 🚀`);

    const translateFolderPath = path.join(
      this.ENTRY_ROOT_PATH,
      this.SOURCE_LANGUAGE
    );
    // 翻译源语言问价夹下的所有json文件
    const translateFolders = await readFileOfDirSync(translateFolderPath);
    console.log("🚀 ~ 需要翻译语言的文件:", translateFolders);
    // 创建进度条
    const multiBar = new cliProgress.MultiBar(
      {
        clearOnComplete: false,
        hideCursor: true,
        format:
          colors.cyan("{bar}") +
          "| {percentage}% || {filename} {value}/{total} ",
      },
      cliProgress.Presets.legacy
    );

    let promises = [];
    const arr: (() => Promise<void>)[] = [];

    for (const item of this.supportLanguages) {
      // 源语言不翻译
      if (item.code === this.SOURCE_LANGUAGE) continue;
      for (const fileName of translateFolders) {
        const translateJson = await this.getTranslateContent(
          item.code,
          fileName
        );
        if (!translateJson) {
          console.log(`${item.code}:${fileName} 没有需要翻译的内容`);
          continue;
        }
        arr.push(() =>
          this.singleTranslate({
            language: item.code,
            fileName,
            multiBar,
            translateJson,
          })
        );
      }
    }

    promises = chunkArray(arr, 8);

    for (const chunk of promises) {
      await Promise.all(chunk.map((fn) => fn()));
    }

    multiBar.stop();
    console.log("🚀 翻译完毕");
  };
  /**
   * 翻译单个文件
   * @param params
   * @returns
   */
  singleTranslate = async (params: ISingleTranslate) => {
    const {
      /** 待翻译的语言 */
      language,
      /** 待翻译的文件名 */
      fileName,
      translateJson,
      multiBar,
      callback,
    } = params;

    try {
      // 等待翻译的数组
      const jsonMap: IJson = {};

      // 生成chat循环代码
      const promiseList = Object.entries(translateJson).map(
        ([key, value], index) =>
          () =>
            this.translateChat({
              key,
              value,
              language,
              index,
              fileName,
            })
      );

      const progressBar = multiBar.create(promiseList.length, 0);

      for (const fn of promiseList) {
        const result = await fn();
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
    } catch (error) {
      logErrorToFile({
        error: error as Error,
        language,
        fileName,
        key: "",
      });
      return;
    }
  };

  /**
   * 使用open ai 进行翻译
   * @param {string} key
   * @param {string} value
   * @param {OpenAI} client
   * @param {string} language
   * @returns
   */
  translateChat = (params: ITranslateChat): Promise<ITranslateChatResponse> => {
    return new Promise((resolve) => {
      const { key, value, language, index, fileName } = params;
      try {
        if (!this.client) throw new Error("Connection failed");
        const targetLanguage = this.searchLanguage(language);
        const originLanguage = this.searchLanguage(this.SOURCE_LANGUAGE);

        if (!targetLanguage) {
          throw new Error(`不支持的语言：${language}`);
        }

        if (!originLanguage) {
          throw new Error(`不支持的语言：${this.SOURCE_LANGUAGE}`);
        }

        setTimeout(async () => {
          const chatCompletion = await this.client!.chat.completions.create({
            model: this.openaiConfig?.model,
            messages: [
              ...this.fineTune.map(
                (val) =>
                  ({
                    role: "system",
                    content: val,
                  } as OpenAI.Chat.Completions.ChatCompletionMessageParam)
              ),
              {
                role: "system",
                content: `请将${originLanguage!.name}翻译成${
                  targetLanguage!.name
                }`,
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
            value: chatCompletion?.choices[0]?.message.content ?? value,
            index,
          });
        }, getRandomNumber(200, 300));
      } catch (error) {
        logErrorToFile({ error: error as Error, key, fileName, language });
        resolve({
          key,
          value,
          index,
          error: error as Error,
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
  getTranslateContent = async (
    language: SupportLanguageType,
    fileName: string
  ): Promise<IJson | undefined> => {
    const translateFilePath = path.join(
      this.ENTRY_ROOT_PATH,
      this.SOURCE_LANGUAGE,
      fileName
    );
    /** 缓存文件路径 */
    const cacheFilePath = path.join(this.CACHE_ROOT_PATH, language, fileName);
    if (!fs.existsSync(translateFilePath)) {
      console.dir(`File not found: ${translateFilePath}`);
      return;
    }
    const translateFileObject = await readJsonFileSync(translateFilePath);
    const cacheObject = await getCacheFileSync(cacheFilePath);
    const diffObject = translateJSONDiffToJson(
      cacheObject,
      translateFileObject
    );
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
  };

  /**
   * 输出语言文件
   * @param {Object} jsonMap
   */
  outputLanguageFile = async (params: IOutputLanguageFile) => {
    const { folderName, fileName, jsonMap } = params;
    const outputFilePath = path.join(this.outputPath, folderName, fileName);
    //创建输出文件夹
    notExistsToCreateFile(this.outputPath);
    //创建输出的语言文件夹
    notExistsToCreateFile(`${this.outputPath}/${folderName}`);
    let oldJsonData: string = "";
    // 检查是否存在文件
    if (!fs.existsSync(outputFilePath)) {
      oldJsonData = await fs.readFileSync(
        path.join(this.ENTRY_ROOT_PATH, this.SOURCE_LANGUAGE, fileName),
        "utf8"
      );
    } else {
      oldJsonData = await fs.readFileSync(outputFilePath, "utf8");
    }
    const oldJsonMap: IJson = JSON.parse(oldJsonData);
    const newJsonMap: IJson = Object.assign(oldJsonMap, jsonMap);

    await fs.writeFileSync(
      path.resolve(outputFilePath),
      JSON.stringify(newJsonMap, null, 2),
      "utf8"
    );

    // 注册缓存
    registerLanguageCacheFile({
      sourceFilePath: path.join(
        this.ENTRY_ROOT_PATH,
        this.SOURCE_LANGUAGE,
        fileName
      ),
      jsonMap: newJsonMap,
      fileName,
      language: folderName,
      folderName: this.CACHE_ROOT_PATH,
    });
  };
}
