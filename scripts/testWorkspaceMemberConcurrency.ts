import assert from 'node:assert/strict';
import { addWorkspaceMember, WorkspaceMemberConflict } from '../src/server/services/workspaceMembers';

const owner = 'owner';
const workspace = { ownerId: owner, members: [{ userId: owner, role: 'owner' }] };
const first = addWorkspaceMember(workspace, owner, { userId: 'a', role: 'analyst' }, 3);
// A competing Firestore transaction retries against the committed snapshot.
const retried = addWorkspaceMember({ ownerId: owner, members: first.members }, owner,
  { userId: 'b', role: 'viewer' }, 3);
assert.deepEqual(retried.memberIds, [owner, 'a', 'b']);
assert.throws(() => addWorkspaceMember({ ownerId: owner, members: retried.members }, owner,
  { userId: 'c', role: 'viewer' }, 3), (err: unknown) => err instanceof WorkspaceMemberConflict && err.code === 'WORKSPACE_MEMBER_LIMIT_REACHED');
assert.throws(() => addWorkspaceMember({ ownerId: owner, members: first.members }, owner,
  { userId: 'a', role: 'viewer' }, 3), (err: unknown) => err instanceof WorkspaceMemberConflict && err.code === 'MEMBER_ALREADY_EXISTS');
assert.throws(() => addWorkspaceMember(workspace, 'attacker', { userId: 'a', role: 'viewer' }, 3),
  (err: unknown) => err instanceof WorkspaceMemberConflict && err.code === 'WORKSPACE_OWNER_REQUIRED');
console.log('Workspace member transaction retry boundaries passed.');
