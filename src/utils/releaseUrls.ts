/** whats_new page shared by all patches on the same minor line */
export function releaseChangelogPageUrl(version: string): string {
  const [major, minor] = version.split('.')
  return `https://scikit-learn.org/stable/whats_new/v${major}.${minor}.html`
}

/** Deep link to the version section on the whats_new page */
export function releaseChangelogAnchorUrl(version: string): string {
  const parts = version.split('.')
  const [major, minor, patch] = parts
  const page = releaseChangelogPageUrl(version)
  if (patch && patch !== '0') {
    return `${page}#version-${parts.join('-')}`
  }
  return `${page}#release-notes-${major}-${minor}`
}
