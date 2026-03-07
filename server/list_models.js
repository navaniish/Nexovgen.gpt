import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("GEMINI_API_KEY not found in " + path.join(__dirname, '.env'));
        // Try root too just in case
        dotenv.config({ path: path.join(__dirname, '..', '.env') });
        const key2 = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        if (!key2) {
            console.error("Still no key found.");
            return;
        }
        console.log("Found key in root or via VITE_ prefix.");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => console.log(`- ${m.name}`));
        } else {
            console.error("No models found or error:", JSON.stringify(data));
        }
    } catch (err) {
        console.error("Fetch failed:", err.message);
    }
}

listModels();
