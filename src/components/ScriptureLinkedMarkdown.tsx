'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { linkifyScripture, detectLanguage, type BibleLanguage } from '@/lib/scriptureLinks';
import { linkifyVaticanDocuments } from '@/lib/vaticanDocuments';

interface ScriptureLinkedMarkdownProps {
  content: string;
  language?: BibleLanguage;
  autoDetectLanguage?: boolean;
}

/**
 * Markdown component that automatically converts scripture references to links
 */
export default function ScriptureLinkedMarkdown({ 
  content, 
  language = 'english',
  autoDetectLanguage = true 
}: ScriptureLinkedMarkdownProps) {
  // Auto-detect language if enabled
  const detectedLanguage = autoDetectLanguage ? detectLanguage(content) : language;
  
  // Convert scripture references to markdown links
  let linkedContent = linkifyScripture(content, detectedLanguage);
  
  // Convert Vatican document references to markdown links
  linkedContent = linkifyVaticanDocuments(linkedContent);
  
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Custom link styling for scripture references - subtle and smaller
        a: ({ node, ...props }) => {
          const isBibleLink = props.href?.includes('bible.usccb.org') || 
                             props.href?.includes('vatican.va') ||
                             props.href?.includes('biblegateway.com');
          
          return (
            <a
              {...props}
              className={`${
                isBibleLink
                  ? 'text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline decoration-1 text-sm font-normal opacity-80 hover:opacity-100 transition-opacity'
                  : 'text-blue-500 hover:text-blue-700 underline'
              }`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {props.children}
            </a>
          );
        },
        // Style other markdown elements
        p: ({ node, ...props }) => (
          <p className="mb-3 leading-relaxed" {...props} />
        ),
        strong: ({ node, ...props }) => (
          <strong className="font-bold text-gray-900 dark:text-gray-100" {...props} />
        ),
        em: ({ node, ...props }) => (
          <em className="italic text-gray-800 dark:text-gray-200" {...props} />
        ),
        ul: ({ node, ...props }) => (
          <ul className="list-disc list-inside mb-3 space-y-1" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="list-decimal list-inside mb-3 space-y-1" {...props} />
        ),
        blockquote: ({ node, ...props }) => (
          <blockquote 
            className="border-l-4 border-blue-500 pl-4 py-2 my-3 italic text-gray-800 bg-blue-50/50" 
            {...props} 
          />
        ),
        code: ({ node, inline, ...props }: any) => 
          inline ? (
            <code 
              className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-purple-700 dark:text-purple-300" 
              {...props} 
            />
          ) : (
            <code 
              className="block bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm font-mono overflow-x-auto" 
              {...props} 
            />
          ),
        h1: ({ node, ...props }) => (
          <h1 className="text-2xl font-bold mb-3 mt-4" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h2 className="text-xl font-bold mb-2 mt-3" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h3 className="text-lg font-bold mb-2 mt-2" {...props} />
        ),
      }}
    >
      {linkedContent}
    </ReactMarkdown>
  );
}
