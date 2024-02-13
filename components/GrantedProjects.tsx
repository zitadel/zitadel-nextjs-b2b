import { getSession } from 'next-auth/react';
import useSWR from 'swr';

import orgStore from '../lib/org';
import ProjectItem from './ProjectItem';

export default function GrantedProjects() {
  const fetcher = async (url: string) => {
    const session = (await getSession()) as any;
    const org = orgStore.getState().org;

    return fetch(`${url}`, {
      method: 'GET',
      headers: {
        'content-Type': 'application/json',
        authorization: `Bearer ${session.accessToken}`,
        orgid: org.id,
      },
    })
      .then((res) => res.json())
      .then((resp) => resp.result ?? [])
      .catch((error) => {
        console.error(error);
      });
  };

  const { data: projects, error: orgError } = useSWR('/api/grantedprojects', (url) => fetcher(url));

  return (
    <div className="container md:mx-auto max-w-7xl px-6">
      <h2 className="mb-4 text-2xl mt-4">Granted Projects</h2>
      {projects && projects.length ? (
        <div className="">
          <div className="flex flex-row gap-4">
            {projects.map((project) => (
              <div
                key={`
            ${project.projectId}${project.grantId}`}
              >
                <ProjectItem project={project} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-4">
          <p className="opacity-80">No granted projects found!</p>
        </div>
      )}
    </div>
  );
}
