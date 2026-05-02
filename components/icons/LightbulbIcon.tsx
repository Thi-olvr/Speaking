import React from 'react';

export const LightbulbIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    {...props}
    >
    <path d="M9 18h6"></path>
    <path d="M10 22h4"></path>
    <path d="M12 2a7 7 0 0 0-7 7c0 3.04 1.63 5.36 3.86 6.5a2 2 0 0 1 1.14 1.83V20a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-2.67a2 2 0 0 1 1.14-1.83C17.37 14.36 19 12.04 19 9a7 7 0 0 0-7-7Z"></path>
  </svg>
);
