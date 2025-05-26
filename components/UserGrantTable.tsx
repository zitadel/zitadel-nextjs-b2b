import { getSession } from 'next-auth/react';
import useSWR, { mutate } from 'swr';
import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { PencilIcon, TrashIcon, PlusIcon, UserAddIcon } from '@heroicons/react/outline';
import orgStore from '../lib/org';
import InviteUserModal from './InviteUserModal';

export default function UserGrantTable() {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [addGrantError, setAddGrantError] = useState<string>('');

  // Get the current organization from the store
  const org = orgStore((state) => (state as any).org);

  const fetcher = async (url: string) => {
    const session = (await getSession()) as any;

    return fetch(`${url}`, {
      method: 'GET',
      headers: {
        'content-Type': 'application/json',
        authorization: `Bearer ${session.accessToken}`,
      },
    })
      .then((res) => res.json())
      .then((resp) => resp ?? [])
      .catch((error) => {
        console.error(error);
      });
  };

  const { data: usergrants, error: orgError } = useSWR(
    org?.id ? `/api/usergrants?orgId=${org.id}` : null, 
    (url) => fetcher(url)
  );
  const { data: orgUsers } = useSWR(
    org?.id ? `/api/orgusers?orgId=${org.id}` : null,
    fetcher
  );

  // Function to fetch available roles for a project
  const fetchProjectRoles = async (projectId: string) => {
    try {
      const session = (await getSession()) as any;
      const response = await fetch(`/api/projectroles?projectId=${projectId}&orgId=${org?.id}`, {
        method: 'GET',
        headers: {
          'content-Type': 'application/json',
          authorization: `Bearer ${session.accessToken}`,
        },
      });
      if (response.ok) {
        const roles = await response.json();
        setAvailableRoles(roles);
        console.log(`Available roles for project ${projectId}:`, roles);
      } else {
        console.error('Failed to fetch project roles');
        // Fallback to basic roles if API fails
        setAvailableRoles(['admin', 'reader']);
      }
    } catch (error) {
      console.error('Error fetching project roles:', error);
      // Fallback to basic roles if API fails
      setAvailableRoles(['admin', 'reader']);
    }
  };

  // Group user grants by project
  const grantsByProject = usergrants?.reduce((acc: any, grant: any) => {
    const projectId = grant.projectId;
    if (!acc[projectId]) {
      acc[projectId] = {
        projectName: grant.projectName,
        projectGrantId: grant.projectGrantId, // Include project grant ID
        users: [],
      };
    }
    acc[projectId].users.push(grant);
    return acc;
  }, {});

  const handleEditGrant = async (grant: any) => {
    setSelectedGrant(grant);
    setEditRoles(grant.roleKeys || []);
    
    // Fetch available roles for this project
    await fetchProjectRoles(grant.projectId);
    
    setEditModalOpen(true);
  };

  const handleDeleteGrant = (grant: any) => {
    setSelectedGrant(grant);
    setDeleteModalOpen(true);
  };

  const handleAddGrant = async (projectId: string, projectGrantId: string, projectName: string) => {
    setSelectedProject({ id: projectId, grantId: projectGrantId, name: projectName });
    setEditRoles([]);
    setAddGrantError(''); // Clear any previous error
    
    // Fetch available roles for this project
    await fetchProjectRoles(projectId);
    
    setAddModalOpen(true);
  };

  const updateUserGrant = async () => {
    if (!selectedGrant) return;
    
    const session = await getSession() as any;
    try {
      await fetch('/api/usergrants/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          userId: selectedGrant.userId,
          grantId: selectedGrant.id,
          roles: editRoles,
          orgId: selectedGrant.details?.resourceOwner || selectedGrant.orgId, // Use resourceOwner first, fallback to orgId
        }),
      });
      mutate(`/api/usergrants?orgId=${org.id}`);
      setEditModalOpen(false);
    } catch (error) {
      console.error('Error updating user grant:', error);
    }
  };

  const deleteUserGrant = async () => {
    if (!selectedGrant) return;
    
    const session = await getSession() as any;
    try {
      await fetch('/api/usergrants/remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          userId: selectedGrant.userId,
          grantId: selectedGrant.id,
          orgId: selectedGrant.details?.resourceOwner || selectedGrant.orgId || org?.id, // Use the grant's organization context
        }),
      });
      mutate(`/api/usergrants?orgId=${org.id}`);
      setDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting user grant:', error);
    }
  };

  const addUserGrant = async (userId: string) => {
    if (!selectedProject) return;
    
    // Clear any previous error
    setAddGrantError('');
    
    // Validate required fields
    if (!userId) {
      setAddGrantError('Please select a user.');
      return;
    }
    
    if (editRoles.length === 0) {
      setAddGrantError('Please select at least one role.');
      return;
    }
    
    // Check if user already has a grant for this project
    const existingGrant = usergrants?.find(
      (grant: any) => grant.userId === userId && grant.projectId === selectedProject.id
    );
    
    if (existingGrant) {
      setAddGrantError(`User already has a grant for project "${selectedProject.name}". You can edit the existing grant instead.`);
      return;
    }
    
    const session = await getSession() as any;
    try {
      const response = await fetch('/api/usergrants/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          userId,
          projectId: selectedProject.id,
          projectGrantId: selectedProject.grantId,
          roles: editRoles,
          orgId: org?.id, // Pass the current organization ID
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        setAddGrantError(`Error adding user grant: ${errorData.error || 'Unknown error'}`);
        return;
      }
      
      mutate(`/api/usergrants?orgId=${org.id}`);
      setAddModalOpen(false);
      setAddGrantError(''); // Clear error on success
      setEditRoles([]); // Reset roles selection
    } catch (error) {
      console.error('Error adding user grant:', error);
      setAddGrantError('Error adding user grant. Please try again.');
    }
  };

  const handleUserCreated = (userData: any) => {
    // Refresh the user grants data after a new user is created
    mutate(`/api/usergrants?orgId=${org.id}`);
    
    // Optionally refresh org users data as well
    mutate(`/api/orgusers?orgId=${org.id}`);
    
    // You could also show a success message here
    console.log('User created successfully:', userData);
  };

  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl mt-4">User Grants</h2>
          <p className="text-sm text-gray-300 mt-2">These are the user grants for all granted projects in your organization.</p>
        </div>
        <button
          onClick={() => setInviteModalOpen(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          <UserAddIcon className="w-5 h-5 mr-2" />
          Invite User
        </button>
      </div>

      {grantsByProject &&
        Object.entries(grantsByProject).map(([projectId, projectData]: any) => (
          <div key={projectId} className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-semibold">{projectData.projectName}</h3>
              <button
                onClick={() => handleAddGrant(projectId, projectData.projectGrantId, projectData.projectName)}
                className="flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add User Grant
              </button>
            </div>
            <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 py-4 overflow-x-auto">
              <div className="inline-block min-w-full shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                  <thead>
                    <tr>
                      <th className="px-5 py-3 border-b-2 border-white/20 text-left text-xs text-gray-200 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-5 py-3 border-b-2 border-white/20 text-left text-xs text-gray-200 uppercase tracking-wider">
                        Roles
                      </th>
                      <th className="px-5 py-3 border-b-2 border-white/20 text-left text-xs text-gray-200 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectData.users.map((user: any, i: number) => (
                      <tr key={`${user.id}${i}`} className="group hover:bg-gray-700">
                        <td className="px-5 py-1 border-b border-gray-600 text-sm group">
                          <div className="flex flex-col">
                            <p className="text-white whitespace-no-wrap">{user.displayName}</p>
                            <p className="block text-sm text-gray-400 whitespace-no-wrap">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-5 py-5 border-b border-gray-600 text-sm group">
                          <p className="text-white whitespace-no-wrap">
                            {user.roleKeys && user.roleKeys.length > 0 
                              ? user.roleKeys.join(', ') 
                              : <span className="text-gray-400 italic">No roles assigned</span>
                            }
                          </p>
                        </td>
                        <td className="px-5 py-5 border-b border-gray-600 text-sm group">
                          <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditGrant(user)}
                              className="p-1 text-blue-400 hover:text-blue-300"
                              title={user.roleKeys && user.roleKeys.length > 0 ? "Edit roles" : "Add roles"}
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteGrant(user)}
                              className="p-1 text-red-400 hover:text-red-300"
                              title="Remove grant"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}

      {(!grantsByProject || Object.keys(grantsByProject).length === 0) && (
        <div className="w-full flex flex-row items-center justify-center py-2 px-6 bg-black/5 dark:bg-white/5">
          <i className="las la-exclamation text-icon"> </i>
          <p className="text-center text-sm italic">No entries</p>
        </div>
      )}

      {/* Edit Roles Modal */}
      <Transition appear show={editModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setEditModalOpen(false)}>
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    {selectedGrant?.roleKeys && selectedGrant.roleKeys.length > 0 ? 'Edit User Roles' : 'Add User Roles'}
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedGrant?.displayName} - {selectedGrant?.projectName}
                    </p>
                  </div>

                  <div className="mt-4">
                    <div className="space-y-2">
                      {availableRoles.map((role) => (
                        <label key={role} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editRoles.includes(role)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditRoles([...editRoles, role]);
                              } else {
                                setEditRoles(editRoles.filter((r) => r !== role));
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-gray-900 dark:text-white">{role}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                      onClick={() => setEditModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={updateUserGrant}
                    >
                      Update
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Confirmation Modal */}
      <Transition appear show={deleteModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setDeleteModalOpen(false)}>
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    Remove User Grant
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Are you sure you want to remove the grant for {selectedGrant?.displayName} from {selectedGrant?.projectName}?
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                      onClick={() => setDeleteModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                      onClick={deleteUserGrant}
                    >
                      Remove
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Add User Grant Modal */}
      <Transition appear show={addModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => {
          setAddModalOpen(false);
          setAddGrantError(''); // Clear error when modal is closed
        }}>
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    Add User Grant
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Add a user to {selectedProject?.name}
                    </p>
                  </div>

                  {/* Error Message Display */}
                  {addGrantError && (
                    <div className="mt-3 p-3 rounded-md bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-800 dark:text-red-200">
                            {addGrantError}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select User:
                    </label>
                    <select
                      id="user-select"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      onChange={() => {
                        // Clear error when user makes a selection
                        if (addGrantError) {
                          setAddGrantError('');
                        }
                      }}
                    >
                      <option value="">Choose a user...</option>
                      {orgUsers?.map((user: any) => (
                        <option key={user.userId} value={user.userId}>
                          {user.username} ({user.human?.profile?.displayName || 'No display name'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Roles:
                    </label>
                    <div className="space-y-2">
                      {availableRoles.map((role) => (
                        <label key={role} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editRoles.includes(role)}
                            onChange={(e) => {
                              // Clear error when roles are modified
                              if (addGrantError) {
                                setAddGrantError('');
                              }
                              
                              if (e.target.checked) {
                                setEditRoles([...editRoles, role]);
                              } else {
                                setEditRoles(editRoles.filter((r) => r !== role));
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-gray-900 dark:text-white">{role}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                      onClick={() => {
                        setAddModalOpen(false);
                        setAddGrantError(''); // Clear error when cancelled
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={() => {
                        const userSelect = document.getElementById('user-select') as HTMLSelectElement;
                        const selectedUserId = userSelect.value;
                        if (selectedUserId) {
                          addUserGrant(selectedUserId);
                        }
                      }}
                    >
                      Add Grant
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Invite User Modal */}
      <InviteUserModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onUserCreated={handleUserCreated}
      />
    </div>
  );
}
