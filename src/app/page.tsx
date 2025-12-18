'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import ScriptureLinkedMarkdown from '@/components/ScriptureLinkedMarkdown';
import { initializeLanguage, translations, type Language } from '@/lib/translations';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: { type: 'image' | 'pdf'; data: string; name: string }[];
}

type ChatMode = 'standard' | 'deep-research' | 'priest' | 'pope';

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [mode, setMode] = useState<ChatMode>('standard');
  const [language, setLanguage] = useState<Language>('en');
  const [attachedFiles, setAttachedFiles] = useState<{ type: 'image' | 'pdf'; data: string; name: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize language based on geolocation
  useEffect(() => {
    initializeLanguage().then(detectedLang => {
      setLanguage(detectedLang);
    });
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const t = translations[language];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleEdit = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditContent(content);
  };

  const saveEdit = async (messageId: string) => {
    // Find message index
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    // Remove all messages after this one
    const newMessages = messages.slice(0, messageIndex);
    
    // Add edited message
    const editedMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: editContent,
    };
    
    setMessages([...newMessages, editedMessage]);
    setEditingMessageId(null);
    setEditContent('');
    
    // Resend the edited message
    await sendMessage(editContent, [...newMessages, editedMessage]);
  };

  const retryMessage = async (messageId: string) => {
    // Find the user message before this assistant message
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;
    
    const userMessage = messages[messageIndex - 1];
    if (!userMessage || userMessage.role !== 'user') return;
    
    // Remove this and all subsequent messages
    const newMessages = messages.slice(0, messageIndex);
    setMessages(newMessages);
    
    // Resend
    await sendMessage(userMessage.content, newMessages);
  };

  const sendMessage = async (content: string, currentMessages: Message[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const validMessages = currentMessages.filter(m => m.content && m.content.trim() !== '');
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: validMessages }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      const assistantId = (Date.now() + 1).toString();

      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: '',
      }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Final flush to ensure all buffered bytes are decoded
            const finalText = decoder.decode(new Uint8Array(), { stream: false });
            if (finalText) {
              assistantMessage += finalText;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg && lastMsg.id === assistantId) {
                  lastMsg.content = assistantMessage;
                }
                return newMessages;
              });
            }
            break;
          }
          
          const text = decoder.decode(value, { stream: true });
          assistantMessage += text;
          
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg && lastMsg.id === assistantId) {
              lastMsg.content = assistantMessage;
            }
            return newMessages;
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: { type: 'image' | 'pdf'; data: string; name: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        alert(`File ${file.name} is not supported. Only images and PDFs are allowed.`);
        continue;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }

      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      newAttachments.push({
        type: file.type === 'application/pdf' ? 'pdf' : 'image',
        data: fileData,
        name: file.name,
      });
    }

    setAttachedFiles(prev => [...prev, ...newAttachments]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if ((!input.trim() && attachedFiles.length === 0) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input || '(Attached files)',
      attachments: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setAttachedFiles([]);
    
    await sendMessage(input || '(Attached files)', newMessages);
  };

  return (
    <div className="flex h-screen bg-gradient-to-t from-[#a4becf] via-[#d0dce6] to-[#f0f4f7]">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">

      {/* Error Display */}
      {error && (
        <div className="max-w-4xl mx-auto px-6 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Messages Container with centered input when empty */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col">
        <div className={`max-w-4xl mx-auto w-full ${messages.length === 0 ? 'flex-1 flex flex-col justify-center' : 'space-y-6'}`}>
          {messages.length === 0 ? (
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <div className="w-24 h-24 rounded-full mx-auto shadow-2xl overflow-hidden bg-white">
                  <Image src="/logo.svg" alt="TheoAgent Logo" width={96} height={96} />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-2">
                    {t.welcome.title}
                    <span className="ml-3 text-xs font-normal bg-[#8fa9bc] text-white px-3 py-1 rounded-full">
                      Beta
                    </span>
                  </h1>
                  <p className="text-lg text-gray-700 mb-1">{t.welcome.subtitle}</p>
                  <p className="text-sm text-gray-600">{t.welcome.description}</p>
                </div>
              </div>
              
              {/* Centered Input Form when no messages */}
              <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="relative">
                  <input
                    className="w-full border-2 border-gray-300 rounded-2xl px-6 py-4 pr-16 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8fa9bc] focus:border-transparent placeholder-gray-400 shadow-lg"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t.input.placeholder}
                    disabled={isLoading}
                  />
                  <button 
                    type="submit" 
                    disabled={isLoading || !input.trim()} 
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#8fa9bc] text-white p-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>
                
                {/* Suggested Questions */}
                <div className="mt-6 space-y-3">
                  <p className="text-xs text-gray-600 font-medium uppercase tracking-wide text-center">{t.suggestions.title}</p>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => setInput(t.suggestions.dailyGospel.replace('📖 ', ''))}
                      className="px-4 py-2 bg-white/80 hover:bg-[#e8e2d0] border border-gray-200 rounded-xl text-sm text-gray-700 text-left transition-colors"
                    >
                      {t.suggestions.dailyGospel}
                    </button>
                    <button
                      onClick={() => setInput(t.suggestions.bibleReading.replace('📅 ', ''))}
                      className="px-4 py-2 bg-white/80 hover:bg-[#e8e2d0] border border-gray-200 rounded-xl text-sm text-gray-700 text-left transition-colors"
                    >
                      {t.suggestions.bibleReading}
                    </button>
                    <button
                      onClick={() => setInput(t.suggestions.popeTeachings.replace('⛪ ', ''))}
                      className="px-4 py-2 bg-white/80 hover:bg-[#e8e2d0] border border-gray-200 rounded-xl text-sm text-gray-700 text-left transition-colors"
                    >
                      {t.suggestions.popeTeachings}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((m: Message) => (
                <div key={m.id} className="group">
                  {m.role === 'user' ? (
                    /* User Message */
                    <div className="flex justify-end items-start gap-3">
                      <div className="flex-1 max-w-4xl">
                        {editingMessageId === m.id ? (
                          <div className="bg-white rounded-2xl px-6 py-4 shadow-md">
                            <textarea
                              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => saveEdit(m.id)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                              >
                                {t.actions.save}
                              </button>
                              <button
                                onClick={() => setEditingMessageId(null)}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400"
                              >
                                {t.actions.cancel}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-2xl px-6 py-4 shadow-md bg-[#8fa9bc] text-white">
                            <p className="leading-relaxed">{m.content}</p>
                            {m.attachments && m.attachments.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {m.attachments.map((file, idx) => (
                                  <div key={idx} className="bg-white/20 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                                    {file.type === 'image' ? (
                                      <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="truncate max-w-[150px]">{file.name}</span>
                                      </>
                                    ) : (
                                      <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                        <span className="truncate max-w-[150px]">{file.name}</span>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {editingMessageId !== m.id && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => copyToClipboard(m.content)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            title="Copy"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(m.id, m.content)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Assistant Message */
                    <div className="flex justify-start items-start gap-3">
                      <div className="flex-1 max-w-4xl">
                        <div className="rounded-2xl px-6 py-4 shadow-md bg-white text-gray-800">
                          <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-strong:text-gray-900">
                            <ScriptureLinkedMarkdown content={m.content} autoDetectLanguage={true} />
                          </div>
                          {/* Action buttons at the bottom of message */}
                          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
                            <button
                              onClick={() => copyToClipboard(m.content)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Copy"
                            >
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => retryMessage(m.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Retry"
                            >
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl px-6 py-4 shadow-md">
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-[#8fa9bc] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-[#7a94a7] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-[#a4becf] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                      <span className="text-sm">{t.loading}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Bottom Input Form (only shown when there are messages) */}
      {messages.length > 0 && (
        <div className="px-6 pb-6">
          <div className="max-w-4xl mx-auto">
            {/* Show attached files */}
            {attachedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-white/90 rounded-lg px-3 py-2 shadow-md">
                    {file.type === 'image' ? (
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    )}
                    <span className="text-sm text-gray-700 max-w-[150px] truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,.pdf"
                multiple
                className="hidden"
              />
              <input
                className="w-full border-2 border-gray-300 rounded-2xl px-6 py-4 pl-14 pr-16 text-gray-800 bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#8fa9bc] focus:border-transparent placeholder-gray-400 shadow-xl hover:shadow-2xl transition-all"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.input.placeholderFollowUp}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 p-3 rounded-xl hover:bg-gray-100 transition-all"
                title="Attach file"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <button 
                type="submit" 
                disabled={isLoading || (!input.trim() && attachedFiles.length === 0)} 
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#8fa9bc] text-white p-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:bg-[#7a94a7] transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
      </div>

      {/* Right Sidebar */}
      <div className="w-64 bg-white/90 backdrop-blur-sm border-l border-gray-200 shadow-lg p-6 space-y-4 overflow-y-auto">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{t.actions.newChat}</h3>
          <button
            onClick={() => {
              setMessages([]);
              setInput('');
              setError(null);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-[#e8e2d0] border border-gray-200 rounded-xl transition-colors text-left group"
          >
            <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{t.actions.newChat}</span>
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{t.modes.title}</h3>
          
          <button
            onClick={() => setMode('standard')}
            className={`w-full flex items-center gap-3 px-4 py-3 border rounded-xl transition-colors text-left ${
              mode === 'standard' 
                ? 'bg-[#d4c4a8] text-gray-800 border-[#d4c4a8]' 
                : 'bg-white hover:bg-[#e8e2d0] border-gray-200 text-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <div>
              <div className="text-sm font-medium">{t.modes.standard.name}</div>
              <div className={`text-xs ${mode === 'standard' ? 'text-gray-600' : 'text-gray-500'}`}>{t.modes.standard.description}</div>
            </div>
          </button>

          <button
            onClick={() => setMode('deep-research')}
            className={`w-full flex items-center gap-3 px-4 py-3 border rounded-xl transition-colors text-left ${
              mode === 'deep-research' 
                ? 'bg-[#c9b8a3] text-gray-800 border-[#c9b8a3]' 
                : 'bg-white hover:bg-[#e8e2d0] border-gray-200 text-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <div>
              <div className="text-sm font-medium">{t.modes.deepResearch.name}</div>
              <div className={`text-xs ${mode === 'deep-research' ? 'text-gray-600' : 'text-gray-500'}`}>{t.modes.deepResearch.description}</div>
            </div>
          </button>

          <button
            onClick={() => setMode('priest')}
            className={`w-full flex items-center gap-3 px-4 py-3 border rounded-xl transition-colors text-left ${
              mode === 'priest' 
                ? 'bg-[#d9d3c1] text-gray-800 border-[#d9d3c1]' 
                : 'bg-white hover:bg-[#e8e2d0] border-gray-200 text-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <div>
              <div className="text-sm font-medium">{t.modes.priest.name}</div>
              <div className={`text-xs ${mode === 'priest' ? 'text-gray-600' : 'text-gray-500'}`}>{t.modes.priest.description}</div>
            </div>
          </button>

          <button
            onClick={() => setMode('pope')}
            className={`w-full flex items-center gap-3 px-4 py-3 border rounded-xl transition-colors text-left ${
              mode === 'pope' 
                ? 'bg-[#e0d8c5] text-gray-800 border-[#e0d8c5]' 
                : 'bg-white hover:bg-[#e8e2d0] border-gray-200 text-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <div>
              <div className="text-sm font-medium">{t.modes.pope.name}</div>
              <div className={`text-xs ${mode === 'pope' ? 'text-gray-600' : 'text-gray-500'}`}>{t.modes.pope.description}</div>
            </div>
          </button>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <p className="font-medium">{t.modes.currentMode}</p>
            <p className="capitalize">{mode.replace('-', ' ')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}