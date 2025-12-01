const express = require('express');
const jsforce = require('jsforce');
const cors = require('cors');
const bodyParser = require('body-parser');
const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'build')));

// Store Connection AND Metadata
const connections = { 
    source: { conn: null, instanceUrl: '', lastSync: null }, 
    target: { conn: null, instanceUrl: '', lastSync: null } 
};

const STORAGE_DIR = path.join(__dirname, 'storage');
const STATE_FILE = path.join(__dirname, 'state.json');
const INVENTORY_FILE = path.join(__dirname, 'inventory.json');

// APP STATE FOR UI PROGRESS
const appState = {
    isBusy: false,
    action: 'Idle',
    progress: 0,
    error: null
};

const updateStatus = (action, percent) => {
    appState.isBusy = true;
    appState.action = action;
    appState.progress = percent;
};

const SNAPSHOT_TYPES = [
    'ApexClass', 'ApexTrigger', 'Flow', 'CustomObject', 
    'Layout', 'PermissionSet', 'Profile', 'Workflow', 'EmailTemplate',
    'FlexiPage', 'AuraDefinitionBundle', 'LightningComponentBundle', 'CustomLabel',
    'StaticResource', 'CustomMetadata', 'GlobalValueSet', 'ApexComponent', 'ApexPage'
];

