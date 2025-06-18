import { useRouter } from 'next/router';

import FooterLink from './FooterLink';

const Footer = () => {
  const router = useRouter();
  const effectClasses = 'filter grayscale transform hover:brightness-75 dark:hover:brightness-125';

  return (
    <>
      <footer className="bg-footer-light dark:bg-zitadelblue-900 text-grey font-medium text-sm pt-8 w-full border-t border-white/20">
        <div className="container mx-auto flex-col px-6 max-w-7xl">
          <div className="flex flex-row flex-wrap -mx-3">
            <div className="flex-1 px-3 py-6 min-w-half md:min-w-0 box-border">
              <p className="text-xs text-gray-400 uppercase mb-4 font-semibold">ZITADEL</p>

              <FooterLink external href="https://zitadel.com">
                Home
              </FooterLink>
              <FooterLink external href="https://zitadel.com/opensource">
                Opensource
              </FooterLink>
            </div>

            <div className="flex-1 px-3 py-6 min-w-half md:min-w-0 box-border">
              <p className="text-xs text-gray-400 uppercase mb-4 font-semibold">Examples</p>

              <FooterLink href="https://zitadel.com/docs/examples/introduction" external>
                Quickstarts
              </FooterLink>

              <FooterLink href="https://zitadel.com/docs/examples/sdks" external>
                SDKs
              </FooterLink>
            </div>
          </div>

          <div className="flex-1 p-4 md:px-0 flex flex-col items-center md:flex-row md:justify-between border-t border-gray-500 border-opacity-30 text-xs">
            <div className="flex-1">
              <p className="text-gray-600 dark:text-gray-300 text-center md:text-left mb-2">
                <a className="hover:text-pink-600" href="https://zitadel.com">
                  ZITADEL (CAOS Ltd.)
                </a>
              </p>
              <div className="flex flex-col space-y-1 text-center md:text-left">
                <span className="text-gray-500">
                  Four Embarcadero Center, Suite 1400
                </span>
                <span className="text-gray-500">
                  San Francisco, CA 94111-4164
                </span>
                <span className="text-gray-500">{`Copyright © ${new Date().getFullYear()} All rights reserved.`}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 my-2">
              <a
                className="hover:text-gray-500 dark:text-gray-400 dark:hover:text-white"
                target="_blank"
                rel="noreferrer"
                href="https://github.com/zitadel"
              >
                <i className="text-3xl lab la-github"></i>
              </a>
              <a
                className="hover:text-gray-500 dark:text-gray-400 dark:hover:text-white"
                target="_blank"
                rel="noreferrer"
                href="https://twitter.com/zitadel"
              >
                <i className="text-3xl lab la-twitter"></i>
              </a>
              <a
                className="hover:text-gray-500 dark:text-gray-400 dark:hover:text-white"
                target="_blank"
                rel="noreferrer"
                href="https://www.linkedin.com/company/zitadel/"
              >
                <i className="text-3xl lab la-linkedin"></i>
              </a>
              <a
                className="hover:text-gray-500 dark:text-gray-400 dark:hover:text-white"
                target="_blank"
                rel="noreferrer"
                href="https://www.facebook.com/zitadel.social"
              >
                <i className="text-3xl lab la-facebook"></i>
              </a>
              <a
                className="hover:text-gray-500 dark:text-gray-400 dark:hover:text-white"
                target="_blank"
                rel="noreferrer"
                href="https://zitadel.com/chat"
              >
                <i className="text-3xl lab la-discord"></i>
              </a>
              <a
                className="hover:text-gray-500 dark:text-gray-400 dark:hover:text-white"
                target="_blank"
                rel="noreferrer"
                href="https://www.youtube.com/@zitadel"
              >
                <i className="text-3xl lab la-youtube"></i>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
