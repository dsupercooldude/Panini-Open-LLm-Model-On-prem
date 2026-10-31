import React, { useState } from 'react';
import {
  UserRole,
  RbacAction,
  PREDEFINED_RBAC_ROLES,
  evaluateRbacPermission,
} from '../utils/engineLogic';
import { UserProfile, CollaborationEvent } from '../utils/initialData';
import { Plus } from 'lucide-react';

interface TeamRbacViewProps {
  profiles: UserProfile[];
  activeProfileId: string;
  onSelectProfile: (profileId: string) => void;
  onAddProfile: (profile: UserProfile) => void;
  collabEvents: CollaborationEvent[];
  onPostCollabNote: (summary: string) => void;
  authMode: 'Offline Local Passkey' | 'Enterprise OAuth 2.0';
  onToggleAuthMode: (mode: 'Offline Local Passkey' | 'Enterprise OAuth 2.0') => void;
  oauthClientId: string;
  onChangeOauthClientId: (clientId: string) => void;
  oauthIssuerUrl: string;
  onChangeOauthIssuerUrl: (url: string) => void;
  isDark: boolean;
}

const RBAC_ACTIONS: { id: RbacAction; label: string; description: string }[] = [
  {
    id: 'run_inference',
    label: 'Execute Chat, Multi-Stage Math, Deep Research & 8K Media',
    description: 'Run offline/hybrid inference, inspect Explainable AI traces, and use 10k scenario autocomplete.',
  },
  {
    id: 'clone_and_edit_model',
    label: 'Clone Models & Edit Glass-Box Layers / Quantization',
    description: 'Fork stored checkpoints, modify quantization bitrates, and commit QLoRA adapters.',
  },
  {
    id: 'rollback_version',
    label: 'Execute Atomic Model Version Rollbacks',
    description: 'Restore previous SHA-256 model configurations in production registries.',
  },
  {
    id: 'trigger_backup_and_cicd',
    label: 'Trigger Encrypted Backups & CI/CD Pipelines',
    description: 'Create or restore state snapshots and update automated build workflows.',
  },
  {
    id: 'manage_rbac_and_auth',
    label: 'Configure Enterprise OAuth 2.0 & RBAC Policies',
    description: 'Modify authentication providers, manage team profiles, and assign predefined roles.',
  },
  {
    id: 'clear_central_logs',
    label: 'Acknowledge & Prune Centralized Security Logs',
    description: 'Manage centralized syslog streams and critical system failure alert rules.',
  },
];

