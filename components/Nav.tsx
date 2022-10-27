import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { Router, withRouter } from 'next/router';
import React, { Fragment, useEffect, useState } from 'react';

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

    Router.events.on("routeChangeComplete", (url) => {
      this.setState({
        mobileOpen: false,
      });
    });
    Router.events.on("hashChangeComplete", (url) => {
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
    Router.events.off("routeChangeComplete", () => {});
    Router.events.off("hashChangeComplete", () => {});
  }

  render() {
    return (
      <nav className="font-normal z-50 transition-all duration-300 ease-in-out fixed top-0 inset-x-0 h-14 bg-lnav dark:bg-dnav shadow-lnav backdrop-nav dark:shadow-dnav">
        <div className="h-full max-w-7xl mx-auto flex items-center px-6">
          <div className="min-w-40 relative">
            <Link href="/">
              <a className="h-10 block">
                <img
                  height={40}
                  width={147.5}
                  className="navimgd"
                  src="/zitadel-logo-light.svg"
                  alt="ZITADEL logo dark"
                />
              </a>
            </Link>

            <span className="text-xl font-bold absolute -bottom-1 -right-6 text-zitadelaccent-500">
              B2B
            </span>
          </div>

          <AuthCheck fallback={<div></div>}>
            <OrgContext />
          </AuthCheck>

          <span className="flex-grow"></span>

          <ul className="hidden md:flex items-center flex-grow justify-end">
            <li className="text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white">
              <Link href="/">
                <a className="flex items-center h-14 relative px-4 text-sm">
                  Home
                </a>
              </Link>
            </li>

            <li className="text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white">
              <a
                href={`${process.env.NEXT_PUBLIC_ZITADEL_ISSUER}/ui/console`}
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
                className="flex items-center box-border px-4 outline-none focus:outline-none"
              >
                <i className="text-lg las la-bars"></i>
              </button>
              <div
                className={`${
                  this.state.mobileOpen
                    ? "absolute inset-0 top-14 h-screen w-full dark:bg-zitadelblue-700 dark:bg-opacity-80"
                    : "hidden"
                }`}
                onClick={() => this.triggerMenu()}
              ></div>
              <div
                className={`${
                  this.state.mobileOpen
                    ? "absolute top-14 left-0 right-0 bottom-0 flex-col"
                    : "hidden "
                } `}
              >
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
    signIn("zitadel" as any, {
      callbackUrl: "/",
    });
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
  return (
    <div className="overflow-y-scroll max-h-screenmnav m-2 py-2  bg-white dark:bg-zitadelblue-400 shadow-xl dark:text-white rounded-xl relative">
      <Link href="/">
        <a className="px-4 py-4 flex items-center hover:text-purple-700 dark:hover:text-zitadelaccent-400 justify-center">
          Home
        </a>
      </Link>
      <Link href="/aboutus">
        <a className="px-4 py-4 flex items-center hover:text-purple-700 dark:hover:text-zitadelaccent-400 justify-center">
          About Us
        </a>
      </Link>
      <Link href="/contact">
        <a className="px-4 py-4 flex items-center hover:text-purple-700 dark:hover:text-zitadelaccent-400 justify-center">
          Contact
        </a>
      </Link>
      <Link href="/jobs">
        <a className="px-4 py-4 flex items-center hover:text-purple-700 dark:hover:text-zitadelaccent-400 justify-center">
          Jobs
        </a>
      </Link>
    </div>
  );
}

export default withRouter(Nav);
