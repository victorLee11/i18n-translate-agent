import { OpenAI } from "openai";
import { ICwalletTranslateParams, IJson, IOpenaiConfig, IOutputLanguageFile, ISingleTranslate, ITranslateChat, ITranslateChatResponse, SupportLanguageType } from "./types";
export declare class CwalletTranslate {
    /** open ai api key  */
    private OPENAI_KEY;
    /** */
    CACHE_ROOT_PATH: string;
    ENTRY_ROOT_PATH: string;
    /** default en */
    SOURCE_LANGUAGE: SupportLanguageType;
    OUTPUT_ROOT_PATH: string | undefined;
    languages: SupportLanguageType[];
    client: OpenAI | null;
    /** default model gpt-4o */
    openaiConfig: IOpenaiConfig;
    fineTune: string[];
    constructor(params: ICwalletTranslateParams);
    get supportLanguages(): import("./types").ILanguage[];
    get outputPath(): string;
    searchLanguage(code: SupportLanguageType): import("./types").ILanguage | undefined;
    createOpenAIClient: () => void;
    /**
     * 翻译入口文件的所有支持的语言文件夹和其中的文件
     */
    translate: () => Promise<void>;
    /**
     * 翻译单个文件
     * @param params
     * @returns
     */
    singleTranslate: (params: ISingleTranslate) => Promise<void>;
    /**
     * 使用open ai 进行翻译
     * @param {string} key
     * @param {string} value
     * @param {OpenAI} client
     * @param {string} language
     * @returns
     */
    translateChat: (params: ITranslateChat) => Promise<ITranslateChatResponse>;
    /**
     * 对比缓存文件 获取需要翻译的内容
     * @param language
     * @param fileName
     * @returns
     */
    getTranslateContent: (language: SupportLanguageType, fileName: string) => Promise<IJson | undefined>;
    /**
     * 输出语言文件
     * @param {Object} jsonMap
     */
    outputLanguageFile: (params: IOutputLanguageFile) => Promise<void>;
}
//# sourceMappingURL=index.d.ts.map