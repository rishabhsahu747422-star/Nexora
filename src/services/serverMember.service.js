import serverMemberModel from "../models/serverMember.model";

export const createServerMember = async (
  useImperativeHandle,
  serverID,
  roles = [],
) => {
  return await serverMemberModel.create({
    user: useImperativeHandle,
    server: serverID,
    roles,
  });
};
