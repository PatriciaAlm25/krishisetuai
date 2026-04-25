import React, { useState, useRef, useEffect } from 'react';
import './VoiceAssistant.css';

const SARVAM_API_KEY = import.meta.env.VITE_SARVAM_API_KEY;
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

const LANGUAGES = [
  { code: 'hi-IN', label: 'Hindi', name: 'Hindi' },
  { code: 'kn-IN', label: 'Kannada', name: 'Kannada' },
  { code: 'ta-IN', label: 'Tamil', name: 'Tamil' },
  { code: 'te-IN', label: 'Telugu', name: 'Telugu' },
  { code: 'mr-IN', label: 'Marathi', name: 'Marathi' },
  { code: 'gu-IN', label: 'Gujarati', name: 'Gujarati' },
  { code: 'bn-IN', label: 'Bengali', name: 'Bengali' },
  { code: 'en-IN', label: 'English', name: 'English' },
];

export default function VoiceAssistant() {
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const [volume, setVolume] = useState(0);
  
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const pcmDataRef = useRef([]);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!SARVAM_API_KEY || !OPENROUTER_API_KEY) {
      setError('API keys are missing. Please check your .env file and restart the server.');
    }
  }, []);

  const startRecording = async () => {
    if (!SARVAM_API_KEY || !OPENROUTER_API_KEY) {
      setError('API keys are missing. Please check your .env file.');
      return;
    }
    try {
      // Improved constraints for better voice capture
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      
      // Ensure context is running (fixes issues with some browsers)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      // Using ScriptProcessorNode for simple PCM capture
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      pcmDataRef.current = [];

      processorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        pcmDataRef.current.push(new Float32Array(inputData));
        
        // Calculate volume for visual feedback
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        setVolume(Math.sqrt(sum / inputData.length));
      };

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      setIsRecording(true);
      setStatus('Listening...');
      setError(null);
    } catch (err) {
      setError('Microphone access denied or not available.');
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (processorRef.current && isRecording) {
      setIsRecording(false);
      setStatus('Processing...');

      // Disconnect everything
      processorRef.current.onaudioprocess = null;
      processorRef.current.disconnect();
      if (audioContextRef.current) audioContextRef.current.close();

      // Flatten and encode to WAV
      const flattened = flattenArray(pcmDataRef.current);
      const wavBlob = encodeWAV(flattened, 16000);
      processAudio(wavBlob);
    }
  };

  const flattenArray = (channelBuffer) => {
    let result = new Float32Array(channelBuffer.reduce((acc, b) => acc + b.length, 0));
    let offset = 0;
    for (let i = 0; i < channelBuffer.length; i++) {
      result.set(channelBuffer[i], offset);
      offset += channelBuffer[i].length;
    }
    return result;
  };

  const encodeWAV = (samples, sampleRate) => {
    // 1. Find the peak for normalization
    let peak = 0;
    for (let i = 0; i < samples.length; i++) {
      const abs = Math.abs(samples[i]);
      if (abs > peak) peak = abs;
    }
    
    // 2. Normalize samples (if not already loud)
    // Limit gain to 10x to prevent blowing up the noise floor
    const factor = peak > 0 ? Math.min(10, 0.9 / peak) : 1.0;
    console.log(`Peak amplitude: ${peak}, Normalization factor: ${factor}`);

    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 32 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      // Apply normalization factor
      let s = Math.max(-1, Math.min(1, samples[i] * factor));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return new Blob([view], { type: 'audio/wav' });
  };

  const processAudio = async (blob) => {
    try {
      // 1. Speech to Text (Sarvam)
      setStatus('Transcribing...');
      
      if (blob.size < 1000) { 
        throw new Error('The recorded audio is too short. Please hold the button longer while speaking.');
      }

      const formData = new FormData();
      // Use recording.wav for the manual WAV encoder output
      formData.append('file', blob, 'recording.wav');
      formData.append('language_code', selectedLang.code);
      formData.append('model', 'saaras:v3');
      formData.append('mode', 'transcribe');

      const sttRes = await fetch('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: { 
          'api-subscription-key': SARVAM_API_KEY 
        },
        body: formData
      });

      if (!sttRes.ok) {
        const errorText = await sttRes.text().catch(() => '');
        throw new Error(`Speech-to-Text failed (Status: ${sttRes.status}): ${errorText || sttRes.statusText}`);
      }
      const sttData = await sttRes.json();
      console.log('STT Response:', sttData); // Debug log
      
      const text = sttData.transcript;
      setTranscript(text);

      if (!text || text.trim() === '') {
        setStatus('Ready');
        const debugInfo = `(Blob size: ${Math.round(blob.size / 1024)}KB)`;
        
        // Create a download link for debugging
        const downloadUrl = URL.createObjectURL(blob);
        setError(
          <div>
            No speech detected. {debugInfo} 
            <br />
            <a href={downloadUrl} download="recording.wav" style={{ color: '#3b82f6', textDecoration: 'underline', fontSize: '0.8rem' }}>
              Download your recording to check if it has sound
            </a>
          </div>
        );
        return;
      }

      // 2. Gemini AI Response (OpenRouter)
      setStatus('Thinking...');
      const prompt = `You are a helpful agricultural assistant for Indian farmers. 
      The user input is a transcript from a voice recording and might contain repeated words or stutters. 
      Please ignore repetitions and answer the question in ${selectedLang.name}. 
      
      IMPORTANT: Keep your answer VERY SHORT (under 250 characters) so it can be spoken quickly. 
      Use simple language and NO markdown formatting (no asterisks, no bold).
      
      User question: ${text}`;

      const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "KrishiSetu"
        },
        body: JSON.stringify({
          "model": "google/gemini-2.0-flash-001",
          "messages": [{ "role": "user", "content": prompt }]
        })
      });

      if (!aiRes.ok) {
        const errorData = await aiRes.json().catch(() => ({}));
        throw new Error(`AI Service failed: ${errorData.error?.message || aiRes.statusText}`);
      }
      const aiData = await aiRes.json();
      const aiText = aiData.choices[0].message.content;
      setAiResponse(aiText);

      // 3. Text to Speech (Sarvam)
      setStatus('Synthesizing Voice...');
      // Strip markdown characters for cleaner TTS
      const cleanAiText = aiText.replace(/[*_#`~]/g, '').replace(/\[.*?\]\(.*?\)/g, '');
      
      const ttsRes = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: { 
          'api-subscription-key': SARVAM_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: cleanAiText,
          target_language_code: selectedLang.code,
          speaker: 'ritu',
          speech_sample_rate: 24000,
          output_audio_codec: 'mp3',
          model: 'bulbul:v3' 
        })
      });

      if (!ttsRes.ok) {
        const errorData = await ttsRes.text().catch(() => '');
        throw new Error(`Text-to-Speech failed (Status: ${ttsRes.status}): ${errorData}`);
      }
      const ttsData = await ttsRes.json();
      
      if (!ttsData.audios || ttsData.audios.length === 0) {
        throw new Error('No audio returned from TTS service');
      }

      // Convert base64 to Blob URL
      const audioBlob = base64ToBlob(ttsData.audios[0], 'audio/mp3');
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      setStatus('Ready');
    } catch (err) {
      console.error("Voice Assistant Error:", err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setStatus('Ready');
    }
  };

  const base64ToBlob = (base64, type) => {
    const binStr = atob(base64);
    const len = binStr.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) arr[i] = binStr.charCodeAt(i);
    return new Blob([arr], { type });
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  useEffect(() => {
    if (audioUrl) playAudio();
  }, [audioUrl]);

  return (
    <div className="voice-assistant">
      <div className="va-container">
        <header className="va-header">
          <h1>KrishiSetu Voice</h1>
          <p>Talk to your agricultural assistant in your native language</p>
        </header>

        {error && <div className="va-error"><span>❌</span> {error}</div>}

        <div className="va-lang-selector">
          <label>Selected Language:</label>
          <select 
            value={selectedLang.code} 
            onChange={(e) => setSelectedLang(LANGUAGES.find(l => l.code === e.target.value))}
            disabled={isRecording || status !== 'Ready' && status !== 'Idle'}
          >
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>

        <div className="va-mic-section">
          <button 
            className={`mic-button ${isRecording ? 'recording' : ''} ${status !== 'Ready' && status !== 'Idle' && !isRecording ? 'processing' : ''}`}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={status !== 'Ready' && status !== 'Idle' && !isRecording}
          >
            {isRecording ? '⏹️' : '🎙️'}
          </button>
          
          <div className="va-status">
            {isRecording ? (
              <div className="va-waves">
                {[1,2,3,4,5].map(i => (
                  <div 
                    key={i} 
                    className="va-wave" 
                    style={{ height: `${Math.max(5, volume * 300)}%` }} 
                  />
                ))}
                <span>Listening...</span>
              </div>
            ) : status}
          </div>
          <small style={{ marginTop: '10px', color: '#64748b' }}>
            {isRecording ? 'Release to stop' : 'Hold to speak'}
          </small>
        </div>

        <div className="va-chat-area">
          {transcript && (
            <div className="va-bubble va-bubble--user">
              <span className="va-bubble-label">You said ({selectedLang.label}):</span>
              {transcript}
            </div>
          )}

          {aiResponse && (
            <div className="va-bubble va-bubble--ai">
              <span className="va-bubble-label">Assistant:</span>
              {aiResponse}
              {audioUrl && (
                <button className="va-replay-btn" onClick={playAudio}>
                  🔊 Play Response
                </button>
              )}
            </div>
          )}
        </div>

        {audioUrl && <audio ref={audioRef} src={audioUrl} hidden />}
      </div>
    </div>
  );
}
