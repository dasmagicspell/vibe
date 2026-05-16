export function getAppVersion(): string {
  return import.meta.env.VITE_APP_VERSION
}

/** Format an ISO build timestamp for display (e.g. "May 16, 2026"). */
export function formatAppBuildDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function getAppBuildDate(): string {
  return formatAppBuildDate(import.meta.env.VITE_APP_BUILD_DATE)
}
