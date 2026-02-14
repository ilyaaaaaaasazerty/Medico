import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { config } from '../config/env.js';
const UPLOAD_DIR = config.UPLOAD_DIR || './uploads';
const BASE_URL = config.BACKEND_URL;

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const diskStorage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        cb(null, UPLOAD_DIR);
    },
    filename: function (_req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

export const storage = multer({
    storage: diskStorage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    }
});

/**
 * Get public URL for a file key
 */
export function getFileUrl(key: string): string {
    if (!key) return '';
    if (key.startsWith('http')) return key; // Already a full URL

    // Return URL for the local static folder
    return `${BASE_URL.replace(/\/$/, '')}/uploads/${key}`;
}

export async function deleteFile(key: string) {
    if (!key) return;
    try {
        const filePath = path.join(UPLOAD_DIR, key);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error('Error deleting local file:', error);
    }
}