const CHILD_TYPES = [
    'CustomField', 'ValidationRule', 'WebLink', 'ListView', 'FieldSet', 'RecordType'
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- UTILS ---
const getFileHash = (content) => {
    const normalized = content.toString().replace(/\r\n/g, '').replace(/\n/g, '').replace(/\s+/g, '').trim();
    return crypto.createHash('md5').update(normalized).digest('hex');
};

async function getFullMetadataList(conn, type) {
    let allItems = [];
    try {
        let rootList = await conn.metadata.list([{ type, folder: null }]);
        if (rootList) {
            if (!Array.isArray(rootList)) rootList = [rootList];
            allItems = allItems.concat(rootList);
        }
    } catch (e) {}

    const folderTypeMap = { 'EmailTemplate': 'EmailFolder', 'Report': 'ReportFolder', 'Dashboard': 'DashboardFolder', 'Document': 'DocumentFolder' };
    if (folderTypeMap[type]) {
        try {
            let folders = await conn.metadata.list([{ type: folderTypeMap[type] }]);
            if (folders) {
                if (!Array.isArray(folders)) folders = [folders];
                for (const folder of folders) {
                    try {
                        let folderItems = await conn.metadata.list([{ type, folder: folder.fullName }]);
                        if (folderItems) {
                            if (!Array.isArray(folderItems)) folderItems = [folderItems];
                            allItems = allItems.concat(folderItems);
                        }
                    } catch (err) {}
                }
            }
        } catch (e) {}
    }
    return allItems;
}

// --- CORE ENGINE ---
async function downloadEnv(envName) {
    const session = connections[envName];
    const conn = session.conn;
    const envDir = path.join(STORAGE_DIR, envName);
    
    await fs.emptyDir(envDir);
    
    let inventory = {};
    if (fs.existsSync(INVENTORY_FILE)) inventory = fs.readJsonSync(INVENTORY_FILE);
    inventory[envName] = []; 

    console.log(`Starting Snapshot for ${envName}...`);
    
    const totalSteps = SNAPSHOT_TYPES.length + CHILD_TYPES.length;
    let currentStep = 0;

    // A. FILES
    for (const type of SNAPSHOT_TYPES) {
        currentStep++;
        const percent = Math.round((currentStep / totalSteps) * 100);
        updateStatus(`Fetching ${type} from ${envName}...`, percent);

        try {
            const items = await getFullMetadataList(conn, type);
            if (!items || items.length === 0) continue;
            
            items.forEach(i => {
                inventory[envName].push({ 
                    fullName: i.fullName, 
                    type: type, 
                    lastModifiedDate: i.lastModifiedDate,
                    id: i.id,
                    isFile: true 
                });
            });

            const members = items.map(i => i.fullName);
            const CHUNK_SIZE = 1500;
            
            for (let i = 0; i < members.length; i += CHUNK_SIZE) {
                const chunk = members.slice(i, i + CHUNK_SIZE);
                updateStatus(`Downloading ${type} (${i}/${members.length})...`, percent);
                
                const pkg = { types: [{ name: type, members: chunk }], version: '58.0' };
                const request = await conn.metadata.retrieve({ unpackaged: pkg });
                
                let isDone = false, res = null;
                while (!isDone) {
                    res = await conn.metadata.checkRetrieveStatus(request.id);
                    if (res.done === 'true' || res.done === true) isDone = true;
                    else await sleep(2000);
                }

                if (res.status === 'Succeeded') {
                    const zip = new AdmZip(Buffer.from(res.zipFile, 'base64'));
                    zip.getEntries().forEach(entry => {
                        if (!entry.isDirectory && !entry.entryName.includes('package.xml')) {
                            const cleanName = entry.entryName.replace('unpackaged/', '');
                            const fullPath = path.join(envDir, cleanName);
                            fs.ensureDirSync(path.dirname(fullPath));
                            fs.writeFileSync(fullPath, entry.getData());
                        }
                    });
                }
            }
        } catch (e) { console.error(`Error ${type}: ${e.message}`); }
    }

    // B. CHILDREN
    for (const type of CHILD_TYPES) {
        currentStep++;
        const percent = Math.round((currentStep / totalSteps) * 100);
        updateStatus(`Listing ${type}...`, percent);

        try {
            const items = await getFullMetadataList(conn, type);
            if (items && items.length > 0) {
                items.forEach(i => {
                    inventory[envName].push({ 
                        fullName: i.fullName, 
                        type: type, 
                        lastModifiedDate: i.lastModifiedDate,
                        id: i.id,
                        isFile: false 
                    });
                });
            }
        } catch (e) {}
    }
    
    fs.writeJsonSync(INVENTORY_FILE, inventory);
    connections[envName].lastSync = new Date().toISOString();
    console.log(`${envName} Complete.`);
}

async function analyzeDiff() {
    updateStatus('Analyzing Differences...', 100);
    const sourceDir = path.join(STORAGE_DIR, 'source');
    const targetDir = path.join(STORAGE_DIR, 'target');
    
    let inventory = { source: [], target: [] };
    try { inventory = fs.readJsonSync(INVENTORY_FILE); } catch(e){}

    const fullAnalysis = [];
    const sourceItems = inventory.source || [];
    const targetItems = inventory.target || [];
    
    const targetMap = new Map();
    targetItems.forEach(i => targetMap.set(`${i.type}#${i.fullName}`, i));

    for (const item of sourceItems) {
        let status = 'NEW';
        const uniqueKey = `${item.type}#${item.fullName}`;
        const targetItem = targetMap.get(uniqueKey);

        if (targetItem) {
            if (item.isFile) {
                // Try to find file logic
                let typeFolder = '';
                if (item.type === 'ApexClass') typeFolder = 'classes';
                else if (item.type === 'ApexTrigger') typeFolder = 'triggers';
                else if (item.type === 'Flow') typeFolder = 'flows';
                else if (item.type === 'CustomObject') typeFolder = 'objects';
                else if (item.type === 'Layout') typeFolder = 'layouts';
                else if (item.type === 'PermissionSet') typeFolder = 'permissionsets';
                else if (item.type === 'FlexiPage') typeFolder = 'flexipages';
                else if (item.type === 'EmailTemplate') typeFolder = 'email';
                
                let sPath, tPath;
                if(typeFolder) {
                    ['cls', 'trigger', 'flow', 'object', 'layout', 'permissionset', 'email', 'flexipage'].forEach(ext => {
                        const pS = path.join(sourceDir, typeFolder, `${item.fullName}.${ext}`);
                        const pT = path.join(targetDir, typeFolder, `${item.fullName}.${ext}`);
                        if(fs.existsSync(pS)) sPath = pS;
                        if(fs.existsSync(pT)) tPath = pT;
                    });
                }

                if (sPath && tPath) {
                    const sHash = getFileHash(fs.readFileSync(sPath));
                    const tHash = getFileHash(fs.readFileSync(tPath));
                    status = (sHash === tHash) ? 'MATCH' : 'CHANGED';
                } else {
                    const sDate = new Date(item.lastModifiedDate);
                    const tDate = new Date(targetItem.lastModifiedDate);
                    status = (sDate > tDate) ? 'CHANGED' : 'MATCH';
                }
            } else {
                const sDate = new Date(item.lastModifiedDate);
                const tDate = new Date(targetItem.lastModifiedDate);
                status = (sDate.getTime() > tDate.getTime()) ? 'CHANGED' : 'MATCH';
            }
        }

        fullAnalysis.push({ 
            fullName: item.fullName, 
            type: item.type, 
            status: status, 
            id: uniqueKey, 
            path: item.type + '/' + item.fullName, 
            lastModifiedDate: item.lastModifiedDate,
            salesforceId: item.id
        });
    }

    fs.writeJsonSync(STATE_FILE, fullAnalysis);
    return fullAnalysis;
}

// --- ROUTES ---
const runTask = async (fn) => {
    if (appState.isBusy) throw new Error("System is busy");
    try { await fn(); } 
    catch (e) { appState.error = e.message; console.error(e); throw e; } 
    finally { appState.isBusy = false; appState.action = 'Idle'; appState.progress = 0; }
};

app.get('/api/status', (req, res) => {
    res.json({ 
        ...appState,
        lastSync: { source: connections.source.lastSync, target: connections.target.lastSync },
        instanceUrls: { source: connections.source.instanceUrl, target: connections.target.instanceUrl }
    });
});

app.post('/api/login', async (req, res) => {
    const { envType, loginUrl, username, password, token } = req.body;
    try {
        const conn = new jsforce.Connection({ loginUrl, version: '58.0' });
        await conn.login(username, password + (token || ''));
        connections[envType].conn = conn;
        connections[envType].instanceUrl = conn.instanceUrl;
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/fetch/:env', async (req, res) => {
    const { env } = req.params;
    if (!connections[env].conn) return res.status(400).json({ error: `${env} not connected` });
    try {
        await runTask(async () => {
            await downloadEnv(env);
            const newState = await analyzeDiff(); 
            res.json({ success: true, data: newState });
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/fetch-all', async (req, res) => {
    if (!connections.source.conn || !connections.target.conn) return res.status(400).json({ error: 'Connect both' });
    try {
        await runTask(async () => {
            await downloadEnv('source');
            await downloadEnv('target');
            const newState = await analyzeDiff();
            res.json({ success: true, data: newState });
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/state', (req, res) => {
    if (fs.existsSync(STATE_FILE)) res.json(fs.readJsonSync(STATE_FILE));
    else res.json([]);
});

app.post('/api/search', async (req, res) => {
    const { query, env } = req.body;
    const searchEnv = env || 'target';
    const searchDir = path.join(STORAGE_DIR, searchEnv);
    if (!fs.existsSync(searchDir)) return res.json([]);
    
    let inventory = {};
    if (fs.existsSync(INVENTORY_FILE)) inventory = fs.readJsonSync(INVENTORY_FILE);
    const envInventory = inventory[searchEnv] || [];

    const results = [];
    async function scan(dir) {
        const files = await fs.readdir(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = await fs.stat(fullPath);
            if (stat.isDirectory()) await scan(fullPath);
            else {
                try {
                    const content = await fs.readFile(fullPath, 'utf8');
                    if (content.toLowerCase().includes(query.toLowerCase())) {
                        const relative = fullPath.replace(searchDir + path.sep, '');
                        const cleanName = path.basename(relative).split('.')[0]; 
                        const metaItem = envInventory.find(i => i.fullName === cleanName) || {};
                        const idx = content.toLowerCase().indexOf(query.toLowerCase());
                        const snippet = content.substring(Math.max(0, idx - 40), Math.min(content.length, idx + 60));
                        
                        results.push({ 
                            fileName: relative, 
                            snippet: `...${snippet.replace(/\n/g, ' ')}...`,
                            id: metaItem.id
                        });
                    }
                } catch (e) {}
            }
        }
    }
    await scan(searchDir);
    res.json(results);
});

app.post('/api/deploy-standard', async (req, res) => {
    const { source, target } = connections;
    if (!source.conn || !target.conn) return res.status(401).json({ error: 'Orgs not connected' });
    const { components, checkOnly, testLevel, runTests } = req.body;

    try {
        await runTask(async () => {
            updateStatus('Retrieving Package...', 20);
            const types = Object.keys(components).map(t => ({ name: t, members: components[t] }));
            const pkg = { types: types, version: '58.0' };
            const retrieveRequest = await source.conn.metadata.retrieve({ unpackaged: pkg });
            let isDone = false, retrieveResult = null;
            while (!isDone) {
                retrieveResult = await source.conn.metadata.checkRetrieveStatus(retrieveRequest.id);
                if (retrieveResult.done === 'true' || retrieveResult.done === true) isDone = true;
                else await sleep(1000);
            }

            updateStatus('Preparing...', 50);
            const zip = new AdmZip(Buffer.from(retrieveResult.zipFile, 'base64'));
            const newZip = new AdmZip();
            zip.getEntries().forEach(entry => {
                let newName = entry.entryName.replace('unpackaged/', '');
                if (newName && newName.length > 0) newZip.addFile(newName, entry.getData());
            });

            const deployOptions = { checkOnly, rollbackOnError: true, singlePackage: true };
            if (testLevel && testLevel !== 'Default') deployOptions.testLevel = testLevel;
            if (testLevel === 'RunSpecifiedTests' && runTests) deployOptions.runTests = runTests.split(',').map(t => t.trim());

            updateStatus('Uploading to Target...', 80);
            const deployLocator = await target.conn.metadata.deploy(newZip.toBuffer().toString('base64'), deployOptions);
            updateStatus('Processing...', 90);
            res.json({ jobId: deployLocator.id });
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/deploy/status/:id', async (req, res) => {
    if (!connections.target.conn) return res.status(401).json({ error: 'Target not connected' });
    try {
        const status = await connections.target.conn.metadata.checkDeployStatus(req.params.id, true);
        res.json(status);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, 'build', 'index.html')));
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`ControlV V5.0 running on ${PORT}`));
