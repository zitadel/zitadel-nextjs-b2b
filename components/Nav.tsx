import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { Router, withRouter } from 'next/router';
import React, { Fragment, useEffect, useState } from 'react';
import { PencilIcon, PlusIcon, LogoutIcon } from '@heroicons/react/outline';

import AuthCheck from './AuthCheck';
import OrgContext from './OrgContext';
import ProfileImage from './ProfileImage';

type Props = {
  router: any;
};

type State = {
  mobileOpen: boolean;
};

class Nav extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      mobileOpen: false,
    };

    Router.events.on('routeChangeComplete', (url) => {
      this.setState({
        mobileOpen: false,
      });
    });
    Router.events.on('hashChangeComplete', (url) => {
      this.setState({
        mobileOpen: false,
      });
    });
  }

  triggerMenu() {
    this.setState({
      mobileOpen: !this.state.mobileOpen,
    });
  }

  componentWillUnmount() {
    Router.events.off('routeChangeComplete', () => {});
    Router.events.off('hashChangeComplete', () => {});
  }

  render() {
    return (
      <nav className="font-normal z-50 transition-all duration-300 ease-in-out fixed top-0 inset-x-0 h-14 bg-lnav dark:bg-dnav shadow-lnav backdrop-nav dark:shadow-dnav">
        <div className="h-full max-w-7xl mx-auto flex items-center px-4 sm:px-6">
          <div className="min-w-32 sm:min-w-40 relative">
            <Link href="/" className="h-8 sm:h-10 block">
              <img height={40} width={147.5} className="navimgd h-8 sm:h-10 w-auto" src="/zitadel-logo-light.svg" alt="ZITADEL logo dark" />
            </Link>

            <span className="text-lg sm:text-xl font-bold absolute -bottom-1 -right-4 sm:-right-6 text-zitadelaccent-500">B2B</span>
          </div>

          <AuthCheck fallback={<div></div>}>
            <OrgContext />
          </AuthCheck>

          <span className="flex-grow"></span>

          <ul className="hidden md:flex items-center flex-grow justify-end">
            <li className="text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white">
              <Link href="/" className="flex items-center h-14 relative px-4 text-sm">
                Home
              </Link>
            </li>

            <li className="text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white">
              <a
                href={`${process.env.PUBLIC_NEXT_ZITADEL_API}/ui/console`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center h-14 relative px-4 text-sm"
              >
                <span>Console</span>
                <i className="text-xl h-5 -mt-2 ml-2 las la-external-link-alt"></i>
              </a>
            </li>

            <NavButtons></NavButtons>
          </ul>

          <ul className="pt-flex md:hidden">
            <li className="text-gray-500 dark:text-gray-200">
              <button
                onClick={() => this.triggerMenu()}
                className="flex items-center box-border px-2 sm:px-4 outline-none focus:outline-none"
              >
                <i className="text-lg sm:text-xl las la-bars"></i>
              </button>
              <div
                className={`${
                  this.state.mobileOpen
                    ? 'absolute inset-0 top-14 h-screen w-full dark:bg-zitadelblue-700 dark:bg-opacity-80'
                    : 'hidden'
                }`}
                onClick={() => this.triggerMenu()}
              ></div>
              <div className={`${this.state.mobileOpen ? 'absolute top-14 left-0 right-0 bottom-0 flex-col' : 'hidden '} `}>
                <MobileList></MobileList>
              </div>
            </li>
          </ul>
        </div>
      </nav>
    );
  }
}

function NavButtons() {
  const { data: session, status } = useSession();

  function login() {
    signIn(
      'zitadel',
      {
        callbackUrl: '/',
      },
      { prompt: 'select_account' },
    );
  }

  if (session) {
    return <ProfileImage user={session.user} />;
  } else {
    return (
      <div className="flex items-center justify-center py-2">
        <button
          onClick={login}
          className="whitespace-nowrap py-2 px-4 mx-2 shadow rounded-md text-sm hidden md:block hover:bg-gray-100 dark:bg-zitadelblue-400 dark:hover:bg-zitadelblue-300 dark:hover:bg-opacity-80 font-normal"
        >
          Login
        </button>
      </div>
    );
  }
}

function MobileList() {
  const { data: session } = useSession();
  
  const logout = async () => {
    await signOut({ callbackUrl: '/' });
    const url =
      `${process.env.PUBLIC_NEXT_ZITADEL_API}/oidc/v1/end_session?` +
      new URLSearchParams({
        post_logout_redirect_uri: window.location.origin,
        client_id: process.env.ZITADEL_CLIENT_ID || ''
      });
    
    window.location.href = url;
  };

  function login() {
    signIn(
      'zitadel',
      {
        callbackUrl: '/',
      },
      { prompt: 'select_account' },
    );
  }

  return (
    <div className="overflow-y-scroll max-h-screenmnav m-2 py-2 bg-white dark:bg-zitadelblue-400 shadow-xl dark:text-white rounded-xl relative">
      <Link
        href="/"
        className="px-4 py-3 sm:py-4 flex items-center hover:text-purple-700 dark:hover:text-zitadelaccent-400 justify-center text-sm sm:text-base"
      >
        Home
      </Link>
      <a
        href={`${process.env.PUBLIC_NEXT_ZITADEL_API}/ui/console`}
        target="_blank"
        rel="noreferrer"
        className="px-4 py-3 sm:py-4 flex items-center hover:text-purple-700 dark:hover:text-zitadelaccent-400 justify-center text-sm sm:text-base"
      >
        <span>Console</span>
        <i className="text-lg sm:text-xl h-4 sm:h-5 -mt-1 sm:-mt-2 ml-2 las la-external-link-alt"></i>
      </a>

      {session ? (
        <>
          {/* User Profile Section */}
          <div className="border-t border-gray-200 dark:border-gray-600 my-2 pt-3">
            <div className="px-4 py-2 text-center">
              <p className="text-sm font-medium truncate">{session.user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-300 truncate">{session.user?.email}</p>
            </div>
            
            {/* Profile Actions */}
            <a
              href={`${process.env.PUBLIC_NEXT_ZITADEL_API}/ui/console/users/me${
                session.user?.loginName ? `?login_hint=${encodeURIComponent(session.user.loginName)}` : ''
              }`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-3 flex items-center hover:text-purple-700 dark:hover:text-zitadelaccent-400 justify-center text-sm"
            >
              <PencilIcon className="w-4 h-4 mr-2" />
              Edit Profile
            </a>
            
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
              className="w-full px-4 py-3 flex items-center hover:text-purple-700 dark:hover:text-zitadelaccent-400 justify-center text-sm"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add other user
            </button>
            
            <button
              onClick={logout}
              className="w-full px-4 py-3 flex items-center hover:text-red-500 justify-center text-sm border-t border-gray-200 dark:border-gray-600 mt-2 pt-3"
            >
              <LogoutIcon className="w-4 h-4 mr-2" />
              Logout all users
            </button>
          </div>
        </>
      ) : (
        <div className="border-t border-gray-200 dark:border-gray-600 my-2 pt-3">
          <button
            onClick={login}
            className="w-full px-4 py-3 mx-2 mb-2 shadow rounded-md text-sm bg-gray-100 dark:bg-zitadelblue-300 hover:bg-gray-200 dark:hover:bg-zitadelblue-200 font-normal"
          >
            Login
          </button>
        </div>
      )}
    </div>
  );
}

export default withRouter(Nav);
