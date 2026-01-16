'use client';

import type { ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { linkifyScripture, detectLanguage, type BibleLanguage } from '@/lib/scriptureLinks';
import { linkifyVaticanDocuments } from '@/lib/vaticanDocuments';

interface ScriptureLinkedMarkdownProps {
  content: string;
  language?: BibleLanguage;
  autoDetectLanguage?: boolean;
}

type CodeProps = ComponentPropsWithoutRef<'code'> & {
  inline?: boolean;
  node?: unknown;
};

export default function ScriptureLinkedMarkdown({ 
  content, 
  language = 'english',
  autoDetectLanguage = true 
}: ScriptureLinkedMarkdownProps) {
  const detectedLanguage = autoDetectLanguage ? detectLanguage(content) : language;
  
  let linkedContent = linkifyScripture(content, detectedLanguage);
  
  linkedContent = linkifyVaticanDocuments(linkedContent);
  
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ ...props }) => {
          const isBibleLink = props.href?.includes('bible.usccb.org') || 
                             props.href?.includes('vatican.va') ||
                             props.href?.includes('biblegateway.com');
          
          return (
            <a
              {...props}
              className={`${
                isBibleLink
                  ? 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline decoration-2 text-base font-bold hover:scale-105 transition-all inline-block'
                  : 'text-blue-500 hover:text-blue-700 underline'
              }`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {props.children}
            </a>
          );
        },
        p: ({ ...props }) => (
          <p className="mb-3 leading-relaxed" {...props} />
        ),
        strong: ({ ...props }) => (
          <strong className="font-bold text-gray-900 dark:text-gray-100" {...props} />
        ),
        em: ({ ...props }) => (
          <em className="italic text-gray-800 dark:text-gray-200" {...props} />
        ),
        ul: ({ ...props }) => (
          <ul className="list-disc list-inside mb-3 space-y-1" {...props} />
        ),
        ol: ({ ...props }) => (
          <ol className="list-decimal list-inside mb-3 space-y-1" {...props} />
        ),
        blockquote: ({ ...props }) => (
          <blockquote 
            className="border-l-4 border-blue-500 pl-4 py-2 my-3 italic text-gray-800 bg-blue-50/50" 
            {...props} 
          />
        ),
        code: ({ inline, ...props }: CodeProps) => 
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
        h1: ({ ...props }) => (
          <h1 className="text-2xl font-bold mb-3 mt-4" {...props} />
        ),
        h2: ({ ...props }) => (
          <h2 className="text-xl font-bold mb-2 mt-3" {...props} />
        ),
        h3: ({ ...props }) => (
          <h3 className="text-lg font-bold mb-2 mt-2" {...props} />
        ),
      }}
    >
      {linkedContent}
    </ReactMarkdown>
  );
}
