import { ref, type Ref } from 'vue'
import releasesJson from '@data/releases/scikit-learn.json'
import type { Release, ReleasesFile } from '@/types/release'

const data = releasesJson as unknown as ReleasesFile

/** Numeric version-tuple compare; "future" always sorts first. */
function compareVersions(a: Release, b: Release): number {
  if (a.version === 'future') return -1
  if (b.version === 'future') return 1
  const pa = a.version.split('.').map((n) => parseInt(n, 10) || 0)
  const pb = b.version.split('.').map((n) => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pb[i] ?? 0) - (pa[i] ?? 0)
    if (diff) return diff
  }
  return 0
}

const sortedReleases: Ref<Release[]> = ref(
  [...data.releases].sort(compareVersions),
)

/** Count of non-future releases (used for the tab badge). */
const releaseCount: Ref<number> = ref(
  data.releases.filter((r) => r.version !== 'future').length,
)

export function useReleases() {
  return {
    releases: sortedReleases,
    releaseCount,
  }
}
