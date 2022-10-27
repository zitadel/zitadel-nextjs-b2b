import create from 'zustand';

import { ZitadelOrg } from '../components/OrgContext';

const orgStore = create((set: any) => ({
  org: null,
  setOrg: (orgToSet: ZitadelOrg) =>
    set({
      org: orgToSet,
    }),
}));

export default orgStore;
