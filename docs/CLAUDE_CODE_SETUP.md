# 🖥️ Claude Code Desktop - Setup Guide

**What:** Claude Code = Desktop app version of Claude ที่จัดการ files + folders ได้  
**Goal:** ใช้ claude code ช่วยจัดการ project ตั้งแต่ index จนถึงฐานข้อมูล

---

## 📥 Step 1: Install Claude Code Desktop

### **Download:**
1. Go to: https://www.anthropic.com/news/claude-code
2. Click "Download Claude Desktop"
3. Choose your OS (Mac/Windows/Linux)

### **Install:**
- **Mac:** Drag to Applications
- **Windows:** Run installer
- **Linux:** Follow instructions

### **Launch:**
- Open Claude app (same as web claude.ai)
- Look for "Code" tab at bottom
- Click → Opens Claude Code Desktop

---

## 🔑 Step 2: Connect GitHub

### **Before You Start:**
1. Sign in to GitHub (https://github.com)
2. Go to: Settings → Developer settings → Personal access tokens → Tokens (classic)
3. Click "Generate new token"
4. **Scopes needed:** ✅ repo (full control)
5. Copy token (you'll need it)

### **In Claude Code:**
1. Open Claude Code Desktop
2. Click menu (three lines) → Settings → GitHub
3. Paste your token
4. Click "Connect"
5. Done! ✅

---

## 📂 Step 3: Create/Clone Repository

### **Option A: Create New Repo (If doesn't exist yet)**

**In Claude Code:**
1. Click "New Repository"
2. Name: `cool-uncle-legal`
3. Description: "Thai Legal Education Platform"
4. Click "Create"
5. Claude creates folder + initializes git

### **Option B: Clone Existing Repo (If already have)**

**In Claude Code:**
1. Click "Clone Repository"
2. Enter: `https://github.com/dukperado-hue/cool-uncle-legal.git`
3. Click "Clone"
4. Wait for download

---

## 📋 Step 4: Copy All Files

### **Get Files From `/mnt/user-data/outputs/`**

**Method 1: Direct Copy (If you have access)**
```bash
cp -r /mnt/user-data/outputs/* ~/cool-uncle-legal/
```

**Method 2: Download One-by-One**
1. Go to `/mnt/user-data/outputs/`
2. Download these files:
   ```
   ✅ index-upgraded.html  → RENAME to: index.html
   ✅ codex-search.html
   ✅ codex-article-viewer.html
   ✅ codex-data.json
   ✅ shared.css
   ✅ tts-helper.js
   ✅ subject-hub-template.html
   ✅ All .md files
   ```
3. Drag into Claude Code folder

### **In Claude Code:**

1. Right-click in file tree
2. Click "New Folder"
3. Create: `docs/`, `games/` folders
4. Drag files into proper folders

**Final Structure:**
```
cool-uncle-legal/
├── index.html                  ← Main (renamed from index-upgraded.html)
├── codex-search.html           ← Search page
├── codex-article-viewer.html   ← Article display
├── codex-data.json             ← Database
├── shared.css                  ← Styles
├── tts-helper.js               ← Thai TTS
├── subject-hub-template.html   ← Template
│
├── docs/
│   ├── PROJECT_SUMMARY.md
│   ├── PHASE1_COMPLETE.md
│   ├── CODEX_EXTRACTION_GUIDE.md
│   ├── CODEX_INTEGRATION.md
│   └── CLAUDE_CODE_BRIEF.md    ← This brief
│
├── games/
│   ├── (13 game files from uploads)
│   └── ...
│
├── README.md                   ← Create new
├── .gitignore                  ← Create new
└── LICENSE                     ← Optional
```

---

## ✏️ Step 5: Create README & .gitignore

### **Create README.md**

In Claude Code:
1. Click "New File"
2. Name: `README.md`
3. Add this content:

```markdown
# 📚 Cool Uncle Legal Lab

Thai legal education platform with interactive games and codex search.

## Features
- 🎓 Bachelor subjects (ปี 2-4)
- 📖 Postgraduate branches
- 🔍 2,129 law articles searchable
- 🎮 Interactive games
- 📺 YouTube integration

## Quick Start

1. Open `index.html` in browser
2. Use `codex-search.html` to search articles
3. Try search: "276" or "สัญญา"

## Structure
- `index.html` - Main homepage
- `codex-search.html` - Article search
- `codex-data.json` - Database (2,129 articles)
- `shared.css` - Styles
- `tts-helper.js` - Thai text-to-speech

## Deployment
- GitHub Pages: Enable in repo settings
- Vercel: Connect GitHub repo
- Netlify: Drag & drop folder

## Phase 2 (Coming Soon)
- Case laws
- Examples
- Admin panel
```

### **Create .gitignore**

In Claude Code:
1. Click "New File"
2. Name: `.gitignore`
3. Add:

```
# Node
node_modules/
package-lock.json

# IDEs
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Logs
*.log

# Temp
*.tmp
~*
```

---

## 🔍 Step 6: Verify Files

### **In Claude Code, Check:**

1. **All HTML files present**
   - [ ] index.html (renamed)
   - [ ] codex-search.html
   - [ ] codex-article-viewer.html

2. **Database OK**
   - [ ] codex-data.json (should be 5.0 MB)
   - Click it → preview should show JSON structure

3. **Assets OK**
   - [ ] shared.css
   - [ ] tts-helper.js
   - [ ] subject-hub-template.html

4. **Docs OK**
   - [ ] docs/ folder created
   - [ ] All .md files inside
   - [ ] README.md in root

---

## 🧪 Step 7: Test Locally

### **In Claude Code:**

1. Click "Terminal" (bottom of screen)
2. Type:
   ```bash
   cd ~/cool-uncle-legal
   python -m http.server 8000
   ```
3. Opens browser to: `http://localhost:8000`

### **Test Checklist:**

- [ ] index.html loads
- [ ] All styles apply (not plain text)
- [ ] Codex Search loads
- [ ] Search "276" → returns results
- [ ] Search "สัญญา" → returns results
- [ ] Thai text displays correctly (not garbled)
- [ ] No console errors (open F12)

---

## 📤 Step 8: Commit & Push

### **In Claude Code:**

1. Click "Source Control" (left sidebar)
2. You should see all new files listed
3. Write commit message:
   ```
   Phase 1 Complete: Index + Codex System (2,129 articles)
   ```
4. Click checkmark ✓ to stage
5. Click "Commit" button
6. Click "Sync" (or "Push")

### **Verify on GitHub:**

1. Go to: https://github.com/dukperado-hue/cool-uncle-legal
2. Should see all files uploaded
3. README should display

---

## 🚀 Step 9: Deploy (Pick One)

### **Option 1: GitHub Pages**

In Claude Code terminal:
```bash
# No need to do anything - files already in GitHub
# Just enable in repo settings:
# Settings → Pages → Source: main → Save
```

Wait 1-2 minutes, then visit:
```
https://dukperado-hue.github.io/cool-uncle-legal/
```

### **Option 2: Vercel**

In Claude Code terminal:
```bash
npm install -g vercel
vercel
```

Follow prompts. Auto-generates URL like: `cool-uncle-legal.vercel.app`

### **Option 3: Netlify**

1. Go to https://netlify.com
2. Drag & drop `cool-uncle-legal` folder
3. Auto-generates URL

---

## 💬 Asking Claude Code for Help

### **How to Use Claude Code in This Project:**

**Example 1: Ask about structure**
```
"Explain the folder structure of this project"
→ Claude Code reads files + explains
```

**Example 2: Fix a bug**
```
"Search isn't working. Check codex-search.html"
→ Claude Code opens file + fixes
```

**Example 3: Create new file**
```
"Create a new file admin-panel.html with structure..."
→ Claude Code creates + writes content
```

**Example 4: Update content**
```
"Update README.md to add deployment instructions"
→ Claude Code edits file
```

---

## 📊 Workflow (Going Forward)

### **When You Need to Update:**

1. **Open Claude Code Desktop**
2. **Open project folder**
3. **Tell Claude Code what you need:**
   - "Add case law to article 276"
   - "Create admin panel for adding examples"
   - "Fix search not finding keyword X"
   - "Update codex-data.json with new articles"
4. **Claude Code edits files**
5. **Push to GitHub** (Source Control tab)

---

## ⚠️ Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| **Files not uploading** | Check GitHub token valid + "repo" scope enabled |
| **Search doesn't work** | Claude Code: verify codex-data.json syntax |
| **Thai text garbled** | Check UTF-8 encoding in files (F12 → Sources) |
| **Links broken** | Claude Code: verify relative paths |
| **Terminal won't open** | Try: View → Terminal (or Ctrl+`) |

---

## 🎯 Quick Checklist

Before calling it "done":

```
✅ Claude Code Desktop installed
✅ GitHub connected
✅ Repository created/cloned
✅ All files copied to repo
✅ Folder structure organized
✅ README.md created
✅ .gitignore created
✅ Local test passes (search works)
✅ Files committed & pushed to GitHub
✅ README displays on GitHub
✅ Deployed to GitHub Pages / Vercel / Netlify
✅ Live URL works
```

---

## 🎉 You're Done!

Once all above done:
- ✅ Project in GitHub
- ✅ Live on internet
- ✅ Search system working
- ✅ Ready for Phase 2

**Next time you need to:**
- Edit files → Use Claude Code
- Add features → Ask Claude Code
- Deploy → Push via Claude Code

---

## 📞 Need Help?

In Claude Code, just ask:
```
"I need to [thing you want to do]"
```

Claude Code will help! 🚀

---

**Ready? Open Claude Code & let's go!** ✨
