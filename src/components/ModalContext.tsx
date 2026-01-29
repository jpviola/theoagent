'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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

  const openModal = (type: ModalType) => {
    if (!type) return;
    
    // Priority check: Angelus always interrupts or takes precedence
    if (type === 'angelus') {
      setActiveModal('angelus');
      return;
    }

    // If Angelus is already active, ignore other requests or queue them
    if (activeModal === 'angelus') {
      if (!modalQueue.includes(type)) {
        setModalQueue(prev => [...prev, type]);
      }
      return;
    }

    // If another modal is active, queue this one
    if (activeModal && activeModal !== type) {
       if (!modalQueue.includes(type)) {
         setModalQueue(prev => [...prev, type]);
       }
       return;
    }

    // Otherwise, open it
    setActiveModal(type);
  };

  const closeModal = (type: ModalType) => {
    if (activeModal === type) {
      setActiveModal(null);
      
      // Process queue if any
      // Priority: Donation -> Subscription
      // If we just closed Angelus, maybe show Donation next
      if (modalQueue.length > 0) {
        // Simple queue logic: take first
        // But let's enforce specific order: Donation -> Subscription
        // So if both are in queue, pick Donation
        
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
            setModalQueue(prev => prev.filter(m => m !== nextModal));
            // Small delay to separate modals visually
            setTimeout(() => {
                setActiveModal(nextModal);
            }, 500);
        }
      }
    }
  };

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
