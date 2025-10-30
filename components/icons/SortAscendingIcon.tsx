import React from 'react';

const SortAscendingIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    className="w-5 h-5 text-gray-500 dark:text-gray-400" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg" 
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path>
  </svg>
);

export default SortAscendingIcon;
