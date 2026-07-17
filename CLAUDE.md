# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI低代码平台 (AI Low-Code Platform) - An AI-powered visual page builder where users describe pages in natural language and AI generates complete web pages. Supports drag-and-drop editing, multi-page management, and one-click HTML export.

## Commands

```bash
npm run dev      # Start development server (Vite on port 5173)
npm run build    # Build for production (TypeScript compile + Vite build)
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Backend Server (Optional for local development)

```bash
cd server && npm install && npm start  # Start Express proxy server on port 3001
```

The backend server proxies AI API requests to protect API keys. In production (Vercel), serverless functions in `api/` handle this.

## Architecture

### Data Flow

```
User Input → AI Service → JSON Schema → editorStore → Canvas Render
                  ↓
         User Edits → updateElement → re-render
                  ↓
         Export → exportHtml.ts → HTML/ZIP download
```

### Core Stores (Zustand)

- **editorStore** (`src/store/editorStore.ts`): Canvas state - elements, selection, undo/redo history (50 snapshots max)
- **pageStore** (`src/store/pageStore.ts`): Multi-page management with localStorage persistence
- **authStore** (`src/store/authStore.ts`): Authentication state (Supabase OAuth + guest mode)

### Schema-Driven Rendering

All page elements are defined in `src/types/schema.ts` as JSON schemas. The `ElementRenderer` (`src/core/renderer/ElementRenderer.tsx`) dynamically renders components based on element type.

**Adding a new element type:**
1. Add type definition to `src/types/schema.ts`
2. Create component in `src/components/elements/`
3. Add case to `ElementRenderer.tsx`
4. Add HTML export logic to `src/utils/exportHtml.ts`
5. Add property editing UI to `src/components/editor/PropertyPanel.tsx`
6. Update AI system prompt in `src/services/aiService.ts`

### Element Types (12 total)

`text`, `image`, `button`, `input`, `container`, `video`, `audio`, `link`, `divider`, `icon`, `card`, `select`

### Key Components

- **Canvas** (`src/components/canvas/Canvas.tsx`): Main editing area with grid overlay
- **ElementWrapper** (`src/components/canvas/ElementWrapper.tsx`): Handles drag (react-draggable), resize, selection
- **ChatPanel** (`src/components/chat/ChatPanel.tsx`): AI conversation interface with streaming response
- **PropertyPanel** (`src/components/editor/PropertyPanel.tsx`): Element property editor (double-click to open)

### AI Integration

- Uses SSE streaming for real-time response display
- Backend proxy (`api/chat.js` for Vercel, `server/index.js` for local) protects API keys
- Supports OpenAI-compatible APIs (DeepSeek) and iFlytek with signature auth
- Guest mode: 1 AI request/day (tracked in localStorage)
- Logged-in users: 3 requests/day (tracked via Supabase)

### Export System

`src/utils/exportHtml.ts` converts pixel positions to viewport units (vw/vh) for responsive HTML output. ZIP export uses JSZip for multi-page bundles.

## Authentication

- Supabase Auth with GitHub/Google OAuth + email/password
- OAuth callback handled at `/auth/callback` route
- Guest mode available without login
- Profile stored in `profiles` table (Supabase)

## Environment Variables

**Frontend (.env):**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

**Backend (Vercel/server):**
- `API_URL` - AI API endpoint
- `API_KEY` - AI API key (or `appId:appSecret` for iFlytek)
- `MODEL_ID` - Model identifier
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

## Tech Stack

React 19, TypeScript 5.8, Vite 6, Zustand 5, Tailwind CSS 3, react-draggable, JSZip, Supabase
