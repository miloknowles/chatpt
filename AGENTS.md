# Agent Notes

Primary context for this repository is in:

- [docs/brainstorming.md](docs/brainstorming.md)

## Working Tree Guidance

- It is okay to commit changes made for the requested task.
- Ignore unrelated existing changes in the working tree; do not revert them unless explicitly asked.

## Local Development Guidance

- Do not start dev servers to test changes.
- Do not use browser automation or browser-based checks to verify changes; leave browser verification to the user.
- Do not run `yarn build` while the dev server is running; it can corrupt the active dev server state.

## Supabase Guidance

- Never change the remote Supabase project directly without explicit permission.
- For database changes, create migration files instead and ask the user to push/apply them.
