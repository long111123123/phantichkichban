
import React from 'react';

const UnlockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M18 1.5c2.9 0 5.25 2.35 5.25 5.25v3.75a.75.75 0 01-1.5 0V6.75a3.75 3.75 0 10-7.5 0v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a.75.75 0 011.5 0v6.75a4.5 4.5 0 01-4.5 4.5H8.25a4.5 4.5 0 01-4.5-4.5v-6.75a4.5 4.5 0 014.5-4.5v-3A5.25 5.25 0 0112 1.5a.75.75 0 010 1.5A3.75 3.75 0 008.25 6.75v3a.75.75 0 01-1.5 0v-3c0-2.9 2.35-5.25 5.25-5.25H18z" />
  </svg>
);

export default UnlockIcon;
