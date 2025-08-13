import { CwalletTranslate } from "../index.js";
import { SupportLanguageType } from "../types/index.js";
import OpenAI from "openai";

// 配置您的 API 信息
const config = {
  apiKey: "",

  // 如果使用其他 OpenAI 兼容服务，请修改 baseURL
  baseURL: "https://openrouter.ai/api/v1",

  // 选择模型
  model: "gpt-4o" as OpenAI.Chat.ChatModel,

  // 微调指令
  fineTune: [
    "你是一个专业的翻译助手",
    "请保持原文的语气和风格",
    "翻译要准确且自然",
  ],

  // 要翻译的目标语言
  languages: ["zh-CN", "ja", "ko"] as SupportLanguageType[],

  // 源语言
  sourceLanguage: "en" as SupportLanguageType,
};

async function main() {
  console.log("🚀 CwalletTranslate 使用示例");
  console.log("============================");

  // 检查 API key
  if (config.apiKey === "your-openai-api-key-here") {
    console.error("❌ 请先设置您的 OpenAI API key");
    process.exit(1);
  }

  try {
    // 创建 CwalletTranslate 实例
    const translator = new CwalletTranslate({
      key: config.apiKey,
      cacheFileRootPath: "./cache",
      fileRootPath: "./translations",
      fineTune: config.fineTune,
      languages: config.languages,
      sourceLanguage: config.sourceLanguage,
      openaiClientConfig: {
        baseURL: config.baseURL,
      },
      chatCompletionCreateParams: {
        model: config.model,
      },
    });

    console.log(`📝 配置信息:`);
    console.log(`   模型: ${config.model}`);
    console.log(`   API URL: ${config.baseURL}`);
    console.log(`   源语言: ${config.sourceLanguage}`);
    console.log(`   目标语言: ${config.languages.join(", ")}`);
    console.log();

    // 测试文本列表
    const testTexts = [
      "Hello, how are you?",
      "Welcome to our application",
      "Please enter your password",
      "Settings saved successfully",
      "Error: Invalid input data",
    ];

    // 对每个目标语言进行翻译测试
    for (const language of config.languages) {
      console.log(`🌍 翻译到 ${language}:`);
      console.log("─".repeat(50));

      for (let i = 0; i < testTexts.length; i++) {
        const text = testTexts[i];
        console.log(`📤 原文: ${text}`);

        try {
          const result = await translator["translateChat"]({
            key: `test_${i}`,
            value: text,
            language: language,
            index: i,
            fileName: "demo.json",
          });

          if (result.error) {
            console.log(`❌ 翻译失败: ${result.error.message}`);
          } else {
            console.log(`📥 译文: ${result.value}`);
          }
        } catch (error) {
          console.log(
            `❌ 翻译异常: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }

        console.log();

        // 避免请求过于频繁
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      console.log();
    }

    console.log("✅ 翻译测试完成!");
  } catch (error) {
    console.error(
      "❌ 发生错误:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

// 运行示例（检查是否直接运行此文件）
const isMainModule =
  process.argv[1] &&
  (process.argv[1].endsWith("demo.ts") || process.argv[1].endsWith("demo.js"));
if (isMainModule) {
  main().catch(console.error);
}

export { main };
