import React from 'react';

export const CC0License = ({ className = '' }: { className?: string }) => {
  return (
    <span className={`inline-flex items-center flex-wrap justify-center ${className}`}>
      This work is marked{' '}
      <a 
        href="https://creativecommons.org/publicdomain/zero/1.0/" 
        target="_blank" 
        rel="noopener noreferrer"
        className="underline hover:text-amber-600 dark:hover:text-amber-400 mx-1"
      >
        CC0 1.0 Universal
      </a>
      <img 
        src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" 
        alt="CC" 
        className="max-w-[1em] max-h-[1em] ml-[0.2em] inline-block align-middle"
        style={{ maxWidth: '1em', maxHeight: '1em', marginLeft: '.2em' }}
      />
      <img 
        src="https://mirrors.creativecommons.org/presskit/icons/zero.svg" 
        alt="Zero" 
        className="max-w-[1em] max-h-[1em] ml-[0.2em] inline-block align-middle" 
        style={{ maxWidth: '1em', maxHeight: '1em', marginLeft: '.2em' }}
      />
    </span>
  );
};
