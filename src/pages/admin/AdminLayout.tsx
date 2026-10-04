import { useEffect, useMemo, useState, type SyntheticEvent } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Skeleton from '@mui/material/Skeleton'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Alert from '@mui/material/Alert'
import AdminHeader from '../../components/admin/AdminHeader'
import LoginDialog from '../../components/admin/LoginDialog'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import { useCmsContent } from '../../utils/useCmsContent'
import { getStoredToken, clearStoredToken, validateToken } from '../../utils/githubAuth'
import type { GitHubUser } from '../../utils/githubAuth'
import type { Post, Subject, Tag, TagSummary } from '../../utils/dataTypes'
import {
  ADMIN_DASHBOARD_PATH,
  ADMIN_SUBJECTS_PATH,
  ADMIN_POSTS_PATH,
  ADMIN_TAGS_PATH,
} from './adminSections'

export interface AdminOutletContext {
  subjects: Subject[]
  posts: Post[]
  tags: Tag[]
  tagSummary: TagSummary[]
  reload: () => Promise<void>
  setStatus: (status: string | null) => void
  setStatusType: (type: 'success' | 'error') => void
  registerDirty: (dirty: boolean) => void
}

const SECTIONS = [
  { label: 'Dashboard', value: ADMIN_DASHBOARD_PATH },
  { label: 'Subjects', value: ADMIN_SUBJECTS_PATH },
  { label: 'Posts', value: ADMIN_POSTS_PATH },
  { label: 'Tags', value: ADMIN_TAGS_PATH },
]

function getActiveSection(pathname: string): string {
  const match = SECTIONS.slice(1).find((section) => pathname.startsWith(section.value))
  return match?.value ?? ADMIN_DASHBOARD_PATH
}

const STATUS_AUTO_DISMISS_MS = 4000

function AdminLayout() {
  const { subjects, posts, tags, tagSummary, loading, error, reload } = useCmsContent({ allLanguages: true })
  const location = useLocation()
  const navigate = useNavigate()

  const [authUser, setAuthUser] = useState<GitHubUser | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)
  const [authStatus, setAuthStatus] = useState<string | null>(null)
  const [authStatusType, setAuthStatusType] = useState<'success' | 'error'>('success')
  const [status, setStatus] = useState<string | null>(null)
  const [statusType, setStatusType] = useState<'success' | 'error'>('success')
  const [isDirty, setIsDirty] = useState(false)
  const [pendingNav, setPendingNav] = useState<string | null>(null)

  useEffect(() => {
    const token = getStoredToken()
    if (!token) return

    validateToken(token)
      .then(setAuthUser)
      .catch(() => {
        clearStoredToken()
        setAuthUser(null)
      })
  }, [])

  useEffect(() => {
    if (!status || statusType !== 'success') return
    const timer = setTimeout(() => setStatus(null), STATUS_AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [status, statusType])

  useEffect(() => {
    if (!isDirty) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const handleLogout = () => {
    clearStoredToken()
    setAuthUser(null)
    setAuthStatusType('success')
    setAuthStatus('Logged out successfully.')
  }

  const isAuthenticated = Boolean(authUser)
  const activeSection = getActiveSection(location.pathname)

  const handleSectionChange = (_event: SyntheticEvent, value: string) => {
    if (value === activeSection) return
    if (isDirty) {
      setPendingNav(value)
      return
    }
    navigate(value)
  }

  const outletContext = useMemo<AdminOutletContext>(
    () => ({
      subjects,
      posts,
      tags,
      tagSummary,
      reload,
      setStatus,
      setStatusType,
      registerDirty: setIsDirty,
    }),
    [subjects, posts, tags, tagSummary, reload]
  )

  return (
    <Box
      component="main"
      sx={{
        maxWidth: '1200px',
        mx: 'auto',
        px: { xs: 2, sm: 3 },
        py: { xs: 4, sm: 6 },
      }}
    >
      <Stack
        spacing={3}
        sx={{
          justifyContent: isAuthenticated ? 'flex-start' : 'center',
          transition: 'all 240ms ease',
        }}
      >
        <AdminHeader
          user={authUser}
          onLoginClick={() => setLoginOpen(true)}
          onLogout={handleLogout}
          status={authStatus}
          statusType={authStatusType}
          error={error}
          mode={isAuthenticated ? 'default' : 'hero'}
        />

        <LoginDialog
          open={loginOpen}
          onClose={() => setLoginOpen(false)}
          onSuccess={(user) => {
            setAuthUser(user)
            setAuthStatusType('success')
            setAuthStatus('Logged in successfully.')
          }}
        />

        {isAuthenticated && (
          loading ? (
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Skeleton variant="rounded" height={110} sx={{ flex: 1 }} />
                <Skeleton variant="rounded" height={110} sx={{ flex: 1 }} />
                <Skeleton variant="rounded" height={110} sx={{ flex: 1 }} />
              </Stack>
              <Skeleton variant="rounded" height={72} />
              <Skeleton variant="rounded" height={72} />
              <Skeleton variant="rounded" height={72} />
            </Stack>
          ) : (
            <>
              <Tabs value={activeSection} onChange={handleSectionChange} aria-label="Admin sections">
                {SECTIONS.map((section) => (
                  <Tab key={section.value} label={section.label} value={section.value} />
                ))}
              </Tabs>

              {status && (
                <Alert severity={statusType} onClose={() => setStatus(null)}>
                  {status}
                </Alert>
              )}

              <Outlet context={outletContext} />
            </>
          )
        )}

        <ConfirmDialog
          open={pendingNav !== null}
          title="Discard unsaved changes?"
          description="You have unsaved changes in this form. Leaving now will discard them."
          confirmLabel="Discard"
          onConfirm={() => {
            const next = pendingNav
            setPendingNav(null)
            setIsDirty(false)
            if (next) navigate(next)
          }}
          onCancel={() => setPendingNav(null)}
        />
      </Stack>
    </Box>
  )
}

export default AdminLayout
