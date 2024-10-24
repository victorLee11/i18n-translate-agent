import { MultiBar } from "cli-progress";
import OpenAI from "openai";

export interface ILanguage {
  /** 语言code */
  code?: string;
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
  translateFilePath: string;
}

export interface IRegisterLanguageCacheFile {
  folderName: string;
  fileName: string;
  language: SupportLanguageType;
  jsonMap: IJson;
  sourceFilePath: string;
}

export interface IJson {
  [key: string]: string;
}

export interface ITranslate {
  language: SupportLanguageType;
  fileName: string;
  multiBar: MultiBar;
  callback: () => void;
}

export interface ITranslateChat {
  key: string;
  value: string;
  client: OpenAI;
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
