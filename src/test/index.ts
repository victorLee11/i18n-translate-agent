import OpenAI from "openai";
import { ITestParams } from "src/types";

export const testCompletions = async (params: ITestParams) => {
  try {
    const { key, question } = params;
    const client = new OpenAI({
      apiKey: key,
    });
    const chatCompletion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: question,
        },
      ],
    });
    console.log(
      "🚀 ~ test ~ chatCompletion:",
      chatCompletion?.choices[0]?.message.content
    );
  } catch (err) {
    console.error(err);
  }
};
