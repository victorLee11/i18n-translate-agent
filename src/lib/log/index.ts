import { ITranslateLogError } from "@/types";
import fs from "fs";

export function logErrorToFile(params: ITranslateLogError) {
  const { error, key, language, fileName } = params;
  const logMessage = `${new Date().toISOString()} - Error: ${error.message}
  \nLanguage: ${language}
  \nFileName: ${fileName}
  \nkey:${key}
  \nStack: ${error.stack}\n\n`;

  fs.appendFile("error.log", logMessage, (err) => {
    if (err) {
      console.error("无法写入日志文件:", err);
    } else {
      console.log("错误日志已写入 error.log 文件");
    }
  });
}
