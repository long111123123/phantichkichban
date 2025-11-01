
import React from 'react';

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M9 4.5a.75.75 0 01.75.75V9h3.75a.75.75 0 010 1.5H9.75v3.75a.75.75 0 01-1.5 0V10.5H4.5a.75.75 0 010-1.5H8.25V5.25A.75.75 0 019 4.5zM13.5 15a.75.75 0 01.75.75V19.5h3.75a.75.75 0 010 1.5H14.25v3.75a.75.75 0 01-1.5 0V21h-3.75a.75.75 0 010-1.5H12V15.75a.75.75 0 01.75-.75z"
      clipRule="evenodd"
    />
  </svg>
);

export default SparklesIcon;
