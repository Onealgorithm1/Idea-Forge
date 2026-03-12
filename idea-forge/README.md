# idea-spark

A fast, component-driven idea collaboration UI built with Vite, React, TypeScript, Tailwind CSS, and a collection of Radix/shadcn-style UI primitives.

This repository provides a starting point and a set of UI components for building ideas/kanban style apps and dashboards.

---

## Tech stack

- Framework: React (18+)
- Bundler / Dev server: Vite
- Language: TypeScript
- Styling: Tailwind CSS
- Component primitives: Radix UI / shadcn-style components
- Testing: Vitest + @testing-library/react
- Linting: ESLint
- Optional runtime / package manager: Bun (repo includes `bun.lock`)


## Features

- Ready-to-use UI components under `src/components` and `src/components/ui`
- Example pages and routing with React Router
- Type-safe forms using react-hook-form + zod (resolver provided)
- Lightweight state & data fetching using @tanstack/react-query
- Reusable utilities in `src/lib`
- Unit tests configured with Vitest


## Project structure (high level)

- `index.html` — Vite entry HTML
- `src/`
  - `main.tsx` — app bootstrap
  - `App.tsx` — top-level app
  - `components/` — feature components and UI primitives (includes `ui/` folder)
  - `pages/` — route pages (Index, NotFound)
  - `data/` — mock data used by the demo
  - `hooks/` — custom hooks
  - `lib/` — small utilities
- `public/` — static assets
- `vite.config.ts`, `tsconfig.*.json`, `tailwind.config.ts` — build & tooling configs
- `package.json` — scripts & dependencies


## Quick start

Prerequisites:

- Node.js 18+ recommended (or use Bun if preferred)
- Git

The repo includes a `bun.lock` file; Bun can be used instead of npm/yarn. Below are both sets of commands — pick one.

Using Bun (recommended if you have Bun installed):

```bash
# install deps
bun install

# start dev server (Vite)
bun run dev

# build for production
bun run build

# preview production build
bun run preview

# run tests
bun run test
```

Using npm / Node.js:

```bash
# install dependencies
npm install

# dev server
npm run dev

# build for production
npm run build

# build in development mode
npm run build:dev

# preview production build
npm run preview

# run tests once
npm run test

# run tests in watch mode
npm run test:watch

# lint the project
npm run lint
```

Note: `bun run <script>` runs the `scripts` defined in `package.json` just like `npm run <script>`.


## Available npm scripts

The `package.json` includes the following scripts:

- `dev` — run Vite dev server
- `build` — production build (Vite)
- `build:dev` — build using `development` mode
- `preview` — preview the production build locally
- `lint` — run ESLint over the project
- `test` — run tests with Vitest (single run)
- `test:watch` — run Vitest in watch mode


## Testing

This project uses Vitest with @testing-library/react. Example tests are placed in `src/test/` (see `example.test.ts`).

Run the test suite with:

```bash
npm run test
# or
bun run test
```


## Development tips

- Tailwind utility classes are configured in `tailwind.config.ts` and used throughout components.
- UI primitives are under `src/components/ui` — reuse these building blocks when creating new components.
- Keep components small and focused; prefer composition over large monolithic components.
- Use `react-query` for server state and caching patterns.
- Use `zod` with react-hook-form for schema-validated forms (project already includes `@hookform/resolvers` and `zod`).


## Troubleshooting

- If the dev server fails to start due to port conflicts, specify a port: `npm run dev -- --port 3000` or set `PORT` env var.
- If dependency / lockfile issues appear, remove `node_modules` and lockfile and reinstall:

```bash
rm -rf node_modules package-lock.json bun.lock
npm install
# or
bun install
```

- If TypeScript types fail, ensure your editor is using the workspace TypeScript (configured via `tsconfig.json`) and restart the TS server.
- If tests fail due to environment issues, ensure `NODE_ENV` is not forcing production or that jsdom is available (Vitest runs in jsdom by default here).


## Contributing

Contributions are welcome. A minimal workflow:

1. Fork the repository
2. Create a feature branch
3. Implement changes and add/update tests
4. Run linting and tests locally
5. Open a pull request describing your changes

Please follow the existing code style; run `npm run lint` before submitting.


## License

This repository does not include a license file by default. If you want an open-source license, consider adding an `LICENSE` (MIT is common):

```bash
# example: add an MIT license
echo "MIT License" > LICENSE
```


## Links & references

- Vite: https://vitejs.dev/
- React: https://reactjs.org/
- TypeScript: https://www.typescriptlang.org/
- Tailwind CSS: https://tailwindcss.com/
- Bun: https://bun.sh/
- Vitest: https://vitest.dev/


## Maintainers / Contact

If you have questions or want to contribute, please open an issue or PR on the repository. You can also add your contact info or GitHub handle here.


---

Thank you for using idea-spark — build fast, iterate faster.

