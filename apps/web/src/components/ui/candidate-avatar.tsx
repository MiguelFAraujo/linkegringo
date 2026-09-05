import React, { useState, useEffect } from 'react';

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

const INVALID_PLACEHOLDERS = new Set(['user', 'unknown', 'candidato', 'profile', 'null', 'undefined']);

/**
 * Extracts and cleans a LinkedIn username/slug from a raw publicId or full URL.
 * Returns null if the value is missing, empty, or a LinkeGringo fallback sentinel.
 */
export function extractLinkedInSlug(raw?: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  let slug = raw.trim();
  if (!slug) return null;

  // Strip query parameters and URL fragments
  slug = slug.replace(/[?#].*$/, '');

  // Strip full URL protocols and localized LinkedIn domains (e.g., https://br.linkedin.com/in/)
  slug = slug.replace(/^(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\//i, '');
  slug = slug.replace(/^\/?in\//i, '');
  slug = slug.replace(/^@/, '');
  slug = slug.replace(/\/+$/, '').trim();

  if (!slug || INVALID_PLACEHOLDERS.has(slug.toLowerCase())) {
    return null;
  }

  return slug;
}

export function CandidateAvatar({
  publicId,
  name,
  className = '',
  size = 'md',
}: CandidateAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const cleanSlug = extractLinkedInSlug(publicId);

  // Reset image error state if publicId changes (e.g., switching profile or loading demo)
  useEffect(() => {
    setImgError(false);
  }, [cleanSlug]);

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
