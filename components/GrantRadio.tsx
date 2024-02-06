import { RadioGroup } from '@headlessui/react';
import { EyeIcon } from '@heroicons/react/outline';

import { Role, ROLES } from '../lib/roles';

export default function GrantRadio({ roles, selected, setSelected }: any) {
  function isAllowed(requestedRoles: string[]): boolean {
    const isAllowed = roles && requestedRoles && roles.some((role) => requestedRoles.includes(role));
    return isAllowed;
  }

  return (
    <div className="py-4">
      <div className="mx-auto max-w-7xl px-6">
        <RadioGroup className="" value={selected} onChange={setSelected}>
          <RadioGroup.Label className="sr-only">Server size</RadioGroup.Label>
          <div className="flex flex-row space-x-2">
            {ROLES.map((role: Role) => (
              <RadioGroup.Option
                key={role.name}
                value={role}
                disabled={!isAllowed(role.roles)}
                className={({ active, checked, disabled }) =>
                  `${active ? '' : ''}
                  ${checked ? 'bg-zitadelaccent-500 text-white' : 'bg-zitadelblue-400'}
                  ${disabled ? 'bg-gray-600 opacity-50 text-gray-500 cursor-not-allowed' : 'cursor-pointer '}
                    relative rounded-full shadow-md px-4 py-1 flex focus:outline-none`
                }
              >
                {({ active, checked }) => (
                  <>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <div className="text-sm">
                          <RadioGroup.Label as="p" className={`font-medium  ${checked ? 'text-white' : 'text-white'}`}>
                            {role.name}
                          </RadioGroup.Label>
                          {/* <RadioGroup.Description
                            as="span"
                            className={`inline ${checked ? 'text-sky-100' : 'text-gray-500'}`}
                          >
                            <span>{role.desc}</span>{' '}
                          </RadioGroup.Description> */}
                        </div>
                      </div>
                      {/* {checked && (
                        <div className="flex-shrink-0 text-white">
                          <EyeIcon className="text-zitadelaccent-500 w-6 h-6" />
                        </div>
                      )} */}
                    </div>
                  </>
                )}
              </RadioGroup.Option>
            ))}
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}
