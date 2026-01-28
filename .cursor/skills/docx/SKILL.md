---
name: docx
description: "Comprehensive Word document creation, editing, and analysis. Use when working with .docx files: creating new documents, editing with tracked changes, adding comments, extracting text, or analyzing document structure."
---

# DOCX Processing

This skill provides capabilities for creating, editing, and analyzing Word documents (.docx files).

## Setup

This skill is located at `~/.cursor/skills/docx`. Set the path before running commands:

```bash
DOCX_SKILL="$HOME/.cursor/skills/docx"
```

## Workflow Decision Tree

### Creating New Document
Use **docx-js** (JavaScript/TypeScript)

### Editing Existing Document
- **Simple changes to your own document**: Basic OOXML editing
- **Someone else's document**: Use **Redlining workflow** (recommended)
- **Legal, academic, business, government docs**: Use **Redlining workflow** (required)

### Reading/Analyzing Content
Use pandoc or raw XML access

---

## Creating New Documents

Use docx-js to create Word documents programmatically.

### Workflow
1. **MANDATORY**: Read the complete docx-js reference: [docx-js.md](docx-js.md)
2. Create JavaScript/TypeScript file using Document, Paragraph, TextRun components
3. Export as .docx using `Packer.toBuffer()`

### Quick Example
```javascript
const { Document, Packer, Paragraph, TextRun } = require('docx');
const fs = require('fs');

const doc = new Document({
  sections: [{
    children: [
      new Paragraph({ children: [new TextRun({ text: "Hello World", bold: true })] })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => fs.writeFileSync("output.docx", buffer));
```

### Dependencies
```bash
npm install -g docx  # If not installed
```

---

## Reading Document Content

### Text Extraction (via pandoc)
```bash
# Convert to markdown with tracked changes preserved
pandoc --track-changes=all document.docx -o output.md
# Options: --track-changes=accept/reject/all
```

### Raw XML Access
For comments, complex formatting, metadata, or embedded media:
```bash
# Unpack document
python "$DOCX_SKILL/ooxml/scripts/unpack.py" document.docx unpacked/

# Key files:
# - word/document.xml  - Main content
# - word/comments.xml  - Comments
# - word/media/        - Embedded images
```

---

## Editing Documents (Redlining)

Use the Python Document library for tracked changes and comments.

### Workflow
1. **MANDATORY**: Read the complete OOXML reference: [ooxml.md](ooxml.md)
2. Unpack the document:
   ```bash
   python "$DOCX_SKILL/ooxml/scripts/unpack.py" document.docx unpacked/
   ```
3. Create and run Python script (see Document Library below)
4. Pack the final document:
   ```bash
   python "$DOCX_SKILL/ooxml/scripts/pack.py" unpacked/ output.docx
   ```

### Document Library Usage

Run scripts with PYTHONPATH set:
```bash
PYTHONPATH="$DOCX_SKILL" python your_script.py
```

```python
from scripts.document import Document, DocxXMLEditor

# Initialize
doc = Document('unpacked')

# Find and replace with tracked changes
node = doc["word/document.xml"].get_node(tag="w:r", contains="old text")
rpr = tags[0].toxml() if (tags := node.getElementsByTagName("w:rPr")) else ""
replacement = f'<w:del><w:r>{rpr}<w:delText>old text</w:delText></w:r></w:del><w:ins><w:r>{rpr}<w:t>new text</w:t></w:r></w:ins>'
doc["word/document.xml"].replace_node(node, replacement)

# Add comment
start = doc["word/document.xml"].get_node(tag="w:p", contains="target text")
doc.add_comment(start=start, end=start, text="Comment text")

# Save
doc.save()
```

### Key Principle: Minimal Edits
Only mark text that actually changes. Keep unchanged text outside `<w:del>`/`<w:ins>` tags:

```python
# BAD - replaces entire sentence
'<w:del><w:delText>The term is 30 days.</w:delText></w:del><w:ins><w:t>The term is 60 days.</w:t></w:ins>'

# GOOD - only marks the changed number
'<w:r><w:t>The term is </w:t></w:r><w:del><w:r><w:delText>30</w:delText></w:r></w:del><w:ins><w:r><w:t>60</w:t></w:r></w:ins><w:r><w:t> days.</w:t></w:r>'
```

---

## Converting Documents to Images

```bash
# Step 1: Convert DOCX to PDF
soffice --headless --convert-to pdf document.docx

# Step 2: Convert PDF pages to JPEG
pdftoppm -jpeg -r 150 document.pdf page
# Creates page-1.jpg, page-2.jpg, etc.
```

---

## Dependencies

| Tool | Install Command | Purpose |
|------|-----------------|---------|
| pandoc | `brew install pandoc` | Text extraction |
| docx | `npm install -g docx` | Creating documents |
| LibreOffice | `brew install --cask libreoffice` | PDF conversion |
| Poppler | `brew install poppler` | PDF to images |
| defusedxml | `pip install defusedxml` | Secure XML parsing |

---

## Additional Resources

For complete API details and patterns, read the reference files:
- **Creating documents**: [docx-js.md](docx-js.md)
- **Editing documents**: [ooxml.md](ooxml.md)
