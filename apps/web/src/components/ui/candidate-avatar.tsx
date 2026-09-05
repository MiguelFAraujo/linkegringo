import React, { useState } from 'react';

interface CandidateAvatarProps {
  publicId?: string;
  name?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses: Record<'sm' | 'md' | 'lg' | 'xl', { container: string; text: string }> = {
  sm: { container: 'h-8 w-8 rounded-lg', text: 'text-xs' },
  md: { container: 'h-10 w-10 rounded-xl', text: 'text-sm' },
  lg: { container: 'h-12 w-12 rounded-xl', text: 'text-base font-semibold' },
  xl: { container: 'h-16 w-16 rounded-2xl', text: 'text-xl font-bold' },
};

export function CandidateAvatar({
  publicId,
  name,
  className = '',
  size = 'md',
}: CandidateAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const cleanSlug = publicId
    ?.trim()
    .replace(/^https?:\/\/(?:www\.)?linkedin\.com\/in\//i, '')
    .replace(/\/+$/, '');

  const avatarUrl = cleanSlug ? `https://unavatar.io/linkedin/${encodeURIComponent(cleanSlug)}` : null;

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
      >
        <img
          src={avatarUrl}
          alt={name ? `Foto de perfil de ${name}` : 'Foto de perfil'}
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
