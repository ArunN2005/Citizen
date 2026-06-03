const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, LevelFormat, PageNumber, PageBreak, TabStopType,
  TabStopPosition, UnderlineType
} = require("docx");
const fs = require("fs");

// ── COLOURS ──────────────────────────────────────────────────────────────────
const BLUE      = "1F4E79";   // dark navy — headings
const ACCENT    = "2563EB";   // brand blue — section header bars
const LIGHT_BG  = "EFF6FF";   // very light blue — info boxes
const CODE_BG   = "F3F4F6";   // light grey — code blocks
const TABLE_HDR = "1F4E79";   // navy — table headers
const TABLE_ALT = "F0F4FF";   // alternating row
const WHITE     = "FFFFFF";
const TEXT      = "1A1A1A";
const MUTED     = "6B7280";
const BORDER_C  = "CCCCCC";
const WARN_BG   = "FFF7ED";
const WARN_BDR  = "F59E0B";

// ── HELPERS ───────────────────────────────────────────────────────────────────
const border1 = { style: BorderStyle.SINGLE, size: 1, color: BORDER_C };
const cellBorders = { top: border1, bottom: border1, left: border1, right: border1 };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function spacer(pts = 120) {
  return new Paragraph({ children: [], spacing: { before: pts, after: 0 } });
}

function hr() {
  return new Paragraph({
    children: [],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 1 } },
    spacing: { before: 160, after: 160 },
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, color: WHITE, bold: true, size: 40, font: "Arial" })],
    shading: { fill: BLUE, type: ShadingType.CLEAR },
    spacing: { before: 0, after: 200 },
    indent: { left: 180, right: 180 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: ACCENT } },
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, color: WHITE, bold: true, size: 30, font: "Arial" })],
    shading: { fill: ACCENT, type: ShadingType.CLEAR },
    spacing: { before: 240, after: 160 },
    indent: { left: 0 },
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, color: BLUE, bold: true, size: 26, font: "Arial" })],
    spacing: { before: 200, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "D1D5DB", space: 1 } },
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, color: TEXT, size: 22, font: "Arial", ...opts })],
    spacing: { before: 60, after: 80 },
  });
}

// Rich paragraph: array of {text, bold, italic, code, color}
function richPara(runs, spacing = {}) {
  return new Paragraph({
    children: runs.map(r => new TextRun({
      text: r.text,
      bold: r.bold || false,
      italic: r.italic || false,
      color: r.color || TEXT,
      size: r.code ? 20 : 22,
      font: r.code ? "Courier New" : "Arial",
      shading: r.code ? { fill: CODE_BG, type: ShadingType.CLEAR } : undefined,
    })),
    spacing: { before: 60, after: 80, ...spacing },
  });
}

function bullet(text, level = 0, bold = false) {
  const indent = level === 0
    ? { left: 720, hanging: 360 }
    : { left: 1080, hanging: 360 };
  return new Paragraph({
    numbering: { reference: "bullets", level },
    children: [new TextRun({ text, color: TEXT, size: 22, font: "Arial", bold })],
    spacing: { before: 40, after: 40 },
    indent,
  });
}

function numbered(text, ref = "numbers") {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    children: [new TextRun({ text, color: TEXT, size: 22, font: "Arial" })],
    spacing: { before: 60, after: 60 },
    indent: { left: 720, hanging: 360 },
  });
}

function codeBlock(lines) {
  return lines.map((line, i) => new Paragraph({
    children: [new TextRun({ text: line || " ", font: "Courier New", size: 18, color: "1F2937" })],
    shading: { fill: CODE_BG, type: ShadingType.CLEAR },
    spacing: { before: i === 0 ? 80 : 0, after: i === lines.length - 1 ? 80 : 0 },
    indent: { left: 360, right: 360 },
    border: i === 0
      ? { top: border1, left: border1, right: border1 }
      : i === lines.length - 1
        ? { bottom: border1, left: border1, right: border1 }
        : { left: border1, right: border1 },
  }));
}

