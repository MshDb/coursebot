# End-User Module

## Purpose

Manages Telegram end users (people who interact with bots). End users are
globally deduplicated by `telegram_user_id` — one record per Telegram user
regardless of how many bots they interact with.

## Files

| File | Purpose |
|------|---------|
| `router.ts` | Placeholder — no dashboard-facing procedures in Spec 003 |
| `service.ts` | `EndUserService.findOrCreate` — upserts by `telegramUserId` |
| `schema.ts` | Zod schema for Telegram user data |
| `types.ts` | TypeScript interfaces |
| `constants.ts` | Module constants |

## Key Design Decisions

- **Global dedup**: One `EndUser` per Telegram user. `BotSubscriber` join table handles per-bot relationships.
- **Upsert strategy**: User info (name, username, language) updated on each interaction via upsert.
- **No dashboard exposure**: End users are internal entities managed by the webhook handler. Future specs may add subscriber browsing.
