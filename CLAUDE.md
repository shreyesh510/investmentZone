# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TradeZone is a full-stack investment management application consisting of:
- **Backend**: NestJS API with Firebase integration
- **Frontend**: React + TypeScript + Vite with Redux state management

## Key Commands

### Backend (tradezone-backend/)
```bash
cd tradezone-backend

# Development
npm run start:dev      # Start dev server with hot reload (port 3000)
npm run start:debug    # Start with debugging

# Build & Production
npm run build          # Build for production
npm run start:prod     # Run production build

# Testing
npm test               # Run unit tests
npm run test:watch     # Run tests in watch mode
npm run test:cov       # Run tests with coverage
npm run test:e2e       # Run e2e tests

# Code Quality
npm run lint           # Lint and fix TypeScript files
npm run format         # Format code with Prettier
```

### Frontend (tradeZone-frontend/)
```bash
cd tradeZone-frontend

# Development
npm run dev            # Start dev server (port 3001)

# Build & Production
npm run build          # Build for production
npm run preview        # Preview production build

# Code Quality
npm run lint           # Run ESLint
```

## Architecture

### Backend Structure
- **NestJS modular architecture** with dependency injection
- **Firebase** for database (Firestore) and authentication
- **Modules**:
  - `auth`: JWT-based authentication with Firebase
  - `positions`: Investment position management
  - `deposits`/`withdrawals`: Transaction handling
  - `wallets`: Wallet management
  - `chat`: WebSocket-based real-time chat
  - `database`: Firebase service abstraction

### Frontend Structure
- **React** with functional components and hooks
- **Redux Toolkit** for state management with slices:
  - `authSlice`: Authentication state
  - `positionsSlice`: Investment positions
  - `depositsSlice`/`withdrawalsSlice`: Transactions
  - `walletsSlice`: Wallet management
  - `priceSlice`: Real-time price data
- **Context Providers**:
  - `SettingsContext`: App settings
  - `SocketContext`: WebSocket connection
  - `ToastContext`: Notifications
- **Routing**: React Router v7 with protected routes

## Key Technical Details

### Backend
- Firebase credentials configured via environment variables (`FIREBASE_SERVICE_ACCOUNT_KEY`) or local JSON file
- CORS enabled for cross-origin requests
- WebSocket support via Socket.io for real-time features
- Global validation pipe for DTO validation
- Firebase Firestore with `ignoreUndefinedProperties` enabled

### Frontend
- TypeScript strict mode enabled
- Vite for fast builds and HMR
- TailwindCSS for styling
- Redux DevTools support in development
- Socket.io-client for real-time updates
- Excel import/export functionality via xlsx library

## Environment Configuration

### Backend Environment Variables
- `FIREBASE_SERVICE_ACCOUNT_KEY`: Firebase service account JSON (production)
- `FIREBASE_PROJECT_ID`: Firebase project ID (default: tradeinzone-1a8b1)
- `FIREBASE_DATABASE_URL`: Firebase database URL

### Frontend
- API endpoint configured to connect to backend on port 3000
- WebSocket connection established automatically with backend

## Testing Approach
- Backend uses Jest for unit and e2e testing
- Test files follow `*.spec.ts` pattern
- Coverage reports available via `npm run test:cov`

## Important Notes
- Firebase Admin SDK initialization is handled in `firebase.config.ts`
- Authentication uses JWT tokens with Firebase user verification
- The app initializes sample data on module initialization
- Both frontend and backend use TypeScript with module resolution configured for their respective environments