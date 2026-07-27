# 📚 CLAUDE CODE - Cool Uncle Legal Lab Project Brief

**Status:** ✅ Phase 1 Data Complete - Phase 2 Setup Needed  
**Platform:** Claude Code Desktop (cowork)  
**Repository:** https://github.com/dukperado-hue/cool-uncle-legal  
**Task:** Setup repo + organize files + verify everything works

---

## 🎯 Project Overview

**Cool Uncle Legal Lab** = Thai legal education platform

### Main Components:
1. **Homepage (Index)** - Subject listings + exam countdown
2. **Codex Search** - 2,129 law articles searchable
3. **Article Viewer** - Display articles + TTS
4. **Shared Assets** - CSS, JS, Templates

### Key Features:
- 🎓 4 years of bachelor subjects (ปี 2-4)
- 📖 4 postgrad branches (แพ่ง/อาญา/วิ.แพ่ง/วิ.อาญา)
- 🔍 Full-text search (2,129 articles)
- 🎮 13 game files
- 📺 YouTube integration
- ⏰ Exam countdown timer
- 🔊 Thai TTS support

---

## 📁 Files to Setup

### **Already Created (Phase 1):**
- ✅ index-upgraded.html (NEEDS RENAME → index.html)
- ✅ codex-search.html (LIVE VERSION)
- ✅ codex-article-viewer.html
- ✅ codex-data.json (5.0 MB - 2,129 articles)
- ✅ shared.css
- ✅ tts-helper.js
- ✅ subject-hub-template.html
- ✅ All guides & documentation

### **Location of All Files:**
All files currently in: `/mnt/user-data/outputs/`

### **List of All Files to Setup:**

```
cool-uncle-legal/
├── index.html                        ← Main homepage
├── codex-search.html                 ← Search page (LIVE)
├── codex-article-viewer.html         ← Article display
├── codex-data.json                   ← Database (2,129 articles)
├── shared.css                        ← Global styles
├── tts-helper.js                     ← Thai TTS
├── subject-hub-template.html         ← Template for subjects
│
├── DOCS/
│   ├── PROJECT_SUMMARY.md
│   ├── PHASE1_COMPLETE.md
│   ├── CODEX_EXTRACTION_GUIDE.md
│   ├── CODEX_INTEGRATION.md
│   ├── README.md                     ← Create new
│   └── SETUP_GUIDE.md                ← Create new
│
├── games/                            ← Folder for game files
│   └── (13 game HTML files from uploads)
│
└── .gitignore                        ← Create new

```

---

## 🛠️ Tasks for Claude Code

### **Priority 1: GitHub Setup (FIRST)**

1. **Create/Setup GitHub Repository**
   - Repo name: `cool-uncle-legal`
   - Description: "Thai Legal Education Platform - Interactive games + Law Codex search"
   - Add README.md
   - Add .gitignore (node_modules, *, etc)

2. **Initialize in Claude Code**
   - Clone: `https://github.com/dukperado-hue/cool-uncle-legal.git`
   - Open in Claude Code Desktop
   - Verify folder structure

### **Priority 2: File Organization**

1. **Copy all files from outputs**
   - Rename: `index-upgraded.html` → `index.html`
   - Organize in proper folder structure
   - Create `games/` folder (for 13 game files)
   - Create `docs/` folder (for guides)

2. **Verify all files present:**
   ```
   ✅ index.html
   ✅ codex-search.html
   ✅ codex-article-viewer.html
   ✅ codex-data.json (5.0 MB)
   ✅ shared.css
   ✅ tts-helper.js
   ✅ subject-hub-template.html
   ✅ All documentation
   ```

### **Priority 3: Verification & Testing**

1. **Verify File Integrity**
   - Check all HTML files valid syntax
   - Check codex-data.json valid JSON
   - Check all links are correct

2. **Local Testing**
   - Start local server (python -m http.server 8000)
   - Test index.html loads
   - Test codex-search.html works
   - Test search: "276", "สัญญา", "ความผิด"
   - Verify Thai text displays correctly

3. **Check Cross-Links**
   - Index → Codex Search link works
   - Codex Search → Article Viewer link works
   - All relative paths correct

### **Priority 4: Documentation**

1. **Create README.md**
   - Project description
   - How to run locally
   - How to deploy
   - Structure overview

2. **Create SETUP_GUIDE.md**
   - How to develop
   - How to add new features
   - How to update content

3. **Organize existing docs**
   - Move to `docs/` folder
   - Update links if needed

