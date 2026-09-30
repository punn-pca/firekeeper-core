export class WorkspaceMemberConflict extends Error {
  constructor(public readonly code: 'WORKSPACE_OWNER_REQUIRED' | 'MEMBER_ALREADY_EXISTS' | 'WORKSPACE_MEMBER_LIMIT_REACHED') {
    super(code);
  }
}

export function addWorkspaceMember(
  workspace: { ownerId?: string; members?: Array<{ userId: string; role: string }> },
  ownerId: string,
  member: { userId: string; role: string },
  maxMembers: number
) {
  if (workspace.ownerId !== ownerId) throw new WorkspaceMemberConflict('WORKSPACE_OWNER_REQUIRED');
  const members = Array.isArray(workspace.members) ? workspace.members : [];
  if (members.some(m => m.userId === member.userId)) throw new WorkspaceMemberConflict('MEMBER_ALREADY_EXISTS');
  if (members.length >= maxMembers) throw new WorkspaceMemberConflict('WORKSPACE_MEMBER_LIMIT_REACHED');
  const nextMembers = [...members, member];
  return { members: nextMembers, memberIds: Array.from(new Set(nextMembers.map(m => m.userId))) };
}
