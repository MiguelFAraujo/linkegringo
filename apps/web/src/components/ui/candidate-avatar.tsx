import React, { useState, useEffect } from 'react';

interface CandidateAvatarProps {
  publicId?: string;
  name?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  decorative?: boolean;
}

const sizeClasses: Record<'sm' | 'md' | 'lg' | 'xl', { container: string; text: string }> = {
  sm: { container: 'h-8 w-8 rounded-lg', text: 'text-xs' },
  md: { container: 'h-10 w-10 rounded-xl', text: 'text-sm' },
  lg: { container: 'h-12 w-12 rounded-xl', text: 'text-base font-semibold' },
  xl: { container: 'h-16 w-16 rounded-2xl', text: 'text-xl font-bold' },
};

const INVALID_PLACEHOLDERS = new Set(['user', 'unknown', 'candidato', 'profile', 'null', 'undefined']);
const DEMO_PLACEHOLDERS = new Set([
  'demo',
  'mock',
  'demo-candidate',
  'demo-profile',
  'candidato-demo',
  'fictional',
  'fictional-candidate',
]);

import { extractLinkedInSlug } from '@linkegringo/core';
export { extractLinkedInSlug };

export function CandidateAvatar({
  publicId,
  name,
  className = '',
  size = 'md',
  decorative,
}: CandidateAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const cleanSlug = extractLinkedInSlug(publicId);
  const isDemo = Boolean(
    publicId &&
      (DEMO_PLACEHOLDERS.has(publicId.toLowerCase()) ||
        publicId.toLowerCase().startsWith('demo-') ||
        publicId.toLowerCase().startsWith('mock-') ||
        publicId.toLowerCase().startsWith('fictional-')),
  );

  // Reset image error state if publicId changes (e.g., switching profile or loading demo)
  useEffect(() => {
    setImgError(false);
  }, [cleanSlug, isDemo]);

  let avatarUrl: string | null = null;
  if (isDemo) {
    avatarUrl = '/demo-avatar.svg';
  } else if (cleanSlug) {
    avatarUrl = `https://unavatar.io/linkedin/${encodeURIComponent(cleanSlug)}`;
  }

  const initials = (() => {
    if (!name || !name.trim()) return 'P';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  })();

  const sizing = sizeClasses[size] || sizeClasses.md;

  if (avatarUrl && !imgError) {
    return (
      <div
        className={`relative overflow-hidden flex-shrink-0 border border-slate-700/60 bg-slate-800 ${sizing.container} ${className}`}
        {...(decorative ? { 'aria-hidden': 'true' } : {})}
      >
        <img
          src={avatarUrl}
          alt={decorative ? '' : name ? `Foto de perfil de ${name}` : 'Foto de perfil'}
          role={decorative ? 'presentation' : undefined}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center flex-shrink-0 bg-slate-800/90 text-slate-200 border border-slate-700/70 select-none shadow-inner ${sizing.container} ${sizing.text} ${className}`}
      aria-label={name ? `Avatar com iniciais de ${name}` : 'Avatar do candidato'}
    >
      <span>{initials}</span>
    </div>
  );
}
