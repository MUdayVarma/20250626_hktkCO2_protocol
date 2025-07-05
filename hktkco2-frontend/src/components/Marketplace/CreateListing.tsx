import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { ethers } from 'ethers';
import useContract from '../../contracts/hooks/useContract';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateListingModal: React.FC<CreateListingModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { carbonMarketplace } = useContract();
  const [formData, setFormData] = useState({
    amount: '',
    pricePerToken: '',
    projectId: '',
    projectName: '',
    methodology: 'REDD+',
    vintage: new Date().getFullYear(),
    creditIds: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carbonMarketplace) return;

    try {
      setLoading(true);
      setError('');

      const creditIdArray = formData.creditIds.split(',').map(id => parseInt(id.trim()));
      
      const tx = await carbonMarketplace.createListing(
        formData.amount,
        ethers.utils.parseEther(formData.pricePerToken),
        formData.projectId,
        formData.vintage,
        creditIdArray
      );
      
      await tx.wait();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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
                <Dialog.Title as="div" className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">List Carbon Credits</h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      name="projectName"
                      value={formData.projectName}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project ID
                    </label>
                    <input
                      type="text"
                      name="projectId"
                      value={formData.projectId}
                      onChange={handleChange}
                      required
                      placeholder="VCS-1234"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Methodology
                      </label>
                      <select
                        name="methodology"
                        value={formData.methodology}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="REDD+">REDD+</option>
                        <option value="CDM">CDM</option>
                        <option value="Gold Standard">Gold Standard</option>
                        <option value="VCS">VCS</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vintage
                      </label>
                      <input
                        type="number"
                        name="vintage"
                        value={formData.vintage}
                        onChange={handleChange}
                        min="2020"
                        max={new Date().getFullYear()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount (tCO₂)
                      </label>
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        required
                        min="1"
                        step="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price per tCO₂ ($)
                      </label>
                      <input
                        type="number"
                        name="pricePerToken"
                        value={formData.pricePerToken}
                        onChange={handleChange}
                        required
                        min="0.01"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credit IDs (comma-separated)
                    </label>
                    <textarea
                      name="creditIds"
                      value={formData.creditIds}
                      onChange={handleChange}
                      required
                      placeholder="1, 2, 3"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        loading
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {loading ? 'Creating...' : 'Create Listing'}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-2 px-4 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CreateListingModal;