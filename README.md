# PDF Notes Plugin for Obsidian 🪄

A powerful Obsidian plugin that creates seamless connections between your PDFs and markdown notes, offering two distinct modes for organizing your thoughts and annotations.




https://github.com/user-attachments/assets/71ab4787-cfbb-4414-b797-d2d7cbe30ed6




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
- The notes **are not** separated by each PDF pages
- Ideal for general note-taking and document summaries
- All thoughts and annotations in one place (you can still use sub notes)

### 🎨 Intuitive Interface
- **Sidebar View**: Dedicated PDF Notes panel in your workspace
- **Real-time Editing**: Notes save automatically as you type
- **Visual Indicators**: Clear icons showing current mode (Page/Single Note)
- **Page Lock Feature**: Lock/unlock page

### ⚙️ Flexible Organization
- **Multiple Folder Options**:
  - Same folder as PDF
  - Specific custom folder
  - Root vault folder
  - Relative folder paths
- **Batch Link Management**: View, search, and manage all PDF-note links

## 📌 How do the links work ?
<img width="851" height="64" alt="image" src="https://github.com/user-attachments/assets/7d3546cd-9e0a-4d3d-993c-4824da2c53f4" />




To remember which PDFs are associated with which Markdown files, the plugin saves a link between them.

Normally, when you rename/move/delete a file, the related link will be updated automatically ✨

But if an error occurs, you can fix a broken link between a PDF and a Markdown file: [Fix a broken link](#-fix-a-broken-link)

## 🔧 Fix a broken link
#### If a link between a Markdown file and a PDF breaks, you can repair it:
1) Use the command **Link PDF to Note** to open the link modal

2) **Delete the broken link** if it exists. You can find it using the search bar by entering the PDF or Markdown file name.

3) **Create a new link** in the "Create New Link" section:

	- Enter the PDF path in the first input.

	- Enter the Markdown note path in the second input.

4) Select Page Mode if needed using the checkbox.


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
3. **Choose your mode**:
   - Toggle Page Mode for per-page notes
   - Disable for single comprehensive note

## 📖 Usage Guide

### Creating Your First PDF Note

<img width="713" height="83" alt="9e14c5019aeeae3da53e78f83273fd3ce08d72a036aed6d2cc995a45676599a1" src="https://github.com/user-attachments/assets/7422a254-8b26-4af9-b4ba-84180857b10b" />

#### Automatic Creation
`Auto-create notes` must be *enabled* in the settings
1. Open any PDF file
2. The plugin automatically creates a linked note

#### Manual Creation
`Auto-create notes` must be *disabled* in the settings
1. Open a PDF in Obsidian
2. A modal will appear
3. Choose to *link an existing note* or *create a new one*
	- *Link existing note*: [Link Management Interface](#link-management-interface)
	- *Creating New Note*: Select Page Mode or Single Note mode

### Working with Page Mode
<img width="115" height="30" alt="9f5f89a6e6920b3243d9763b549f5abfb55887e1cd729b3baae124b9995a6580" src="https://github.com/user-attachments/assets/bf8ee7d0-696f-4ab1-8c6b-eb7ade08216b" />

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
<img width="115" height="30" alt="cd356906a7251086e3d473948dae288d50db1a57d648059763fb0bd6a81df376" src="https://github.com/user-attachments/assets/e1b481a4-0bd1-430a-912e-5dc2988f5bda" />

Write comprehensive notes in one file:
- Document summaries
- Key takeaways
- Cross-references
- Overall thoughts and analysis

### Link Management Interface

<img width="1437" height="845" alt="485080630f100102499021ba828c2417f8b7986333746eecc74c5c7cc9ceebda" src="https://github.com/user-attachments/assets/8761d09a-bdb0-420d-94bf-b05449e4831d" />

#### Access via "Link PDF to Note" command or automatically when opening a new file if not in Auto-create notes:

- Create New Links: Enter a PDF path and a note path, then choose between Single Note (📄) or Page Mode (📚) before linking.

- Search & Filter: Use the search bar to quickly find existing links by PDF or note name.

- Browse Connections: Scroll through all PDF–note links with pagination for large lists.

- Mode Indicators: Each link shows whether it uses Page Mode or Single Note.

- Delete Links: Remove a link with one click, with a confirmation step to avoid mistakes.

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
