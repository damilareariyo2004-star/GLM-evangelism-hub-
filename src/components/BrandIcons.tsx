import React from 'react';

interface BrandIconProps {
  className?: string;
  size?: number;
}

/**
 * Official WhatsApp logo inline SVG:
 * Green speech bubble (#25D366) with genuine tail and crisp white phone handset.
 */
export const WhatsAppIcon: React.FC<BrandIconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="WhatsApp"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Z"
      fill="#25D366"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M17.47 14.38c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z"
      fill="#FFFFFF"
    />
  </svg>
);

/**
 * Official Telegram logo inline SVG:
 * Blue circle (#26A5E4) with crisp white paper airplane.
 */
export const TelegramIcon: React.FC<BrandIconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Telegram"
  >
    <circle cx="12" cy="12" r="10" fill="#26A5E4" />
    <path
      d="M17.5 7.3 5.9 11.8c-.8.3-.8.8-.1 1l3 1 7-4.4c.3-.2.6-.1.4.1l-5.7 5.1-.2 3.1c.3 0 .5-.1.6-.3l1.5-1.5 3.2 2.4c.6.3 1 .2 1.2-.5l2.1-9.9c.2-.9-.3-1.3-1.1-.9Z"
      fill="#FFFFFF"
    />
  </svg>
);
