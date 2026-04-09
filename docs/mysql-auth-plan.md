# MySQL and Login Phase Plan

## Scope
- Move persistence from local JSON file to MySQL with repository adapters.
- Add local account login with email + password hash + session token.
- Partition all state by `userId` so chat/task/history/ML events are private per account.

## Schema
- `users(id, email, password_hash, created_at, updated_at)`
- `sessions(id, user_id, token_hash, expires_at, created_at)`
- `tasks(...)` with `user_id`
- `goals(...)` with `user_id`
- `projects(...)` with `user_id`
- `checkins(...)` with `user_id`
- `feedback(...)` with `user_id`
- `conversations(...)` with `user_id`
- `artifacts(...)` with `user_id`
- `ml_events(...)` with `user_id`
- `ml_models(...)` with `user_id`

## Migration
1. Add repository abstraction layer.
2. Keep JSON as fallback adapter.
3. Add MySQL adapter and migration scripts.
4. Dual-write validation in dev.
5. Switch reads to MySQL once parity is proven.

## Security
- Hash passwords with `bcrypt`.
- HTTP-only session cookie.
- Rotate session token on login.
- Add logout endpoint.
