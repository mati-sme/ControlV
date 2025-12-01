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

Before running the tool, you must install these two programs:

**1. VS Code (Code Editor)**
*   [Download here](https://code.visualstudio.com/download)
*   Install and open it.

**2. Node.js (The Engine)**
*   [Download here](https://nodejs.org/en) (Choose the **LTS** version).
*   Install it (Click Next, Next, Next).

---

## 📥 2. Installation Guide

**Step 1: Get the Code**
1.  Create a folder on your Desktop named `control-v`.
2.  Paste the project files into this folder.
3.  Open **VS Code**.
4.  Go to **File > Open Folder** and select `control-v`.

**Step 2: Install Backend (Server)**
1.  In VS Code, open the Terminal (`Terminal` > `New Terminal`).
2.  Copy and paste these commands, then hit Enter:
    ```bash
    cd server
    npm install
    ```

**Step 3: Install Frontend (Client)**
1.  Click the `+` icon in the Terminal panel to open a **second terminal**.
2.  Copy and paste these commands:
    ```bash
    cd client
    npm install
    ```

---

## 🟢 3. How to Run the App (Daily)

To use the tool, you need to turn on the "Engine" (Server) and the "Dashboard" (Client). 
**You need TWO terminal windows open at the same time.**

### Terminal 1: Start the Backend
Navigate to the server folder and run the start command:
```bash
cd server
node index.js
```
*Success Message: `ControlV V5.0 running on 5001`*

### Terminal 2: Start the Frontend
Navigate to the client folder and start the UI:
```bash
cd client
npm start
```
*A browser window will automatically open at `http://localhost:3000`.*

---

## 📖 User Guide

### 🔄 Sync & Compare
1.  **Login:** Enter credentials for Source (Sandbox) and Target (Production).
    *   *Note: If you are working from home (off-VPN), add your Security Token to the end of your password.*
2.  **Sync:** Click **Sync Source** and **Sync Target**.
    *   The bar at the bottom will show progress (e.g., "Downloading ApexClass...").
3.  **Analyze:** The table will show you exactly what is different.
    *   **MATCH (Green):** Identical logic.
    *   **CHANGED (Orange):** File content is different.
    *   **NEW (Blue):** Exists in Source but not Target.

### 🚀 Deploy
1.  **Select:** Check the boxes next to the items you want to move (you can mix Flows, Fields, and Classes).
2.  **Review:** Click the green **Review** button.
3.  **Configure:** Choose `Default` (Auto) or `RunSpecifiedTests` if you need to run specific Apex tests.
4.  **Execute:** Click **Deploy**. Watch the status update in real-time.

### 🔎 Explore (Search)
1.  Click the **Explorer (Search)** tab on the left sidebar.
2.  Select **Target** (Prod) or **Source** (Dev).
3.  Type a keyword (e.g., `Case Assignment`, `0015f00000...`).
4.  Click **Search**.
5.  Click **Open in Salesforce** to jump straight to that asset in the org.

---

## ❓ Troubleshooting

**"I get a 'Port 5001 in use' error"**
*   You probably have the server running in another window. Close old terminals or press `Ctrl + C` to stop the old process.

**"The list isn't updating"**
*   Click the **Sync** button again to force a fresh download from Salesforce.

**"Login Failed"**
*   Check if you need a [Security Token](https://help.salesforce.com/s/articleView?id=sf.user_security_token.htm&type=5).
*   Ensure you selected the correct environment (Sandbox vs Production).
