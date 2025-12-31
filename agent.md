# Agent Instructions: The Zulu Method Customer Advisory Board

## Application Overview

The Zulu Method Customer Advisory Board (CAB) is a React-based web application that simulates a virtual customer advisory board using AI personas. The application allows users to:

- **Generate 20 diverse AI personas** modeled on their Ideal Customer Profile (ICP)
- **Test ideas, products, messaging, positioning, branding, and pricing** through virtual board sessions
- **Receive comprehensive analysis reports** with feedback from multiple perspectives
- **Upload supporting documents** (PDFs, text files, images) for context
- **Save and load previous board sessions** for reference
- **Swap individual board members** to refine the advisory board composition

The application uses Google Gemini AI to generate realistic board member personas and conduct deep analysis sessions that simulate real customer advisory board meetings.

## Tech Stack

- **Frontend Framework:** React 19 with TypeScript
- **Build Tool:** Vite 6.2.0
- **Styling:** TailwindCSS (utility-first CSS)
- **AI Integration:** Google Gemini AI (`@google/genai` v1.30.0) - using `gemini-2.5-flash` model
- **Markdown Rendering:** `react-markdown` v10.1.0 with `remark-gfm` v4.0.0
- **Icons:** `lucide-react` v0.554.0
- **State Management:** React Hooks (useState, useEffect, useCallback)
- **Storage:** Browser LocalStorage API

## External Tools & APIs

### Google Gemini AI API
- **Model:** `gemini-2.5-flash`
- **Usage:** 
  - Board member persona generation (JSON schema-based)
  - Streaming analysis reports (markdown format)
  - Single member regeneration
- **Configuration:** API key required via `GEMINI_API_KEY` environment variable
- **Service File:** `services/geminiService.ts`

### Browser APIs
- **LocalStorage:** Persists saved board sessions (`zulu_sessions` key)
- **FileReader API:** Converts uploaded files to base64 for AI processing
- **Print API:** Browser print functionality for PDF export

## Project Structure

```
project/
├── App.tsx                 # Main application component (orchestrates state flow)
├── index.tsx              # Application entry point
├── types.ts               # TypeScript interfaces and enums
├── metadata.json          # Application metadata
├── components/
│   ├── SetupForm.tsx      # Initial form for ICP, industry, feedback item
│   ├── BoardAssembly.tsx  # Displays 20 generated board members
│   ├── ReportDisplay.tsx  # Renders streaming/complete analysis report
│   ├── ProgressBar.tsx    # Visual progress indicator
│   └── ErrorBoundary.tsx  # Error handling component
├── services/
│   └── geminiService.ts   # All Google Gemini AI interactions
├── vite.config.ts         # Vite build configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## Development Setup

### Prerequisites
- Node.js 18 or higher
- Google Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Installation
```bash
npm install
```

### Environment Configuration
Create a `.env` file in the project root:
```
GEMINI_API_KEY=your_actual_api_key_here
```

The Vite configuration (`vite.config.ts`) automatically loads this and makes it available as `process.env.API_KEY` and `process.env.GEMINI_API_KEY` in the application.

### Development Server
```bash
npm run dev
```
- Server runs on `http://localhost:3000`
- Hot module replacement enabled
- Host: `0.0.0.0` (accessible from network)

### Build for Production
```bash
npm run build
npm run preview
```

## Architecture & Application Flow

### State Management
The application uses a state machine pattern with the `AppState` enum (`types.ts`):

1. **SETUP** - User fills out form (ICP, industry, feedback item, optional files)
2. **ASSEMBLING** - Generating 20 board member personas via Gemini AI
3. **BOARD_READY** - Display generated board, allow member swapping
4. **ANALYZING** - Streaming analysis report from board session
5. **COMPLETE** - Report fully generated, can export/save

### Key Components

**App.tsx** - Main orchestrator
- Manages global application state
- Handles state transitions
- Manages saved sessions (localStorage)
- Coordinates component interactions

