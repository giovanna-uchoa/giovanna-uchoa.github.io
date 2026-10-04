import { useMemo } from 'react';
import { Archive, BookOpen, Hash, Home, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageProvider';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function useNavItems(): NavItem[] {
  const { t } = useLanguage();

  return useMemo(
    () => [
      { label: t('nav.home'), href: '/', icon: Home },
      { label: t('nav.archives'), href: '/archives', icon: Archive },
      { label: t('nav.subjects'), href: '/catalog', icon: BookOpen },
      { label: t('nav.tags'), href: '/tags', icon: Hash },
    ],
    [t]
  );
}
