import { OpenAI, ClientOptions } from "openai";
import { ICwalletTranslateParams, IJson, IOutputLanguageFile, ISingleTranslate, ITranslateChat, ITranslateChatResponse, SupportLanguageType } from "./types";
import { ChatCompletionCreateParams } from "openai/resources";
export { generateCache, deleteBatchCache } from "./lib/cache/index.js";
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
    openaiClientConfig: ClientOptions;
    fineTune: string[];
    chatCompletionCreateParams: Partial<ChatCompletionCreateParams>;
    constructor(params: ICwalletTranslateParams);
    get supportLanguages(): import("./types").ILanguage[];
    get outputPath(): string;
    searchLanguage(code: SupportLanguageType): import("./types").ILanguage | undefined;
    createOpenAIClient: () => void;
    /**
     * Translate all supported language folders and files in the entry file
     */
    translate: () => Promise<void>;
    /**
     * Translate a single file
     * @param params
     * @returns
     */
    singleTranslate: (params: ISingleTranslate) => Promise<void>;
    /**
     * Use OpenAI for translation
     * @param {string} key
     * @param {string} value
     * @param {OpenAI} client
     * @param {string} language
     * @returns
     */
    translateChat: (params: ITranslateChat) => Promise<ITranslateChatResponse>;
    /**
     * Compare cache files to get content that needs translation
     * @param language
     * @param fileName
     * @returns
     */
    getTranslateContent: (language: SupportLanguageType, fileName: string) => Promise<IJson | undefined>;
    /**
     * Output language file
     * @param {Object} jsonMap
     */
    outputLanguageFile: (params: IOutputLanguageFile) => Promise<void>;
}
//# sourceMappingURL=index.d.ts.map