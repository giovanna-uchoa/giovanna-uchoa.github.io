import Box from '@mui/material/Box';
import { monoFont } from '../../theme/muiTheme';
import type { Language } from '../../utils/dataTypes';
import { useLanguage } from '../../i18n/LanguageProvider';

const OPTIONS: { value: Language; label: string; name: string }[] = [
  { value: 'pt', label: 'PT', name: 'Português' },
  { value: 'en', label: 'EN', name: 'English' },
];

function LanguageSwitch() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <Box
      role="group"
      aria-label={t('shell.language')}
      sx={{ display: 'inline-flex', alignItems: 'center' }}
    >
      {OPTIONS.map((option, index) => {
        const selected = option.value === language;
        return (
          <Box key={option.value} sx={{ display: 'inline-flex', alignItems: 'center' }}>
            {index > 0 && (
              <Box component="span" aria-hidden="true" sx={{ color: 'text.disabled' }}>
                /
              </Box>
            )}
            <Box
              component="button"
              type="button"
              lang={option.value}
              aria-label={option.name}
              aria-pressed={selected}
              onClick={() => setLanguage(option.value)}
              sx={(theme) => ({
                minWidth: 40,
                height: 40,
                border: 0,
                borderRadius: 1,
                background: 'transparent',
                cursor: 'pointer',
                fontFamily: monoFont,
                fontSize: '0.8125rem',
                fontWeight: selected ? 600 : 400,
                color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
                '&:hover': { color: theme.palette.primary.main },
                '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}` },
              })}
            >
              {option.label}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

export default LanguageSwitch;
