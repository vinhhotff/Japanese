/**
 * ============================================
 * Speaking Evaluation Edge Function
 * 
 * Nhận audio → ASR → similarity scoring → lưu DB
 * 
 * CÁCH DEPLOY:
 * 1. Tạo bucket 'voice-recordings' trong Supabase Storage (public)
 * 2. Chạy SQL trong supabase/speaking_attempts.sql
 * 3. supabase functions new speaking-evaluate
 * 4. supabase functions deploy speaking-evaluate
 * 
 * ENV cần thiết:
 * - GOOGLE_APPLICATION_CREDENTIALS (JSON credentials cho Google STT)
 *   Hoặc dùng: GOOGLE_SPEECH_API_KEY (API key đơn giản)
 * ============================================
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  audioUrl: string;
  targetText: string;
  targetLanguage: "japanese" | "chinese";
  userId: string;
  durationSec?: number;
}

interface SimilarityResult {
  similarity: number;
  match: boolean;
  differences: string[];
}

// Simple similarity calculation (Levenshtein-based)
function calculateSimilarity(text1: string, text2: string): SimilarityResult {
  const normalize = (t: string) => t.replace(/[。、？！\s.,!?]/g, "").toLowerCase();
  const t1 = normalize(text1);
  const t2 = normalize(text2);

  if (t1 === t2) {
    return { similarity: 100, match: true, differences: [] };
  }

  // Levenshtein distance
  const len1 = t1.length;
  const len2 = t2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) matrix[i] = [i];
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = t1[i - 1] === t2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  const similarity = maxLen > 0 ? Math.round((1 - distance / maxLen) * 100) : 0;

  return {
    similarity,
    match: similarity >= 80,
    differences: similarity < 80 
      ? [`Cần nói: ${text1}`, `Bạn nói: ${text2}`] 
      : [],
  };
}

// ASR using Google Speech-to-Text (simplified - requires API key)
async function transcribeAudio(audioUrl: string, language: string): Promise<{
  transcript: string;
  confidence: number;
}> {
  const apiKey = Deno.env.get("GOOGLE_SPEECH_API_KEY");
  
  if (!apiKey) {
    // Fallback: return dummy result if no API key
    console.warn("No GOOGLE_SPEECH_API_KEY, returning empty transcript");
    return { transcript: "", confidence: 0 };
  }

  // Download audio first
  const audioRes = await fetch(audioUrl);
  const audioBuffer = await audioRes.arrayBuffer();
  const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

  // Google Speech-to-Text API
  const langCode = language === "japanese" ? "ja-JP" : "zh-CN";
  
  const requestBody = {
    config: {
      encoding: "WEBM_OPUS",
      sampleRateHertz: 48000,
      languageCode: langCode,
      enableAutomaticPunctuation: true,
    },
    audio: {
      content: audioBase64,
    },
  };

  const response = await fetch(
    `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("Google STT error:", err);
    return { transcript: "", confidence: 0 };
  }

  const data = await response.json();
  
  if (!data.results || data.results.length === 0) {
    return { transcript: "", confidence: 0 };
  }

  const result = data.results[0];
  const transcript = result.alternatives?.[0]?.transcript || "";
  const confidence = result.alternatives?.[0]?.confidence || 0;

  return { transcript, confidence };
}

// Alternative: using OpenAI Whisper (if API key provided)
async function transcribeWithWhisper(audioUrl: string, language: string): Promise<{
  transcript: string;
  confidence: number;
}> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  
  if (!apiKey) {
    return { transcript: "", confidence: 0 };
  }

  // Download audio
  const audioRes = await fetch(audioUrl);
  const audioBlob = await audioRes.blob();
  
  // Convert to form data
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.webm");
  formData.append("model", "whisper-1");
  formData.append("language", language === "japanese" ? "ja" : "zh");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}` },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Whisper error:", err);
    return { transcript: "", confidence: 0 };
  }

  const data = await response.json();
  return { transcript: data.text || "", confidence: 0.8 }; // Whisper doesn't return confidence
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    const body: RequestBody = await req.json();
    const { audioUrl, targetText, targetLanguage, userId, durationSec } = body;

    if (!audioUrl || !targetText || !targetLanguage || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try ASR with multiple providers
    let transcript = "";
    let confidence = 0;

    // Try Whisper first (better quality)
    const whisperResult = await transcribeWithWhisper(audioUrl, targetLanguage);
    if (whisperResult.transcript) {
      transcript = whisperResult.transcript;
      confidence = whisperResult.confidence;
    } else {
      // Fallback to Google STT
      const googleResult = await transcribeAudio(audioUrl, targetLanguage);
      transcript = googleResult.transcript;
      confidence = googleResult.confidence;
    }

    // Calculate similarity
    const similarityResult = calculateSimilarity(targetText, transcript);

    // Save to database
    const { data: attempt, error: dbError } = await supabase
      .from("speaking_attempts")
      .insert({
        user_id: userId,
        target_text: targetText,
        target_language: targetLanguage,
        audio_url: audioUrl,
        transcript: transcript || null,
        confidence: confidence || null,
        similarity: similarityResult.similarity,
        is_match: similarityResult.match,
        duration_sec: durationSec || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to save attempt", details: dbError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: attempt.id,
          transcript,
          confidence,
          similarity: similarityResult.similarity,
          isMatch: similarityResult.match,
          differences: similarityResult.differences,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
