import React from 'react';
import { Coffee, CreditCard } from 'lucide-react';

export type DonationProvider = 'paypal' | 'mercadopago' | 'buymeacoffee';

interface DonationButtonProps {
  provider: DonationProvider;
  href?: string;
  onClick?: () => void;
  className?: string;
  label?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
  disabled?: boolean;
  title?: string;
  id?: string;
}

const providerStyles: Record<DonationProvider, string> = {
  paypal: 'bg-[#003087] hover:bg-[#00256b] text-white border border-transparent',
  mercadopago: 'bg-[#009EE3] hover:bg-[#0089c7] text-white border border-transparent',
  buymeacoffee: 'bg-[#FFDD00] hover:bg-[#e6c700] text-black border border-amber-400',
};

const providerIcons: Record<DonationProvider, React.ReactNode> = {
  paypal: <span className="text-lg">🅿️</span>,
  mercadopago: <CreditCard className="w-5 h-5" />,
  buymeacoffee: <Coffee className="w-5 h-5" />,
};

const defaultLabels: Record<DonationProvider, string> = {
  paypal: 'Donar con PayPal',
  mercadopago: 'Donar con MercadoPago',
  buymeacoffee: 'Invítame un Café',
};

export const DonationButton: React.FC<DonationButtonProps> = ({
  provider,
  href,
  onClick,
  className = '',
  label,
  showIcon = true,
  children,
  disabled = false,
  title,
  id,
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 h-[50px]';
  const hoverStyles = disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg';
  const colorStyles = providerStyles[provider];
  
  const content = children || (
    <>
      {showIcon && providerIcons[provider]}
      <span>{label || defaultLabels[provider]}</span>
    </>
  );

  if (href && !disabled) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={`${baseStyles} ${hoverStyles} ${colorStyles} ${className}`}
        onClick={onClick}
        title={title}
        id={id}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${hoverStyles} ${colorStyles} ${className}`}
      title={title}
      id={id}
    >
      {content}
    </button>
  );
};
