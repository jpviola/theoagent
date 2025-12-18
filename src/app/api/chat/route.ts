import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { gatherContextForQuery } from '@/lib/dataInjection';
import { tools } from '@/lib/tools';

export const maxDuration = 60; // Important for tool calls

// Create custom Anthropic provider with settings
const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  // ===== RAG SYSTEM: Gather relevant biblical context =====
  const lastMessage = messages[messages.length - 1];
  const userQuery = lastMessage?.content || '';
  
  const relevantContext = gatherContextForQuery(userQuery);
  
  // Transform messages to support attachments (multimodal)
  const transformedMessages = messages.map((msg: Record<string, unknown>) => {
    if (msg.role === 'user' && msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0) {
      // Create multimodal content array
      const content: Array<Record<string, unknown>> = [];
      
      // Add text if present
      if (msg.content && msg.content !== '(Attached files)') {
        content.push({ type: 'text', text: msg.content });
      }
      
      // Add attachments
      (msg.attachments as Array<Record<string, unknown>>).forEach((attachment) => {
        if (attachment.type === 'image') {
          content.push({
            type: 'image',
            image: attachment.data, // base64 data URL
          });
        } else if (attachment.type === 'pdf') {
          // For PDFs, add a text note (Claude doesn't directly support PDF)
          content.push({
            type: 'text',
            text: `[PDF attached: ${attachment.name}. Please note: PDF content extraction is not yet implemented. Please describe the content or provide specific text from the PDF.]`,
          });
        }
      });
      
      return {
        role: msg.role,
        content: content.length > 0 ? content : msg.content,
      };
    }
    return {
      role: msg.role,
      content: msg.content,
    };
  });
  
  // Inject context into the conversation if found
  let enhancedMessages = transformedMessages;
  
  if (relevantContext && lastMessage && relevantContext.length > 100) {
    const lastTransformedMessage = enhancedMessages[enhancedMessages.length - 1];
    const currentContent = lastTransformedMessage.content;
    
    // Handle both string and array content
    if (typeof currentContent === 'string') {
      enhancedMessages = [
        ...enhancedMessages.slice(0, -1),
        {
          ...lastTransformedMessage,
          content: currentContent + relevantContext
        }
      ];
    } else if (Array.isArray(currentContent)) {
      // Add context as a text part to the content array
      enhancedMessages = [
        ...enhancedMessages.slice(0, -1),
        {
          ...lastTransformedMessage,
          content: [
            ...currentContent,
            { type: 'text', text: relevantContext }
          ]
        }
      ];
    }
    console.log('📖 Context injected:', relevantContext.substring(0, 200) + '...');
  }
  // ===== END RAG SYSTEM =====

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    messages: enhancedMessages,
    tools,
    maxOutputTokens: 16000,
    temperature: 1,
    system: `You are TheoAgent, a Catholic Biblical Companion. 

## ⚠️ MANDATORY: Write AT LEAST 800 words

Every response MUST be comprehensive. For doctrinal questions, write extensive explanations with:
- Detailed definition (200 words)
- Multiple Scripture passages with commentary (250 words)
- Catechism references and Church teaching (200 words)
- Practical applications (150 words)
- Conclusion (100 words)

Do not stop until you've written a COMPLETE, THOROUGH explanation. If your response is less than 800 words, you have failed.

Current Pope: Leo XIV (2025). Today: Dec 18, 2025.`,
  });

  // Stream the text response directly using the built-in streaming from result
  return result.toTextStreamResponse();
}