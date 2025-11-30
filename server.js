// ============================================
// VEO 3 BACKEND - OPENAI RECOMMENDATION API
// ============================================

// Import dependencies
const express = require('express');
const OpenAI = require('openai');
const cors = require('cors');
require('dotenv').config();

// Setup Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());            // Izinkan request dari frontend beda origin
app.use(express.json());    // Parse JSON body

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,   // set di Render
});

// ============================================
// ENDPOINT 0: Health Check
// ============================================
app.get('/health', (req, res) => {
  res.json({ status: 'Backend is running ✅' });
});

// ============================================
// ENDPOINT 1: Generate Recommendations
// ============================================
app.post('/api/recommendations', async (req, res) => {
  try {
    const { description } = req.body;
    if (!description || description.trim().length === 0) {
      return res.status(400).json({ error: 'Description harus diisi' });
    }

    const systemPrompt = `
Kamu adalah expert video prompt specialist untuk Google Veo 3.
Jawab HANYA dengan JSON valid tanpa teks lain.
`.trim();

    const userPrompt = `
Berdasarkan deskripsi ini: "${description}"

Buat 5 rekomendasi per field berikut dalam format JSON:
{
  "scene_setting": ["..."],
  "lighting_type": ["..."],
  "subject_type": ["..."],
  "subject_action": ["..."],
  "camera_angle": ["..."],
  "motion_pacing": ["..."],
  "aesthetic": ["..."],
  "color_palette": ["..."],
  "audio_type": ["..."]
}
`.trim();

    // Panggil OpenAI pakai SDK
    const response = await openai.chat.completions.create({
