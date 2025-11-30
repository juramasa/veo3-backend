// ============================================
// VEO 3 BACKEND - OPENAI RECOMMENDATION API
// ============================================

// Import dependencies
const express = require('express');
const OpenAI = require('openai');
const cors = require('cors');
const fetch = require('node-fetch');   // ← tambahan untuk fetch di Node
require('dotenv').config();

// Setup Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());            // Izinkan request dari frontend beda origin
app.use(express.json());    // Parse JSON body

// Initialize OpenAI client (kalau nanti butuh)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

    // Panggil OpenAI via HTTP fetch
    const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',     // bisa diganti gpt-4.1 / gpt-3.5-turbo sesuai akunmu
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      console.error('OpenAI error:', data);
      return res.status(500).json({
        error: 'OpenAI API error',
        details: data,
      });
    }

    const content = data.choices?.[0]?.message?.content || '';
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('OpenAI response bukan JSON valid');
    }

    const recommendations = JSON.parse(match[0]);

    res.json({
      success: true,
      recommendations,
    });
  } catch (err) {
    console.error('❌ Error di /api/recommendations:', err);
    res.status(500).json({
      error: 'Gagal generate rekomendasi',
      details: err.message,
    });
  }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🎬 VEO 3 BACKEND SERVER RUNNING      ║
║  Port: ${PORT}                        ║
║  Siap menerima request dari frontend  ║
╚════════════════════════════════════════╝
  `);
  console.log(`
Test endpoint di browser:
- Health check: http://localhost:${PORT}/health
- Recommendation: POST ke http://localhost:${PORT}/api/recommendations
  `);
});
