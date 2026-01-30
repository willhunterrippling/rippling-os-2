---
name: passcode
description: Generate and manage access passcodes for the web dashboard. Use when the user says "/passcode", wants to generate a passcode, manage their passcodes, or needs to access the hosted web dashboard.
---

# /passcode - Access Passcode Management

Generate and manage passcodes for accessing the Rippling OS web dashboard.

**Skill directory**: `.cursor/skills/passcode`

## Overview

Passcodes are used to authenticate to the web dashboard. They replace email-based login.

**Requirements to generate a passcode:**
1. Git email must be `@rippling.com`
2. User must have valid Snowflake access (verified via test query)

**Passcode format:** `XXXX-XXXX-XXXX-XXXX` (16 alphanumeric characters)

## Quick Start

### Check Prerequisites

Before generating a passcode, verify everything is configured:

```bash
bash .cursor/skills/passcode/scripts/verify-prerequisites.sh
```

This checks:
- Git email is `@rippling.com`
- Snowflake configuration exists
- Database URL is configured
- Dependencies are installed

### Check Your Status

See if you already have passcodes:

```bash
npx tsx .cursor/skills/passcode/scripts/check-status.ts
```

### Generate a Passcode

```bash
npm run passcode generate
```

**Agent permissions:** MUST request `all` permissions (Snowflake requires network access).

## Commands Reference

### User Commands

| Command | Description |
|---------|-------------|
| `npm run passcode generate` | Generate a new passcode |
| `npm run passcode list` | List your passcodes (hints only) |
| `npm run passcode delete <id>` | Delete a passcode |

### Admin Commands (willhunter@rippling.com only)

| Command | Description |
|---------|-------------|
| `npm run passcode admin:list` | List all users with passcodes |
| `npm run passcode admin:list <email>` | List specific user's passcodes |
| `npm run passcode admin:delete <id>` | Delete any passcode |

### Skill Scripts

| Script | Description |
|--------|-------------|
| `scripts/verify-prerequisites.sh` | Check if prerequisites are met |
| `scripts/check-status.ts` | Quick status check for current user |
| `scripts/admin-list-users.ts` | Admin overview of all users |

## Workflow

### First-Time Setup

```bash
# 1. Check prerequisites
bash .cursor/skills/passcode/scripts/verify-prerequisites.sh

# 2. Generate passcode (requires all permissions)
npm run passcode generate

# 3. Save the displayed passcode - it's shown only once!

# 4. Use passcode to login at /login
```

### Generate Passcode Flow

When `npm run passcode generate` runs:

1. **Validates git email** - Must be `@rippling.com`
2. **Tests Snowflake connection** - Browser may open for SSO
3. **Generates secure passcode** - 16 random alphanumeric chars
4. **Hashes with bcrypt** - Only hash is stored
5. **Saves to database** - Associated with user
6. **Displays once** - User must save it

### Example Output

```
🔑 Generating new passcode...

📧 Git email: jane.doe@rippling.com
🔗 Testing Snowflake connection...
✅ Snowflake connection verified

═══════════════════════════════════════════════════════════

  🎉 Your new passcode:

     ABCD-1234-EFGH-5678

  ⚠️  IMPORTANT: Save this passcode now!
     It cannot be recovered after this screen.

  📝 Use this passcode to sign in at:
     https://rippling-os-2.vercel.app/login

═══════════════════════════════════════════════════════════
```

## Security

### How Passcodes Work

```
User generates passcode → System shows: "ABCD-1234-EFGH-5678"
                        → System stores: {
                            codeHash: bcrypt("ABCD1234EFGH5678"),
                            codeHint: "5678"  // last 4 chars
                          }
```

### Security Features

- **bcrypt hashing** - Passcodes stored as irreversible hashes
- **Hint only** - Only last 4 chars saved for identification
- **Show once** - Full passcode never stored or displayed again
- **30-day sessions** - Automatic expiration
- **Snowflake verification** - Ensures real data access

### Lost Passcode

If you lose a passcode:
1. Generate a new one: `npm run passcode generate`
2. Delete the old one: `npm run passcode delete <id>`

Cannot recover - this is by design for security.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Git email not configured" | `git config user.email "you@rippling.com"` |
| "Only @rippling.com emails" | Git email must be your Rippling email |
| "Failed to connect to Snowflake" | SSO may have expired - browser will open |
| "Not authorized" | You can only manage your own passcodes |
| "No passcodes found" | Run `npm run passcode generate` |

### Debug Steps

```bash
# 1. Check all prerequisites
bash .cursor/skills/passcode/scripts/verify-prerequisites.sh

# 2. Check current status
npx tsx .cursor/skills/passcode/scripts/check-status.ts

# 3. List passcodes with full details
npm run passcode list
```

## API Endpoints

The web app provides these passcode-related endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Validate passcode, create session |
| `/api/auth/logout` | POST | Destroy session |
| `/api/passcodes` | GET | List current user's passcodes |
| `/api/passcodes?id=xxx` | DELETE | Delete a passcode |

## Related Skills

- `/start` - Launch the web dashboard locally
- `/setup` - Initial repository setup
- `/share` - Share projects with other users
