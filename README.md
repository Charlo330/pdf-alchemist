# PDF Notes Plugin for Obsidian 🪄

A powerful Obsidian plugin that creates seamless connections between your PDFs and markdown notes, offering two distinct modes for organizing your thoughts and annotations.

## ✨ Features

### 🔗 Smart PDF-Note Linking
- **Automatic Note Creation**: Automatically generate markdown notes when opening PDFs
- **Manual Link Management**: Create custom links between any PDF and markdown file
- **Bidirectional Navigation**: Seamlessly switch between PDFs and their linked notes
- **Link Repair System**: Automatically detect broken links

### 📄 Dual Note Modes

#### 📚 Page Mode
- Create **separate notes for each PDF page**
- Perfect for detailed academic reading and research
- Page-synchronized navigation - notes automatically update as you navigate through the PDF
- Organized structure with clear page headers (`###### Page N`)

#### 📝 Single Note Mode
- Create **one comprehensive note per PDF**
- Ideal for general note-taking and document summaries
- All thoughts and annotations in one place

### 🎨 Intuitive Interface
- **Sidebar View**: Dedicated PDF Notes panel in your workspace
- **Real-time Editing**: Notes save automatically as you type
- **Visual Indicators**: Clear icons showing current mode (Page/Single Note)
- **Page Lock Feature**: Lock/unlock page synchronization

### ⚙️ Flexible Organization
- **Multiple Folder Options**:
  - Same folder as PDF
  - Specific custom folder
  - Root vault folder
  - Relative folder paths
- **Batch Link Management**: View, search, and manage all PDF-note links

## 🚀 Getting Started

### Installation
1. Open Obsidian Settings
2. Go to Community Plugins
3. Search for "PDF Notes"
4. Install and enable the plugin

### Quick Setup
1. **Open a PDF** in Obsidian
2. **Access PDF Notes** via:
   - Command Palette: "Open PDF Notes"
   - Ribbon icon (🪄)
   - Right-click → "Open PDF Notes"
3. **Choose your mode**:
   - Toggle Page Mode for per-page notes
   - Disable for single comprehensive note

## 📖 Usage Guide

### Creating Your First PDF Note

#### Automatic Creation
1. Enable "Auto-create notes" in settings
2. Open any PDF file
3. The plugin automatically creates a linked note

#### Manual Creation
1. Use Command: "Link PDF to Note"
2. Select your PDF file
3. Choose or create a markdown file
4. Select Page Mode or Single Note mode
5. Click "Create Link"

### Working with Page Mode

```markdown
###### Page 1
Your notes for page 1 go here...

###### Page 2
Notes for page 2...

###### Page 5
You can skip pages - only pages with notes are saved...
```

- Navigate through your PDF
- Notes automatically sync to the current page
- Only pages with content are saved
- Clean, organized structure

### Working with Single Note Mode

Write comprehensive notes in one file:
- Document summaries
- Key takeaways
- Cross-references
- Overall thoughts and analysis

### Link Management Interface

Access via "Link PDF to Note" command:

- **Create New Links**: Connect any PDF to any markdown file
- **Search & Filter**: Find links quickly with real-time search
- **Bulk Management**: View all your PDF-note connections
- **Visual Mode Indicators**: See which links use Page Mode vs Single Note
- **Easy Deletion**: Remove links with confirmation dialogs

## ⚙️ Settings

### General Settings
- **Auto-create notes**: Automatically generate notes for new PDFs
- **Default Page Mode**: Choose default mode for new links
- **Note Location**: Configure where new notes are created

### Folder Location Options
- **Root Folder**: Create notes in vault root
- **Specific Folder**: Choose a dedicated notes folder
- **Same as PDF**: Keep notes beside their PDFs
- **Relative Path**: Use custom relative paths (e.g., `./notes`, `../research`)

## 🔧 Advanced Features

### File System Integration
- **Automatic Sync**: Links update when files are moved or renamed
- **Cleanup**: Automatically remove links when files are deleted
- **Path Validation**: Ensure all links remain valid

### Context Menu Integration
Right-click any PDF or markdown file to:
- **Show Linked File**: Instantly see what's connected
- **Create/Repair Links**: Quick access to link management

## 🎨 UI Components

### Main Sidebar
- **PDF Title**: Current document name with mode indicator
- **Page Counter**: Real-time page tracking (Page Mode)
- **Navigation Controls**: Back/Home buttons for sub-notes
- **Mode Toggle**: Switch between locked/unlocked page sync

### Visual Indicators
- 📚 **Page Mode Icon**: Stack of files (`file-stack`)
- 📝 **Single Note Icon**: Single file (`file`)
- 🔒 **Lock Status**: Locked (red) / Unlocked (green)
- 🏠 **Navigation**: Clear breadcrumb system

## 🛠️ Technical Details

### Architecture
- **Dependency Injection**: Clean, modular codebase using InversifyJS
- **State Management**: Centralized application state
- **Event-Driven**: Responsive to Obsidian workspace changes
- **Type-Safe**: Full TypeScript implementation

### Data Storage
- **JSON Index**: Lightweight `pdf-note-index.json` file
- **Non-Intrusive**: No modification of your existing files
- **Portable**: Easy backup and sync across devices

### Performance
- **Lazy Loading**: Only load notes when needed
- **Debouncing**: Only save notes when the user stops typing
- **Memory Conscious**: Clean resource management

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for:
- Code style standards
- Testing requirements
- Pull request process
- Issue reporting

## 📄 License

TODO NEED HELP FOR THIS
## 🙏 Acknowledgments

Built with:
- [Obsidian API](https://docs.obsidian.md/)
- [InversifyJS](https://inversify.io/) for dependency injection
- [Embeddable Editor](https://gist.github.com/Fevol/caa478ce303e69eabede7b12b2323838) for rich text editing

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Charlo330/pdf-alchemist/issues)
- **Community**: Join the conversation in Obsidian Discord

---

**Transform your PDF reading experience with seamless note-taking integration! 🪄**
