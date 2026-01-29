# /save - DEPRECATED

**This skill is deprecated.** Data is now stored in the database, not git.

## Why Deprecated?

With the new database architecture:
- Projects, queries, dashboards, and reports are stored in Vercel Postgres
- No local files to commit
- Changes are saved to the database immediately when you use `/query`, `/report`, etc.
- No user branches - everyone works on `main`

## What to Use Instead

| Old Workflow | New Workflow |
|--------------|--------------|
| `/query` then `/save` | Just `/query` - results saved to DB automatically |
| Edit dashboard, `/save` | Edit via web UI or `/query` with widget add |
| Create report, `/save` | Just `/report` - saved to DB automatically |

## If User Asks to Save

Tell them:
```
Your changes are already saved! With the new database architecture,
all your work is automatically saved when you run commands like
/query or /report.

There's no need to commit anymore - your data is safely stored
in the cloud database.
```

## Legacy Support

If you need to commit actual code changes (not data), use standard git:
```bash
git add -A
git commit -m "Your message"
git push
```

But note: user data should NOT be in git anymore.
