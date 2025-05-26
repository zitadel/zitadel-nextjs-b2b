import { getSession } from 'next-auth/react';
import useSWR, { mutate } from 'swr';
import { useState, Fragment, useMemo, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { PencilIcon, TrashIcon, PlusIcon, UserAddIcon, SearchIcon, XIcon } from '@heroicons/react/outline';
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
  
  // Search functionality state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  
  // User search state for add grant modal
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

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

  const { data: userGrantsResponse, error: orgError } = useSWR(
    org?.id ? `/api/usergrants?orgId=${org.id}` : null, 
    (url) => fetcher(url)
  );
  
  // Extract the grants data from the response
  const usergrants = userGrantsResponse?.result || userGrantsResponse || [];
  
  // Ensure usergrants is always an array
  const grantsArray = Array.isArray(usergrants) ? usergrants : [];
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
  const grantsByProject = grantsArray?.reduce((acc: any, grant: any) => {
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

  // Filter grants based on search query
  const filteredGrantsByProject = useMemo(() => {
    if (!grantsByProject || !searchQuery.trim()) {
      return grantsByProject;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered: any = {};

    Object.entries(grantsByProject).forEach(([projectId, projectData]: any) => {
      const filteredUsers = projectData.users.filter((user: any) => {
        const displayName = (user.displayName || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const username = (user.userName || '').toLowerCase();
        const firstName = (user.firstName || '').toLowerCase();
        const lastName = (user.lastName || '').toLowerCase();
        const preferredLoginName = (user.preferredLoginName || '').toLowerCase();
        
        return displayName.includes(query) || 
               email.includes(query) || 
               username.includes(query) ||
               firstName.includes(query) ||
               lastName.includes(query) ||
               preferredLoginName.includes(query);
      });

      // Only include projects that have matching users
      if (filteredUsers.length > 0) {
        filtered[projectId] = {
          ...projectData,
          users: filteredUsers
        };
      }
    });

    return filtered;
  }, [grantsByProject, searchQuery]);

  // Filter organization users based on search query
  const filteredOrgUsers = useMemo(() => {
    if (!orgUsers || userSearchQuery.trim().length < 2) {
      return [];
    }

    const query = userSearchQuery.toLowerCase().trim();
    
    return orgUsers.filter((user: any) => {
      const displayName = (user.human?.profile?.displayName || '').toLowerCase();
      const email = (user.human?.email?.email || '').toLowerCase();
      const username = (user.username || '').toLowerCase();
      const firstName = (user.human?.profile?.givenName || '').toLowerCase();
      const lastName = (user.human?.profile?.familyName || '').toLowerCase();
      
      return displayName.includes(query) || 
             email.includes(query) || 
             username.includes(query) ||
             firstName.includes(query) ||
             lastName.includes(query);
    });
  }, [orgUsers, userSearchQuery]);

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
    setUserSearchQuery(''); // Clear user search
    setSelectedUserId(''); // Clear selected user
    
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

  const addUserGrant = async (userId?: string) => {
    if (!selectedProject) return;
    
    // Use provided userId or the selected one from state
    const targetUserId = userId || selectedUserId;
    
    // Clear any previous error
    setAddGrantError('');
    
    // Validate required fields
    if (!targetUserId) {
      setAddGrantError('Please select a user.');
      return;
    }
    
    if (editRoles.length === 0) {
      setAddGrantError('Please select at least one role.');
      return;
    }
    
    // Check if user already has a grant for this project
    const existingGrant = grantsArray?.find(
      (grant: any) => grant.userId === targetUserId && grant.projectId === selectedProject.id
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
          userId: targetUserId,
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
      setUserSearchQuery(''); // Clear user search
      setSelectedUserId(''); // Clear selected user
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl mt-4 font-semibold">User Grants</h2>
          <p className="text-sm text-gray-300 mt-2">These are the user grants for all granted projects in your organization.</p>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={() => setInviteModalOpen(true)}
            className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <UserAddIcon className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="whitespace-nowrap">Invite User</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search users by name, email, or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XIcon className="h-5 w-5 text-gray-400" />
            </button>
          )}
        </div>
        
        {/* Search Results Info */}
        {searchQuery.trim() && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>
              {filteredGrantsByProject && Object.keys(filteredGrantsByProject).length > 0
                ? `Found ${Object.values(filteredGrantsByProject).reduce((total: number, project: any) => total + project.users.length, 0)} user${Object.values(filteredGrantsByProject).reduce((total: number, project: any) => total + project.users.length, 0) !== 1 ? 's' : ''} matching "${searchQuery}"`
                : `No users found matching "${searchQuery}"`
              }
            </span>
          </div>
        )}
      </div>

      {filteredGrantsByProject &&
        Object.entries(filteredGrantsByProject).map(([projectId, projectData]: any) => (
          <div key={projectId} className="mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 mb-4">
              <h3 className="text-lg sm:text-xl font-semibold truncate">{projectData.projectName}</h3>
              <button
                onClick={() => handleAddGrant(projectId, projectData.projectGrantId, projectData.projectName)}
                className="flex items-center justify-center sm:justify-start px-3 py-2 sm:py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="whitespace-nowrap">Add User Grant</span>
              </button>
            </div>
            <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 py-4 overflow-x-auto">
              <div className="inline-block min-w-full shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                  <thead>
                    <tr>
                      <th className="px-3 sm:px-5 py-3 border-b-2 border-white/20 text-left text-xs text-gray-200 uppercase tracking-wider">
                        User
                      </th>
                      <th className="hidden sm:table-cell px-3 sm:px-5 py-3 border-b-2 border-white/20 text-left text-xs text-gray-200 uppercase tracking-wider">
                        Roles
                      </th>
                      <th className="px-3 sm:px-5 py-3 border-b-2 border-white/20 text-left text-xs text-gray-200 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectData.users.map((user: any, i: number) => (
                      <tr key={`${user.id}${i}`} className="group hover:bg-gray-700">
                        <td className="px-3 sm:px-5 py-3 sm:py-1 border-b border-gray-600 text-sm group">
                          <div className="flex flex-col">
                            <p className="text-white text-sm sm:text-base">{user.displayName}</p>
                            <p className="text-xs sm:text-sm text-gray-400">{user.email}</p>
                            {/* Show roles on mobile */}
                            <p className="sm:hidden text-xs text-gray-300 mt-1">
                              {user.roleKeys && user.roleKeys.length > 0 
                                ? user.roleKeys.join(', ') 
                                : <span className="text-gray-400 italic">No roles assigned</span>
                              }
                            </p>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-3 sm:px-5 py-5 border-b border-gray-600 text-sm group">
                          <p className="text-white whitespace-no-wrap">
                            {user.roleKeys && user.roleKeys.length > 0 
                              ? user.roleKeys.join(', ') 
                              : <span className="text-gray-400 italic">No roles assigned</span>
                            }
                          </p>
                        </td>
                        <td className="px-3 sm:px-5 py-3 sm:py-5 border-b border-gray-600 text-sm group">
                          <div className="flex space-x-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditGrant(user)}
                              className="p-2 sm:p-1 text-blue-400 hover:text-blue-300 bg-blue-900/20 sm:bg-transparent rounded sm:rounded-none"
                              title={user.roleKeys && user.roleKeys.length > 0 ? "Edit roles" : "Add roles"}
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteGrant(user)}
                              className="p-2 sm:p-1 text-red-400 hover:text-red-300 bg-red-900/20 sm:bg-transparent rounded sm:rounded-none"
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

      {(!filteredGrantsByProject || Object.keys(filteredGrantsByProject).length === 0) && (
        <div className="w-full flex flex-row items-center justify-center py-8 px-6 bg-black/5 dark:bg-white/5 rounded-lg">
          <div className="text-center">
            <i className="las la-exclamation text-4xl text-gray-400 mb-2"></i>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchQuery.trim() 
                ? `No users found matching "${searchQuery}". Try a different search term.`
                : 'No user grants found. Users need to be granted access to projects first.'
              }
            </p>
          </div>
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
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white">
                    {selectedGrant?.roleKeys && selectedGrant.roleKeys.length > 0 ? 'Edit User Roles' : 'Add User Roles'}
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-300">
                      {selectedGrant?.displayName} - {selectedGrant?.projectName}
                    </p>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
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
                            className="mr-2 rounded border-zitadelblue-600 bg-zitadelblue-800 text-zitadelaccent-500 focus:ring-zitadelaccent-500"
                          />
                          <span className="text-white">{role}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 sm:gap-0">
                    <button
                      type="button"
                      className="order-2 sm:order-1 inline-flex justify-center rounded-md border border-zitadelblue-500 bg-zitadelblue-600 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-zitadelblue-500 focus:outline-none focus:ring-2 focus:ring-zitadelaccent-500 focus:ring-offset-2 focus:ring-offset-zitadelblue-700"
                      onClick={() => setEditModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="order-1 sm:order-2 inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zitadelblue-700"
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
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white">
                    Remove User Grant
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-300">
                      Are you sure you want to remove the grant for {selectedGrant?.displayName} from {selectedGrant?.projectName}?
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 sm:gap-0">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-zitadelblue-500 bg-zitadelblue-600 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-zitadelblue-500 focus:outline-none focus:ring-2 focus:ring-zitadelaccent-500 focus:ring-offset-2 focus:ring-offset-zitadelblue-700"
                      onClick={() => setDeleteModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zitadelblue-700"
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
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white">
                    Add User Grant
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-300">
                      Add a user to {selectedProject?.name}
                    </p>
                  </div>

                  {/* Error Message Display */}
                  {addGrantError && (
                    <div className="mt-3 p-3 rounded-md bg-red-900/30 border border-red-700">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-200">
                            {addGrantError}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Search for User:
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search by name, email, or username..."
                        value={userSearchQuery}
                        onChange={(e) => {
                          setUserSearchQuery(e.target.value);
                          setSelectedUserId(''); // Clear selection when typing
                          if (addGrantError) {
                            setAddGrantError('');
                          }
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-zitadelblue-600 rounded-md shadow-sm bg-zitadelblue-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-zitadelaccent-500 focus:border-zitadelaccent-500 text-sm"
                      />
                    </div>
                    
                    {/* Search Results */}
                    {userSearchQuery.trim().length >= 2 && (
                      <div className="mt-2 max-h-48 overflow-y-auto border border-zitadelblue-600 rounded-md bg-zitadelblue-800">
                        {filteredOrgUsers.length > 0 ? (
                          <div className="py-1">
                            {filteredOrgUsers.map((user: any) => (
                              <button
                                key={user.userId}
                                type="button"
                                onClick={() => {
                                  setSelectedUserId(user.userId);
                                  setUserSearchQuery(user.human?.profile?.displayName || user.username || 'Unknown User');
                                  if (addGrantError) {
                                    setAddGrantError('');
                                  }
                                }}
                                className={`w-full text-left px-3 py-2 hover:bg-zitadelblue-600 transition-colors ${
                                  selectedUserId === user.userId 
                                    ? 'bg-zitadelaccent-500/20 text-zitadelaccent-200' 
                                    : 'text-white'
                                }`}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium text-sm">
                                    {user.human?.profile?.displayName || user.username || 'Unknown User'}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {user.human?.email?.email || 'No email'} • {user.username || 'No username'}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="py-2 px-3 text-sm text-gray-400">
                            No users found matching "{userSearchQuery}"
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Selected User Display */}
                    {selectedUserId && userSearchQuery.trim() && (
                      <div className="mt-2 p-2 bg-zitadelaccent-500/20 border border-zitadelaccent-500 rounded-md">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zitadelaccent-200 font-medium">
                            Selected: {userSearchQuery}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserId('');
                              setUserSearchQuery('');
                            }}
                            className="text-zitadelaccent-300 hover:text-zitadelaccent-100 ml-2"
                          >
                            <XIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {userSearchQuery.trim().length > 0 && userSearchQuery.trim().length < 2 && (
                      <p className="mt-1 text-xs text-gray-400">
                        Type at least 2 characters to search for users
                      </p>
                    )}
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
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
                            className="mr-2 rounded border-zitadelblue-600 bg-zitadelblue-800 text-zitadelaccent-500 focus:ring-zitadelaccent-500"
                          />
                          <span className="text-white">{role}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 sm:gap-0">
                    <button
                      type="button"
                      className="order-2 sm:order-1 inline-flex justify-center rounded-md border border-zitadelblue-500 bg-zitadelblue-600 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-zitadelblue-500 focus:outline-none focus:ring-2 focus:ring-zitadelaccent-500 focus:ring-offset-2 focus:ring-offset-zitadelblue-700"
                      onClick={() => {
                        setAddModalOpen(false);
                        setAddGrantError(''); // Clear error when cancelled
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="order-1 sm:order-2 inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zitadelblue-700"
                      onClick={() => {
                        if (selectedUserId) {
                          addUserGrant(selectedUserId);
                        } else {
                          setAddGrantError('Please select a user from the search results.');
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
