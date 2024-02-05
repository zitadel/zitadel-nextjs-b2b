import { signIn, useSession } from 'next-auth/react';

export default function AuthCheck(props: any) {
  const { data: session } = useSession();
  return session
    ? props.children
    : props.fallback || (
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col items-center">
            <p className="mb-4">You must be signed in!</p>
            <button
              onClick={() => signIn('zitadel', { callbackUrl: '/' }, { prompt: 'select_account' })}
              className="whitespace-nowrap py-2 px-4 md:mr-0 shadow rounded-md bg-black dark:text-white dark:bg-zitadelaccent-500 dark:hover:bg-zitadelaccent-400 text-white text-sm hidden md:block font-normal"
            >
              Login
            </button>
          </div>
        </div>
      );
}