function infoBox(labelText, bodyLines) {
  const rows = [
    new TableRow({
      children: [new TableCell({
        borders: noBorders,
        shading: { fill: LIGHT_BG, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 60, left: 180, right: 180 },
        children: [new Paragraph({
          children: [new TextRun({ text: labelText, bold: true, color: BLUE, size: 22, font: "Arial" })],
          spacing: { before: 0, after: 60 },
        })],
      })],
    }),
    ...bodyLines.map(line => new TableRow({
      children: [new TableCell({
        borders: noBorders,
        shading: { fill: LIGHT_BG, type: ShadingType.CLEAR },
        margins: { top: 0, bottom: 40, left: 360, right: 180 },
        children: [new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          children: [new TextRun({ text: line, color: TEXT, size: 21, font: "Arial" })],
          spacing: { before: 0, after: 0 },
          indent: { left: 720, hanging: 360 },
        })],
      })],
    })),
    new TableRow({
      children: [new TableCell({
        borders: noBorders,
        shading: { fill: LIGHT_BG, type: ShadingType.CLEAR },
        margins: { top: 0, bottom: 80, left: 180, right: 180 },
        children: [new Paragraph({ children: [] })],
      })],
    }),
  ];
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: ACCENT },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_C },
      left: { style: BorderStyle.SINGLE, size: 4, color: ACCENT },
      right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_C },
    },
  });
}

function twoColTable(headers, rows, colWidths = [3120, 6240]) {
  const hdrRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      borders: cellBorders,
      shading: { fill: TABLE_HDR, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      width: { size: colWidths[i], type: WidthType.DXA },
      children: [new Paragraph({
        children: [new TextRun({ text: h, bold: true, color: WHITE, size: 22, font: "Arial" })],
      })],
    })),
  });
  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => new TableCell({
      borders: cellBorders,
      shading: { fill: ri % 2 === 0 ? WHITE : TABLE_ALT, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      width: { size: colWidths[ci], type: WidthType.DXA },
      children: [new Paragraph({
        children: [new TextRun({ text: cell, color: TEXT, size: 21, font: ci === 1 && cell.startsWith("/") ? "Courier New" : "Arial" })],
      })],
    })),
  }));
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [hdrRow, ...dataRows],
  });
}

function stepTable(steps) {
  const hdrRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        borders: cellBorders,
        shading: { fill: TABLE_HDR, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        width: { size: 720, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: "#", bold: true, color: WHITE, size: 22, font: "Arial" })] })],
      }),
      new TableCell({
        borders: cellBorders,
        shading: { fill: TABLE_HDR, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        width: { size: 2160, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: "Step", bold: true, color: WHITE, size: 22, font: "Arial" })] })],
      }),
      new TableCell({
        borders: cellBorders,
        shading: { fill: TABLE_HDR, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        width: { size: 6480, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: "What Happens", bold: true, color: WHITE, size: 22, font: "Arial" })] })],
      }),
    ],
  });
  const dataRows = steps.map(([num, step, what], ri) => new TableRow({
    children: [
      new TableCell({
        borders: cellBorders,
        shading: { fill: ri % 2 === 0 ? WHITE : TABLE_ALT, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        width: { size: 720, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ children: [new TextRun({ text: num, bold: true, color: ACCENT, size: 22, font: "Arial" })] })],
      }),
      new TableCell({
        borders: cellBorders,
        shading: { fill: ri % 2 === 0 ? WHITE : TABLE_ALT, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        width: { size: 2160, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: step, bold: true, color: TEXT, size: 22, font: "Arial" })] })],
      }),
      new TableCell({
        borders: cellBorders,
        shading: { fill: ri % 2 === 0 ? WHITE : TABLE_ALT, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        width: { size: 6480, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: what, color: TEXT, size: 21, font: "Arial" })] })],
      }),
    ],
  }));
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [720, 2160, 6480],
    rows: [hdrRow, ...dataRows],
  });
}

