# Development

## Commands

From `frontend/`:

```bash
bun run dev
bun run lint
bun run format
bun run format:check
bun run build
bun run types
```

## Typical Change Workflow

1. Update route/component code in `src/`.
2. If Spacetime schema changed, run `bun run types`.
3. Run `bun run lint` and `bun run build`.
4. Verify affected route flows in browser.

## Routing Guidelines

- Keep page-level composition in `src/routes/*`.
- Keep business display widgets in `src/components/domain/*`.
- Route declarations live only in `src/main.tsx`.

## Spacetime Guidelines

- Add new selectors/enums in `src/spacetime/hooks.ts`.
- Use existing enum helpers (`TaskStatusEnum`, `IdeaStatusEnum`, etc.) instead of raw tag strings where possible.
- Keep generated imports isolated to hooks and focused domain logic.
