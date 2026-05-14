export interface ReleaseHighlight {
  text: string
  github_issue_url?: string | null
  reaction_count?: number | null
}

export interface ReleaseBlogPost {
  url: string
  title: string
  author: string
  date: string
}

export interface ReleaseStats {
  tag_counts: {
    major_feature?: number
    feature?: number
    efficiency?: number
    enhancement?: number
    fix?: number
    api_change?: number
  }
  contributor_count?: number
}

export interface Release {
  version: string
  label?: string
  date: string | null
  github_url?: string | null
  release_notes_url?: string | null
  highlights: Array<ReleaseHighlight | string>
  blog_posts?: ReleaseBlogPost[]
  stats?: ReleaseStats
}

export interface ReleasesFile {
  meta: {
    version: string
    updated: string
    [k: string]: unknown
  }
  releases: Release[]
}
