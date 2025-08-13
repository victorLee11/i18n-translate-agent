import path from "path";
import fs from "fs";
import colors from "ansi-colors";
import { OpenAI, ClientOptions } from "openai";
import cliProgress from "cli-progress";
import {
  ICwalletTranslateParams,
  IJson,
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
import { ChatCompletionCreateParams } from "openai/resources";

export { generateCache, deleteBatchCache } from "./lib/cache/index.js";

const DEFAULT_OPENAI_CONFIG: ClientOptions = {};

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
  openaiClientConfig: ClientOptions;
  fineTune: string[];
  chatCompletionCreateParams: ChatCompletionCreateParams;

  constructor(params: ICwalletTranslateParams) {
    this.OPENAI_KEY = params.key;
    this.CACHE_ROOT_PATH = params.cacheFileRootPath;
    this.ENTRY_ROOT_PATH = params.fileRootPath;
    this.openaiClientConfig =
      params.openaiClientConfig ?? DEFAULT_OPENAI_CONFIG;
    this.chatCompletionCreateParams =
      params.chatCompletionCreateParams ??
      ({
        model: "gpt-4o",
      } as ChatCompletionCreateParams);
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
    /** Initialize OpenAI */
    const client = new OpenAI(this.openaiClientConfig);

    this.client = client;
  };
  /**
   * Translate all supported language folders and files in the entry file
   */
  translate = async () => {
    console.log("🚀 Starting translation");
    console.log(
      `🚀 Model being used: ${this.chatCompletionCreateParams.model} 🚀`
    );
    console.log(`🚀 Fine-tuning: ${this.fineTune} 🚀`);

    const translateFolderPath = path.join(
      this.ENTRY_ROOT_PATH,
      this.SOURCE_LANGUAGE
    );
    // Translate all json files under the source language folder
    const translateFolders = await readFileOfDirSync(translateFolderPath);
    console.log("🚀 ~ Files to be translated:", translateFolders);
    // Create progress bar
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
      // Source language does not need translation
      if (item.code === this.SOURCE_LANGUAGE) continue;
      for (const fileName of translateFolders) {
        const translateJson = await this.getTranslateContent(
          item.code,
          fileName
        );
        if (!translateJson) {
          console.log(`${item.code}:${fileName} has no content to translate`);
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
    console.log("🚀 Translation completed");
  };
  /**
   * Translate a single file
   * @param params
   * @returns
   */
  singleTranslate = async (params: ISingleTranslate) => {
    const {
      /** Language to be translated */
      language,
      /** File name to be translated */
      fileName,
      translateJson,
      multiBar,
      callback,
    } = params;

    try {
      // Array waiting for translation
      const jsonMap: IJson = {};

      // Generate chat loop code
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
   * Use OpenAI for translation
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
          throw new Error(`Unsupported language: ${language}`);
        }

        if (!originLanguage) {
          throw new Error(`Unsupported language: ${this.SOURCE_LANGUAGE}`);
        }

        setTimeout(async () => {
          const chatCompletion = await this.client!.chat.completions.create({
            ...this.chatCompletionCreateParams,
            stream: false,
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
                content: `Please translate ${originLanguage!.name} to ${
                  targetLanguage!.name
                }`,
              },
              {
                role: "system",
                content: `After translation is complete, directly output the corresponding meaning without any irrelevant content`,
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
   * Compare cache files to get content that needs translation
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
    /** Cache file path */
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
   * Output language file
   * @param {Object} jsonMap
   */
  outputLanguageFile = async (params: IOutputLanguageFile) => {
    const { folderName, fileName, jsonMap } = params;
    const outputFilePath = path.join(this.outputPath, folderName, fileName);
    // Create output folder
    notExistsToCreateFile(this.outputPath);
    // Create output language folder
    notExistsToCreateFile(`${this.outputPath}/${folderName}`);
    let oldJsonData: string = "";
    // Check if file exists
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

    // Register cache
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