// ── BUILD ─────────────────────────────────────────────────────────────────────
const children = [

  // ── COVER ──────────────────────────────────────────────────────────────────
  new Paragraph({
    children: [new TextRun({ text: "LAZARUS OS", bold: true, size: 60, color: BLUE, font: "Arial" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 1440, after: 120 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Technical Setup & User Manual", size: 36, color: MUTED, font: "Arial" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "repo-read Skill  ·  GitNexus", size: 26, color: MUTED, font: "Arial" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 0 },
  }),
  new Paragraph({
    children: [],
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: ACCENT } },
    spacing: { before: 300, after: 600 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Who is this document for?", bold: true, size: 24, color: TEXT, font: "Arial" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 120 },
  }),
  new Paragraph({
    children: [new TextRun({
      text: "This document is written for anyone who is new to Lazarus OS and needs to understand what it does, how it is set up on the EC2 server, and how to use it. No prior knowledge of the system is assumed.",
      size: 22, color: TEXT, font: "Arial",
    })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 1440 },
  }),
  new Paragraph({ children: [new PageBreak()] }),

  // ── SECTION 1: OVERVIEW ────────────────────────────────────────────────────
  h1("1.  What Is Lazarus OS?"),
  spacer(120),
  para("Lazarus OS is an internal automation platform that runs on an Amazon EC2 server. Its job is to take a GitHub or GitLab repository URL and automatically produce a full technical analysis of that codebase — without any manual effort from the person asking."),
  spacer(60),
  para("Think of it like handing someone a repo link and getting back a complete report that tells you:"),
  spacer(40),
  bullet("What the codebase does and how it is structured"),
  bullet("Every function, class, and module in the project"),
  bullet("How data flows through the system from start to finish"),
  bullet("Any known security vulnerabilities in the dependencies"),
  bullet("A health grade for the code and actionable recommendations"),
  spacer(100),
  para("This is done through two main components that work together:"),
  spacer(60),
  infoBox("The two components", [
    "repo-read — the skill (a set of instructions) that orchestrates the entire analysis process",
    "GitNexus — the code intelligence engine that does the actual deep indexing of the codebase",
  ]),
  spacer(200),

  h2("1.1  How It All Fits Together"),
  spacer(80),
  para("Here is the big picture of what happens when you give Lazarus OS a repo URL:"),
  spacer(80),

  stepTable([
    ["0", "Freshness Check",       "Check if this repo has been analysed before and whether the existing index is still up to date"],
    ["1", "Clone the Repo",        "Download a shallow copy of the repository from GitHub or GitLab onto the EC2 server"],
    ["2", "Scan Files",            "Walk the entire file tree, read dependency manifests, check for tests and CI configuration"],
    ["3", "Index with GitNexus",   "Build a full symbol map of every function, class, and interface — with a 5-attempt fallback if indexing fails"],
    ["4", "Run MCP Queries",       "Run 8 structured queries against the index to map architecture, entry points, data layer, execution flows, and blast radius"],
    ["4.5", "Generate Diagram",   "Convert the architecture map into a high-resolution PNG diagram using Mermaid CLI"],
    ["5", "CVE Security Scan",     "Check all dependencies against known vulnerability databases and produce a security score"],
    ["6", "Write the Report",      "Produce a 10-section markdown report and write it to disk incrementally as it is generated"],
    ["7", "Push to S3",            "Upload the report, source files, diagram, and GitNexus knowledge graph to the S3 bucket"],
  ]),

  spacer(200),
  new Paragraph({ children: [new PageBreak()] }),

  // ── SECTION 2: EC2 SETUP ───────────────────────────────────────────────────
  h1("2.  EC2 Server — Where Everything Lives"),
  spacer(120),
  para("All Lazarus OS components run on a single Amazon EC2 instance. Below is a map of every important location on that server."),
  spacer(120),

  h2("2.1  Directory Structure"),
  spacer(80),

  twoColTable(
    ["What It Is", "Path on EC2"],
    [
      ["Root workspace for all of Lazarus OS",              "/home/ubuntu/lazarus-os/"],
      ["All repo workspaces (one folder per repo analysed)", "/home/ubuntu/lazarus-os/workspaces/"],
      ["All installed skills (including repo-read)",         "/home/ubuntu/lazarus-os/skills/"],
      ["The repo-read skill folder",                         "/home/ubuntu/lazarus-os/skills/repo-read/"],
      ["The skill instruction file",                         "/home/ubuntu/lazarus-os/skills/repo-read/SKILL.md"],
      ["Helper scripts (staleness check, CVE scanner, etc)", "/home/ubuntu/lazarus-os/scripts/"],
      ["Staleness check script",                             "/home/ubuntu/lazarus-os/scripts/staleness-check.sh"],
      ["CVE scanning script",                                "/home/ubuntu/lazarus-os/scripts/cve_scan.py"],
      ["Active repo name sentinel file",                     "/home/ubuntu/lazarus-os/.lazarus-active-repo"],
      ["Active forge (GitHub/GitLab) sentinel file",         "/home/ubuntu/lazarus-os/.lazarus-active-forge"],
      ["Architecture diagrams output folder",                "~/.openclaw/canvas/"],
      ["Puppeteer config for Mermaid CLI",                   "/tmp/puppeteer.json"],
    ],
    [3000, 6360]
  ),

  spacer(200),
  h2("2.2  What Is Installed on the EC2"),
  spacer(80),
  para("The following tools must be present on the EC2 instance for Lazarus OS to work. This table explains what each one does and why it is needed."),
  spacer(80),

  twoColTable(
    ["Tool / Package", "Why It Is Needed"],
    [
      ["git",              "Clones repositories from GitHub and GitLab onto the server"],
      ["gitnexus",         "The code intelligence engine — indexes symbols, builds call graphs, exposes MCP tools"],
      ["Node.js",          "Runtime for gitnexus; also used for the pptxgenjs and docx npm packages"],
      ["mmdc (Mermaid CLI)", "Converts Mermaid diagram code into high-resolution PNG architecture diagrams"],
      ["AWS CLI",          "Pushes the final report, diagrams, and GitNexus database to the S3 bucket"],
      ["Python 3",         "Runs cve_scan.py for security scanning and helper scripts"],
      ["react-icons",      "npm package — provides icons used in diagram generation"],
      ["sharp",            "npm package — rasterises SVG icons to PNG for use in diagrams"],
    ],
    [2400, 6960]
  ),

  spacer(200),
  h2("2.3  S3 Bucket — Where Reports Are Stored"),
  spacer(80),
  para("After every analysis, four things are pushed to the S3 bucket automatically:"),
  spacer(60),
  bullet("result.md — the full report (10 sections, typically 200+ lines)"),
  bullet("Source files — a copy of the repo (excluding .git, node_modules, and build output)"),
  bullet("<repo>-arch.png — the architecture diagram generated in Step 4.5"),
  bullet("GitNexus database — the full knowledge graph (.gitnexus/ folder) for future queries"),
  spacer(80),
  richPara([
    { text: "S3 bucket path:  ", bold: true },
    { text: "s3://openclaw-codeanalysis/lazarus/repos/<repo-name>/", code: true },
  ]),

  spacer(200),
  new Paragraph({ children: [new PageBreak()] }),

  // ── SECTION 3: REPO-READ ───────────────────────────────────────────────────
  h1("3.  The repo-read Skill"),
  spacer(120),
  para("A \"skill\" in Lazarus OS is a SKILL.md file — a set of structured instructions that tells the AI exactly what to do when triggered. The repo-read skill is what makes repository analysis happen."),
  spacer(120),

  h2("3.1  What It Does (Plain English)"),
  spacer(80),
  para("When you give the system a GitHub or GitLab URL, repo-read takes over. It clones the code, indexes every single symbol in the project using GitNexus, runs a battery of queries to understand how everything connects, scans for security vulnerabilities, and then writes a full technical report — all automatically."),
  spacer(80),
  para("The final report covers 10 areas:"),
  spacer(60),
  bullet("Tech stack and dependencies"),
  bullet("File structure and module breakdown"),
  bullet("Architecture pattern and entry points"),
  bullet("Data flow through the system"),
  bullet("Security vulnerabilities (CVE scan)"),
  bullet("Symbol statistics — functions, classes, interfaces"),
  bullet("Most connected symbols and their blast radius"),
  bullet("Code health grades across 7 dimensions"),
  bullet("Legacy debt signals"),
  bullet("Ranked recommendations — Critical, High Priority, Nice to Have"),

  spacer(200),
  h2("3.2  Skill Location on EC2"),
  spacer(80),
  twoColTable(
    ["Item", "Path"],
    [
      ["Skill folder",    "/home/ubuntu/lazarus-os/skills/repo-read/"],
      ["Skill file",      "/home/ubuntu/lazarus-os/skills/repo-read/SKILL.md"],
      ["Version",         "3.1.0"],
    ],
    [2400, 6960]
  ),

  spacer(200),
  h2("3.3  How to Trigger the Skill"),
  spacer(80),
  para("The skill is triggered automatically when a user types any of the following phrases followed by a GitHub or GitLab URL:"),
  spacer(80),
  ...codeBlock([
    "analyse this repo https://github.com/owner/repo",
    "read this repo https://gitlab.com/group/subgroup/project",
    "what does this repo do https://github.com/owner/repo",
    "explore this codebase https://github.com/owner/repo/tree/main",
  ]),
  spacer(80),
  para("You do not need to configure anything. Just paste the URL and the skill handles the rest."),

  spacer(200),
  h2("3.4  Supported URL Formats"),
  spacer(80),
  twoColTable(
    ["Platform", "URL Format"],
    [
      ["GitHub — main branch",       "https://github.com/owner/repo"],
      ["GitHub — specific branch",   "https://github.com/owner/repo/tree/<branch>"],
      ["GitLab — main branch",       "https://gitlab.com/owner/repo"],
      ["GitLab — specific branch",   "https://gitlab.com/owner/repo/-/tree/<branch>"],
      ["GitLab — nested subgroups",  "https://gitlab.com/group/subgroup/repo"],
      ["GitLab — subgroup + branch", "https://gitlab.com/group/subgroup/repo/-/tree/<branch>"],
    ],
    [2800, 6560]
  ),
  spacer(80),
  infoBox("Important — GitLab vs GitHub URL difference", [
    "GitHub branch URLs use /tree/<branch>",
    "GitLab branch URLs use /-/tree/<branch>  (note the dash before /tree)",
    "The repo name is always the last segment of the URL — this matters for GitLab nested subgroups",
  ]),

  spacer(200),
  h2("3.5  Configuration Files the Skill Uses"),
  spacer(80),
  para("The skill uses a small set of sentinel files on disk to track state across steps. These are created automatically — you do not need to create them manually."),
  spacer(80),
  twoColTable(
    ["File", "What It Stores"],
    [
      ["/home/ubuntu/lazarus-os/.lazarus-active-repo",  "The name of the repo currently being analysed"],
      ["/home/ubuntu/lazarus-os/.lazarus-active-forge", "Whether the repo is from GitHub or GitLab"],
      ["/tmp/lazarus-skip-reindex-<repo>",              "Flag indicating whether GitNexus re-indexing can be skipped"],
      ["/tmp/lazarus-primary-repo-<repo>",              "The best GitNexus alias to use for MCP queries (set during indexing)"],
      ["/tmp/puppeteer.json",                           "Puppeteer browser config used by Mermaid CLI to render diagrams"],
    ],
    [3600, 5760]
  ),

  spacer(200),
  new Paragraph({ children: [new PageBreak()] }),

  // ── SECTION 4: GITNEXUS ────────────────────────────────────────────────────
  h1("4.  GitNexus — The Code Intelligence Engine"),
  spacer(120),

  h2("4.1  What GitNexus Is"),
  spacer(80),
  para("GitNexus is the tool that does the heavy lifting of understanding a codebase. It reads every source file in the repository and builds a detailed knowledge graph of:"),
  spacer(60),
  bullet("Every function, class, interface, and type in the project"),
  bullet("How they call each other (the call graph)"),
  bullet("Which files are entry points vs internal modules"),
  bullet("Execution flows — what happens from start to finish when the app runs"),
  spacer(80),
  para("Once the index is built, repo-read uses GitNexus through 8 MCP (Model Context Protocol) tool calls to extract architecture maps, trace execution flows, and calculate impact — which symbols would break if a given function changed."),

  spacer(200),
  h2("4.2  Where GitNexus Lives"),
  spacer(80),
  twoColTable(
    ["Item", "Location / Value"],
    [
      ["Binary",                      "gitnexus  (globally installed, available on PATH)"],
      ["Index per repo",              "<workspace>/.gitnexus/"],
      ["Index metadata file",         "<workspace>/.gitnexus/meta.json"],
      ["Ignore file (like .gitignore)", "<workspace>/.gitnexusignore"],
    ],
    [2400, 6960]
  ),

  spacer(200),
  h2("4.3  What Is Installed for GitNexus"),
  spacer(80),
  twoColTable(
    ["Package / Tool", "Role"],
    [
      ["gitnexus",        "The indexer itself — installed globally via npm"],
      ["Node.js",         "Runtime (heap tuned via NODE_OPTIONS for large repos)"],
      ["react-icons",     "SVG icon source for diagram rendering (npm)"],
      ["sharp",           "Converts SVG icons to PNG for embedding in diagrams (npm)"],
    ],
    [2400, 6960]
  ),

  spacer(200),
  h2("4.4  GitNexus Configuration"),
  spacer(80),
  para("GitNexus is configured through command-line flags when it runs, not through a config file. Here are the key settings repo-read uses:"),
  spacer(80),
  twoColTable(
    ["Setting", "Value / Explanation"],
    [
      ["Memory (standard)",          "NODE_OPTIONS=--max-old-space-size=8192  (8 GB heap)"],
      ["Memory (fallback)",          "NODE_OPTIONS=--max-old-space-size=16384  (16 GB heap for large repos)"],
      ["Max file size",              "--max-file-size 2048  (skip files over 2 MB to avoid parser crashes)"],
      ["Verbose mode",               "-v  (shows detailed indexing warnings in the log)"],
      ["Skip git check",             "--skip-git  (used when indexing individual project subdirectories)"],
      ["Custom alias",               "--name lazarus-<repo>-<dirname>  (used in per-project indexing mode)"],
    ],
    [2800, 6560]
  ),
  spacer(80),
  infoBox("Flags that do NOT exist in GitNexus — never use these", [
    "--skip-embeddings  (does not exist — use --drop-embeddings instead)",
    "--workers  (does not exist)",
    "--worker-timeout  (does not exist)",
  ]),

  spacer(200),
  h2("4.5  The 8 MCP Tool Calls"),
  spacer(80),
  para("After indexing, repo-read queries the GitNexus knowledge graph using exactly 8 MCP tool calls. All 8 are mandatory and run in this order:"),
  spacer(80),
  twoColTable(
    ["Call", "Tool & Purpose"],
    [
      ["4a", "gitnexus_generate_map — full architecture component map + Mermaid diagram code"],
      ["4b", "gitnexus_search — find all entry points (main, index, app, server)"],
      ["4c", "gitnexus_query — list all functions, classes, and interfaces"],
      ["4d", "gitnexus_search — find core business logic (services, handlers, controllers)"],
      ["4e", "gitnexus_search — find the data layer (models, schemas, queries, repositories)"],
      ["4f", "gitnexus_context — trace the execution flow from the main entry point"],
      ["4g", "gitnexus_impact — calculate blast radius of the most central symbol"],
      ["4h", "gitnexus_detect_changes — detect uncommitted drift or stale index signals"],
    ],
    [720, 8640]
  ),

  spacer(200),
  h2("4.6  The 5-Attempt Indexing Fallback"),
  spacer(80),
  para("Some repositories — especially large C# codebases — cause GitNexus to crash during indexing. To handle this gracefully, repo-read has a 5-attempt waterfall fallback. Zero indexed nodes is never an acceptable outcome."),
  spacer(80),

  stepTable([
    ["1", "Standard Index",          "Run gitnexus analyze with 8 GB heap and capture the log"],
    ["2", "Surgical File Quarantine", "Parse the crash log, physically move the crashing files out of the workspace, re-index, then restore them"],
    ["3", "Broad Dir Quarantine",    "Quarantine entire directories that contain crashing files (when individual file quarantine is insufficient), then re-index"],
    ["4", "Per-Project Indexing",    "Find all .csproj files, index each project individually using --skip-git, track the most symbol-rich project as the primary"],
    ["5", "FTS Repair",              "If nodes > 0 but MCP queries return empty results, repair the full-text search index using --repair-fts or --force"],
  ]),

  spacer(80),
  para("If all 5 attempts fail, the skill skips Steps 4 and 4.5 and continues with the CVE scan and a partial report. The failure is documented clearly in the output."),

  spacer(200),
  new Paragraph({ children: [new PageBreak()] }),

  // ── SECTION 5: THE REPORT ──────────────────────────────────────────────────
  h1("5.  The Report — What You Get"),
  spacer(120),
  para("At the end of every successful analysis, a full report is written to disk and pushed to S3. The report is a markdown file (result.md) stored in the repo's workspace folder and in S3."),
  spacer(80),
  para("The report has 10 sections, written in this order:"),
  spacer(80),
  twoColTable(
    ["Section", "What It Contains"],
    [
      ["A — Header",              "URL, forge, branch, timestamp, embedded architecture diagram"],
      ["B — Tech Stack",          "Language, framework, runtime, package manager, database, infra, CI/CD, test framework"],
      ["C — File Structure",      "Top-level folder tree, total counts, heaviest modules by symbol count"],
      ["D — Architecture",        "Pattern, entry points, module roles, data flow, execution trace"],
      ["E — Dependencies",        "Full dependency table with version, purpose, and freshness status"],
      ["F — Security Analysis",   "CVE table by severity, security score out of 100, posture summary"],
      ["G — Code Intelligence",   "Symbol stats, most connected symbols, execution flow highlights"],
      ["H — Code Health",         "Grade table across 7 dimensions with overall grade"],
      ["I — Legacy Debt Signals", "Old frameworks, deprecated APIs, dead code, outdated patterns"],
      ["J — Recommendations",     "Ranked: Critical → High Priority → Nice to Have, each with file/symbol reference"],
    ],
    [2400, 6960]
  ),
  spacer(80),
  infoBox("How the report is written", [
    "Each section is appended to result.md on disk as it is generated — the file builds up incrementally",
    "A size guard checks that result.md is over 2000 bytes before the S3 push runs",
    "If the file is under 2000 bytes, the S3 push is aborted and the file is printed for diagnosis",
    "This prevents a stub or empty report from being pushed to production",
  ]),

  spacer(200),
  new Paragraph({ children: [new PageBreak()] }),

  // ── SECTION 6: QUICK START ─────────────────────────────────────────────────
  h1("6.  Quick Start — How to Use This System"),
  spacer(120),
  para("If you are new to Lazarus OS and just want to run an analysis, follow these steps:"),
  spacer(120),

  h2("Step 1 — Find the Repo URL"),
  spacer(80),
  para("Go to GitHub or GitLab and copy the URL of the repository you want to analyse. Any of the following formats will work:"),
  spacer(60),
  ...codeBlock([
    "https://github.com/owner/repo",
    "https://github.com/owner/repo/tree/develop",
    "https://gitlab.com/group/subgroup/project",
    "https://gitlab.com/group/subgroup/project/-/tree/main",
  ]),

  spacer(200),
  h2("Step 2 — Type the Trigger Phrase"),
  spacer(80),
  para("In the Lazarus OS chat interface, type any of the following and paste your URL at the end:"),
  spacer(60),
  ...codeBlock([
    "analyse this repo https://github.com/owner/repo",
  ]),
  spacer(80),
  para("That is all you need to do. The system takes over from here."),

  spacer(200),
  h2("Step 3 — Wait for the Analysis"),
  spacer(80),
  para("The system will print progress updates as it works through each step. A typical analysis takes several minutes depending on the size of the repository. You will see messages like:"),
  spacer(60),
  ...codeBlock([
    "Guard 0 complete — Forge: github. LadybugDB: NO_S3_META. First-time repo.",
    "Step 1 complete — Cloned my-project to /home/ubuntu/lazarus-os/workspaces/my-project.",
    "Step 2 complete — 342 files. Language: TypeScript. Framework: Next.js.",
    "Step 3 complete — Symbols: 1,842. Nodes > 0: YES.",
    "Step 4 complete — Architecture mapped. 3 entry points. 12 core modules.",
    "Step 5 complete — Security score: 78/100. CVEs found: 2.",
    "Step 6 complete — Full report written. Lines: 214. Size: 9,832 bytes.",
    "Step 7 complete — Report and assets pushed to S3.",
  ]),

  spacer(200),
  h2("Step 4 — Read the Report"),
  spacer(80),
  para("Once complete, the full report is displayed in the chat. It is also available in S3 at:"),
  spacer(60),
  ...codeBlock([
    "s3://openclaw-codeanalysis/lazarus/repos/<repo-name>/result.md",
  ]),

  spacer(200),
  h2("Step 5 — Ask Follow-Up Questions"),
  spacer(80),
  para("After the report, you can ask the system to go deeper. For example:"),
  spacer(60),
  bullet("\"Modernise this repo — upgrade the dependencies and remove legacy patterns\""),
  bullet("\"Add a feature: user authentication with JWT\""),
  bullet("\"Fix the bug where the payment handler crashes on empty cart\""),
  bullet("\"Explain what the AuthService class does in detail\""),

  spacer(200),
  new Paragraph({ children: [new PageBreak()] }),

  // ── SECTION 7: TROUBLESHOOTING ─────────────────────────────────────────────
  h1("7.  Troubleshooting"),
  spacer(120),
  para("If something goes wrong, the table below covers the most common issues and what to do about them."),
  spacer(80),
  twoColTable(
    ["Problem", "What To Do"],
    [
      ["Clone fails immediately",                 "Check the URL is correct and the repo is publicly accessible (or that credentials are configured)"],
      ["GitNexus reports 0 nodes after all 5 attempts", "Check the gitnexus logs at /tmp/gitnexus-attempt1-<repo>.log — the crash type will be listed there"],
      ["MCP queries return empty arrays",         "This is an FTS (full-text search) issue. Attempt 5 (FTS repair) should fix it automatically"],
      ["Report is pushed to S3 but is very short", "The size guard should prevent this. If it happens, check that all 10 sections appended to result.md during Step 6"],
      ["Diagram not generated",                   "mmdc may have failed — check /tmp/puppeteer.json exists. The report will still be generated without the diagram"],
      ["LadybugDB ERROR on Guard 0",              "The staleness check script failed — do not proceed. Check /home/ubuntu/lazarus-os/scripts/staleness-check.sh"],
    ],
    [3000, 6360]
  ),

  spacer(200),
  new Paragraph({ children: [new PageBreak()] }),

  // ── SECTION 8: REFERENCE ───────────────────────────────────────────────────
  h1("8.  Quick Reference"),
  spacer(120),

  h2("Key Paths"),
  spacer(80),
  ...codeBlock([
    "Skill root:         /home/ubuntu/lazarus-os/skills/repo-read/",
    "Skill file:         /home/ubuntu/lazarus-os/skills/repo-read/SKILL.md",
    "Workspaces:         /home/ubuntu/lazarus-os/workspaces/<repo-name>/",
    "GitNexus index:     /home/ubuntu/lazarus-os/workspaces/<repo-name>/.gitnexus/",
    "Scripts:            /home/ubuntu/lazarus-os/scripts/",
    "Diagrams:           ~/.openclaw/canvas/<repo-name>-arch.png",
    "S3 reports:         s3://openclaw-codeanalysis/lazarus/repos/<repo-name>/result.md",
    "Active repo file:   /home/ubuntu/lazarus-os/.lazarus-active-repo",
    "Active forge file:  /home/ubuntu/lazarus-os/.lazarus-active-forge",
  ]),

  spacer(160),
  h2("GitNexus MCP Tools"),
  spacer(80),
  twoColTable(
    ["Tool", "Purpose"],
    [
      ["gitnexus_generate_map",    "Architecture overview and Mermaid diagram"],
      ["gitnexus_search",          "Find files/functions related to a concept or keyword"],
      ["gitnexus_query",           "List all symbols — functions, classes, interfaces"],
      ["gitnexus_context",         "Full detail on a specific function or class"],
      ["gitnexus_impact",          "What breaks if X changes — upstream blast radius"],
      ["gitnexus_detect_changes",  "Detect uncommitted drift and stale index signals"],
      ["gitnexus_rename",          "Safe multi-file symbol rename"],
    ],
    [2800, 6560]
  ),

  spacer(160),
  h2("Confirmed GitNexus Flags"),
  spacer(80),
  ...codeBlock([
    "--force               Force a full re-index",
    "--drop-embeddings     Drop existing embeddings on rebuild",
    "--skip-git            Index a folder without a .git directory",
    "--name <alias>        Register the index under a custom name",
    "--max-file-size <kb>  Skip files over N KB (default 512)",
    "-v / --verbose        Show detailed indexing warnings",
    "--embeddings          Enable embedding generation (slower)",
    "--skills              Generate skill files from communities",
    "--no-stats            Omit volatile counts from AGENTS.md",
  ]),

  spacer(400),
  new Paragraph({
    children: [new TextRun({ text: "Lazarus OS — Internal Documentation", size: 18, color: MUTED, font: "Arial", italic: true })],
    alignment: AlignmentType.CENTER,
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: BORDER_C } },
    spacing: { before: 200 },
  }),
];

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: "numbers",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22, color: TEXT } },
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 40, bold: true, font: "Arial", color: WHITE },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, font: "Arial", color: WHITE },
        paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 1 },
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: BLUE },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      },
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/mnt/user-data/outputs/lazarus-os-manual.docx", buf);
  console.log("Done.");
});