// File: avatar.tsx — avatar de usuario (foto o iniciales)
import { initials } from '@/lib/zaire-ops/profiles';

interface AvatarLike { full_name?: string | null; avatar_url?: string | null; email?: string | null }

export default function Avatar({ profile, size = 30 }: { profile: AvatarLike; size?: number }) {
  if (profile.avatar_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={profile.avatar_url} alt="" className="zo-avatar" style={{ width: size, height: size }} />;
  }
  return (
    <span className="zo-avatar zo-avatar-fallback" style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}>
      {initials(profile.full_name, profile.email)}
    </span>
  );
}
