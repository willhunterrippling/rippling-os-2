# /update-os - Sync with Main

Update your user branch with the latest changes from main.

## Trigger

User says "update", "/update-os", "sync", or "pull latest".

## Workflow

1. **Verify User Branch**
   - Check current branch is a user branch (starts with `user/`)
   - If on main, warn and abort

2. **Save Local Changes**
   - Check for uncommitted changes
   - If any, stash them: `git stash`

3. **Fetch and Rebase**
   ```bash
   git fetch origin main
   git rebase origin/main
   ```

4. **Handle Conflicts**
   - If conflicts occur, inform user and provide guidance:
     ```
     ⚠️ Conflicts detected!
     
     Conflicting files:
     - [file1]
     - [file2]
     
     To resolve:
     1. Edit the conflicting files
     2. Run: git add [files]
     3. Run: git rebase --continue
     
     Or to abort: git rebase --abort
     ```

5. **Restore Stashed Changes**
   - If changes were stashed: `git stash pop`

6. **Push Updated Branch**
   ```bash
   git push origin [current-branch] --force-with-lease
   ```

7. **Output Confirmation**
   ```
   ✅ Branch updated!
   
   Your branch is now up to date with main.
   Branch: user/[email-prefix]
   
   New features/fixes from main:
   - [list of recent commits if any]
   ```

## Shell Script Alternative

Users can also run: `./scripts/sync.sh`

## Safety Notes

- Uses `--force-with-lease` for safe force push (won't overwrite others' work)
- Preserves local uncommitted changes via stash
- If rebase fails, user can always abort

## Error Handling

- If not on a user branch, prompt to run `/setup` first
- If rebase conflicts can't be auto-resolved, provide clear instructions
