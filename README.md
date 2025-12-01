# 🚀 ControlV - Salesforce Metadata Intelligence

**ControlV** is a custom-built tool designed to replace Salesforce Change Sets. It allows you to visualize differences between environments, search your entire org's metadata (Flows, Classes, Objects), and deploy changes with a single click.

![ControlV Dashboard](https://via.placeholder.com/800x400.png?text=ControlV+Dashboard+Preview)

## ✨ Key Features
*   **🚦 Deep Comparison:** Automatically detects if a component is New, Changed, or Matches Production (ignoring whitespace/formatting noise).
*   **🔎 Metadata Search Engine:** Search for *any* text (e.g., "Email Subject", "Hardcoded ID") across all your Flows, Classes, and Layouts instantly.
*   **⚡️ Lightning Deployment:** Select components and deploy. No more uploading Change Sets.
*   **🛡 Validation Levels:** Support for `RunLocalTests` and `RunSpecifiedTests`.
*   **🔗 Deep Linking:** Click any search result to open that exact asset in Salesforce Lightning.

---

## 🛠 Prerequisites (Do this first!)

Before you can run the app, you need to install two tools on your computer.

### 1. Install VS Code
This is the tool we use to run the code.
*   [Download VS Code for Mac/Windows here](https://code.visualstudio.com/download)
*   Install it and open it.

### 2. Install Node.js
This is the engine that runs the application.
*   [Download Node.js (LTS Version)](https://nodejs.org/en)
*   Install it (just click Next, Next, Next).
*   To check if it worked, open your terminal and type `node -v`. You should see a version number (e.g., `v20.x`).

---

## 📥 Installation Guide

Follow these steps to download and set up ControlV on your machine.

### Step 1: Get the Code
1.  Open **VS Code**.
2.  Open the Terminal (Click **Terminal** > **New Terminal** in the top menu).
3.  Clone the repository (Copy and paste this):
    ```bash
    git clone https://github.com/YOUR_USERNAME/control-v.git
    cd control-v
    ```

### Step 2: Install Dependencies
We need to install the libraries for both the "Brain" (Server) and the "Face" (Client) of the app.

**1. Install Server (Backend)**
Run these commands in the terminal:
```bash
cd server
npm install
