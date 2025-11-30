// ============================================
// VIMEO 3 BACKEND - OPENAI RECOMMENDATION API
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
app.use(cors()); // Izinkan request dari frontend berbeda domain
app.use(express.json()); // Parse JSON dari request

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Baca dari file .env
});

// ============================================
// ENDPOINT 1: Test Health Check
// ============================================
app.post('/api/recommendations', async (req, res) => {
  try {
    const { description } = req.body;
    if (!description || description.trim().length === 0) {
      return res.status(400).json({ error: 'Description harus diisi' });
    }

    const systemPrompt = `Kamu adalah expert video prompt specialist untuk Google Veo 3.
Jawab HANYA dengan JSON valid.`;
    const userPrompt = `Berdasarkan deskripsi ini: "${description}"
buat 5 rekomendasi per field berikut dalam format JSON:
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
}`;

    // Panggil OpenAI langsung via fetch
    const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',        // bisa diganti gpt-4.1 / gpt-3.5-turbo tergantung akunmu
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
      return res.status(500).json({ error: 'OpenAI API error', details: data });
    }

    const content = data.choices?.[0]?.message?.content || '';
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('OpenAI response bukan JSON valid');
    }

    const recommendations = JSON.parse(match[0]);
    res.json({ success: true, recommendations });
  } catch (err) {
    console.error('❌ Error di /api/recommendations:', err);
    res.status(500).json({ error: 'Gagal generate rekomendasi', details: err.message });
  }
});


// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🎬 VEO 3 BACKEND SERVER RUNNING      ║
║  Port: ${PORT}                           ║
║  Siap menerima request dari frontend   ║
╚════════════════════════════════════════╝
  `);
  console.log(`
Test endpoint di browser:
- Health check: http://localhost:${PORT}/health
- Recommendation: POST ke http://localhost:${PORT}/api/recommendations
  `);
});
