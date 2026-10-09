import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = path.join(__dirname, '../data/logs');
const LOG_FILE = path.join(LOG_DIR, 'live_copy.csv');
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

let isWriting = false;
const writeQueue = [];

// Ensure dir exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Check file rotation
const rotateIfNecessary = () => {
    try {
        if (fs.existsSync(LOG_FILE)) {
            const stats = fs.statSync(LOG_FILE);
            if (stats.size >= MAX_BYTES) {
                const rotatedPath = path.join(LOG_DIR, `live_copy_${Date.now()}.csv`);
                fs.renameSync(LOG_FILE, rotatedPath);
            }
        }
    } catch (err) {
        console.error('Log copy rotation error:', err.message);
    }
};

const processQueue = () => {
    if (isWriting || writeQueue.length === 0) return;
    isWriting = true;

    const chunk = writeQueue.splice(0, writeQueue.length);
    rotateIfNecessary();

    const fileExists = fs.existsSync(LOG_FILE);
    const content = (fileExists ? '' : 'ts,deviceId,type,buildingId,floor,zone,source,kw,tank_level_pct,flow_lpm\n') +
        chunk.map(r => {
            const tsStr = r.ts instanceof Date ? r.ts.toISOString() : new Date(r.ts).toISOString();
            return `"${tsStr}","${r.deviceId || ''}","${r.type || ''}","${r.buildingId || ''}","${r.floor || ''}","${(r.zone || '').replace(/"/g, '""')}","${r.source || ''}",${r.kw != null ? r.kw : ''},${r.tank_level_pct != null ? r.tank_level_pct : ''},${r.flow_lpm != null ? r.flow_lpm : ''}`;
        }).join('\n') + '\n';

    fs.appendFile(LOG_FILE, content, (err) => {
        isWriting = false;
        if (err) console.error('Log copy write error:', err.message);
        if (writeQueue.length > 0) processQueue();
    });
};

export const appendLogCopy = (reading) => {
    if (process.env.LOG_COPY !== 'true') return;
    writeQueue.push(reading);
    processQueue();
};
