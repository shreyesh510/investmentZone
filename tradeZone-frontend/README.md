# TradeZone Frontend

A modern cryptocurrency trading platform built with React, TypeScript, and Vite, featuring real-time charts, AI-powered analysis, and live chat functionality.

## Features

- 📈 Real-time cryptocurrency price charts powered by TradingView
- 🤖 AI-powered market analysis using OpenAI GPT
- 💬 Live chat with annotation support
- 🔒 Secure authentication
- 📱 Responsive design with modern UI

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- OpenAI API key (for AI features)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Configure your OpenAI API key in the `.env` file:
   ```env
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   ```

   **To get your OpenAI API key:**
   - Visit https://platform.openai.com/api-keys
   - Sign in or create an account
   - Generate a new API key
   - Copy the key and paste it in your `.env` file

5. Start the development server:
   ```bash
   npm run dev
   ```

### Environment Variables

The application requires the following environment variables:

- `VITE_API_BASE_URL` - Backend API URL (default: http://localhost:3000)
- `VITE_OPENAI_API_KEY` - OpenAI API key for AI features (required)
- `NODE_ENV` - Environment mode (development/production)

**Important:** Never commit your `.env` file to version control. The `.env.example` file is provided as a template.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
