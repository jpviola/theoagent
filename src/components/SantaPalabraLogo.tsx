import Image from 'next/image';

interface SantaPalabraLogoProps {
  size?: number;
  className?: string;
}

export default function SantaPalabraLogo({ size = 48, className = "" }: SantaPalabraLogoProps) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <Image
        src="/santapalabra-logo.svg"
        alt="Santa Palabra"
        width={size}
        height={size}
        className="drop-shadow-lg"
        priority
      />
    </div>
  );
}