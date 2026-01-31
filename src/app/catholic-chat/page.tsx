'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, BookOpen, AlertTriangle, X, Zap, Clock, Upload, FileText, Mic, Square, Volume2, Menu, CheckCircle2, Circle, Copy, RefreshCw, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import AuthFlowManager from '@/components/AuthFlowManager';
import { subscribeToNewsletter, SUBSCRIPTION_TIERS } from '@/lib/subscription';
import { useUserProgress } from '@/components/GamificationSystem';
import ChatRightSidebar from '@/components/ChatRightSidebar';
import ScriptureLinkedMarkdown from '@/components/ScriptureLinkedMarkdown';
import { useLearningEngine } from '@/hooks/useLearningEngine';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  responseTime?: number;
  implementation?: string;
  fallbackUsed?: boolean;
  actualModel?: string;
}

interface ApiErrorPayload {
  error?: string;
  message?: string;
  details?: string;
}

interface UserPreferences {
  interests?: string[];
  learningGoals?: string[];
}

const categorizedQuestions = {
  es: [
    "Obras de misericordia",
    "Evangelio de hoy",
    "¿Qué es la Iglesia católica?",
    "El Papa",
    "El Vaticano",
    "La Biblia",
    "Los Evangelios",
    "Latín",
    "Bienaventuranzas",
    "Rosario"
  ],
  pt: [
    "Obras de misericórdia",
    "Evangelho de hoje",
    "O que é a Igreja Católica?",
    "O Papa",
    "O Vaticano",
    "A Bíblia",
    "Os Evangelhos",
    "Latim",
    "Bem-aventuranças",
    "Rosário"
  ],
  en: [
    "Works of Mercy",
    "Today's Gospel",
    "What is the Catholic Church?",
    "The Pope",
    "The Vatican",
    "The Bible",
    "The Gospels",
    "Latin",
    "Beatitudes",
    "Rosary"
  ]
};

