import React from 'react';

interface UserCircleIconProps {
  size?: number;
}

const UserCircleIcon: React.FC<UserCircleIconProps> = ({ size = 96 }) => {
  return (
    <svg 
      className="text-gray-400 dark:text-gray-500" 
      width={size} 
      height={size} 
      fill="currentColor" 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
};

export default UserCircleIcon;