import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XIcon, UserAddIcon } from '@heroicons/react/outline';
import { getSession } from 'next-auth/react';
import orgStore from '../lib/org';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated?: (userData: any) => void;
}

export default function InviteUserModal({ isOpen, onClose, onUserCreated }: InviteUserModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    givenName: '',
    familyName: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Get the current organization from the store
  const org = orgStore((state) => (state as any).org);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Username is required.');
      return false;
    }
    if (!formData.givenName.trim()) {
      setError('Given name is required.');
      return false;
    }
    if (!formData.familyName.trim()) {
      setError('Family name is required.');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email address is required.');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!org?.id) {
      setError('No organization selected.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const session = await getSession() as any;
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          givenName: formData.givenName.trim(),
          familyName: formData.familyName.trim(),
          email: formData.email.trim(),
          orgId: org.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(`Error creating user: ${errorData.error || 'Unknown error'}`);
        return;
      }

      const userData = await response.json();
      
      // Reset form
      setFormData({
        username: '',
        givenName: '',
        familyName: '',
        email: '',
      });
      
      // Call success callback
      if (onUserCreated) {
        onUserCreated(userData);
      }
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Error creating user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      username: '',
      givenName: '',
      familyName: '',
      email: '',
    });
    setError('');
    setIsLoading(false);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-zitadelblue-700 border border-zitadelblue-600 p-4 sm:p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-start mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white pr-4">
                    Invite New Team Member
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-200 flex-shrink-0 p-1"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-2">
                  <p className="text-sm text-gray-300">
                    Add a new user to {org?.name || 'the organization'}
                  </p>
                </div>

                {/* Error Message Display */}
                {error && (
                  <div className="mt-3 p-3 rounded-md bg-red-900/30 border border-red-700">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-200">
                          {error}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-4 space-y-3 sm:space-y-4">
                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-zitadelblue-600 bg-zitadelblue-800 text-white shadow-sm focus:border-zitadelaccent-500 focus:ring-zitadelaccent-500 text-sm sm:text-base placeholder-gray-400"
                      placeholder="e.g., john-doe"
                      required
                    />
                  </div>

                  {/* Given Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                      Given Name *
                    </label>
                    <input
                      type="text"
                      name="givenName"
                      value={formData.givenName}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-zitadelblue-600 bg-zitadelblue-800 text-white shadow-sm focus:border-zitadelaccent-500 focus:ring-zitadelaccent-500 text-sm sm:text-base placeholder-gray-400"
                      placeholder="e.g., John"
                      required
                    />
                  </div>

                  {/* Family Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                      Family Name *
                    </label>
                    <input
                      type="text"
                      name="familyName"
                      value={formData.familyName}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-zitadelblue-600 bg-zitadelblue-800 text-white shadow-sm focus:border-zitadelaccent-500 focus:ring-zitadelaccent-500 text-sm sm:text-base placeholder-gray-400"
                      placeholder="e.g., Doe"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-zitadelblue-600 bg-zitadelblue-800 text-white shadow-sm focus:border-zitadelaccent-500 focus:ring-zitadelaccent-500 text-sm sm:text-base placeholder-gray-400"
                      placeholder="e.g., john.doe@company.com"
                      required
                    />
                  </div>

                  {/* Display Name Preview */}
                  {formData.givenName && formData.familyName && (
                    <div className="p-3 bg-zitadelblue-800 border border-zitadelblue-600 rounded-md">
                      <p className="text-sm text-gray-300">
                        Display Name: <span className="font-medium text-white">{formData.givenName} {formData.familyName}</span>
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3 sm:space-x-0">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="order-2 sm:order-1 inline-flex justify-center rounded-md border border-zitadelblue-500 bg-zitadelblue-600 px-4 py-2 text-sm font-medium text-gray-200 shadow-sm hover:bg-zitadelblue-500 focus:outline-none focus:ring-2 focus:ring-zitadelaccent-500 focus:ring-offset-2 focus:ring-offset-zitadelblue-700"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="order-1 sm:order-2 inline-flex justify-center items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-zitadelblue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </>
                      ) : (
                        <>
                          <UserAddIcon className="w-4 h-4 mr-2" />
                          Create User
                        </>
                      )}
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
}
