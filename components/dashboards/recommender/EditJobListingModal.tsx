import React, { useState, useEffect } from 'react';
import { updateJobListing } from '../../../services/firebase';
import { type JobListing } from '../../../types';
import Button from '../../Button';
import CloseIcon from '../../icons/CloseIcon';

interface EditJobListingModalProps {
  onClose: () => void;
  listing: JobListing;
  onListingUpdated: () => void;
}

const EditJobListingModal: React.FC<EditJobListingModalProps> = ({ onClose, listing, onListingUpdated }) => {
    const [jobTitle, setJobTitle] = useState('');
    const [jobDetails, setJobDetails] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [salary, setSalary] = useState('');
    const [salaryType, setSalaryType] = useState<'per_hour' | 'per_year'>('per_year');
    const [address, setAddress] = useState('');
    const [areaCode, setAreaCode] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPerson, setContactPerson] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setJobTitle(listing.jobTitle);
        setJobDetails(listing.jobDetails || '');
        setCompanyName(listing.companyName || '');
        setSalary(listing.salary?.value.toString() || '');
        setSalaryType(listing.salary?.type || 'per_year');
        setAddress(listing.address || '');
        setAreaCode(listing.areaCode || '');
        setContactPhone(listing.contactPhone);
        setContactEmail(listing.contactEmail);
        setContactPerson(listing.contactPerson);
    }, [listing]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!jobTitle || !contactPerson || !contactPhone || !contactEmail) {
            setError('Por favor, completa los campos obligatorios: Nombre del Empleo, Persona de Contacto, Teléfono y Correo.');
            return;
        }
        setLoading(true);
        setError('');
        
        try {
            const salaryValue = parseFloat(salary);
            const salaryData = !isNaN(salaryValue) && salaryValue > 0 ? { value: salaryValue, type: salaryType } : undefined;

            const updatedData: Partial<JobListing> = {
                jobTitle,
                jobDetails,
                companyName,
                address,
                areaCode,
                contactPhone,
                contactEmail,
                contactPerson,
                salary: salaryData,
                status: 'pending', // Reset status for re-approval
            };
            
            await updateJobListing(listing.id, updatedData);
            onListingUpdated();

        } catch (err) {
            setError('No se pudo actualizar la recomendación. Inténtalo de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-job-listing-title"
            >
                <div className="relative p-6 sm:p-8">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md"
                        aria-label="Cerrar modal"
                    >
                        <CloseIcon />
                    </button>
                    <h2 id="edit-job-listing-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Editar Recomendación</h2>
                    
                     <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                        {error && <p className="text-sm text-center text-red-700 bg-red-100 p-3 rounded-lg">{error}</p>}
                        
                        <div>
                            <label className="block text-sm font-medium">Nombre del Empleo <span className="text-red-500">*</span></label>
                            <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} required className="w-full mt-1 input-style" />
                        </div>

                         <div>
                            <label className="block text-sm font-medium">Detalles del Empleo</label>
                            <textarea value={jobDetails} onChange={e => setJobDetails(e.target.value)} rows={4} className="w-full mt-1 input-style"></textarea>
                        </div>
                         <div>
                            <label className="block text-sm font-medium">Nombre de la Empresa</label>
                            <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full mt-1 input-style" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                                <label className="block text-sm font-medium">Salario (Opcional)</label>
                                <input type="number" value={salary} onChange={e => setSalary(e.target.value)} className="w-full mt-1 input-style" placeholder="Ej: 50000" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium">Tipo de Salario</label>
                                <select value={salaryType} onChange={e => setSalaryType(e.target.value as any)} className="w-full mt-1 input-style">
                                    <option value="per_year">Por Año</option>
                                    <option value="per_hour">Por Hora</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Dirección</label>
                            <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full mt-1 input-style" />
                        </div>
                        
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Información de Contacto</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div>
                                       <label className="block text-sm font-medium">Persona de Contacto <span className="text-red-500">*</span></label>
                                       <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} required className="w-full mt-1 input-style" />
                                   </div>
                                    <div>
                                       <label className="block text-sm font-medium">Correo de Contacto <span className="text-red-500">*</span></label>
                                       <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} required className="w-full mt-1 input-style" />
                                   </div>
                               </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                   <div className="md:col-span-1">
                                       <label className="block text-sm font-medium">Cód. de Área</label>
                                       <input type="tel" value={areaCode} onChange={e => setAreaCode(e.target.value)} className="w-full mt-1 input-style" placeholder="Ej: +1" />
                                   </div>
                                   <div className="md:col-span-2">
                                       <label className="block text-sm font-medium">Teléfono de contacto <span className="text-red-500">*</span></label>
                                       <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} required className="w-full mt-1 input-style" />
                                   </div>
                               </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 gap-3">
                           <Button type="button" onClick={onClose} variant="secondary">
                             Cancelar
                           </Button>
                           <Button type="submit" disabled={loading}>
                             {loading ? 'Guardando...' : 'Guardar Cambios'}
                           </Button>
                        </div>
                    </form>
                </div>
            </div>
             <style>{`
                .input-style {
                    background-color: #f3f4f6;
                    border: 2px solid transparent;
                    border-radius: 0.5rem;
                    padding: 0.75rem 1rem;
                    transition: all 0.2s;
                }
                .dark .input-style {
                    background-color: #374151;
                }
                .input-style:focus {
                    border-color: #6366f1;
                    outline: none;
                    --tw-ring-shadow: none;
                }
             `}</style>
        </div>
    );
};

export default EditJobListingModal;