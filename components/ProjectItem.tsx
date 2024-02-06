import { useRouter } from 'next/router';

import localizedDate from '../lib/localized-date';

export type ZitadelProjectGrant = {
  details: {
    sequence: string;
    creationDate: string;
    changeDate: string;
    resourceOwner: string;
  };
  grantId: string;
  grantedOrgId: string;
  grantedOrgName: string;
  grantedRoleKeys: string[];
  projectId: string;
  projectName: string;
  projectOwnerId: string;
  projectOwnerName: string;
  state: string;
};
export default function ProjectItem({ project }: { project: ZitadelProjectGrant }) {
  const { locale } = useRouter();
  return (
    <div
      className={`${
        open ? '' : 'text-opacity-90'
      } h-full w-full min-w-[300px] transition-all outline-none focus:outline-none flex flex-col rounded-lg bg-white dark:bg-white/10 relative p-4 pb-8`}
    >
      <p className="dark:text-white text-left mb-4">{project.projectName}</p>
      {project.state === 'PROJECT_GRANT_STATE_ACTIVE' && (
        <div className="flex items-center mb-2">
          <p>active</p>
          <div className="mx-2 h-2 w-2 rounded-full bg-green-500 shadow"></div>
        </div>
      )}
      {project.state === 'PROJECT_GRANT_STATE_INACTIVE' && (
        <div className="flex items-center mb-2">
          <p>inactive</p>
          <div className="mx-2 h-2 w-2 rounded-full bg-red-500 shadow"></div>
        </div>
      )}

      <span className="text-sm text-left text-gray-500 dark:text-gray-300">
        created: {localizedDate(project.details.creationDate, locale)}
      </span>

      <span className="text-sm text-left text-gray-500 dark:text-gray-300">
        granted roles: {project?.grantedRoleKeys ? project.grantedRoleKeys.join(', ') : ''}
      </span>

      <div className="absolute bottom-0 right-0"></div>
    </div>
  );
}
