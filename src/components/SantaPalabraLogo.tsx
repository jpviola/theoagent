import Image from 'next/image';

interface SantaPalabraLogoProps {
  className?: string;
}

export default function SantaPalabraLogo({ className = "" }: SantaPalabraLogoProps) {
  return (
    <div className={`relative ${className}`}>
      <Image
        src="/santapalabra-logo.svg"
        alt="Santa Palabra"
        fill
        className="drop-shadow-lg object-contain"
        priority
      />
    </div>
  );
}