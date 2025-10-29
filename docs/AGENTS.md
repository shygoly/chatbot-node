# Repository Guidelines

## Project Structure & Module Organization
Source lives in `src/`, with `src/index.ts` bootstrapping Express and delegating to `src/app.ts`. REST handlers sit in `src/routes`, shared helpers in `src/lib`, validation schemas in `src/types`, and cross-cutting logic under `src/middleware`. Default configuration lives in `config/`, compiled output lands in `dist/`, and reference material plus request samples reside in `docs/` and `examples/`.

## Build, Test, and Development Commands
- `npm run dev` starts the service with `tsx` hot reload.
- `npm run build` compiles TypeScript to `dist/`; run before Docker or release builds.
- `npm start` executes the compiled server; ensure `.env` is present.
- `npm run lint` enforces ESLint rules; append `--fix` for safe autofixes.
- `npm run format` applies Prettier to `src/**/*.ts` so diffs stay clean.

## Coding Style & Naming Conventions
Target Node 18+ and keep TypeScript strict—prefer explicit types on exported functions and DTOs. Prettier defaults (2-space indent, single quotes, trailing semicolons) and the existing ESLint config define formatting; do not disable rules without an explanatory comment. Name files and folders in kebab-case (`src/routes/chat-history.ts`), classes in PascalCase, and functions/constants in camelCase.

## Testing Guidelines
The `npm test` script currently exits early, so introduce real coverage alongside new features. Adopt Vitest or Jest with Supertest for HTTP assertions, place specs next to source as `*.spec.ts`, and update the `test` script accordingly. Focus on routing branches, middleware error handling, streaming responses, and configuration fallbacks. Store reusable payloads under `tests/fixtures/` to keep cases deterministic.

## Commit & Pull Request Guidelines
Follow present-tense Conventional Commits (`feat: add coze chat stream`) so changelog tooling remains viable. Keep commits focused, include doc or config updates when behavior shifts, and run build/lint before pushing. Pull requests should describe the intent, link to issues, note manual steps, and include screenshots or curl transcripts when HTTP payloads change. Tag reviewers for the touched areas and paste the command output confirming `npm run build` or `npm run lint` success.

## Environment & Security Tips
Copy `.env.example` to `.env`, keep secrets out of version control, and rotate tokens shared in `memory/` or sample files. When deploying, tighten CORS origins in the relevant config module and rely on the upstream proxy or load balancer for TLS.
