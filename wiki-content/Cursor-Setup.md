# Cursor Setup

## 🚀 Quick Start

### Account Setup
- **Email**: teamflippi@gmail.com
- **Sign in**: Use Google OAuth

### Open Project
1. Cmd+O
2. Navigate to: `~/Documents/FlippiMaster/price-scanner-app`
3. Let it index (shows progress in bottom bar)

## 💡 Key Features

### AI Chat (Cmd+L)
Ask about your codebase:
- "How does auth work?"
- "Where are API endpoints?"
- "Explain the deploy process"

### AI Edit (Cmd+K)
Select code, then:
- "Add error handling"
- "Convert to async"
- "Add comments"

### Multi-File View
- Drag tabs to split
- Cmd+\ to split current file
- See multiple files at once

## ⌨️ Essential Shortcuts

- **Cmd+P** - Quick file open
- **Cmd+Shift+F** - Search all files
- **Cmd+L** - AI chat
- **Cmd+K** - AI edit
- **Cmd+`** - Terminal

## 🔧 Recommended Settings

```json
Preferences → Settings
{
  "cursor.aiModel": "gpt-4",
  "files.exclude": {
    "node_modules": true
  }
}
```

## 💡 Cursor + Claude Workflow

**Use Cursor for:**
- Browsing code
- Quick AI edits
- Seeing structure

**Use Claude for:**
- Running commands
- Complex changes
- Deployments

## 📝 Example Workflow

1. Find issue in Cursor
2. Note file:line number
3. Tell Claude: "Fix error in server.js:156"
4. Claude makes changes
5. See updates in Cursor

[[Home]] | [[Working-with-Claude]] | [[Development-Workflow]]