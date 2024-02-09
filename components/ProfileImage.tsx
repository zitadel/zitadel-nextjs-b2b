import { Menu, Transition } from '@headlessui/react';
import { LogoutIcon, PencilIcon, PlusIcon } from '@heroicons/react/outline';
import { getSession, signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Fragment, useEffect, useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { Avatar, AvatarSize } from './Avatar';

export default function ProfileImage({ user }: { user?: any | null }) {
  const router = useRouter();

  const logout = async () => {
    await signOut({ callbackUrl: '/' });
    const url =
      `${process.env.PUBLIC_NEXT_ZITADEL_API}/oidc/v1/end_session?` +
      new URLSearchParams({
        post_logout_redirect_uri: 'http://localhost:3000',
      });

    return router.push(url);
  };

  const [isLoading, setIsLoading] = useState(false);

  const getSessions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sessions');
      const data = await response.json();
      if (data && typeof data === 'object' && data.length) {
        setSessions(data);
        setIsLoading(false);
      }
    } catch (error) {
      setSessions([]);
      console.error(error);
      setIsLoading(false);
    }
  };

  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    getSessions();
  }, []);

  function signInWithHint(session: any): void {
    signIn(
      'zitadel',
      {
        callbackUrl: '/',
      },
      {
        login_hint: session.loginName,
      },
    );
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="flex items-center bg-zitadelblue-400 justify-center ml-4 transition-all h-8 w-8 rounded-full shadow-lg ring-2 ring-white ring-opacity-50 hover:ring-opacity-100">
          {user && user.image ? (
            <img className="h-8 w-8 rounded-full" src={user.image} alt="user avatar" />
          ) : (
            <Avatar size={AvatarSize.SMALL} loginName={user.loginName} name={user.displayName}></Avatar>
          )}
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute w-80 right-0 mt-5 origin-top-right bg-zitadelblue-400 divide-y divide-white/10 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-1 py-1 ">
            <div className="flex flex-col items-center py-4">
              <p>{user?.name}</p>
              <p className="text-gray-300 text-sm">{user?.email}</p>
            </div>
            <Menu.Item>
              {({ active }) => (
                <a
                  href={`${process.env.PUBLIC_NEXT_ZITADEL_API}/ui/console/users/me${
                    user?.loginName ? `?login_hint=${encodeURIComponent(user.loginName)}` : ''
                  }`}
                  target="_blank"
                  rel="noreferrer"
                  className={`${
                    active ? 'bg-zitadelblue-300 text-white' : 'text-gray-300'
                  } group flex rounded-md justify-center items-center w-full px-2 py-2 text-sm`}
                >
                  {active ? (
                    <PencilIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                  ) : (
                    <PencilIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                  )}
                  Edit Profile
                </a>
              )}
            </Menu.Item>
          </div>
          <div className="px-1 py-1 ">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() =>
                    signIn(
                      'zitadel',
                      {
                        callbackUrl: '/',
                      },
                      {
                        prompt: 'select_account',
                      },
                    )
                  }
                  className={`${
                    active ? 'bg-zitadelblue-300 text-white' : 'text-gray-300'
                  } rounded-md group flex justify-center items-center w-full px-2 py-2 text-sm`}
                >
                  {active ? (
                    <PlusIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                  ) : (
                    <PlusIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                  )}
                  Add other user
                </button>
              )}
            </Menu.Item>
          </div>
          {sessions.filter((s) => s.loginName !== user.loginName).length > 0 && (
            <div className="px-1 py-1 max-h-96 overflow-y-auto flex flex-col">
              {isLoading && <LoadingSpinner className="h-7 w-7 self-center my-2" />}
              {sessions
                .filter((s) => s.loginName !== user.loginName)
                .map((session, i) => (
                  <Menu.Item key={`${session.userName}${i}`}>
                    {({ active }) => (
                      <button
                        onClick={() => signInWithHint(session)}
                        className={`${
                          active ? 'bg-zitadelblue-300 text-white' : 'text-gray-300'
                        } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                      >
                        <div className="mr-4">
                          <Avatar size={AvatarSize.SMALL} loginName={session.loginName} name={session.displayName}></Avatar>
                        </div>
                        <div className="flex flex-col justify-start">
                          <span className="text-left">{session.displayName}</span>
                          <span className="text-left text-sm">{session.userName}</span>
                          <span
                            className={`text-left text-sm ${
                              session.authState === 'SESSION_STATE_ACTIVE' ? 'text-green-500' : 'text-red-500'
                            }`}
                          >
                            {session.authState === 'SESSION_STATE_ACTIVE' ? 'active' : 'inactive'}
                          </span>
                        </div>
                      </button>
                    )}
                  </Menu.Item>
                ))}
            </div>
          )}
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => logout()}
                  className={`${
                    active ? 'bg-zitadelaccent-800  text-white' : 'text-gray-300'
                  } group flex rounded-md hover:bg-red-500/20 hover:text-red-500 transition-all justify-center items-center w-full px-2 py-2 text-sm`}
                >
                  {active ? (
                    <LogoutIcon className="w-5 h-5 mr-2 text-violet-400" aria-hidden="true" />
                  ) : (
                    <LogoutIcon className="w-5 h-5 mr-2 text-violet-400" aria-hidden="true" />
                  )}
                  Logout all users
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
