import React from 'react';
import UserCircleIcon from './icons/UserCircleIcon';

interface AvatarProps {
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ avatarUrl, size = 96, className }) => {
  const style = {
    width: `${size}px`,
    height: `${size}px`,
  };

  return (
    <div
      className={`relative rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 overflow-hidden ${className}`}
      style={style}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="User Avatar"
          className="w-full h-full object-cover"
        />
      ) : (
        <UserCircleIcon size={size} />
      )}
    </div>
  );
};

export default Avatar;