# Wiki Upload TODO

## Current Status
✅ Wiki initialized on GitHub
✅ Wiki repository cloned to: `wiki-repo/`
✅ All wiki content files copied to `wiki-repo/`

## Next Steps
From the `price-scanner-app` directory, run:

```bash
# 1. Navigate to wiki repository
cd wiki-repo

# 2. Check status
git status

# 3. Add all files
git add .

# 4. Commit with message
git commit -m "Add comprehensive wiki documentation"

# 5. Push to GitHub
git push origin master
# or
git push origin main
# (check which branch with: git branch)
```

## Files Ready to Upload
- Home.md - Combined customer & dev documentation
- _Sidebar.md - Navigation structure
- Architecture.md - System design
- API-Documentation.md - Endpoint reference
- Blue-Environment-Setup.md - Blue server details
- Coding-Practices.md - Team coding standards
- Common-Issues.md - FAQ
- Deployment-Guide.md - GitHub Actions guide
- Development-Workflow.md - Dev process
- Troubleshooting.md - Debug guide

## After Upload
The wiki will be live at:
https://github.com/johnjhusband/price-scanner-app/wiki

All pages will be searchable and interconnected via [[WikiLinks]].