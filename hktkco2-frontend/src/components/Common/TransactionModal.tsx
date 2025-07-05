import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CheckCircle, XCircle, Loader2, ExternalLink, X } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'pending' | 'success' | 'error';
  txHash?: string;
  title?: string;
  message?: string;
  errorMessage?: string;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  status,
  txHash,
  title = 'Transaction Status',
  message,
  errorMessage,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'error':
        return <XCircle className="h-12 w-12 text-red-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'pending':
        return message || 'Transaction is being processed...';
      case 'success':
        return message || 'Transaction completed successfully!';
      case 'error':
        return errorMessage || 'Transaction failed. Please try again.';
    }
  };

  const viewOnExplorer = () => {
    if (txHash) {
      const explorerUrl = `https://sepolia.etherscan.io/tx/${txHash}`;
      window.open(explorerUrl, '_blank');
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold text-gray-900"
                  >
                    {title}
                  </Dialog.Title>
                  {status !== 'pending' && (
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-col items-center py-8">
                  {getStatusIcon()}
                  
                  <p className="mt-4 text-center text-gray-600">
                    {getStatusMessage()}
                  </p>

                  {txHash && status !== 'pending' && (
                    <button
                      onClick={viewOnExplorer}
                      className="mt-4 flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <span>View on Explorer</span>
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {status !== 'pending' && (
                  <div className="mt-4">
                    <button
                      type="button"
                      className="w-full justify-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                      onClick={onClose}
                    >
                      Close
                    </button>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default TransactionModal;