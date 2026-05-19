'use client';

import React from 'react';
import Button from './Button';

interface ConfirmationModalProps {
    isOpen: boolean;
    header: string;
    message: string;
    okButtonText?: string;
    cancelButtonText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
    variant?: 'danger' | 'primary';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    header,
    message,
    okButtonText = 'Confirm',
    cancelButtonText = 'Cancel',
    onConfirm,
    onCancel,
    isLoading = false,
    variant = 'primary'
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-container border border-bd-ghost max-w-sm w-full p-8 rounded-2xl text-center shadow-2xl animate-in zoom-in-95 duration-300">
                <h3 className="text-xl font-bold mb-2 uppercase italic tracking-tighter">{header}</h3>
                <p className="text-xs text-tx-secondary font-medium mb-8 leading-relaxed uppercase tracking-widest">
                    {message}
                </p>
                
                <div className="flex gap-3">
                    <Button 
                        variant="outline" 
                        onClick={onCancel} 
                        disabled={isLoading}
                        className="flex-1"
                    >
                        {cancelButtonText}
                    </Button>
                    <Button 
                        variant={variant === 'danger' ? 'secondary' : 'primary'}
                        onClick={onConfirm} 
                        isLoading={isLoading}
                        className={`flex-1 ${variant === 'danger' ? 'bg-red-500 hover:bg-red-600 border-red-500' : ''}`}
                    >
                        {okButtonText}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