### **Priority 5: GitHub Push**

1. **Commit all files**
   ```bash
   git add .
   git commit -m "Phase 1 Complete: Index + Codex Search System (2,129 articles)"
   git push origin main
   ```

2. **Verify on GitHub**
   - Check all files uploaded
   - Check folder structure correct
   - Check README displays

---

## 📊 Data Summary (For Reference)

### **Codex Database:**
- **Total Articles:** 2,129
- **Civil Code:** 1,731 articles
- **Criminal Code:** 398 articles
- **Keywords:** 8,207 indexed
- **File Size:** 5.0 MB

### **Article Structure:**
```json
{
  "id": "civil_276",
  "number": "276",
  "text": "Full article text here...",
  "keywords": ["keyword1", "keyword2"],
  "meta": {
    "book": "5",
    "cat": "2"
  },
  "caseLaw": [],        // Empty for Phase 1
  "examples": []        // Empty for Phase 1
}
```

### **Index Structure:**
- 🎓 Bachelor: 4 years with 17 subjects
- 📖 Postgrad: 4 branches
- 📚 Codex: 2,129 articles

---

## 🔗 Important Links

- **GitHub Repo:** https://github.com/dukperado-hue/cool-uncle-legal
- **YouTube Channel:** https://www.youtube.com/@CoolUncleLaw/videos
- **Current Files:** `/mnt/user-data/outputs/`

---

## ⚙️ Technical Details

### **Frontend Stack:**
- HTML5
- CSS3 (with design system variables)
- Vanilla JavaScript (no frameworks)
- Web Speech API (for TTS)

### **Database:**
- JSON (codex-data.json)
- Loaded client-side
- Searchable by: number, keywords, book type

### **Browser Support:**
- Chrome/Edge/Safari/Firefox (modern versions)
- Mobile responsive
- Thai font support (Noto Serif Thai, Sarabun)

### **Performance:**
- First load: ~3 seconds
- Search: < 1 second
- Gzipped size: ~1.5 MB

---

## 📋 Quality Checklist

Before pushing to GitHub, verify:

- [ ] All HTML files valid (no syntax errors)
- [ ] All links working (relative paths correct)
- [ ] codex-data.json valid JSON (can parse)
- [ ] Thai text displays correctly (no garbled characters)
- [ ] Search works (test with "276", "สัญญา")
- [ ] Mobile responsive (test on mobile view)
- [ ] No console errors (F12)
- [ ] README.md complete
- [ ] .gitignore present
- [ ] All files in proper folders

---

## 🎯 Success Criteria

✅ **Phase 1 Complete When:**

1. GitHub repo created & organized
2. All files properly uploaded
3. README describes project
4. Local test passes (all links work)
5. Search system verified working
6. Documentation complete

---

## 💡 Notes for Claude Code

### **Key Decisions Made:**
1. **Database:** JSON (not DB) for Phase 1
2. **Framework:** Vanilla JS (no dependencies)
3. **Deployment:** Ready for GitHub Pages/Vercel/Netlify
4. **Phase 2:** Case laws & admin panel (placeholder for now)

### **Structure Rationale:**
- Flat file structure (simple, no build step needed)
- JSON database searchable client-side
- Responsive design (mobile-first)
- Thai support built-in

### **Common Issues & Solutions:**
| Problem | Solution |
|---------|----------|
| Thai text garbled | UTF-8 encoding check |
| Search doesn't work | Check codex-data.json loads (Network tab) |
| Links broken | Verify relative paths, case-sensitive |
| Slow search | Normal for 2MB+ data, optimize Phase 2 |

---

## 🚀 Next After This Setup

### **Immediate (After GitHub Setup):**
- ✅ Deploy to GitHub Pages / Vercel
- ✅ Test live deployment
- ✅ Share URL

### **Phase 2 (Future):**
- Add case laws
- Build admin panel
- Add analytics
- Optimize search

---

## 📞 Questions for Claude Code

If anything unclear:
1. **Check:** PROJECT_SUMMARY.md (overview)
2. **Check:** PHASE1_COMPLETE.md (deployment details)
3. **Check:** CODEX_INTEGRATION.md (how systems connect)
4. **Look at:** codex-schema.json (data structure)

---

## ✨ Let's Do This!

**Claude Code, you got this!** 

Your mission:
1. ✅ Setup GitHub repo
2. ✅ Organize all files
3. ✅ Verify everything works
4. ✅ Push to GitHub
5. ✅ Create README

**Ready? Let's go!** 🚀
