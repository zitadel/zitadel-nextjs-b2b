import create from 'zustand';

export const ROLES: Role[] = [
  {
    name: 'Granted Projects',
    desc: 'You need to have reader role to view granted projects',
    roles: ['reader', 'admin'],
  },
  {
    name: 'Manage Team',
    desc: 'You need to have admin role to view user grants',
    roles: ['admin'],
  },
];

export interface Role {
  name: string;
  desc: string;
  roles: string[]; // one of the given roles enables the selection if available on the user
}
