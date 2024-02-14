import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, SelectorIcon } from '@heroicons/react/outline';
import { getSession } from 'next-auth/react';
import { Fragment, useEffect, useState } from 'react';

import orgStore from '../lib/org';

export type ZitadelOrg = {
  id: string;
  name: string;
};

export default function OrgContext() {
  const fetcher = async (url: string) => {
    return fetch(`${url}`).then((res) => res.json());
  };

  const setOrg = orgStore((state) => (state as any).setOrg);
  const org = orgStore((state) => (state as any).org);

  const [orgs, setOrgs] = useState<ZitadelOrg[]>([]);

  useEffect(() => {
    const org = orgStore.getState().org;

    fetcher(`/api/orgs`).then((orgs) => {
      if (orgs && orgs.length) {
        setOrgs(orgs);
        setOrg(orgs[0]);
      }
    });
  }, []);

  return (
    <div className="w-60 ml-20">
      <Listbox value={org} onChange={setOrg}>
        <div className="relative mt-1">
          <Listbox.Button className="relative w-full py-2 pl-3 pr-10 text-left bg-zitadelblue-600 rounded-lg shadow-md cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-opacity-75 focus-visible:ring-white focus-visible:ring-offset-orange-300 focus-visible:ring-offset-2 focus-visible:border-indigo-500 sm:text-sm">
            <span className="block truncate">{org?.name ?? 'No org selected'}</span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <SelectorIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
            </span>
          </Listbox.Button>
          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <Listbox.Options className="absolute w-full py-1 mt-1 overflow-auto text-base bg-zitadelblue-600 rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {orgs.length === 0 && <div className="py-2 px-3 text-black/80 dark:text-white/80">No organization found</div>}
              {orgs &&
                orgs.map((org, personIdx) => (
                  <Listbox.Option
                    key={personIdx}
                    className={({ active }) =>
                      `${active ? 'text-amber-900 bg-amber-100' : 'text-gray-200'}
                      cursor-default select-none relative py-2 pl-10 pr-4`
                    }
                    value={org}
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={`${selected ? 'font-medium' : 'font-normal'} block truncate`}>{org.name}</span>
                        {selected ? (
                          <span
                            className={`${active ? 'text-amber-600' : 'text-amber-600'}
                            absolute inset-y-0 left-0 flex items-center pl-3`}
                          >
                            <CheckIcon className="w-5 h-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}
