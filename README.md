# 🚀 ControlV - Salesforce Metadata Intelligence

**ControlV** is a custom internal tool designed to replace Salesforce Change Sets. It allows you to visualize differences between environments (Dev vs Prod), search your entire org's metadata, and deploy changes with a single click.

## ✨ Key Features
*   **🚦 Deep Comparison:** Automatically detects if a component is New, Changed, or Matches Production (ignoring whitespace).
*   **🔎 Metadata Search Engine:** Search for *any* text (e.g., "Email Subject", "Hardcoded ID") across all your Flows, Classes, and Layouts.
*   **⚡️ Lightning Deployment:** Select components and deploy. No more uploading Change Sets.
*   **🛡 Validation Levels:** Support for `RunLocalTests` and `RunSpecifiedTests`.
*   **🔗 Deep Linking:** Click any search result to open that exact asset in Salesforce Lightning.

---

## 🛠 1. Prerequisites (Do this first!)

Before running the tool, you must have these installed on your computer.

### A. Install VS Code (Code Editor)
This is the program we use to run the application.
*   [Download VS Code here](https://code.visualstudio.com/download)
*   Install and open it.

### B. Install Node.js (The Engine)
This is required to run the JavaScript code.
*   [Download Node.js here](https://nodejs.org/en)
*   **Important:** Choose the **LTS (Long Term Support)** version.
*   Run the installer and click Next/Agree until finished.

### C. Install Git (For downloading the code)
*   [Download Git here](https://git-scm.com/downloads)
*   Install it using default settings.

---

## 📥 2. Download & Install

### Step 1: Clone the Repository
1.  Open **VS Code**.
2.  Press `F1` (or `Cmd+Shift+P` on Mac) and type: `Git: Clone`.
3.  Paste the repository URL:
    ```text
    https://github.com/YOUR_USERNAME/control-v.git
    ```
4.  Select a folder on your computer to save it.
5.  Click **Open** when asked.

### Step 2: Install Backend Libraries
1.  In VS Code, open the Terminal (`Terminal` > `New Terminal` in the top menu).
2.  Copy and paste these commands and hit **Enter**:
    ```bash
    cd server
    npm install
    ```

### Step 3: Install Frontend Libraries
1.  Click the `+` icon in the Terminal panel to open a **second terminal**.
2.  Copy and paste these commands and hit **Enter**:
    ```bash
    cd client
    npm install
    ```

---

## 🟢 3. How to Run the App (Daily Usage)

To use the tool, you need to turn on the "Engine" (Server) and the "Dashboard" (Client). 
**You need TWO terminal windows open at the same time.**

### Terminal 1: Start the Backend (Server)
Make sure you are in the `server` folder and run this command:
```bash
cd server
node index.js
