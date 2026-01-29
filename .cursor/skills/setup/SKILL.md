# /setup - Branch Setup

Set up your personal user branch for working in Rippling OS.

## Trigger

User says "setup", "/setup", or starts fresh without a user branch.

## Workflow

1. **Get User Email**
   - Read from `RIPPLING_ACCOUNT_EMAIL` environment variable
   - If not set, ask the user for their Rippling email

2. **Extract Branch Name**
   - Take the prefix before `@` (e.g., `will.smith` from `will.smith@rippling.com`)
   - Branch name format: `user/[email-prefix]`

3. **Check Branch Existence**
   - Run: `git fetch origin`
   - Check if `user/[email-prefix]` exists: `git branch -r | grep "origin/user/[email-prefix]"`

4. **Create or Switch to Branch**
   - If branch doesn't exist:
     ```bash
     git checkout main
     git pull origin main
     git checkout -b user/[email-prefix]
     git push -u origin user/[email-prefix]
     ```
   - If branch exists:
     ```bash
     git fetch origin
     git checkout user/[email-prefix]
     git pull origin user/[email-prefix]
     ```

5. **Output Welcome Message**
   ```
   ✅ Setup complete!
   
   Your branch: user/[email-prefix]
   Preview URL: https://rippling-os-2-git-user-[email-prefix].vercel.app
   
   Next steps:
   1. Run /create-project to start a new analysis
   2. Run /query to execute SQL and cache results
   3. Run /save to commit your work
   ```

## Shell Script Alternative

Users can also run: `./scripts/setup-branch.sh`

## Environment Requirements

- `RIPPLING_ACCOUNT_EMAIL` must be set in `.env` file
- Git must be configured with push access to the repository

## Error Handling

- If `RIPPLING_ACCOUNT_EMAIL` is not set, prompt user to set it
- If git operations fail, show the error and suggest checking permissions
