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
app.get('/health', (req, res) => {
  res.json({ status: 'Backend is running ✅' });
});

// ============================================
// ENDPOINT 2: Generate Recommendations
// ============================================
app.post('/api/recommendations', async (req, res) => {
  try {
    // 1. Validasi input
    const { description } = req.body;
    
    if (!description || description.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Description harus diisi' 
      });
    }

    // 2. Buat prompt untuk OpenAI
    const systemPrompt = `Kamu adalah expert video prompt specialist untuk Google Veo 3. 
Tugas kamu adalah menganalisa deskripsi video dan memberikan 5 rekomendasi untuk setiap field.
Jawab HANYA dalam format JSON valid, tanpa teks tambahan.
Setiap field berisi array dengan 5 rekomendasi string.`;

    const userPrompt = `Berdasarkan deskripsi video ini:

"${description}"

Buatkan 5 rekomendasi TERBAIK untuk setiap field di bawah. 
Setiap rekomendasi harus relevan, unik, dan professional.

Format jawaban (HANYA JSON, tidak ada teks lain):
{
  "scene_setting": ["opsi 1", "opsi 2", "opsi 3", "opsi 4", "opsi 5"],
  "lighting_type": ["opsi 1", "opsi 2", "opsi 3", "opsi 4", "opsi 5"],
  "subject_type": ["opsi 1", "opsi 2", "opsi 3", "opsi 4", "opsi 5"],
  "subject_action": ["opsi 1", "opsi 2", "opsi 3", "opsi 4", "opsi 5"],
  "camera_angle": ["opsi 1", "opsi 2", "opsi 3", "opsi 4", "opsi 5"],
  "motion_pacing": ["opsi 1", "opsi 2", "opsi 3", "opsi 4", "opsi 5"],
  "aesthetic": ["opsi 1", "opsi 2", "opsi 3", "opsi 4", "opsi 5"],
  "color_palette": ["opsi 1", "opsi 2", "opsi 3", "opsi 4", "opsi 5"],
  "audio_type": ["opsi 1", "opsi 2", "opsi 3", "opsi 4", "opsi 5"]
}`;

    // 3. Call OpenAI API
    console.log('📤 Mengirim request ke OpenAI...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo', // Bisa pakai gpt-3.5-turbo untuk lebih murah
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7, // Sedikit creative tapi tetap konsisten
      max_tokens: 1000,
    });

    // 4. Parse response JSON dari OpenAI
    const content = response.choices.message.content;
    console.log('✅ Response dari OpenAI:', content);
    
    // Extract JSON dari response (dalam case ada teks tambahan)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('OpenAI response bukan JSON valid');
    }
    
    const recommendations = JSON.parse(jsonMatch);

    // 5. Kirim response ke frontend
    res.json({
      success: true,
      recommendations: recommendations,
      message: 'Rekomendasi berhasil dibuat'
    });

  } catch (error) {
    // Error handling
    console.error('❌ Error:', error.message);
    
    res.status(500).json({
      error: 'Gagal generate rekomendasi',
      details: error.message
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