export const TeamRbacView: React.FC<TeamRbacViewProps> = ({
  profiles,
  activeProfileId,
  onSelectProfile,
  onAddProfile,
  collabEvents,
  onPostCollabNote,
  authMode,
  onToggleAuthMode,
  oauthClientId,
  onChangeOauthClientId,
  oauthIssuerUrl,
  onChangeOauthIssuerUrl,
  isDark,
}) => {
  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];
  const canManageAuth = evaluateRbacPermission(activeProfile.role, 'manage_rbac_and_auth');

  // Add new user with Predefined RBAC Role template
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [newName, setNewName] = useState('');
  const [newHandle, setNewHandle] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('ML Performance Engineer');
  const [newDept, setNewDept] = useState('Hardware & NPU Optimization');
  const [profileError, setProfileError] = useState('');

  const [collabNote, setCollabNote] = useState('');
  const [localPinVerified, setLocalPinVerified] = useState(true);

  const selectedRoleSpec =
    PREDEFINED_RBAC_ROLES.find((r) => r.role === newRole) || PREDEFINED_RBAC_ROLES[0];

  const handleSelectPredefinedRole = (role: UserRole) => {
    setNewRole(role);
    const spec = PREDEFINED_RBAC_ROLES.find((r) => r.role === role);
    if (spec) {
      setNewDept(spec.defaultDepartment);
    }
  };

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newHandle.trim()) {
      setProfileError('Full Name and Handle are required.');
      return;
    }
    const cleanHandle = newHandle.trim().startsWith('@')
      ? newHandle.trim()
      : `@${newHandle.trim()}`;

    onAddProfile({
      id: `usr-${Date.now()}`,
      name: newName.trim(),
      handle: cleanHandle,
      role: newRole,
      department: newDept.trim() || selectedRoleSpec.defaultDepartment,
      authMethod: authMode,
      lastActive: 'Active now',
    });
    setNewName('');
    setNewHandle('');
    setProfileError('');
    setShowAddProfile(false);
  };

  const handleBroadcastNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabNote.trim()) return;
    onPostCollabNote(collabNote.trim());
    setCollabNote('');
  };

  const borderClass = isDark ? 'border-slate-800' : 'border-slate-200';
  const surfaceClass = isDark ? 'bg-slate-900/70' : 'bg-white';
  const subSurfaceClass = isDark ? 'bg-slate-950/60' : 'bg-slate-50';
  const mutedText = isDark ? 'text-slate-400' : 'text-slate-500';
  const headingText = isDark ? 'text-slate-100' : 'text-slate-900';

  return (
    <div className="space-y-6">
      {/* Predefined RBAC Roles & Operator Profiles */}
      <div className={`border ${borderClass} ${surfaceClass} rounded-xl p-5 space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className={`text-sm font-semibold ${headingText}`}>
              Team Profiles & Predefined RBAC Role Assignment ({profiles.length} Active)
            </h3>
            <p className={`text-xs ${mutedText}`}>
              Add team members using predefined enterprise RBAC role templates or switch active operator sessions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddProfile(!showAddProfile)}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddProfile ? 'Cancel' : 'Add User with Predefined Role'}</span>
          </button>
        </div>

        {/* Predefined RBAC Role Templates Selector when adding a user */}
        {showAddProfile && (
          <form
            onSubmit={handleCreateProfile}
            className={`p-4 rounded-lg border ${borderClass} ${subSurfaceClass} space-y-4`}
          >
            <div className="space-y-2">
              <div className={`text-xs font-semibold ${headingText}`}>
                1. Choose a Predefined RBAC Role Template:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {PREDEFINED_RBAC_ROLES.map((spec) => {
                  const isChosen = spec.role === newRole;
                  return (
                    <button
                      key={spec.role}
                      type="button"
                      onClick={() => handleSelectPredefinedRole(spec.role)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        isChosen
                          ? 'border-sky-500 bg-sky-500/10'
                          : `${borderClass} ${surfaceClass} hover:border-slate-700`
                      }`}
                    >
                      <div className="text-xs font-semibold text-sky-400">{spec.role}</div>
                      <div className={`text-xs font-medium ${headingText} mt-0.5`}>
                        {spec.title} · {spec.badgeText}
                      </div>
                      <div className={`text-[11px] ${mutedText} mt-1 line-clamp-2`}>
                        {spec.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {profileError && <div className="text-xs text-rose-400">{profileError}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="prof-name" className={`block text-xs ${mutedText} mb-1`}>
                  Full Name
                </label>
                <input
                  id="prof-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Dr. Aris Thorne"
                  className={`w-full px-3 py-2 text-xs rounded border ${borderClass} ${surfaceClass} ${headingText}`}
                />
              </div>
              <div>
                <label htmlFor="prof-handle" className={`block text-xs ${mutedText} mb-1`}>
                  Handle
                </label>
                <input
                  id="prof-handle"
                  type="text"
                  value={newHandle}
                  onChange={(e) => setNewHandle(e.target.value)}
                  placeholder="@athorne"
                  className={`w-full px-3 py-2 text-xs rounded border ${borderClass} ${surfaceClass} ${headingText}`}
                />
              </div>
              <div>
                <label htmlFor="prof-dept" className={`block text-xs ${mutedText} mb-1`}>
                  Department (Auto-filled from Role)
                </label>
                <input
                  id="prof-dept"
                  type="text"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded border ${borderClass} ${surfaceClass} ${headingText}`}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded bg-emerald-500 text-slate-950 hover:bg-emerald-400"
              >
                Add User as {newRole}
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {profiles.map((prof) => {
            const isSelected = prof.id === activeProfile.id;
            return (
              <button
                key={prof.id}
                type="button"
                onClick={() => onSelectProfile(prof.id)}
                className={`p-3.5 rounded-lg border text-left transition-colors flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'border-sky-500 bg-sky-500/10'
                    : `${borderClass} ${subSurfaceClass} hover:border-slate-700`
                }`}
              >
                <div>
                  <div className={`text-xs font-mono tabular-nums ${mutedText}`}>
                    {prof.role} · {prof.handle}
                  </div>
                  <div className={`text-sm font-semibold ${headingText} mt-0.5`}>{prof.name}</div>
                  <div className={`text-xs ${mutedText} mt-0.5`}>{prof.department}</div>
                </div>
                <div
                  className={`pt-2 border-t ${borderClass} flex items-center justify-between text-[11px] font-mono ${mutedText}`}
                >
                  <span>{prof.authMethod.split(' ')[0]} Auth</span>
                  <span className={isSelected ? 'text-sky-400 font-semibold' : ''}>
                    {isSelected ? 'Active Session' : 'Switch Profile'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Authentication Configuration + Real-Time Collaboration Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-6 border ${borderClass} ${surfaceClass} rounded-xl p-5 space-y-4`}>
          <div>
            <h3 className={`text-sm font-semibold ${headingText}`}>
              Dual Authentication Architecture (Offline Local + Enterprise OAuth 2.0)
            </h3>
            <p className={`text-xs ${mutedText} mt-0.5`}>
              Operate in air-gapped environments via hardware-backed Local Passkey/PIN, or connect Enterprise OAuth 2.0 / OIDC when online.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleAuthMode('Offline Local Passkey')}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                authMode === 'Offline Local Passkey'
                  ? 'bg-sky-500 text-slate-950 border-sky-500'
                  : `${borderClass} ${subSurfaceClass} ${headingText}`
              }`}
            >
              Offline Local Auth (Air-Gapped)
            </button>
            <button
              type="button"
              onClick={() => onToggleAuthMode('Enterprise OAuth 2.0')}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                authMode === 'Enterprise OAuth 2.0'
                  ? 'bg-sky-500 text-slate-950 border-sky-500'
                  : `${borderClass} ${subSurfaceClass} ${headingText}`
              }`}
            >
              Enterprise OAuth 2.0 / OIDC
            </button>
          </div>

          {authMode === 'Offline Local Passkey' ? (
            <div className={`p-4 rounded-lg border ${borderClass} ${subSurfaceClass} space-y-3 text-xs`}>
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${headingText}`}>
                  Local TPM 2.0 / Secure Enclave Ed25519 Keyring
                </span>
                <span className="font-mono text-emerald-400">
                  {localPinVerified ? 'Verified Offline' : 'Locked'}
                </span>
              </div>
              <p className={mutedText}>
                Zero internet dependency. Model weight shards and user history are unlocked locally using Argon2id + hardware-sealed passkeys.
              </p>
              <div className="flex items-center justify-between pt-2">
                <span className={`font-mono tabular-nums ${mutedText}`}>
                  Session Token: local-ed25519-89f2a0c
                </span>
                <button
                  type="button"
                  onClick={() => setLocalPinVerified(true)}
                  className="px-3 py-1 text-xs font-medium rounded border border-emerald-500/40 text-emerald-300"
                >
                  Re-Verify Local Keyring
                </button>
              </div>
            </div>
          ) : (
            <div className={`p-4 rounded-lg border ${borderClass} ${subSurfaceClass} space-y-3 text-xs`}>
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${headingText}`}>
                  Enterprise OAuth 2.1 + PKCE & DPoP Configuration
                </span>
                <span className="font-mono text-sky-400">
                  {canManageAuth ? 'Editable (Admin)' : 'Read-Only'}
                </span>
              </div>
              <div>
                <label htmlFor="oauth-client-id" className={`block text-xs ${mutedText} mb-1`}>
                  OAuth 2.0 Client ID
                </label>
                <input
                  id="oauth-client-id"
                  type="text"
                  disabled={!canManageAuth}
                  value={oauthClientId}
                  onChange={(e) => onChangeOauthClientId(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs font-mono rounded border ${borderClass} ${surfaceClass} ${headingText} disabled:opacity-50`}
                />
              </div>
              <div>
                <label htmlFor="oauth-issuer-url" className={`block text-xs ${mutedText} mb-1`}>
                  OIDC Discovery / Issuer Endpoint
                </label>
                <input
                  id="oauth-issuer-url"
                  type="text"
                  disabled={!canManageAuth}
                  value={oauthIssuerUrl}
                  onChange={(e) => onChangeOauthIssuerUrl(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs font-mono rounded border ${borderClass} ${surfaceClass} ${headingText} disabled:opacity-50`}
                />
              </div>
            </div>
          )}
        </div>

        <div className={`lg:col-span-6 border ${borderClass} ${surfaceClass} rounded-xl p-5 space-y-4`}>
          <div>
            <h3 className={`text-sm font-semibold ${headingText}`}>
              Real-Time Team Collaboration & Version Audit Stream
            </h3>
            <p className={`text-xs ${mutedText} mt-0.5`}>
              Synchronizes model forks, rollbacks, and peer review annotations across team members.
            </p>
          </div>

          <form onSubmit={handleBroadcastNote} className="flex gap-2">
            <label htmlFor="collab-note-input" className="sr-only">
              Broadcast team collaboration note
            </label>
            <input
              id="collab-note-input"
              type="text"
              value={collabNote}
              onChange={(e) => setCollabNote(e.target.value)}
              placeholder={`Post peer review or model sync note as ${activeProfile.name}...`}
              className={`flex-1 px-3 py-2 text-xs rounded-lg border ${borderClass} ${subSurfaceClass} ${headingText}`}
            />
            <button
              type="submit"
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors whitespace-nowrap shrink-0"
            >
              Broadcast Update
            </button>
          </form>

          <div className="space-y-2.5 max-h-[210px] overflow-y-auto pr-1">
            {collabEvents.map((evt) => (
              <div
                key={evt.id}
                className={`p-3 rounded-lg border ${borderClass} ${subSurfaceClass} text-xs space-y-1`}
              >
                <div
                  className={`flex items-center justify-between font-mono tabular-nums ${mutedText}`}
                >
                  <span>
                    {evt.actor} ({evt.role}) · {evt.actionType}
                  </span>
                  <span>
                    #{evt.commitHash} · {evt.timestamp}
                  </span>
                </div>
                <div className={`font-medium ${headingText}`}>{evt.summary}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RBAC Matrix Table across all 6 Predefined Roles */}
      <div className={`border ${borderClass} ${surfaceClass} rounded-xl p-5 space-y-4`}>
        <div>
          <h3 className={`text-sm font-semibold ${headingText}`}>
            Predefined RBAC Role Permission Matrix
          </h3>
          <p className={`text-xs ${mutedText}`}>
            Granular permissions across all 6 predefined enterprise roles.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b ${borderClass} text-xs ${mutedText}`}>
                <th className="py-2.5 px-3 font-medium">Protected Capability</th>
                {PREDEFINED_RBAC_ROLES.map((r) => (
                  <th
                    key={r.role}
                    className={`py-2.5 px-2.5 font-medium text-center ${
                      activeProfile.role === r.role ? 'text-sky-400 font-semibold' : ''
                    }`}
                  >
                    {r.role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-xs">
              {RBAC_ACTIONS.map((act) => (
                <tr key={act.id} className="hover:bg-slate-800/20">
                  <td className="py-2.5 px-3">
                    <div className={`font-medium ${headingText}`}>{act.label}</div>
                    <div className={`text-[11px] ${mutedText}`}>{act.description}</div>
                  </td>
                  {PREDEFINED_RBAC_ROLES.map((r) => {
                    const allowed = evaluateRbacPermission(r.role, act.id);
                    return (
                      <td
                        key={r.role}
                        className="py-2.5 px-2.5 text-center font-mono tabular-nums whitespace-nowrap"
                      >
                        <span className={allowed ? 'text-emerald-400' : 'text-slate-500'}>
                          {allowed ? 'Allowed' : 'Restricted'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