**SetupForm.tsx** - Initial data collection
- Collects: industry, ICP definition, feedback item, circumstances, files
- Validates required fields
- Converts uploaded files to base64
- File size limit: 10MB per file
- Supported types: PDF, text, CSV, markdown, HTML, images

**BoardAssembly.tsx** - Board member display
- Renders 20 board member cards
- Each member shows: name, role, company type, expertise, personality archetype
- Allows individual member regeneration
- Visual feedback for newly swapped members

**ReportDisplay.tsx** - Analysis report viewer
- Streams markdown content as it's generated
- Renders markdown with syntax highlighting
- Sections: Executive Dashboard, Key Research Findings, Deep Dive Analysis, The Roast & The Gold, Raw Board Transcript
- Export options: Print/PDF, HTML download
- Collapsible board member roster

**geminiService.ts** - AI service layer
- `generateBoardMembers()` - Creates 20 personas with JSON schema
- `regenerateBoardMember()` - Replaces single member
- `streamAnalysis()` - Streams markdown analysis report
- All functions use structured prompts and response schemas

### Data Flow

1. User submits form → `handleSetupSubmit()` in App.tsx
2. Calls `generateBoardMembers()` → Gemini API → Returns BoardMember[]
3. State → BOARD_READY → User reviews/edits board
4. User clicks "Start Session" → `handleStartSession()` → `streamAnalysis()`
5. Gemini streams markdown → `onChunk` callback → Updates report state
6. On completion → Auto-saves to localStorage → State → COMPLETE

## Code Style & Guidelines

### TypeScript
- **Strict typing:** All components use TypeScript interfaces from `types.ts`
- **No `any` types:** Use proper type definitions
- **Interfaces:** `UserInput`, `BoardMember`, `SavedSession`, `FileData`
- **Enums:** `AppState` for application state machine

### React Patterns
- **Functional components only** - No class components
- **Hooks:** useState, useEffect, useCallback, useRef
- **Props:** Explicitly typed interfaces for all component props
- **Event handlers:** Typed with React event types

### Styling
- **TailwindCSS utility classes** - No custom CSS files
- **Responsive design:** Mobile-first with `md:` breakpoints
- **Print styles:** Use `no-print` class for non-printable elements
- **Color scheme:** Indigo/blue primary palette, slate for neutrals

### File Naming
- **Components:** PascalCase (e.g., `SetupForm.tsx`)
- **Services:** camelCase (e.g., `geminiService.ts`)
- **Types:** camelCase (e.g., `types.ts`)
- **Config files:** kebab-case or standard names (e.g., `vite.config.ts`)

### Code Organization
- **Single responsibility:** Each component has one clear purpose
- **Service layer:** All external API calls in `services/` directory
- **Type definitions:** Centralized in `types.ts`
- **Constants:** Define at top of file or in separate constants file

## Key Workflows

### Board Member Generation
1. User provides ICP definition, industry, circumstances
2. `generateBoardMembers()` constructs prompt with context
3. Gemini API called with JSON schema for structured response
4. Returns array of 20 `BoardMember` objects with:
   - Unique ID, name, role, company type
   - Expertise area, personality archetype
   - Optional avatar style

### Analysis Streaming
1. User starts session with assembled board
2. `streamAnalysis()` constructs comprehensive prompt including:
   - User input (industry, ICP, feedback item, circumstances)
   - All 20 board member profiles
   - Uploaded file contents (base64)
3. Gemini streams markdown response
4. Each chunk appended to report state
5. ReportDisplay renders markdown in real-time

### Session Persistence
- **Auto-save:** Sessions automatically saved to localStorage on completion
- **Storage key:** `zulu_sessions`
- **Data structure:** Array of `SavedSession` objects
- **Load:** Clicking saved session restores all state (input, members, report)
- **Delete:** Sessions can be removed from history

### Member Regeneration
1. User clicks swap button on board member card
2. `handleRegenerateMember()` called with member ID
3. `regenerateBoardMember()` creates new member avoiding duplicates
4. Existing member replaced in state array
5. Visual highlight (green border) shows newly swapped member

