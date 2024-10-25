import { MultiBar } from "cli-progress";
import OpenAI from "openai";

export interface ILanguage {
  /** 语言code */
  code: SupportLanguageType;
  /**语言名称 */
  name: string;
}

export type SupportLanguageType =
  | "en"
  | "zh-CN"
  | "zh-TW"
  | "ja"
  | "ar"
  | "bn"
  | "de"
  | "es-ES"
  | "fr"
  | "hi"
  | "id"
  | "it"
  | "ko"
  | "ms"
  | "my"
  | "ne-NP"
  | "nl"
  | "pl"
  | "pt-PT"
  | "ru"
  | "tl"
  | "tr"
  | "vi"
  | "uk"
  | "ur-PK";

export type SupportLanguageMap = Partial<
  Record<SupportLanguageType, ILanguage>
>;

export interface ILogError {
  error: Error;
}

export interface ITranslateLogError extends ILogError {
  key: string;
  language: SupportLanguageType;
  fileName: string;
}

export interface ICreateJsonFileParams {
  language: SupportLanguageType;
  fileName: string;
  folderName: string;
  jsonData: IJson;
}

export interface IOutputLanguageFile {
  folderName: SupportLanguageType;
  fileName: string;
  jsonMap: IJson;
}

export interface IRegisterLanguageCacheFile {
  folderName: string;
  fileName: string;
  language: SupportLanguageType;
  jsonMap: IJson;
  /** await translate file path */
  sourceFilePath: string;
}

export interface IJson {
  [key: string]: string;
}

export interface ISingleTranslate {
  language: SupportLanguageType;
  fileName: string;
  translateJson: IJson;
  multiBar: MultiBar;
  callback?: () => void;
}

export interface ITranslateChat {
  key: string;
  value: string;
  language: SupportLanguageType;
  index: number;
  fileName: string;
}

export interface ITranslateChatResponse {
  key: string;
  value: string;
  index: number;
  error?: Error;
}

export interface ICwalletTranslateParams {
  key: string;
  cacheFileRootPath: string;
  /** await translate file root path */
  fileRootPath: string;
  fineTune: string[];
  languages: SupportLanguageType[];
  outputRootPath?: string;
  sourceLanguage?: SupportLanguageType;
  openaiConfig?: IOpenaiConfig;
}

export interface ITranslate {}

export interface IOpenaiConfig {
  model: OpenAI.Chat.ChatModel;
}
