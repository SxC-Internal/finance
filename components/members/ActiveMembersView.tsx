'use client'

import React from 'react';
import { Crown, User as UserIcon } from 'lucide-react';
import type { User, TeamMember } from '@/types';
import { DB_DEPARTMENTS, DB_USER_DEPARTMENTS, DB_USERS } from '@/constants';
import { useActiveMembers } from '@/hooks/useActiveMembers';
import {
  buildTeamMembersFromDb,
  getDepartmentBadgeClass,
  getDepartmentDotClass,
} from '@/lib/members';

interface ActiveMembersViewProps {
  user: User;
}

interface MemberCardProps {
  member: TeamMember;
  isChief: boolean;
  isAdmin: boolean;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, isChief, isAdmin }) => (
  <div
    className={`bg-white dark:bg-slate-800 rounded-xl p-6 border ${
      isChief ? 'border-amber-200 dark:border-amber-500/30' : 'border-slate-200 dark:border-slate-700/50'
    } hover:border-blue-500/50 transition-all flex items-center space-x-4 group relative overflow-hidden shadow-sm dark:shadow-none`}
  >
    {isChief && (
      <div className="absolute top-0 right-0 p-2 opacity-30 dark:opacity-50">
        <Crown size={60} className="text-amber-500/10 -rotate-12" />
      </div>
    )}

    {isAdmin && (
      <div
        className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
          getDepartmentBadgeClass(member.departmentId)
        }`}
      >
        {member.departmentId}
      </div>
    )}

    <div className="relative z-10">
      <img
        src={member.image}
        alt={member.name}
        className={`w-16 h-16 rounded-full object-cover border-2 ${
          isChief ? 'border-amber-400' : 'border-slate-200 dark:border-slate-700'
        } group-hover:border-blue-500 transition-colors`}
      />
      {!isAdmin && (
        <div
          className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${
            getDepartmentDotClass(member.departmentId)
          }`}
        />
      )}
    </div>
    <div className="z-10">
      <h3 className="text-slate-900 dark:text-white font-bold text-lg flex items-center">
        {member.name}
        {isChief && <Crown size={14} className="ml-2 text-amber-500 fill-amber-500" />}
      </h3>
      <p
        className={`${
          isChief ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'
        } text-sm font-medium`}
      >
        {member.role}
      </p>
      <p className="text-slate-500 text-xs mt-1">{member.email}</p>
    </div>
  </div>
);

const ActiveMembersView: React.FC<ActiveMembersViewProps> = ({ user }) => {
  const members = buildTeamMembersFromDb({
    users: DB_USERS,
    userDepartments: DB_USER_DEPARTMENTS,
    departments: DB_DEPARTMENTS,
  });

  const { chiefs, team, deptName } = useActiveMembers(user, members);

  return (
    <div className="space-y-12 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Active Members</h2>
        <p className="text-slate-500 dark:text-slate-400">
          {user.role === 'admin'
            ? 'Global directory of all departmental leaders and members.'
            : `Active members and leadership for ${deptName}.`}
        </p>
      </div>

      <section>
        <div className="flex items-center mb-6">
          <Crown className="text-amber-500 mr-3" size={24} />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Executive Leadership</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chiefs.map((member) => (
            <MemberCard key={member.id} member={member} isChief isAdmin={user.role === 'admin'} />
          ))}
          {chiefs.length === 0 && (
            <div className="col-span-3 text-center py-8 text-slate-500 bg-slate-100 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              No executives found.
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center mb-6">
          <UserIcon className="text-blue-500 mr-3" size={24} />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Managers & Active Members</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map((member) => (
            <MemberCard key={member.id} member={member} isChief={false} isAdmin={user.role === 'admin'} />
          ))}
          {team.length === 0 && (
            <div className="col-span-3 text-center py-8 text-slate-500 bg-slate-100 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              No active members found.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ActiveMembersView;
