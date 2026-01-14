'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, Home, LogIn, User, Sparkles, BookOpen, FlaskConical, AlertTriangle, X, Settings, Zap, BarChart2, Clock, Upload, FileText, Mic, Square, Volume2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import SantaPalabraLogo from '@/components/SantaPalabraLogo';
import EmailSubscriptionModal from '@/components/EmailSubscriptionModal';
import { subscribeToNewsletter, shouldShowSubscriptionModal, markSubscriptionSkipped } from '@/lib/subscription';
import { useUserProgress } from '@/components/GamificationSystem';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  responseTime?: number;
  implementation?: string;
}

export default function CatholicChatPage() {
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [implementation, setImplementation] = useState<'LangChain' | 'LlamaIndex'>('LangChain');
  const [showMetrics, setShowMetrics] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [isBowing, setIsBowing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'anthropic' | 'openai' | 'gemini' | 'llama'>('anthropic');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [userXP, setUserXP] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [autoSendVoice, setAutoSendVoice] = useState(false);
  const { language } = useLanguage();
  const { progress, addXP } = useUserProgress();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sttWsRef = useRef<WebSocket | null>(null);
  const sttStreamRef = useRef<MediaStream | null>(null);
  const sttAudioContextRef = useRef<AudioContext | null>(null);
  const sttProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sttSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const transcriptRef = useRef<string>('');

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

  // Sincronizar modelo seleccionado con localStorage
  useEffect(() => {
    const savedModel = localStorage.getItem('santapalabra_selected_model');
    if (savedModel) {
      setSelectedModel(savedModel as typeof selectedModel);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('santapalabra_selected_model', selectedModel);
  }, [selectedModel]);

  // Mostrar modal de suscripción después de 3 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      if (shouldShowSubscriptionModal()) {
        setShowSubscriptionModal(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Cargar XP del usuario desde el progreso de gamificación
  useEffect(() => {
    const currentXP = progress.xp || 0;
    // Si es un usuario nuevo, darle XP inicial
    if (currentXP === 0) {
      addXP(50, 'Bienvenida a SantaPalabra');
      setUserXP(50);
    } else {
      setUserXP(currentXP);
    }
  }, [progress, addXP]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => setUser(session?.user || null)
    );
    return () => subscription.unsubscribe();
  }, []);

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
        body: JSON.stringify({ text: clippedText }),
      });

      if (!response.ok) {
        let serverError: any = null;
        try {
          serverError = await response.json();
        } catch {
          // ignore
        }
        const message = serverError?.error || serverError?.details || `HTTP ${response.status}`;
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
      console.error('TTS error:', err);
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
      let s = Math.max(-1, Math.min(1, input[i]));
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

          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessageText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    // Verificar XP suficiente para el modelo seleccionado
    const modelCosts = { anthropic: 5, openai: 8, gemini: 6, llama: 3 };
    const cost = modelCosts[selectedModel];
    
    if (userXP < cost) {
      setError(language === 'es' ? `Necesitas ${cost} XP para usar ${selectedModel}. XP actual: ${userXP}` :
               language === 'pt' ? `Você precisa de ${cost} XP para usar ${selectedModel}. XP atual: ${userXP}` :
               `You need ${cost} XP to use ${selectedModel}. Current XP: ${userXP}`);
      return;
    }

    // Activar animación de reverencia
    setIsBowing(true);
    setTimeout(() => setIsBowing(false), 4000); // Duración de la animación - 4 segundos para transición suave

    const userMessage: Message = {
      id: Date.now().toString() + '_user',
      role: 'user',
      content: trimmed,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    const startTime = Date.now();

    try {
      const apiEndpoint = advancedMode ? '/api/catholic-simple' : '/api/catholic-rag';
      const requestBody = advancedMode
        ? { query: userMessage.content, implementation, mode: 'standard', language, model: selectedModel }
        : { query: userMessage.content, implementation: 'Catholic Chat', language, model: selectedModel };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let serverError: any = null;
        try {
          serverError = await response.json();
        } catch {
          // ignore
        }

        const statusInfo = `HTTP ${response.status}`;
        const messageFromServer =
          serverError?.error ||
          serverError?.message ||
          (typeof serverError === 'string' ? serverError : null);

        const detailsFromServer =
          typeof serverError?.details === 'string' ? serverError.details : null;

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
        responseTime: advancedMode ? responseTime : undefined,
        implementation: advancedMode ? implementation : undefined
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Descontar XP después de respuesta exitosa
      const newXP = Math.max(0, userXP - cost);
      setUserXP(newXP);
      
      // También dar algunos XP por la interacción
      addXP(2, 'Conversación católica');
      
    } catch (error) {
      console.error('Error:', error);

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

  const newChat = () => {
    setMessages([]);
    setError(null);
    setPdfFile(null);
  };

  // Funciones para el modal de suscripción
  const handleSubscribe = async (email: string) => {
    await subscribeToNewsletter(email, language);
    setShowSubscriptionModal(false);
    addXP(25, 'Suscripción al newsletter');
  };

  const handleSkipSubscription = () => {
    markSubscriptionSkipped();
    setShowSubscriptionModal(false);
  };

  const handleSignIn = () => {
    // Implementar lógica de sign in
    console.log('Sign in clicked');
  };

  const handleSignOut = () => {
    // Implementar lógica de sign out
    console.log('Sign out clicked');
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

  // Banco completo de preguntas categorizadas
  const categorizedQuestions = {
    es: {
      scripture: [
        "¿Qué enseña la Sagrada Escritura sobre la creación?",
        "¿Cómo interpretar la parábola del hijo pródigo?",
        "¿Qué significa 'Hágase tu voluntad' en el Padrenuestro?",
        "¿Cómo se formó el canon de la Biblia?"
      ],
      tradition: [
        "¿Qué enseña la Iglesia Católica sobre la Trinidad?",
        "¿Cuál es el significado de la Eucaristía?",
        "¿Qué enseña el Catecismo sobre la confesión?",
        "¿Qué dice el Magisterio sobre el matrimonio?"
      ],
      spirituality: [
        "¿Cómo deben los católicos abordar la oración?",
        "Cuéntame sobre la devoción al Sagrado Corazón",
        "¿Qué enseña Santa Teresa de Ávila sobre la oración?",
        "¿Cuál es la noche oscura según San Juan de la Cruz?"
      ],
      morality: [
        "¿Qué enseña la Iglesia sobre la dignidad humana?",
        "¿Cuándo es lícito defenderse en la guerra justa?",
        "¿Qué dice la Iglesia sobre la eutanasia?",
        "¿Cómo entender el mandamiento 'no matarás'?"
      ],
      saints: [
        "¿Qué enseña la Iglesia sobre la Virgen María?",
        "¿Cuál fue la contribución de San Agustín a la teología?",
        "¿Qué podemos aprender de Santa Teresa de Calcuta?",
        "¿Cómo vivió el testimonio San Francisco de Asís?"
      ],
      latinamerica: [
        "¿Qué dice el CELAM sobre la evangelización en América Latina?",
        "¿Cómo influyó la Virgen de Guadalupe en la evangelización?",
        "¿Qué enseña la teología de la liberación?",
        "¿Cuál es el rol de los laicos en la Iglesia latinoamericana?"
      ],
      mysticism: [
        "¿Qué enseña San Juan de la Cruz sobre la contemplación?",
        "¿Cómo describe Santa Teresa los grados de oración?",
        "¿Qué significa 'castillo interior' en la mística teresiana?",
        "¿Cómo entender el 'camino de perfección'?"
      ],
      catechesis: [
        "¿Qué son los sacramentos de iniciación cristiana?",
        "¿Cuál es la importancia de la catequesis familiar?",
        "¿Cómo preparar a un niño para la primera comunión?",
        "¿Qué enseña la Iglesia sobre la confirmación?"
      ]
    },
    pt: {
      scripture: [
        "O que a Sagrada Escritura ensina sobre a criação?",
        "Como interpretar a parábola do filho pródigo?",
        "O que significa 'Seja feita a tua vontade' no Pai Nosso?",
        "Como se formou o cânon da Bíblia?"
      ],
      tradition: [
        "O que a Igreja Católica ensina sobre a Trindade?",
        "Qual é o significado da Eucaristia?",
        "O que ensina o Catecismo sobre a confissão?",
        "O que diz o Magistério sobre o casamento?"
      ],
      spirituality: [
        "Como os católicos devem abordar a oração?",
        "Conte-me sobre a devoção ao Sagrado Coração",
        "O que Santa Teresa de Ávila ensina sobre a oração?",
        "O que é a noite escura segundo São João da Cruz?"
      ],
      morality: [
        "O que a Igreja ensina sobre a dignidade humana?",
        "Quando é lícito defender-se na guerra justa?",
        "O que a Igreja diz sobre a eutanásia?",
        "Como entender o mandamento 'não matarás'?"
      ],
      saints: [
        "O que a Igreja ensina sobre a Virgem Maria?",
        "Qual foi a contribuição de Santo Agostinho para a teologia?",
        "O que podemos aprender com Santa Teresa de Calcutá?",
        "Como viveu o testemunho São Francisco de Assis?"
      ],
      latinamerica: [
        "O que o CELAM diz sobre a evangelização na América Latina?",
        "Como influenciou a Virgem de Guadalupe na evangelização?",
        "O que ensina a teologia da libertação?",
        "Qual é o papel dos leigos na Igreja latino-americana?"
      ],
      mysticism: [
        "O que ensina São João da Cruz sobre a contemplação?",
        "Como descreve Santa Teresa os graus de oração?",
        "O que significa 'castelo interior' na mística teresiana?",
        "Como entender o 'caminho de perfeição'?"
      ],
      catechesis: [
        "Quais são os sacramentos de iniciação cristã?",
        "Qual é a importância da catequese familiar?",
        "Como preparar uma criança para a primeira comunhão?",
        "O que a Igreja ensina sobre a confirmação?"
      ]
    },
    en: {
      scripture: [
        "What does Sacred Scripture teach about creation?",
        "How to interpret the parable of the prodigal son?",
        "What does 'Thy will be done' mean in the Lord's Prayer?",
        "How was the Bible canon formed?"
      ],
      tradition: [
        "What is the Catholic teaching on the Trinity?",
        "What is the significance of the Eucharist?",
        "What does the Catechism teach about confession?",
        "What does the Magisterium say about marriage?"
      ],
      spirituality: [
        "How should Catholics approach prayer?",
        "Tell me about devotion to the Sacred Heart",
        "What does Saint Teresa of Ávila teach about prayer?",
        "What is the dark night according to Saint John of the Cross?"
      ],
      morality: [
        "What does the Church teach about human dignity?",
        "When is it lawful to defend oneself in just war?",
        "What does the Church say about euthanasia?",
        "How to understand the commandment 'thou shalt not kill'?"
      ],
      saints: [
        "What does the Church teach about the Virgin Mary?",
        "What was Saint Augustine's contribution to theology?",
        "What can we learn from Saint Teresa of Calcutta?",
        "How did Saint Francis of Assisi live his testimony?"
      ],
      latinamerica: [
        "What does CELAM say about evangelization in Latin America?",
        "How did Our Lady of Guadalupe influence evangelization?",
        "What does liberation theology teach?",
        "What is the role of laypeople in the Latin American Church?"
      ],
      mysticism: [
        "What does Saint John of the Cross teach about contemplation?",
        "How does Saint Teresa describe the degrees of prayer?",
        "What does 'interior castle' mean in Teresian mysticism?",
        "How to understand the 'way of perfection'?"
      ],
      catechesis: [
        "What are the sacraments of Christian initiation?",
        "What is the importance of family catechesis?",
        "How to prepare a child for first communion?",
        "What does the Church teach about confirmation?"
      ]
    }
  };

  // Estado para preferencias del usuario
  const [userPreferences, setUserPreferences] = useState<any>(null);

  // Cargar preferencias del usuario
  useEffect(() => {
    const savedProfile = localStorage.getItem('santapalabra_user_profile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setUserPreferences(profile.preferences);
    }
  }, []);

  // Seleccionar preguntas personalizadas
  const [sampleQuestions, setSampleQuestions] = useState<string[]>([]);

  useEffect(() => {
    const gospelQuestion = language === 'es' 
      ? '¿Me explicas el evangelio del día?' 
      : language === 'pt'
      ? 'Você pode me explicar o evangelho do dia?'
      : 'Can you explain today\'s Gospel to me?';
    
    let questions: string[] = [];

    if (userPreferences && userPreferences.interests && userPreferences.interests.length > 0) {
      // Si hay preferencias, seleccionar preguntas basadas en intereses
      const langQuestions = categorizedQuestions[language];
      userPreferences.interests.forEach((interest: string) => {
        const interestKey = interest as keyof typeof langQuestions;
        if (langQuestions[interestKey]) {
          questions.push(...langQuestions[interestKey]);
        }
      });
      
      // Si no hay suficientes preguntas de intereses, agregar algunas generales
      if (questions.length < 4) {
        const generalQuestions = Object.values(langQuestions).flat();
        const additionalQuestions = generalQuestions
          .filter(q => !questions.includes(q))
          .sort(() => Math.random() - 0.5)
          .slice(0, 4 - questions.length);
        questions.push(...additionalQuestions);
      }
    } else {
      // Si no hay preferencias, usar preguntas generales aleatorias
      const langQuestions = categorizedQuestions[language];
      const allQuestions = Object.values(langQuestions).flat();
      questions = allQuestions.sort(() => Math.random() - 0.5);
    }

    // Seleccionar 2 preguntas aleatorias + evangelio del día
    const shuffled = questions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 2);
    
    setSampleQuestions([...selected, gospelQuestion]);
  }, [language, userPreferences]);

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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col relative overflow-hidden">
      {/* Modal de suscripción */}
      <EmailSubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={handleSkipSubscription}
        onSubscribe={handleSubscribe}
      />

      {/* Imágenes decorativas católicas de fondo */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div
          initial={{ opacity: 0, rotate: 0 }}
          animate={{ opacity: 0.15, rotate: 12 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute top-[10%] left-[2%] h-32 w-32 md:h-40 md:w-40"
          style={{ filter: 'sepia(80%) brightness(0.5) contrast(120%) saturate(1.2)' }}
        >
          <Image src="/SantaTeresa.svg" alt="" fill className="object-contain" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, rotate: 0 }}
          animate={{ opacity: 0.15, rotate: -12 }}
          transition={{ duration: 2, delay: 0.7 }}
          className="absolute top-[30%] right-[2%] h-32 w-32 md:h-40 md:w-40"
          style={{ filter: 'sepia(80%) brightness(0.5) contrast(120%) saturate(1.2)' }}
        >
          <Image src="/san juan.svg" alt="" fill className="object-contain" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, rotate: 0 }}
          animate={{ opacity: 0.18, rotate: 0 }}
          transition={{ duration: 2, delay: 0.9 }}
          className="absolute bottom-[15%] left-[1%] h-28 w-28 md:h-36 md:w-36"
          style={{ filter: 'sepia(80%) brightness(0.5) contrast(120%) saturate(1.2)' }}
        >
          <Image src="/guadalupana.svg" alt="" fill className="object-contain" />
        </motion.div>
      </div>

      {/* Advanced Mode Settings Panel */}
      <AnimatePresence>
        {advancedMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden bg-purple-50/50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-700"
          >
            <div className="max-w-4xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900 dark:text-purple-100">{currentTexts.advancedMode}</span>
                  </div>
                  <div className="h-4 w-px bg-purple-300 dark:bg-purple-600"></div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-purple-700 dark:text-purple-300">{currentTexts.implementation}:</label>
                    <select
                      value={implementation}
                      onChange={(e) => setImplementation(e.target.value as 'LangChain' | 'LlamaIndex')}
                      className="text-xs border border-purple-300 dark:border-purple-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                    >
                      <option value="LangChain">LangChain</option>
                      <option value="LlamaIndex">LlamaIndex</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => setShowMetrics(!showMetrics)}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                    showMetrics ? 'bg-purple-200 dark:bg-purple-700 text-purple-900 dark:text-purple-100' : 'text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-800'
                  }`}
                >
                  <BarChart2 className="h-3 w-3" />
                  {currentTexts.showMetrics}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <main className="flex-1 flex items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-3xl">
          {/* Logo SantaPalabra - Estático con animación de reverencia */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ 
              opacity: 1, 
              y: 0
            }}
            className="flex flex-col items-center mb-8"
          >
            <div className="relative">
              <AnimatePresence mode="wait">
                {isBowing ? (
                  <motion.div 
                    key="bowing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                  >
                    <Image 
                      src="/santapalabraBowing.gif" 
                      alt="SantaPalabra haciendo reverencia" 
                      width={128} 
                      height={128}
                      className="brightness-110 drop-shadow-lg rounded-full"
                      style={{ 
                        mixBlendMode: 'multiply',
                        backgroundColor: 'transparent'
                      }}
                      unoptimized
                    />
                    {/* Leyenda durante animación */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
                    >
                      <span className="text-amber-600 text-sm font-semibold tracking-wide">
                        SantaPalabra
                      </span>
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 0] }}
                      transition={{ duration: 2, repeat: 0 }}
                      className="absolute inset-0 rounded-full bg-amber-400/30 blur-xl -z-10"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="static"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Image 
                      src="/santapalabra-logo.svg" 
                      alt="SantaPalabra" 
                      width={128} 
                      height={128}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Recomendaciones de Aprendizaje Personalizadas */}
          {userPreferences && userPreferences.learningGoals && userPreferences.learningGoals.length > 0 && messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-2xl p-6 mb-6 border border-amber-200 dark:border-amber-700"
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
                {userPreferences.learningGoals.map((goal: string, index: number) => {
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

          {/* Input Form - Centrado */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mb-6"
          >
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              {/* Botón Upload PDF */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                className="hidden"
              />
              <motion.button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-3 rounded-full transition-colors shadow-md ${
                  pdfFile 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title={pdfFile ? currentTexts.pdfAttached : currentTexts.uploadPdf}
              >
                {pdfFile ? <FileText className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
              </motion.button>

              {/* Model Selector */}
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as typeof selectedModel)}
                className="px-3 py-2 border border-amber-200 dark:border-amber-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              >
                <option value="anthropic">Anthropic (5 XP)</option>
                <option value="openai">OpenAI (8 XP)</option>
                <option value="gemini">Gemini AI (6 XP)</option>
                <option value="llama">Llama Advanced (3 XP)</option>
              </select>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="¿Qué quieres aprender hoy?"
                className="flex-1 px-5 py-3 border border-amber-200 dark:border-amber-700 rounded-full focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                disabled={isLoading}
              />

              {/* Mic (STT) */}
              <motion.button
                type="button"
                onClick={() => {
                  if (isRecording) {
                    void stopTranscription();
                  } else {
                    void startTranscription();
                  }
                }}
                disabled={isLoading || isTranscribing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-3 rounded-full transition-colors shadow-md ${
                  isRecording
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                } disabled:bg-gray-300 disabled:cursor-not-allowed`}
                title={
                  isRecording
                    ? (language === 'es' ? 'Detener' : language === 'pt' ? 'Parar' : 'Stop')
                    : (language === 'es' ? 'Hablar' : language === 'pt' ? 'Falar' : 'Speak')
                }
              >
                {isTranscribing ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                ) : isRecording ? (
                  <Square className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </motion.button>

              <motion.button
                type="submit"
                disabled={!input.trim() || isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 bg-amber-500 text-white rounded-full hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md"
                title={isLoading ? currentTexts.loading : currentTexts.send}
              >
                {isLoading ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </motion.button>
            </form>

            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-gray-600 dark:text-gray-300">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  checked={autoSendVoice}
                  onChange={(e) => setAutoSendVoice(e.target.checked)}
                />
                <span>
                  {language === 'es'
                    ? 'Auto-enviar al parar el micrófono'
                    : language === 'pt'
                      ? 'Enviar automaticamente ao parar o microfone'
                      : 'Auto-send when stopping mic'}
                </span>
              </label>
              <span className="text-gray-400 dark:text-gray-500">
                {language === 'es'
                  ? 'Voz → texto'
                  : language === 'pt'
                    ? 'Voz → texto'
                    : 'Voice → text'}
              </span>
            </div>

            {/* PDF Info */}
            <AnimatePresence>
              {pdfFile && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{pdfFile.name}</span>
                    <span className="text-xs text-green-600">({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                  <button
                    onClick={removePdf}
                    className="text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* PDF Limits Info */}
            <div className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
              {currentTexts.pdfLimits}
            </div>
          </motion.div>

          {/* Preguntas Sugeridas - Debajo de la barra */}
          <AnimatePresence>
            {messages.length === 0 && sampleQuestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center uppercase tracking-wide mb-3">
                  {language === 'es' ? 'Preguntas sugeridas' : 'Suggested questions'}
                </h3>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-2"
                >
                  {sampleQuestions.map((question, index) => (
                    <motion.button
                      key={index}
                      variants={itemVariants}
                      whileHover={{ scale: 1.01, borderColor: 'rgb(251 191 36)' }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleSampleQuestion(question)}
                      className="text-left px-4 py-2.5 bg-white dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700 transition-all text-sm text-gray-700 dark:text-gray-300 shadow-sm"
                    >
                      {question}
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages - Renderizar cuando existan */}
          {messages.length > 0 && (
            <div className="mt-6 space-y-4 max-h-[50vh] overflow-y-auto">
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
                        <div className="prose prose-sm max-w-none">
                          {message.role === 'assistant' ? (
                            <div 
                              className="whitespace-pre-wrap leading-relaxed"
                              dangerouslySetInnerHTML={{ 
                                __html: message.content.replace(/\n/g, '<br>') 
                              }}
                            />
                          ) : (
                            <p className="whitespace-pre-wrap font-medium">{message.content}</p>
                          )}
                        </div>
                      </div>

                      {message.role === 'assistant' && (
                        <div className="mt-2 flex items-center gap-2">
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
                        </div>
                      )}
                      
                      {advancedMode && showMetrics && message.role === 'assistant' && message.responseTime && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-2 ml-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400"
                        >
                          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                            <Clock className="h-3 w-3" />
                            <span>{message.responseTime}ms</span>
                          </div>
                          <div className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/50 px-2 py-1 rounded-full text-purple-700 dark:text-purple-300">
                            <Zap className="h-3 w-3" />
                            <span>{message.implementation}</span>
                          </div>
                        </motion.div>
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
                className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 flex items-center justify-between"
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
      </main>
    </div>
  );
}