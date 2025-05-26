import { getSession } from 'next-auth/react';
import useSWR, { mutate } from 'swr';
import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/outline';
import orgStore from '../lib/org';

export default function UserGrantTable() {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

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
    // Check if the grant has roleKeys - some grants might not be editable
    if (!grant.roleKeys || grant.roleKeys.length === 0) {
      alert('This user grant has no roles assigned and cannot be edited. You can only delete it.');
      return;
    }
    
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
    
    const session = await getSession() as any;
    try {
      await fetch('/api/usergrants/add', {
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
      mutate(`/api/usergrants?orgId=${org.id}`);
      setAddModalOpen(false);
    } catch (error) {
      console.error('Error adding user grant:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6">
      <h2 className="mb-4 text-2xl mt-4">User Grants</h2>

      <p className="text-sm text-gray-300 mb-4">These are the user grants for all granted projects in your organization.</p>

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
                            {user.roleKeys && user.roleKeys.length > 0 ? (
                              <button
                                onClick={() => handleEditGrant(user)}
                                className="p-1 text-blue-400 hover:text-blue-300"
                                title="Edit roles"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="p-1 text-gray-500" title="Cannot edit - no roles assigned">
                                <PencilIcon className="w-4 h-4 opacity-30" />
                              </span>
                            )}
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
                    Edit User Roles
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
        <Dialog as="div" className="relative z-10" onClose={() => setAddModalOpen(false)}>
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

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select User:
                    </label>
                    <select
                      id="user-select"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                      onClick={() => setAddModalOpen(false)}
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
    </div>
  );
}
