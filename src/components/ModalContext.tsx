'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

type ModalType = 'donation' | 'subscription' | 'angelus' | null;

interface ModalContextType {
  activeModal: ModalType;
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
  registerModal: (type: ModalType) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalQueue, setModalQueue] = useState<ModalType[]>([]);

  const openModal = useCallback((type: ModalType) => {
    if (!type) return;
    
    // Priority check: Angelus always interrupts or takes precedence
    if (type === 'angelus') {
      setActiveModal('angelus');
      return;
    }

    // Since we're using useCallback with state dependencies, we need to access current state.
    // However, to keep this function stable, we're better off using functional updates 
    // or just accepting that it changes and handling the loop in GlobalModalManager (which we did).
    
    // But for this logic (checking activeModal before setting), we need to read it.
    setActiveModal(currentActive => {
      // If Angelus is already active, ignore other requests or queue them
      if (currentActive === 'angelus') {
        setModalQueue(prev => prev.includes(type) ? prev : [...prev, type]);
        return currentActive;
      }

      // If another modal is active, queue this one
      if (currentActive && currentActive !== type) {
         setModalQueue(prev => prev.includes(type) ? prev : [...prev, type]);
         return currentActive;
      }

      // Otherwise, open it
      return type;
    });
  }, []);

  const closeModal = useCallback((type: ModalType) => {
    setActiveModal(currentActive => {
      if (currentActive === type) {
        // We are closing the active modal.
        // We need to return null to update state, BUT we also need to check the queue.
        // We cannot reliably update queue inside this reducer or read the updated queue immediately.
        // So we will trigger a side-effect via useEffect to process the queue when activeModal becomes null?
        // Or we can just do the queue logic here but we need access to the queue state.
        
        // Let's use a workaround:
        // We will return null, but we'll schedule a queue check.
        // But 'modalQueue' state is not accessible inside this callback if we have [] deps.
        // So we MUST add dependencies if we want to read state, OR use a ref for the queue.
        
        // Given we fixed GlobalModalManager loop by removing dependencies there,
        // it is SAFE to add dependencies here.
        return null;
      }
      return currentActive;
    });
  }, []);

  // Effect to process queue when activeModal becomes null
  useEffect(() => {
    if (activeModal === null && modalQueue.length > 0) {
        // Priority: Donation -> Subscription
        const hasDonation = modalQueue.includes('donation');
        const hasSubscription = modalQueue.includes('subscription');
        
        let nextModal: ModalType = null;
        
        if (hasDonation) {
            nextModal = 'donation';
        } else if (hasSubscription) {
            nextModal = 'subscription';
        } else {
            nextModal = modalQueue[0];
        }
        
        if (nextModal) {
            // Remove from queue
            setModalQueue(prev => prev.filter(m => m !== nextModal));
            
            // Open next modal with delay
            setTimeout(() => {
                setActiveModal(nextModal);
            }, 500);
        }
    }
  }, [activeModal, modalQueue]);
  
  const registerModal = (type: ModalType) => {
      // Just a placeholder for now, might be useful for tracking registered components
  };

  return (
    <ModalContext.Provider value={{ activeModal, openModal, closeModal, registerModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
