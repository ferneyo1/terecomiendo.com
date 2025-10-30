import React, { useState, useEffect, useRef } from 'react';
import { onNotificationsChange, markNotificationAsRead, markAllNotificationsAsRead } from '../services/firebase';
import { type Notification, type UserProfile } from '../types';
import BellIcon from './icons/BellIcon';

const NotificationBell: React.FC<{ userProfile: UserProfile }> = ({ userProfile }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (userProfile) {
            const unsubscribe = onNotificationsChange(userProfile, setNotifications);
            return () => unsubscribe();
        }
    }, [userProfile]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMarkAsRead = async (id: string) => {
        await markNotificationAsRead(id);
    };

    const handleMarkAllAsRead = async () => {
        await markAllNotificationsAsRead();
    };

    const timeSince = (timestamp: any): string => {
        if (!timestamp || !timestamp.toDate) return 'Justo ahora';
        const date = timestamp.toDate();
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " años";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " meses";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " días";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " horas";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " min";
        return "Justo ahora";
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800"
                aria-label="Ver notificaciones"
            >
                <BellIcon />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20">
                    <div className="p-3 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Notificaciones</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                            >
                                Marcar todas como leídas
                            </button>
                        )}
                    </div>
                    <ul className="max-h-96 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
                        {notifications.length > 0 ? notifications.map(notif => (
                            <li key={notif.id} className={`p-3 flex items-start gap-3 transition-colors duration-200 ${notif.read ? 'opacity-70' : 'bg-indigo-50 dark:bg-gray-700/50'}`}>
                                <div className={`mt-1.5 flex-shrink-0 w-2.5 h-2.5 rounded-full ${!notif.read ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
                                <div className="flex-grow">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{notif.message}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{timeSince(notif.timestamp)}</p>
                                </div>
                                {!notif.read && (
                                    <button onClick={() => handleMarkAsRead(notif.id)} className="text-xs font-semibold text-indigo-600 hover:underline" aria-label="Marcar como leída">
                                        Leído
                                    </button>
                                )}
                            </li>
                        )) : (
                            <li className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                No tienes notificaciones nuevas.
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;