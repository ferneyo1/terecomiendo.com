import React, { useState } from 'react';
import Button from '../Button';
import EyeIcon from '../icons/EyeIcon';
import EyeOffIcon from '../icons/EyeOffIcon';
import LockIcon from '../icons/LockIcon';

const firebaseConfigKeys = [
    { id: 'apiKey', label: 'API Key' },
    { id: 'authDomain', label: 'Auth Domain' },
    { id: 'databaseURL', label: 'Database URL' },
    { id: 'projectId', label: 'Project ID' },
    { id: 'storageBucket', label: 'Storage Bucket' },
    { id: 'messagingSenderId', label: 'Messaging Sender ID' },
    { id: 'appId', label: 'App ID' },
    { id: 'measurementId', label: 'Measurement ID' },
];

const ConfigInput: React.FC<{ id: string; label: string }> = ({ id, label }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <LockIcon />
                </span>
                <input
                    id={id}
                    type={isVisible ? 'text' : 'password'}
                    placeholder="••••••••••••••••••••"
                    readOnly
                    className="w-full pl-10 pr-10 py-2 bg-gray-200 dark:bg-gray-700 border-2 border-transparent rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
                <button
                    type="button"
                    onClick={() => setIsVisible(!isVisible)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
                    aria-label={isVisible ? "Ocultar" : "Mostrar"}
                >
                    {isVisible ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
};


const SettingsManagement: React.FC = () => {
    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Configuración de Conexiones</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Gestiona las credenciales para los servicios externos de la aplicación.</p>
                
                {/* Firebase Config Section */}
                <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Configuración de Firebase</h2>
                    
                    <div className="p-4 rounded-lg mb-6 bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700">
                        <h3 className="font-bold text-lg text-red-800 dark:text-red-200">¡Advertencia de Seguridad!</h3>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                            Estos valores son críticos para el funcionamiento de la aplicación. Se cargan desde el archivo <strong>services/firebase.ts</strong> al iniciar la aplicación y <strong>no se pueden modificar desde esta interfaz</strong>. Modificar incorrectamente estos valores puede romper la aplicación por completo.
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                            Para actualizar la configuración, un desarrollador debe editar el archivo de configuración en el código fuente y volver a desplegar la aplicación.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {firebaseConfigKeys.map(key => (
                            <ConfigInput key={key.id} id={key.id} label={key.label} />
                        ))}
                    </div>
                     <div className="mt-6 flex justify-end">
                        <div title="Esta acción está deshabilitada. Las credenciales deben ser actualizadas en el código fuente.">
                            <Button disabled>Guardar Configuración de Firebase</Button>
                        </div>
                    </div>
                </div>

                 {/* Google Cloud Config Section */}
                <div className="mt-8 p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Configuración de Google Cloud</h2>
                    
                     <div className="p-4 rounded-lg mb-6 bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            La clave de API para los servicios de IA de Google (Gemini) se gestiona de forma segura a través de variables de entorno del sistema (`process.env.API_KEY`) y no puede ser visualizada ni modificada desde esta interfaz por motivos de seguridad.
                        </p>
                    </div>

                    <ConfigInput id="geminiApiKey" label="Google Gemini API Key" />
                    
                     <div className="mt-6 flex justify-end">
                        <div title="Esta acción está deshabilitada. La clave de API debe ser actualizada en las variables de entorno del servidor.">
                             <Button disabled>Guardar Configuración de Google Cloud</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsManagement;