import Avatar from '@mui/material/Avatar';
import { headingFont } from '../../theme/muiTheme';

const appName = import.meta.env.VITE_APP_NAME ?? '';
const githubOwner = import.meta.env.VITE_GITHUB_OWNER;

function initialsOf(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]);
  return (letters.length > 1 ? letters[0] + letters[letters.length - 1] : letters[0] ?? '').toUpperCase();
}

interface ProfileAvatarProps {
  size: number;
}

// The GitHub profile photo; MUI falls back to the initials if it fails to load.
function ProfileAvatar({ size }: ProfileAvatarProps) {
  return (
    <Avatar
      src={githubOwner ? `https://github.com/${githubOwner}.png?size=${size * 2}` : undefined}
      alt=""
      sx={{
        width: size,
        height: size,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        fontFamily: headingFont,
        fontWeight: 600,
        fontSize: size * 0.38,
      }}
    >
      {initialsOf(appName)}
    </Avatar>
  );
}

export default ProfileAvatar;
