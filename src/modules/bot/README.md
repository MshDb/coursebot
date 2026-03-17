# Bot Module

## Purpose

Manages Telegram bot connections within a workspace. Handles bot lifecycle:
connecting via API token, validating, encrypting tokens, registering webhooks,
configuring welcome messages and menu commands, and soft-deleting.

## Files

| File | Purpose |
|------|---------|
| `router.ts` | tRPC procedures for bot CRUD (`bot.create`, `bot.list`, `bot.getById`, `bot.update`, `bot.delete`) |
| `service.ts` | Pure business logic — all Prisma queries, token encryption/decryption, Telegram API calls |
| `schema.ts` | Zod schemas: `addBotSchema`, `updateBotSchema` |
| `types.ts` | TypeScript interfaces: `BotWithSubscriberCount`, `TelegramBotInfo` |
| `constants.ts` | Status values, webhook path pattern, default messages |

## Dependencies

- `src/lib/encryption.ts` — AES-256-GCM encrypt/decrypt
- `src/lib/telegram.ts` — Telegram Bot API wrapper
- `src/modules/end-user/service.ts` — EndUser findOrCreate (used in webhook handler)

## Key Flows

1. **Bot Connection**: Token → `getMe` validation → encrypt → uniqueness check → create record → `setWebhook` → `setMyCommands`
2. **Bot Config**: Update welcome message / menu config → save → optionally call `setMyCommands`
3. **Bot Deletion**: Soft delete → `deleteWebhook` → set status DELETED
