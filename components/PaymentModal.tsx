import React, { useState, useEffect, useRef } from 'react';
import Button from './Button';
import CloseIcon from './icons/CloseIcon';
import CreditCardIcon from './icons/CreditCardIcon';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  amount: number;
  itemDescription: string;
}

// Luhn algorithm checker
const luhnCheck = (val: string): boolean => {
  let checksum = 0;
  let j = 1;
  const valNoSpaces = val.replace(/\s/g, '');

  if (valNoSpaces.length === 0) {
    return false;
  }

  for (let i = valNoSpaces.length - 1; i >= 0; i--) {
    let calc = 0;
    calc = Number(valNoSpaces.charAt(i)) * j;

    if (calc > 9) {
      checksum = checksum + 1;
      calc = calc - 10;
    }
    
    checksum = checksum + calc;

    if (j === 1) {
      j = 2;
    } else {
      j = 1;
    }
  }
  return (checksum % 10) === 0;
};


const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onConfirm, amount, itemDescription }) => {
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvc: '' });
  const [errors, setErrors] = useState({ number: '', expiry: '', cvc: '', general: '' });
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
        // Reset state when modal opens
        setCardData({ number: '', expiry: '', cvc: '' });
        setErrors({ number: '', expiry: '', cvc: '', general: '' });
        setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateField = (name: keyof typeof cardData, value: string): string => {
      switch (name) {
          case 'number':
              if (value.replace(/\s/g, '').length === 0) return 'El número de tarjeta es obligatorio.';
              if (value.replace(/\s/g, '').length < 16) return 'El número debe tener 16 dígitos.';
              if (!luhnCheck(value)) return 'Número de tarjeta inválido.';
              return '';
          case 'expiry':
              if (!value) return 'La fecha es obligatoria.';
              if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) return 'Formato debe ser MM/AA.';
              const [month, year] = value.split('/').map(Number);
              const now = new Date();
              const currentYear = now.getFullYear() % 100;
              const currentMonth = now.getMonth() + 1;
              if (year < currentYear || (year === currentYear && month < currentMonth)) {
                  return 'La tarjeta ha expirado.';
              }
              return '';
          case 'cvc':
              if (!value) return 'El CVC es obligatorio.';
              if (!/^\d{3,4}$/.test(value)) return 'Debe tener 3 o 4 dígitos.';
              return '';
          default:
              return '';
      }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'number') {
        const rawValue = value.replace(/\s/g, '');
        if (!/^\d*$/.test(rawValue)) return;
        formattedValue = rawValue.match(/.{1,4}/g)?.join(' ').slice(0, 19) || '';
    } else if (name === 'expiry') {
        const rawValue = value.replace(/\//g, '');
         if (!/^\d*$/.test(rawValue)) return;
        if (rawValue.length > 2) {
            formattedValue = `${rawValue.slice(0, 2)}/${rawValue.slice(2, 4)}`;
        } else {
            formattedValue = rawValue;
        }
    } else if (name === 'cvc') {
         if (!/^\d*$/.test(value)) return;
        formattedValue = value.slice(0, 4);
    }

    setCardData(prev => ({...prev, [name]: formattedValue}));
    if (errors[name as keyof typeof errors]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      const error = validateField(name as keyof typeof cardData, value);
      setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ number: '', expiry: '', cvc: '', general: '' });

    const numberError = validateField('number', cardData.number);
    const expiryError = validateField('expiry', cardData.expiry);
    const cvcError = validateField('cvc', cardData.cvc);

    if (numberError || expiryError || cvcError) {
        setErrors({ number: numberError, expiry: expiryError, cvc: cvcError, general: 'Por favor, corrige los errores.' });
        return;
    }

    setLoading(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    try {
        await onConfirm();
        onClose(); 
    } catch (err) {
        setErrors(prev => ({ ...prev, general: err instanceof Error ? err.message : 'Hubo un error al procesar el pago.' }));
        setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md" role="dialog" aria-modal="true">
        <div className="relative p-6 sm:p-8">
            <button onClick={onClose} disabled={loading} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <CloseIcon />
            </button>
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">Procesar Pago</h2>
            <p className="text-center text-gray-600 dark:text-gray-300 mb-6">{itemDescription}</p>
            
            <div className="text-center mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">${amount.toFixed(2)}</span>
            </div>

            {errors.general && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{errors.general}</p>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Número de Tarjeta</label>
                    <div className="relative mt-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3"><CreditCardIcon className="w-5 h-5 text-gray-400" /></span>
                        <input
                            id="cardNumber"
                            name="number"
                            type="text" 
                            placeholder="0000 0000 0000 0000"
                            value={cardData.number}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            required
                            className={`w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 rounded-lg focus:ring-0 ${errors.number ? 'border-red-500' : 'border-transparent focus:border-indigo-500'}`}
                        />
                    </div>
                    {errors.number && <p className="text-xs text-red-500 mt-1">{errors.number}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="cardExpiry" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vencimiento</label>
                        <input 
                            id="cardExpiry"
                            name="expiry"
                            type="text" 
                            placeholder="MM/AA"
                            value={cardData.expiry}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            required
                            className={`w-full mt-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 rounded-lg focus:ring-0 ${errors.expiry ? 'border-red-500' : 'border-transparent focus:border-indigo-500'}`}
                        />
                         {errors.expiry && <p className="text-xs text-red-500 mt-1">{errors.expiry}</p>}
                    </div>
                    <div>
                        <label htmlFor="cardCvc" className="block text-sm font-medium text-gray-700 dark:text-gray-300">CVC</label>
                        <input
                            id="cardCvc"
                            name="cvc"
                            type="text" 
                            placeholder="123"
                            value={cardData.cvc}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            required
                            className={`w-full mt-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 rounded-lg focus:ring-0 ${errors.cvc ? 'border-red-500' : 'border-transparent focus:border-indigo-500'}`}
                        />
                        {errors.cvc && <p className="text-xs text-red-500 mt-1">{errors.cvc}</p>}
                    </div>
                </div>
                
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 pt-2">
                    Este es un formulario de demostración. No introduzcas datos reales.
                </p>

                <Button type="submit" disabled={loading} className="w-full !mt-6">
                    {loading ? 'Procesando...' : `Pagar $${amount.toFixed(2)}`}
                </Button>
            </form>
        </div>
      </div>
    </div>
  );
};
export default PaymentModal;