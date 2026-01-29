'use client';

import { useEffect } from 'react';
import { useModal } from '@/components/ModalContext';
import DonationModal from '@/components/DonationModal';
import EmailSubscriptionModal from '@/components/EmailSubscriptionModal';
import AngelusModal from '@/components/AngelusModal';
import { shouldShowSubscriptionModal } from '@/lib/subscription';

export default function GlobalModalManager() {
  const { openModal } = useModal();

  useEffect(() => {
    // 1. Check Angelus (Highest Priority)
    const checkAngelus = () => {
      const now = new Date();
      const hours = now.getHours();
      
      // Window: 12:00 PM - 12:59 PM
      if (hours === 12) {
        const today = new Date().toDateString();
        const lastShownDate = localStorage.getItem('santapalabra_angelus_shown_date');
        
        if (lastShownDate !== today) {
          openModal('angelus');
          return true; // Angelus triggered
        }
      }
      return false;
    };

    // 2. Check Donation
    const checkDonation = () => {
        // Simple logic: always try to show if not closed permanently
        // The modal component itself will check localStorage, 
        // but here we just signal intent. 
        // However, to coordinate, we should probably check here too.
        
        const storageKey = "santapalabra_donation_modal_closed";
        const value = localStorage.getItem(storageKey);
        
        // Logic from DonationModal:
        // If "true", closed forever.
        // If number, it's a timestamp (snooze).
        
        let shouldShow = true;
        if (value === "true") shouldShow = false;
        if (value && !isNaN(Number(value))) {
            if (Date.now() < Number(value)) shouldShow = false;
        }

        if (shouldShow) {
            // Delay slightly to not clash with immediate load if Angelus isn't there
            setTimeout(() => openModal('donation'), 1500);
            return true;
        }
        return false;
    };

    // 3. Check Subscription
    const checkSubscription = () => {
        if (shouldShowSubscriptionModal()) {
             // Delay slightly more to ensure it comes after donation if both are queued
             setTimeout(() => openModal('subscription'), 3000);
             return true;
        }
        return false;
    };

    // Run checks
    const angelusTriggered = checkAngelus();
    
    // Even if Angelus triggered, we queue the others.
    // The Context handles priority.
    // If Angelus is open, others go to queue.
    
    checkDonation();
    checkSubscription();
    
    // Set up Angelus interval checker
    const interval = setInterval(() => {
        checkAngelus();
    }, 60000);

    return () => clearInterval(interval);

  }, [openModal]);

  return (
    <>
      <AngelusModal />
      <DonationModal />
      {/* Modal de suscripción */}
      <EmailSubscriptionModal />
    </>
  );
}
