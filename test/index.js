var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import OpenAI from "openai";
export const testCompletions = (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { key, question } = params;
        const client = new OpenAI({
            apiKey: key,
        });
        const chatCompletion = yield client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: question,
                },
            ],
        });
        console.log("🚀 ~ test ~ chatCompletion:", (_a = chatCompletion === null || chatCompletion === void 0 ? void 0 : chatCompletion.choices[0]) === null || _a === void 0 ? void 0 : _a.message.content);
    }
    catch (err) {
        console.error(err);
    }
});
