# i18n-translate-agent

🚀 An intelligent i18n translation agent powered by OpenAI, supporting automatic translation of JSON files with caching and progress tracking.

## ✨ Features

- **Multi-language Support**: Translate from one source language to multiple target languages
- **AI-Powered**: Uses OpenAI's GPT models (default: gpt-4o) for high-quality translations
- **Smart Caching**: Intelligent caching system to avoid re-translating unchanged content
- **Progress Tracking**: Real-time progress bars for translation tasks
- **Fine-tuning Support**: Customize translation context for domain-specific accuracy
- **JSON File Processing**: Automatically processes JSON internationalization files
- **Error Handling**: Comprehensive error logging and recovery
- **Batch Processing**: Efficient batch translation with configurable concurrency

## 📦 Installation

```bash
# Using npm
npm install i18n-translate-agent

# Using yarn
yarn add i18n-translate-agent

# Using pnpm
pnpm add i18n-translate-agent
```

## 🚀 Quick Start

```javascript
import { CwalletTranslate } from 'i18n-translate-agent';
import path from 'path';

// Get current directory
const __dirname = import.meta.dirname;

// Create translation instance
const translator = new CwalletTranslate({
  key: "your-openai-api-key",
  sourceLanguage: 'en',
  
  // Cache file path for optimized re-runs
  cacheFileRootPath: path.resolve(__dirname, './cache'),
  
  // Source translation files path
  fileRootPath: path.resolve(__dirname, './locales'),
  
  // Fine-tune translation context for better accuracy
  fineTune: [
    'We are blockchain developers',
    'This is a cryptocurrency wallet application',
    'Technical terms should be kept consistent'
  ],
  
  // Target languages to translate to
  languages: [
    'zh-CN', // Simplified Chinese
    'zh-TW', // Traditional Chinese
    'ja',    // Japanese
    'ko',    // Korean
    'fr',    // French
    'de',    // German
    'es',    // Spanish
    'pt',    // Portuguese
    'ru',    // Russian
    'ar'     // Arabic
  ],
  
  // Output directory for translated files
  outputRootPath: path.resolve(__dirname, './locales'),
  
  // Optional: Custom OpenAI configuration
  openaiClientConfig: {
    apiKey: "your-openai-api-key",
    baseURL: "https://api.openai.com/v1" // Optional: custom endpoint
  },
  
  // Optional: Custom chat completion parameters
  chatCompletionCreateParams: {
    model: "gpt-4o",
    temperature: 0.3,
    max_tokens: 1000
  }
});

// Start translation
await translator.translate();
```

## 📁 File Structure

Your project should have the following structure:

```
your-project/
├── locales/
│   └── en/                 # Source language folder
│       ├── common.json
│       ├── auth.json
│       └── dashboard.json
├── cache/                  # Generated cache files
│   ├── zh-CN/
│   ├── ja/
│   └── ...
└── translate.js           # Your translation script
```

### Example JSON Files

**locales/en/common.json**
```json
{
  "welcome": "Welcome",
  "loading": "Loading...",
  "error": "An error occurred",
  "save": "Save",
  "cancel": "Cancel"
}
```

After translation, you'll get:

**locales/zh-CN/common.json**
```json
{
  "welcome": "欢迎",
  "loading": "加载中...",
  "error": "发生错误",
  "save": "保存",
  "cancel": "取消"
}
```

## ⚙️ Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `key` | `string` | ✅ | OpenAI API key |
| `sourceLanguage` | `string` | ❌ | Source language code (default: 'en') |
| `languages` | `string[]` | ✅ | Target language codes to translate to |
| `fileRootPath` | `string` | ✅ | Path to source translation files |
| `cacheFileRootPath` | `string` | ✅ | Path for cache files |
| `outputRootPath` | `string` | ❌ | Output path (default: same as fileRootPath) |
| `fineTune` | `string[]` | ❌ | Context strings for better translation accuracy |
| `openaiClientConfig` | `ClientOptions` | ❌ | Custom OpenAI client configuration |
| `chatCompletionCreateParams` | `ChatCompletionCreateParams` | ❌ | Custom chat completion parameters |

## 🌍 Supported Languages

The agent supports all major languages. Use standard language codes:

- `en` - English
- `zh-CN` - Simplified Chinese
- `zh-TW` - Traditional Chinese
- `ja` - Japanese
- `ko` - Korean
- `fr` - French
- `de` - German
- `es` - Spanish
- `pt` - Portuguese
- `ru` - Russian
- `ar` - Arabic
- `hi` - Hindi
- `th` - Thai
- `vi` - Vietnamese
- And many more...

## 🛠️ Advanced Usage

### Custom Fine-tuning

```javascript
const translator = new CwalletTranslate({
  // ... other options
  fineTune: [
    'This is a financial application',
    'Cryptocurrency and blockchain terminology should be preserved',
    'Keep technical terms in English when appropriate',
    'Maintain formal tone throughout'
  ]
});
```

### Error Handling

```javascript
try {
  await translator.translate();
  console.log('Translation completed successfully!');
} catch (error) {
  console.error('Translation failed:', error);
}
```

### Cache Management

```javascript
import { generateCache, deleteBatchCache } from 'i18n-translate-agent';

// Generate cache for specific languages
await generateCache(['zh-CN', 'ja'], '/path/to/cache');

// Clear cache for specific languages
await deleteBatchCache(['zh-CN', 'ja'], '/path/to/cache');
```

## 📊 Progress Tracking

The agent provides real-time progress tracking:

```
🚀 Starting translation
🚀 Model being used: gpt-4o 🚀
🚀 Fine-tuning: ['Technical context...'] 🚀
🚀 ~ Files to be translated: ['common.json', 'auth.json']

████████████████████████████████████████ 100% | zh-CN:common.json 25/25
████████████████████████████████████████ 100% | zh-CN:auth.json 30/30
████████████████████████████████████████ 100% | ja:common.json 25/25
████████████████████████████████████████ 100% | ja:auth.json 30/30

🚀 Translation completed
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

If you have any questions or need help, please [open an issue](https://github.com/victorLee11/i18n-translate-agent/issues).

## 🔗 Links

- [GitHub Repository](https://github.com/victorLee11/i18n-translate-agent)
- [NPM Package](https://www.npmjs.com/package/i18n-translate-agent)
- [OpenAI API Documentation](https://platform.openai.com/docs)