export default function CatholicChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // advancedMode removed - using RAG by default
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isBowing, setIsBowing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'anthropic' | 'openai' | 'llama' | 'local'>('llama'); // Default to Groq (Llama)
  const [userXP, setUserXP] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [autoSendVoice, setAutoSendVoice] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [isSpecialist, setIsSpecialist] = useState(false);
  const [dailyMessageCount, setDailyMessageCount] = useState(0);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const { language } = useLanguage();
  const searchParams = useSearchParams();
  const { progress, addXP } = useUserProgress();
  const { learnFromInteraction } = useLearningEngine();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sttWsRef = useRef<WebSocket | null>(null);
  const sttStreamRef = useRef<MediaStream | null>(null);
  const sttAudioContextRef = useRef<AudioContext | null>(null);
  const sttProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sttSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const transcriptRef = useRef<string>('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Load active journey
    const savedActiveJourney = localStorage.getItem('santapalabra_active_journey');
    if (savedActiveJourney) {
      setSelectedTrackId(savedActiveJourney);
    }
  }, []);

  useEffect(() => {
    if (selectedTrackId) {
      localStorage.setItem('santapalabra_active_journey', selectedTrackId);
    }
  }, [selectedTrackId]);

  const handleCopy = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRegenerate = (assistantMessageId: string) => {
    const msgIndex = messages.findIndex(m => m.id === assistantMessageId);
    if (msgIndex === -1) return;

    // Find the user message that triggered this response (usually the one before)
    const userMsgIndex = msgIndex - 1;
    if (userMsgIndex >= 0 && messages[userMsgIndex].role === 'user') {
      const userContent = messages[userMsgIndex].content;
      // Remove the user message and the assistant message (and anything after)
      // This effectively "undoes" the last turn so we can try again
      setMessages(prev => prev.slice(0, userMsgIndex));
      // Re-send the message
      void sendMessageText(userContent);
    }
  };

  const cleanupSttResources = async () => {
    try {
      sttProcessorRef.current?.disconnect();
      sttSourceRef.current?.disconnect();
    } catch {
      // ignore
    } finally {
      sttProcessorRef.current = null;
      sttSourceRef.current = null;
    }

    try {
      sttStreamRef.current?.getTracks().forEach(t => t.stop());
    } catch {
      // ignore
    } finally {
      sttStreamRef.current = null;
    }

    if (sttAudioContextRef.current) {
      try { await sttAudioContextRef.current.close(); } catch {}
      sttAudioContextRef.current = null;
    }

    if (sttWsRef.current) {
      try { sttWsRef.current.close(); } catch {}
      sttWsRef.current = null;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle URL query parameters for initial input
  useEffect(() => {
    const q = searchParams?.get('q');
    if (q) {
      setInput(q);
    }
  }, [searchParams]);

  // Subscription modal moved to GlobalModalManager
  
  // Cargar XP del usuario desde el progreso de gamificación
  useEffect(() => {
    const currentXP = progress.xp || 0;
    // Si es un usuario nuevo, darle XP inicial
    if (currentXP === 0) {
      addXP(50);
      setUserXP(50);
    } else {
      setUserXP(currentXP);
    }
  }, [progress, addXP]);

  const stripHtmlForSpeech = (html: string) => {
    return html
      .replace(/<br\s*\/?\s*>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);
  };

  const speakText = async (messageId: string, rawText: string) => {
    try {
      if (speakingMessageId === messageId) {
        stopSpeaking();
        return;
      }

      stopSpeaking();
      setSpeakingMessageId(messageId);

      const text = stripHtmlForSpeech(rawText);
      if (!text) {
        setSpeakingMessageId(null);
        return;
      }

      // Keep TTS usage bounded (credits are typically per character)
      const maxTtsChars = 900;
      const clippedText = text.length > maxTtsChars
        ? (text.slice(0, maxTtsChars).trimEnd() + '…')
        : text;

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clippedText, language }),
      });

      if (!response.ok) {
        let serverError: ApiErrorPayload | null = null;
        try {
          serverError = await response.json();
        } catch {
        }
        const message =
          serverError?.error ||
          serverError?.details ||
          `HTTP ${response.status}`;
        throw new Error(message);
      }

      const audioBlob = await response.blob();
      const objectUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(objectUrl);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(objectUrl);
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
        setSpeakingMessageId(null);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
        setSpeakingMessageId(null);
      };

      await audio.play();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const isQuotaError = errorMessage.toLowerCase().includes('quota') || 
                           errorMessage.toLowerCase().includes('credit') ||
                           errorMessage.includes('429') ||
                           errorMessage.includes('401');

      if (isQuotaError) {
        console.warn('ElevenLabs API limit reached, using browser fallback:', errorMessage);
      } else {
        console.error('TTS error, attempting fallback:', err);
      }
      
      // Fallback to browser SpeechSynthesis
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
         try {
           // Cancel any ongoing speech first
           window.speechSynthesis.cancel();

           const plainText = stripHtmlForSpeech(rawText);
           const utterance = new SpeechSynthesisUtterance(plainText);
           
           // Set language explicitly
           utterance.lang = language === 'es' ? 'es-ES' : language === 'pt' ? 'pt-BR' : 'en-US';

           // Voice selection strategy
           let voices = window.speechSynthesis.getVoices();
           
           // Attempt to load voices if empty (common in some browsers)
           if (voices.length === 0) {
             // Simple polling for a short time
             await new Promise<void>(resolve => {
               let attempts = 0;
               const checkVoices = () => {
                 voices = window.speechSynthesis.getVoices();
                 if (voices.length > 0 || attempts > 5) {
                   resolve();
                 } else {
                   attempts++;
                   setTimeout(checkVoices, 100);
                 }
               };
               checkVoices();
             });
           }

           let voice = null;
           
           if (voices.length > 0) {
             if (language === 'es') {
               voice = voices.find(v => v.lang.startsWith('es-')) || voices.find(v => v.lang.includes('es'));
             } else if (language === 'pt') {
               voice = voices.find(v => v.lang.startsWith('pt-')) || voices.find(v => v.lang.includes('pt'));
             } else {
               voice = voices.find(v => v.lang.startsWith('en-')) || voices.find(v => v.lang.includes('en'));
             }
           }
           
           if (voice) {
             utterance.voice = voice;
           }
           
           utterance.onend = () => setSpeakingMessageId(null);
           
           utterance.onerror = (e) => {
             // Ignore 'canceled' or 'interrupted' as they are often intentional
             if (e.error === 'canceled' || e.error === 'interrupted') {
               setSpeakingMessageId(null);
               return;
             }
             console.error('Synthesis error details:', e.error);
             setSpeakingMessageId(null);
           };
           
           window.speechSynthesis.speak(utterance);
           return;
         } catch (fallbackErr) {
            console.error('Fallback TTS also failed:', fallbackErr);
         }
      }

      setSpeakingMessageId(null);
      setError(language === 'es'
        ? (err instanceof Error ? err.message : 'Error de audio')
        : language === 'pt'
          ? (err instanceof Error ? err.message : 'Erro de áudio')
          : (err instanceof Error ? err.message : 'Audio error'));
    }
  };

  const floatTo16BitPCM = (input: Float32Array) => {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output;
  };

  const downsampleTo16k = (buffer: Float32Array, inputSampleRate: number) => {
    const outputSampleRate = 16000;
    if (inputSampleRate === outputSampleRate) {
      return floatTo16BitPCM(buffer);
    }
    const sampleRateRatio = inputSampleRate / outputSampleRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      // simple average to reduce aliasing
      let accum = 0;
      let count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      result[offsetResult] = count > 0 ? accum / count : 0;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return floatTo16BitPCM(result);
  };

  const bytesToBase64 = (bytes: Uint8Array) => {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
  };

  const startTranscription = async () => {
    if (isRecording || isTranscribing) return;

    setError(null);
    setIsTranscribing(true);
    transcriptRef.current = '';

    // 1. Try Native Web Speech API first
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = language === 'es' ? 'es-ES' : language === 'pt' ? 'pt-BR' : 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsRecording(true);
          setIsTranscribing(false);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          if (event.error === 'not-allowed') {
             setError(language === 'es' ? 'Permiso de micrófono denegado' : language === 'pt' ? 'Permissão de microfone negada' : 'Microphone permission denied');
          }
          // If network error or no-speech, we might want to just stop
          setIsRecording(false);
          setIsTranscribing(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
          setIsTranscribing(false);
          // Only auto-send if we have a final transcript
           const finalTranscript = transcriptRef.current.trim();
           if (finalTranscript && autoSendVoice) {
               void sendMessageText(finalTranscript);
           }
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          
          if (finalTranscript) {
             transcriptRef.current = (transcriptRef.current + ' ' + finalTranscript).trim();
          }
          
          // Update visual input with both confirmed and interim
          const currentFull = (transcriptRef.current + ' ' + interimTranscript).trim();
          if (currentFull) setInput(currentFull);
        };

        recognitionRef.current = recognition;
        recognition.start();
        return; 
      } catch (e) {
        console.warn('Native Speech Recognition failed, falling back to Cloud STT', e);
      }
    }

    try {
      const tokenRes = await fetch('/api/elevenlabs/single-use-token', {
        method: 'POST',
      });

      if (!tokenRes.ok) {
        const data = await tokenRes.json().catch(() => ({}));
        throw new Error(data?.error || `HTTP ${tokenRes.status}`);
      }

      const tokenData = await tokenRes.json();
      const token = tokenData.token as string;
      const modelId = (tokenData.modelId as string) || 'scribe_v2_realtime';

      const wsUrl = new URL('wss://api.elevenlabs.io/v1/speech-to-text/realtime');
      wsUrl.searchParams.set('model_id', modelId);
      wsUrl.searchParams.set('token', token);
      wsUrl.searchParams.set('audio_format', 'pcm_16000');
      wsUrl.searchParams.set('commit_strategy', 'vad');
      if (language === 'es' || language === 'en' || language === 'pt') {
        wsUrl.searchParams.set('language_code', language);
      }

      const ws = new WebSocket(wsUrl.toString());
      sttWsRef.current = ws;

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg?.message_type === 'committed_transcript' && typeof msg.text === 'string') {
            const next = msg.text.trim();
            if (next) {
              transcriptRef.current = (transcriptRef.current + ' ' + next).trim();
              setInput(transcriptRef.current); // Update UI
            }
          }
        } catch {
          // ignore
        }
      };

      ws.onerror = () => {
        setError(language === 'es' ? 'Error de transcripción' : language === 'pt' ? 'Erro de transcrição' : 'Transcription error');
      };

      ws.onopen = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          sttStreamRef.current = stream;

          const win = window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          };
          const AudioCtx = win.AudioContext || win.webkitAudioContext;
          if (!AudioCtx) {
            throw new Error('Web Audio API not supported');
          }
          const audioContext: AudioContext = new AudioCtx();
          sttAudioContextRef.current = audioContext;

          const source = audioContext.createMediaStreamSource(stream);
          sttSourceRef.current = source;

          // ScriptProcessorNode is deprecated but still widely supported and simplest here
          const processor = audioContext.createScriptProcessor(4096, 1, 1);
          sttProcessorRef.current = processor;

          processor.onaudioprocess = (e) => {
            const socket = sttWsRef.current;
            if (!socket || socket.readyState !== WebSocket.OPEN) return;

            const inputData = e.inputBuffer.getChannelData(0);
            const pcm16 = downsampleTo16k(inputData, audioContext.sampleRate);
            const bytes = new Uint8Array(pcm16.buffer);
            const b64 = bytesToBase64(bytes);

            socket.send(JSON.stringify({
              message_type: 'input_audio_chunk',
              audio_base_64: b64,
              sample_rate: 16000,
              commit: false,
            }));
          };

          source.connect(processor);
          const gain = audioContext.createGain();
          gain.gain.value = 0;
          processor.connect(gain);
          gain.connect(audioContext.destination);

          setIsRecording(true);
          setIsTranscribing(false);
        } catch (err) {
          console.error('Mic init error:', err);
          setIsTranscribing(false);
          setError(language === 'es' ? 'No se pudo acceder al micrófono' : language === 'pt' ? 'Não foi possível acessar o microfone' : 'Could not access microphone');
          try { ws.close(); } catch {}
        }
      };
    } catch (err) {
      console.error('STT start error:', err);
      setIsTranscribing(false);
      setError(language === 'es'
        ? (err instanceof Error ? err.message : 'Error de transcripción')
        : language === 'pt'
          ? (err instanceof Error ? err.message : 'Erro de transcrição')
          : (err instanceof Error ? err.message : 'Transcription error'));
    }
  };

  const stopTranscription = async () => {
    setIsRecording(false);
    setIsTranscribing(false);
    
    // Stop Native Recognition if active
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
      return; // Handled by onend event
    }

    try {
      await cleanupSttResources();
    } finally {
      const transcript = transcriptRef.current.trim();
      if (transcript) {
        if (autoSendVoice) {
          await sendMessageText(transcript);
        } else {
          setInput(transcript);
        }
      }
    }
  };

  useEffect(() => {
    return () => {
      stopSpeaking();
      void cleanupSttResources();
    };
  }, []);

  const sendMessageText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    // Verify Free Limit
    if (dailyMessageCount >= SUBSCRIPTION_TIERS.free.maxMessagesPerDay) {
       const limitMsg = language === 'es' ? 'Has alcanzado el límite diario de mensajes gratuitos.' : 
                        language === 'pt' ? 'Você atingiu o limite diário de mensagens gratuitas.' :
                        'You have reached the daily free message limit.';
       setError(limitMsg);
       return;
    }

    // Verificar XP suficiente para el modelo seleccionado
    // const modelCosts = { anthropic: 5, openai: 8, llama: 3, gemma: 0 } as Record<string, number>;
    // const cost = modelCosts[selectedModel];
    const cost = 5; // Costo estándar para modo automático
    
    if (userXP < cost) {
      setError(language === 'es' ? `Necesitas ${cost} XP para continuar. XP actual: ${userXP}` :
               language === 'pt' ? `Você precisa de ${cost} XP para continuar. XP atual: ${userXP}` :
               `You need ${cost} XP to continue. Current XP: ${userXP}`);
      return;
    }

    // Activar animación de reverencia
    setIsBowing(true);
    setTimeout(() => setIsBowing(false), 4000); // Duración de la animación - 4 segundos para transición suave

    // Aprender de la interacción
    learnFromInteraction(trimmed);

    const userMessage: Message = {
      id: Date.now().toString() + '_user',
      role: 'user',
      content: trimmed,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setDailyMessageCount(prev => prev + 1);
    setInput('');
    setIsLoading(true);
    setError(null);

    const startTime = Date.now();

    try {
      // Using RAG endpoint by default
      const apiEndpoint = '/api/catholic-rag';
      // Always use Catholic Chat implementation with selected model
      const requestBody = { 
        query: userMessage.content, 
        implementation: 'Catholic Chat', 
        language, 
        model: selectedModel, 
        studyTrack: selectedTrackId,
        specialistMode: isSpecialist,
        country: userCountry 
      };

      const controller = new AbortController();
      fetchAbortRef.current = controller;

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      if (!response.ok) {
        let serverError: ApiErrorPayload | string | null = null;
        try {
          serverError = await response.json();
        } catch {
        }

        const statusInfo = `HTTP ${response.status}`;
        let messageFromServer: string | null = null;
        let detailsFromServer: string | null = null;

        if (typeof serverError === 'string') {
          messageFromServer = serverError;
        } else if (serverError) {
          messageFromServer =
            serverError.error ||
            serverError.message ||
            null;
          detailsFromServer = serverError.details || null;
        }

        const finalMessage = [
          messageFromServer,
          detailsFromServer,
          statusInfo,
        ].filter(Boolean).join(' · ');

        throw new Error(finalMessage || statusInfo);
      }
      
      const data = await response.json();
      const responseTime = Date.now() - startTime;
      
      const assistantMessage: Message = {
        id: Date.now().toString() + '_assistant',
        role: 'assistant',
        content: data.response || 'No response received',
        timestamp: new Date(),
        // responseTime and implementation removed from UI
        fallbackUsed: Boolean(data.fallbackUsed),
        actualModel: data.actualModel
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Descontar XP dinámicamente según el modelo realmente usado
      const modelCosts = { anthropic: 5, openai: 8, llama: 3, gemma: 0, auto: 5 } as Record<string, number>;
      const actualModelUsed = data.actualModel || 'auto';
      const realCost = modelCosts[actualModelUsed] ?? 5;
      
      const newXP = Math.max(0, userXP - realCost);
      setUserXP(newXP);
      
      // También dar algunos XP por la interacción
      addXP(2);
      
      fetchAbortRef.current = null;
    } catch (error) {
      console.error('Error:', error);

      fetchAbortRef.current = null;

      if (error instanceof DOMException && error.name === 'AbortError') {
        setError(
          language === 'es'
            ? 'Respuesta cancelada'
            : language === 'pt'
              ? 'Resposta cancelada'
              : 'Response cancelled'
        );
        return;
      }

      const message = error instanceof Error ? error.message : '';
      const isNetworkError =
        message.toLowerCase().includes('failed to fetch') ||
        message.toLowerCase().includes('networkerror') ||
        message.toLowerCase().includes('refused');

      if (isNetworkError || !message) {
        setError(
          language === 'es'
            ? 'No se pudo conectar al servidor. ¿Está corriendo el backend?' 
            : language === 'pt'
              ? 'Não foi possível conectar ao servidor. O backend está rodando?'
              : 'Could not connect to the server. Is the backend running?'
        );
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessageText(input);
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (file.type !== 'application/pdf') {
      setError(language === 'es' ? 'Solo se permiten archivos PDF' : 'Only PDF files are allowed');
      return;
    }

    // Validar tamaño (15 MB = 15 * 1024 * 1024 bytes)
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(language === 'es' ? 'El PDF no debe superar los 15 MB' : 'PDF must not exceed 15 MB');
      return;
    }

    setPdfFile(file);
    setError(null);
  };

  const removePdf = () => {
    setPdfFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Estado para preferencias del usuario
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [userCountry, setUserCountry] = useState<string | null>(null);

  // Cargar preferencias del usuario y detectar país
  useEffect(() => {
    const savedProfile = localStorage.getItem('santapalabra_user_profile');
    if (!savedProfile) return;
    try {
      const profile = JSON.parse(savedProfile) as { preferences?: UserPreferences, country?: string };
      if (profile.preferences) {
        setUserPreferences(profile.preferences);
      }
      if (profile.country) {
        setUserCountry(profile.country);
      }
    } catch {
    }

    // Simular detección por IP (en producción usar headers o API de geoip)
    // Para prueba: si no hay país, default a 'LATAM' o permitir selección
    if (!localStorage.getItem('santapalabra_user_country')) {
       // Mock: Asumir AR para pruebas si no hay nada
       // setUserCountry('AR');
    }
  }, []);

  // Seleccionar preguntas personalizadas
  const [sampleQuestions, setSampleQuestions] = useState<string[]>([]);
  
  useEffect(() => {
    // Load simple concepts based on language
    const concepts = categorizedQuestions[language as keyof typeof categorizedQuestions] || categorizedQuestions.es;
    setSampleQuestions(concepts);
  }, [language]);

  const texts = {
    es: {
      backHome: 'Volver al Inicio',
      title: 'Chat Católico',
      signedIn: 'Conectado como',
      signIn: 'Iniciar Sesión',
      clearChat: 'Nuevo Chat',
      welcomeTitle: 'Bienvenido al Chat Teológico Católico',
      welcomeDesc: 'Pregunta cualquier cosa sobre la fe católica, teología, espiritualidad, o enseñanzas de la Iglesia. Obtén respuestas basadas en el Catecismo, documentos papales, mística española y enseñanzas del CELAM.',
      sampleQuestionsTitle: 'Preguntas de Ejemplo',
      clickToUse: 'Haz clic en cualquier pregunta para usarla:',
      enterMessage: 'Escribe tu pregunta teológica...',
      send: 'Enviar',
      loading: 'Pensando...',
      errorOccurred: 'Ocurrió un error. Por favor intenta de nuevo.',
      advancedMode: 'Modo Avanzado',
      simpleMode: 'Modo Simple',
      implementation: 'Motor RAG',
      showMetrics: 'Mostrar métricas',
      responseTime: 'Tiempo de respuesta',
      uploadPdf: 'Subir PDF',
      pdfAttached: 'PDF adjunto',
      removePdf: 'Quitar PDF',
      pdfLimits: 'Máx. 15 MB, 20 páginas'
    },
    pt: {
      backHome: 'Voltar ao Início',
      title: 'Chat Católico',
      signedIn: 'Conectado como',
      signIn: 'Entrar',
      clearChat: 'Novo Chat',
      welcomeTitle: 'Bem-vindo ao Chat Teológico Católico',
      welcomeDesc: 'Pergunte qualquer coisa sobre a fé católica, teologia, espiritualidade ou ensinamentos da Igreja. Obtenha respostas baseadas no Catecismo, documentos papais, mística espanhola e ensinamentos do CELAM.',
      sampleQuestionsTitle: 'Perguntas de Exemplo',
      clickToUse: 'Clique em qualquer pergunta para usá-la:',
      enterMessage: 'Escreva sua pergunta teológica...',
      send: 'Enviar',
      loading: 'Pensando...',
      errorOccurred: 'Ocorreu um erro. Tente novamente.',
      advancedMode: 'Modo Avançado',
      simpleMode: 'Modo Simples',
      implementation: 'Motor RAG',
      showMetrics: 'Mostrar métricas',
      responseTime: 'Tempo de resposta',
      uploadPdf: 'Enviar PDF',
      pdfAttached: 'PDF anexado',
      removePdf: 'Remover PDF',
      pdfLimits: 'Máx. 15 MB, 20 páginas'
    },
    en: {
      backHome: 'Back to Home',
      title: 'Catholic Chat',
      signedIn: 'Signed in as',
      signIn: 'Sign In',
      clearChat: 'New Chat',
      welcomeTitle: 'Welcome to Catholic Theological Chat',
      welcomeDesc: 'Ask anything about Catholic faith, theology, spirituality, or Church teaching. Get answers based on the Catechism, papal documents, Spanish mysticism and CELAM teachings.',
      sampleQuestionsTitle: 'Sample Questions',
      clickToUse: 'Click any question to use it:',
      enterMessage: 'Enter your theological question...',
      send: 'Send',
      loading: 'Thinking...',
      errorOccurred: 'An error occurred. Please try again.',
      advancedMode: 'Advanced Mode',
      simpleMode: 'Simple Mode',
      implementation: 'RAG Engine',
      showMetrics: 'Show metrics',
      responseTime: 'Response time',
      uploadPdf: 'Upload PDF',
      pdfAttached: 'PDF attached',
      removePdf: 'Remove PDF',
      pdfLimits: 'Max 15 MB, 20 pages'
    }
  };

  const currentTexts = texts[language as keyof typeof texts] || texts.es;

  const handleSampleQuestion = (question: string) => {
    setInput(question);
  };

  const handleStopGeneration = () => {
    const controller = fetchAbortRef.current;
    if (controller) {
      controller.abort();
      fetchAbortRef.current = null;
    }
    setIsLoading(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <AuthFlowManager>
      <div className="h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col relative overflow-hidden">
      {/* Modal de suscripción eliminado de aquí - gestionado por GlobalModalManager */}

      {/* Imágenes decorativas católicas de fondo */}
      <div className="fixed inset-0 pointer-events-none z-0 flex justify-between items-center px-4 md:px-12">
        <motion.div
          initial={{ opacity: 0, x: -50, rotate: -5 }}
          animate={{ opacity: 0.15, x: 0, rotate: 0 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="w-48 h-48 md:w-80 md:h-80 relative opacity-20"
          style={{ filter: 'sepia(80%) brightness(0.5) contrast(120%) saturate(1.2)' }}
        >
          <Image src="/guadalupana.svg" alt="" fill className="object-contain" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 50, rotate: 5 }}
          animate={{ opacity: 0.15, x: 0, rotate: 0 }}
          transition={{ duration: 2, delay: 0.7 }}
          className="w-48 h-48 md:w-80 md:h-80 relative opacity-20"
          style={{ filter: 'sepia(80%) brightness(0.5) contrast(120%) saturate(1.2)' }}
        >
          <Image src="/SantaTeresa.svg" alt="" fill className="object-contain" />
        </motion.div>
      </div>

      <div className="flex-1 flex overflow-hidden relative z-10">
        <main className="flex-1 flex flex-col items-center px-4 pb-6 pt-4 relative z-10 overflow-hidden">
        <div className="w-full max-w-3xl flex flex-col h-full">

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{
              opacity: 1,
              y: 0
            }}
            className="flex flex-col items-center mb-6"
          >
            <div className="relative">
              <motion.div
                animate={{
                  scale: [1, 1.02, 1],
                  boxShadow: [
                    '0 0 0 0 rgba(251,191,36,0)',
                    '0 0 25px 6px rgba(251,191,36,0.4)',
                    '0 0 0 0 rgba(251,191,36,0)'
                  ]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: 'mirror'
                }}
                className="rounded-full"
              >
                <motion.div
                  animate={
                    isBowing
                      ? {
                          scale: [1, 1.08, 1],
                          boxShadow: [
                            '0 0 0 0 rgba(251,191,36,0)',
                            '0 0 40px 10px rgba(251,191,36,0.7)',
                            '0 0 0 0 rgba(251,191,36,0)'
                          ]
                        }
                      : {}
                  }
                  transition={{
                    duration: isBowing ? 2.2 : 0.3
                  }}
                  className="rounded-full"
                >
                  <Image
                    src="/santapalabra-logo.svg"
                    alt="SantaPalabra"
                    width={128}
                    height={128}
                    loading="eager"
                    priority
                  />
                </motion.div>
              </motion.div>
              {isBowing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 1.5] }}
                  transition={{ duration: 2.2 }}
                  className="absolute inset-0 rounded-full bg-amber-400/40 blur-xl -z-10"
                />
              )}
            </div>
          </motion.div>

          <div className="flex-1 flex flex-col mt-2 space-y-4 overflow-y-auto overflow-x-hidden">
            {/* Recomendaciones de Aprendizaje Personalizadas */}
            {userPreferences && userPreferences.learningGoals && userPreferences.learningGoals.length > 0 && messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-700"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-500 rounded-full">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {language === 'es' ? 'Tu Camino de Aprendizaje' : language === 'pt' ? 'Seu Caminho de Aprendizado' : 'Your Learning Path'}
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {userPreferences.learningGoals.map((goal: string) => {
                    const recommendations = {
                      deepen_faith: {
                        es: [
                          "📖 Estudia el Catecismo de la Iglesia Católica",
                          "🙏 Practica la Lectio Divina semanalmente",
                          "⛪ Participa en la Misa dominical con atención plena",
                          "📿 Reza el Rosario diariamente"
                        ],
                        pt: [
                          "📖 Estude o Catecismo da Igreja Católica",
                          "🙏 Pratique a Lectio Divina semanalmente",
                          "⛪ Participe da Missa dominical com atenção plena",
                          "📿 Reze o Terço diariamente"
                        ],
                        en: [
                          "📖 Study the Catechism of the Catholic Church",
                          "🙏 Practice Lectio Divina weekly",
                          "⛪ Participate in Sunday Mass with full attention",
                          "📿 Pray the Rosary daily"
                        ]
                      },
                      prepare_sacraments: {
                        es: [
                          "📚 Estudia los sacramentos de iniciación cristiana",
                          "👨‍👩‍👧‍👦 Habla con tu párroco sobre preparación sacramental",
                          "📖 Lee sobre la importancia de cada sacramento",
                          "🙏 Ora por discernimiento en tu preparación"
                        ],
                        pt: [
                          "📚 Estude os sacramentos de iniciação cristã",
                          "👨‍👩‍👧‍👦 Converse com seu pároco sobre preparação sacramental",
                          "📖 Leia sobre a importância de cada sacramento",
                          "🙏 Ore por discernimento em sua preparação"
                        ],
                        en: [
                          "📚 Study the sacraments of Christian initiation",
                          "👨‍👩‍👧‍👦 Talk to your parish priest about sacramental preparation",
                          "📖 Read about the importance of each sacrament",
                          "🙏 Pray for discernment in your preparation"
                        ]
                      },
                      become_catechist: {
                        es: [
                          "🎓 Considera cursos de formación catequética",
                          "📚 Estudia el Directorio de Catequesis",
                          "👥 Únete a grupos de catequistas en tu parroquia",
                          "📖 Lee obras de catequesis contemporánea"
                        ],
                        pt: [
                          "🎓 Considere cursos de formação catequética",
                          "📚 Estude o Diretório de Catequese",
                          "👥 Junte-se a grupos de catequistas em sua paróquia",
                          "📖 Leia obras de catequese contemporânea"
                        ],
                        en: [
                          "🎓 Consider catechetical formation courses",
                          "📚 Study the Directory of Catechesis",
                          "👥 Join catechist groups in your parish",
                          "📖 Read contemporary catechesis works"
                        ]
                      },
                      study_theology: {
                        es: [
                          "🎓 Inscríbete en cursos de teología básica",
                          "📚 Lee introducciones a la teología sistemática",
                          "⛪ Participa en grupos de estudio teológico",
                          "📖 Estudia los documentos del Vaticano II"
                        ],
                        pt: [
                          "🎓 Inscreva-se em cursos de teologia básica",
                          "📚 Leia introduções à teologia sistemática",
                          "⛪ Participe de grupos de estudo teológico",
                          "📖 Estude os documentos do Vaticano II"
                        ],
                        en: [
                          "🎓 Enroll in basic theology courses",
                          "📚 Read introductions to systematic theology",
                          "⛪ Participate in theological study groups",
                          "📖 Study Vatican II documents"
                        ]
                      },
                      spiritual_growth: {
                        es: [
                          "🙏 Establece un horario regular de oración",
                          "📖 Lee vidas de santos para inspiración",
                          "⛪ Busca dirección espiritual",
                          "📿 Practica la meditación cristiana"
                        ],
                        pt: [
                          "🙏 Estabeleça um horário regular de oração",
                          "📖 Leia vidas de santos para inspiração",
                          "⛪ Busque direção espiritual",
                          "📿 Pratique a meditação cristã"
                        ],
                        en: [
                          "🙏 Establish a regular prayer schedule",
                          "📖 Read saints' lives for inspiration",
                          "⛪ Seek spiritual direction",
                          "📿 Practice Christian meditation"
                        ]
                      },
                      help_others: {
                        es: [
                          "🤝 Ofrece tu tiempo como voluntario en la parroquia",
                          "📚 Comparte recursos católicos con amigos",
                          "👨‍👩‍👧‍👦 Ayuda en catequesis familiar",
                          "🙏 Ora por quienes buscan la fe"
                        ],
                        pt: [
                          "🤝 Ofereça seu tempo como voluntário na paróquia",
                          "📚 Compartilhe recursos católicos com amigos",
                          "👨‍👩‍👧‍👦 Ajude na catequese familiar",
                          "🙏 Ore por aqueles que buscam a fé"
                        ],
                        en: [
                          "🤝 Offer your time as a volunteer in the parish",
                          "📚 Share Catholic resources with friends",
                          "👨‍👩‍👧‍👦 Help with family catechesis",
                          "🙏 Pray for those seeking faith"
                        ]
                      }
                    };

                    const goalKey = goal as keyof typeof recommendations;
                    return (
                      <div key={goal} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 capitalize">
                          {goal.replace('_', ' ')}
                        </h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                          {recommendations[goalKey]?.[language]?.slice(0, 2).map((rec: string, recIndex: number) => (
                            <li key={recIndex} className="flex items-start gap-2">
                              <span className="text-amber-500 mt-1">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {language === 'es' 
                      ? 'Pregúntame sobre cualquiera de estos temas para profundizar tu aprendizaje.'
                      : language === 'pt'
                      ? 'Pergunte-me sobre qualquer um desses temas para aprofundar seu aprendizado.'
                      : 'Ask me about any of these topics to deepen your learning.'
                    }
                  </p>
                </div>
              </motion.div>
            )}

            {/* Country Selector for Beta Testing/Verification */}
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center mb-6"
              >
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm border border-amber-100 dark:border-amber-800">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'es' ? 'Región:' : 'Region:'}
                  </span>
                  <select 
                    value={userCountry || ''} 
                    onChange={(e) => {
                      const c = e.target.value;
                      setUserCountry(c);
                      localStorage.setItem('santapalabra_user_country', c);
                    }}
                    className="bg-transparent border-none text-sm font-medium text-amber-700 dark:text-amber-400 focus:ring-0 cursor-pointer"
                  >
                    <option value="">{language === 'es' ? 'General' : 'General'}</option>
                    <option value="LATAM">Latinoamérica</option>
                    <option value="AR">Argentina</option>
                    <option value="PE">Perú</option>
                    <option value="ES">España</option>
                    <option value="MX">México</option>
                    <option value="CO">Colombia</option>
                  </select>
                </div>
              </motion.div>
            )}

            {/* Messages - Renderizar cuando existan */}
            {messages.length > 0 && (
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 min-h-0 scrollbar-thin scrollbar-thumb-amber-200 dark:scrollbar-thumb-amber-800 scrollbar-track-transparent">
                <AnimatePresence initial={false}>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.9 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.5, ease: 'backOut' }}
                          className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg border-2 border-white"
                        >
                          <BookOpen className="h-5 w-5 text-white" />
                        </motion.div>
                      )}

                      <div className={`max-w-2xl ${
                        message.role === 'user' ? 'w-auto' : 'w-full'
                      }`}>
                        <div
                          className={`rounded-2xl px-4 py-3 shadow-md ${
                            message.role === 'user'
                              ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-gray-900'
                              : 'bg-white dark:bg-gray-800 border-2 border-amber-100 dark:border-amber-700 text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          <div className="prose prose-sm max-w-none text-gray-900 dark:text-gray-100">
                            {message.role === 'assistant' ? (
                              <ScriptureLinkedMarkdown 
                                content={message.content}
                                language={language === 'es' ? 'spanish' : language === 'pt' ? 'portuguese' : 'english'}
                              />
                            ) : (
                              <p className="whitespace-pre-wrap font-medium">{message.content}</p>
                            )}
                          </div>
                        </div>

                        {message.role === 'assistant' && (
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => void speakText(message.id, message.content)}
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                speakingMessageId === message.id
                                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30'
                                  : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                              }`}
                              title={
                                speakingMessageId === message.id
                                  ? (language === 'es' ? 'Detener audio' : language === 'pt' ? 'Parar áudio' : 'Stop audio')
                                  : (language === 'es' ? 'Escuchar' : language === 'pt' ? 'Ouvir' : 'Listen')
                              }
                            >
                              {speakingMessageId === message.id ? (
                                <Square className="h-3.5 w-3.5" />
                              ) : (
                                <Volume2 className="h-3.5 w-3.5" />
                              )}
                              <span>
                                {speakingMessageId === message.id
                                  ? (language === 'es' ? 'Detener' : language === 'pt' ? 'Parar' : 'Stop')
                                  : (language === 'es' ? 'Escuchar' : language === 'pt' ? 'Ouvir' : 'Listen')}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopy(message.content, message.id)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                              title={language === 'es' ? 'Copiar respuesta' : language === 'pt' ? 'Copiar resposta' : 'Copy response'}
                            >
                              {copiedMessageId === message.id ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                              <span>
                                {copiedMessageId === message.id 
                                  ? (language === 'es' ? 'Copiado' : language === 'pt' ? 'Copiado' : 'Copied')
                                  : (language === 'es' ? 'Copiar' : language === 'pt' ? 'Copiar' : 'Copy')}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRegenerate(message.id)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                              title={language === 'es' ? 'Regenerar respuesta' : language === 'pt' ? 'Regenerar resposta' : 'Regenerate response'}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              <span>
                                {language === 'es' ? 'Re-preguntar' : language === 'pt' ? 'Regenerar' : 'Regenerate'}
                              </span>
                            </button>

                            {message.fallbackUsed && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                                {language === 'es'
                                  ? `Respuesta generada con modelo de respaldo (${message.actualModel || 'Alternativo'})`
                                  : language === 'pt'
                                    ? `Resposta gerada com modelo de backup (${message.actualModel || 'Alternativo'})`
                                    : `Answer generated with fallback model (${message.actualModel || 'Fallback'})`}
                              </span>
                            )}
                          </div>
                        )}
                        

                      </div>

                      {message.role === 'user' && (
                        <motion.div
                          initial={{ scale: 0, rotate: 180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.5, ease: 'backOut' }}
                          className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center shadow-lg border-2 border-white"
                        >
                          <User className="h-5 w-5 text-white" />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-3" />
                    <p>{language === 'es' ? 'Error:' : 'Error:'} {error}</p>
                  </div>
                  <button 
                    onClick={() => setError(null)}
                    className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form - Minimalist Capsule Style */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`w-full max-w-3xl mx-auto px-2 transition-all duration-500 flex-shrink-0 ${messages.length === 0 ? 'mb-[15vh]' : 'mt-4'}`}
          >
            {/* Preguntas Sugeridas - Pegadas a la barra */}
            <AnimatePresence>
              {messages.length === 0 && sampleQuestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-3 px-4"
                >
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-wrap justify-center gap-2"
                  >
                    {sampleQuestions.map((question, index) => (
                      <motion.button
                        key={index}
                        variants={itemVariants}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSampleQuestion(question)}
                        className="px-3 py-1 bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-800 rounded-full border border-gray-200/50 dark:border-gray-700/50 transition-all text-xs font-medium text-gray-600 dark:text-gray-300 backdrop-blur-sm"
                      >
                        {question}
                      </motion.button>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <form 
              onSubmit={handleSubmit} 
              className={`relative flex items-center gap-2 bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl border transition-all p-2 pl-4 ${
                isLoading 
                  ? 'border-amber-400 shadow-amber-100 dark:shadow-none' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              aria-label={language === 'es' ? 'Formulario de chat' : language === 'pt' ? 'Formulário de chat' : 'Chat form'}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                className="hidden"
                aria-hidden="true"
                tabIndex={-1}
              />
              
              {/* File Upload Trigger */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-full transition-colors flex-shrink-0 ${
                  pdfFile 
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                    : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={pdfFile ? currentTexts.pdfAttached : currentTexts.uploadPdf}
                aria-label={pdfFile ? currentTexts.pdfAttached : currentTexts.uploadPdf}
              >
                {pdfFile ? <FileText className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
              </button>

              {/* Theological Mode Toggle */}
              <button
                type="button"
                onClick={() => setIsSpecialist(!isSpecialist)}
                className={`pl-2 pr-3 py-1.5 rounded-full transition-all flex-shrink-0 flex items-center gap-2 border ${
                  isSpecialist
                    ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700'
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700'
                }`}
                title={language === 'es' ? 'Activar modo teólogo avanzado' : 'Toggle theological mode'}
                aria-label={language === 'es' ? 'Modo teólogo' : language === 'pt' ? 'Modo teológico' : 'Theological mode'}
                aria-pressed={isSpecialist}
              >
                <BookOpen className="h-4 w-4" />
                <span className="text-xs font-bold whitespace-nowrap hidden sm:inline-block">
                  {language === 'es' ? 'Modo Teólogo' : language === 'pt' ? 'Modo Teológico' : 'Theology Mode'}
                </span>
                <span className="text-xs font-bold whitespace-nowrap sm:hidden">
                  {isSpecialist ? 'ON' : 'OFF'}
                </span>
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={language === 'es' ? 'Pregunta algo sobre la fe...' : language === 'pt' ? 'Pergunte algo sobre a fé...' : 'Ask something about faith...'}
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm sm:text-base text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 py-2 min-w-0"
                disabled={isLoading}
                aria-label={language === 'es' ? 'Escribe tu pregunta' : language === 'pt' ? 'Digite sua pergunta' : 'Type your question'}
              />

              {/* Mic (STT) */}
              <button
                type="button"
                onClick={() => {
                  if (isRecording) {
                    void stopTranscription();
                  } else {
                    void startTranscription();
                  }
                }}
                disabled={isLoading || isTranscribing}
                className={`p-2 rounded-full transition-all flex-shrink-0 ${
                  isRecording
                    ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                    : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={
                  isRecording
                    ? (language === 'es' ? 'Detener' : language === 'pt' ? 'Parar' : 'Stop')
                    : (language === 'es' ? 'Hablar' : language === 'pt' ? 'Falar' : 'Speak')
                }
                aria-label={language === 'es' ? 'Entrada de voz' : language === 'pt' ? 'Entrada de voz' : 'Voice input'}
                aria-pressed={isRecording}
              >
                {isTranscribing ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : isRecording ? (
                  <Square className="h-4 w-4 fill-current" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!input.trim() && !isLoading}
                onClick={(e) => {
                  if (isLoading) {
                    e.preventDefault();
                    handleStopGeneration();
                  }
                }}
                className={`p-2.5 rounded-full transition-all flex-shrink-0 shadow-sm ${
                  isLoading
                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                    : !input.trim()
                      ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                      : 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow-md hover:scale-105 active:scale-95'
                }`}
                title={
                  isLoading
                    ? language === 'es'
                      ? 'Detener respuesta'
                      : language === 'pt'
                        ? 'Parar resposta'
                        : 'Stop response'
                    : currentTexts.send
                }
                aria-label={isLoading ? (language === 'es' ? 'Detener' : 'Stop') : currentTexts.send}
              >
                {isLoading ? (
                  <Square className="h-4 w-4 fill-current" />
                ) : (
                  <Send className="h-4 w-4 ml-0.5" />
                )}
              </button>
            </form>

            <AnimatePresence>
              {(isRecording || isTranscribing) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 flex justify-center"
                >
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 px-3 py-1 rounded-full border border-red-100 dark:border-red-900/20">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
                    </span>
                    <span>
                      {isTranscribing
                        ? language === 'es'
                          ? 'Transcribiendo...'
                          : language === 'pt'
                            ? 'Transcrevendo...'
                            : 'Transcribing...'
                        : language === 'es'
                          ? 'Escuchando...'
                          : language === 'pt'
                            ? 'Ouvindo...'
                            : 'Listening...'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Auto-send Checkbox - Hidden by default or very subtle */}
            {isRecording && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="mt-2 flex justify-center"
              >
                <label className="inline-flex items-center gap-2 cursor-pointer select-none text-[10px] text-gray-500">
                  <input
                    type="checkbox"
                    className="h-3 w-3 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    checked={autoSendVoice}
                    onChange={(e) => setAutoSendVoice(e.target.checked)}
                  />
                  <span>
                    {language === 'es'
                      ? 'Enviar al terminar'
                      : language === 'pt'
                        ? 'Enviar ao terminar'
                        : 'Auto-send'}
                  </span>
                </label>
              </motion.div>
            )}

            {/* PDF Info */}
            <AnimatePresence>
              {pdfFile && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 flex justify-center"
                >
                  <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-full px-3 py-1 text-xs text-green-700 dark:text-green-300">
                    <FileText className="h-3 w-3" />
                    <span className="font-medium max-w-[150px] truncate">{pdfFile.name}</span>
                    <button onClick={removePdf} className="ml-1 hover:text-green-900 dark:hover:text-green-100"><X className="h-3 w-3" /></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
      <ChatRightSidebar />
      </div>
    </div>
    </AuthFlowManager>
  );
}
