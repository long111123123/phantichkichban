
import React from 'react';

const ShieldIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path 
      fillRule="evenodd" 
      d="M12 2.25c-4.495 0-8.54 2.89-10.033 7.026a10.49 10.49 0 00.323 5.093c1.396 3.522 4.58 6.31 8.21 7.558a.75.75 0 00.5 0c3.63-1.248 6.814-4.036 8.21-7.558a10.49 10.49 0 00.323-5.093C20.54 5.14 16.495 2.25 12 2.25zm.393 12.443l4.03-4.03a.75.75 0 10-1.06-1.06l-3.47 3.47-1.72-1.72a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0z" 
      clipRule="evenodd" 
    />
  </svg>
);

export default ShieldIcon;
