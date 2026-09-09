import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CandidateAvatar, extractLinkedInSlug } from './candidate-avatar';

describe('extractLinkedInSlug', () => {
  it('extracts plain slug directly for real users', () => {
    expect(extractLinkedInSlug('pedro-dev')).toBe('pedro-dev');
  });

  it('strips full LinkedIn URLs with https and www', () => {
    expect(extractLinkedInSlug('https://www.linkedin.com/in/pedro-dev/')).toBe('pedro-dev');
  });

  it('strips localized LinkedIn URLs like br.linkedin.com and pt.linkedin.com', () => {
    expect(extractLinkedInSlug('https://br.linkedin.com/in/tiago-santos')).toBe('tiago-santos');
    expect(extractLinkedInSlug('http://pt.linkedin.com/in/joana-silva/')).toBe('joana-silva');
  });

  it('strips query parameters and URL fragments', () => {
    expect(extractLinkedInSlug('https://www.linkedin.com/in/maria-souza?locale=en_US#experience')).toBe('maria-souza');
    expect(extractLinkedInSlug('carlos-eng?trk=profile-badge')).toBe('carlos-eng');
  });

  it('filters out fallback sentinel values like unknown and user', () => {
    expect(extractLinkedInSlug('unknown')).toBeNull();
    expect(extractLinkedInSlug('user')).toBeNull();
    expect(extractLinkedInSlug('candidato')).toBeNull();
    expect(extractLinkedInSlug('')).toBeNull();
    expect(extractLinkedInSlug(undefined)).toBeNull();
  });

  it('filters out demo and mock prefixes to prevent querying real LinkedIn profiles', () => {
    expect(extractLinkedInSlug('demo-candidate')).toBeNull();
    expect(extractLinkedInSlug('demo')).toBeNull();
    expect(extractLinkedInSlug('mock-user')).toBeNull();
    expect(extractLinkedInSlug('fictional-candidate')).toBeNull();
  });
});

describe('CandidateAvatar Component', () => {
  it('renders fictional demo avatar SVG when publicId is a demo candidate', () => {
    render(<CandidateAvatar publicId="demo-candidate" name="Alexandre Rocha" size="md" />);

    const img = screen.getByRole('img');
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe('/demo-avatar.svg');
    expect(img.getAttribute('alt')).toBe('Foto de perfil de Alexandre Rocha');
  });

  it('renders image tag pointing to unavatar when valid real user publicId is provided', () => {
    render(<CandidateAvatar publicId="pedro-dev" name="Pedro Dev" size="md" />);

    const img = screen.getByRole('img');
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe('https://unavatar.io/linkedin/pedro-dev');
    expect(img.getAttribute('alt')).toBe('Foto de perfil de Pedro Dev');
  });

  it('renders initials fallback when publicId is "unknown" or "user"', () => {
    const { rerender } = render(<CandidateAvatar publicId="unknown" name="Ana Paula Silva" size="lg" />);

    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('AS')).toBeDefined();

    rerender(<CandidateAvatar publicId="user" name="Alexandre Rocha" size="lg" />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('AR')).toBeDefined();
  });

  it('derives initials correctly for 1-word, 2-word, and multi-word names', () => {
    const { rerender } = render(<CandidateAvatar name="Madonna" />);
    expect(screen.getByText('MA')).toBeDefined();

    rerender(<CandidateAvatar name="Tiago Santos" />);
    expect(screen.getByText('TS')).toBeDefined();

    rerender(<CandidateAvatar name="João Carlos de Oliveira Santos" />);
    expect(screen.getByText('JS')).toBeDefined();

    rerender(<CandidateAvatar name="" />);
    expect(screen.getByText('P')).toBeDefined();
  });

  it('falls back gracefully to initials when image loading fails', () => {
    render(<CandidateAvatar publicId="non-existent-user-123" name="Carlos Dev" />);

    const img = screen.getByRole('img');
    expect(img).toBeDefined();

    // Trigger onError
    fireEvent.error(img);

    // Image should be removed and initials rendered
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('CD')).toBeDefined();
  });

  it('resets image error state when publicId prop changes', () => {
    const { rerender } = render(<CandidateAvatar publicId="broken-id" name="Carlos Dev" />);

    const img = screen.getByRole('img');
    fireEvent.error(img);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('CD')).toBeDefined();

    // Re-render with new valid publicId
    rerender(<CandidateAvatar publicId="new-valid-id" name="Carlos Dev" />);
    const newImg = screen.getByRole('img');
    expect(newImg).toBeDefined();
    expect(newImg.getAttribute('src')).toBe('https://unavatar.io/linkedin/new-valid-id');
  });
});
