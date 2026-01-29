# /save - Commit & Push Changes

Save your work by committing and pushing to your user branch.

## Trigger

User says "save", "/save", "commit", or "push my changes".

## Workflow

1. **Verify User Branch**
   - Check current branch is a user branch (starts with `user/`)
   - If on main, warn and abort

2. **Check for Changes**
   - Run: `git status --porcelain`
   - If no changes, inform user and exit

3. **Stage Changes**
   - Stage all changes: `git add -A`
   - Or stage specific project folder if specified

4. **Generate Commit Message**
   - If user provided a message, use it
   - Otherwise, generate from the diff:
     - Look at changed files
     - Summarize: "Update [project-name]: [brief description]"

5. **Commit and Push**
   ```bash
   git commit -m "[generated or provided message]"
   git push origin [current-branch]
   ```

6. **Output Confirmation**
   ```
   ✅ Changes saved!
   
   Committed: [commit hash]
   Branch: user/[email-prefix]
   Preview URL: https://rippling-os-2-git-user-[email-prefix].vercel.app
   
   Changes will be deployed in ~1-2 minutes.
   ```

## Shell Script Alternative

Users can also run: `./scripts/save.sh "optional commit message"`

## Safety Checks

- NEVER commit to main branch
- NEVER commit `.env` files
- Warn if committing large files (>1MB)

## Error Handling

- If not on a user branch, **ask the user** if they'd like to set up their personal branch first—if yes, run `/setup` and then retry the save
- If push fails due to conflicts, suggest running `/update-os`