## Error Handling

### API Errors
- **Gemini API failures:** Caught in try-catch, error message displayed to user
- **Network errors:** Graceful degradation with user-friendly messages
- **Invalid responses:** Validation and fallback handling

### User Input Validation
- **Required fields:** Form validation prevents submission without ICP, industry, feedback item
- **File validation:** Size limits (10MB) and type checking before upload
- **Base64 conversion:** Error handling for file reading failures

### State Management
- **Error state:** `error` state in App.tsx for global error messages
- **Loading states:** Visual indicators during async operations
- **Error boundaries:** ErrorBoundary component for React error catching

## Testing & Quality

### Manual Testing Checklist
- Form submission with all required fields
- File upload (various types and sizes)
- Board member generation (20 members)
- Member regeneration (swap functionality)
- Analysis streaming (real-time updates)
- Report export (PDF/HTML)
- Session save/load/delete
- Error scenarios (invalid API key, network failures)

### Code Quality
- **TypeScript:** No type errors, strict mode enabled
- **Linting:** ESLint configured (see `eslint.config.js`)
- **Build:** Production build must complete without errors
- **Performance:** Code splitting configured in vite.config.ts

## Agent Permissions & Guidelines

### ✅ Allowed Actions
- Modify component implementations (UI/UX improvements)
- Add new features following existing patterns
- Update styling (TailwindCSS classes)
- Refactor code for clarity/maintainability
- Add error handling and validation
- Update documentation
- Add new utility functions
- Modify prompt engineering in `geminiService.ts` (improve AI responses)

### ⚠️ Restricted Actions (Require Approval)
- **API Key handling:** Never commit API keys, always use environment variables
- **Breaking changes:** Changes to `types.ts` interfaces that affect multiple components
- **Service layer:** Major changes to Gemini API integration patterns
- **Build configuration:** Modifications to `vite.config.ts` or `tsconfig.json`
- **Dependencies:** Adding/removing major dependencies requires review

### 🔒 Critical Files to Preserve
- `types.ts` - Core type definitions (modify carefully)
- `services/geminiService.ts` - AI integration (test thoroughly)
- `vite.config.ts` - Build configuration
- `.env` - Never commit this file (should be in .gitignore)

### Best Practices for Agents
1. **Read existing code first** - Understand patterns before making changes
2. **Maintain type safety** - Don't use `any`, add proper types
3. **Follow component structure** - Match existing component patterns
4. **Test manually** - Verify changes work in browser
5. **Preserve functionality** - Don't break existing features
6. **Update documentation** - Keep this file and README.md current
7. **Error handling** - Always handle async operations and API calls
8. **Responsive design** - Test on mobile and desktop viewports

## Additional Resources

- **Google Gemini API Docs:** https://ai.google.dev/docs
- **React 19 Docs:** https://react.dev
- **Vite Docs:** https://vitejs.dev
- **TailwindCSS Docs:** https://tailwindcss.com/docs
- **TypeScript Docs:** https://www.typescriptlang.org/docs

## Quick Reference: Common Tasks

### Adding a New Component
1. Create file in `components/` directory
2. Define TypeScript interface for props
3. Use functional component with hooks
4. Style with TailwindCSS classes
5. Import and use in `App.tsx` or parent component

### Modifying AI Prompts
1. Edit `services/geminiService.ts`
2. Update prompt strings in `generateBoardMembers()`, `streamAnalysis()`, or `regenerateBoardMember()`
3. Test with various inputs to ensure quality
4. Maintain response schema structure

### Adding New State
1. Add to `AppState` enum if new application state needed
2. Add state variables in `App.tsx` using `useState`
3. Update state transitions in handlers
4. Pass state as props to components

### Styling Changes
1. Use TailwindCSS utility classes
2. Follow existing color scheme (indigo/slate)
3. Ensure responsive design with `md:` breakpoints
4. Test print styles if affecting report display

---

**Last Updated:** 2025-01-22  
**Version:** 1.0.0

