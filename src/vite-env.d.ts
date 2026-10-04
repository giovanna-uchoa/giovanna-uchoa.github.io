/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string
  readonly VITE_APP_TITLE?: string
  // Optional one-line bio shown under the name in the sidebar.
  readonly VITE_APP_BIO?: string
  readonly VITE_GITHUB_OWNER?: string
  readonly VITE_GITHUB_REPO?: string
  readonly VITE_GITHUB_BRANCH?: string
}
