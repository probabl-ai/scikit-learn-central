<script setup lang="ts">
import { useSubmitModal } from '@/composables/useSubmitModal'

interface Person {
  name: string
  url: string
}
interface Committee {
  title: string
  members: Person[]
}

const { open: openModal } = useSubmitModal()

const committees: Committee[] = [
  {
    title: 'Scientific & Library Guidance',
    members: [
      { name: 'Gaël Varoquaux', url: 'https://www.linkedin.com/in/gael-varoquaux-a8391411' },
      { name: 'Olivier Grisel', url: 'https://www.linkedin.com/in/oliviergrisel/' },
      { name: 'Guillaume Lemaitre', url: 'https://linkedin.com/in/guillaume-lemaitre-b9404939' },
    ],
  },
  {
    title: 'Use Case Curation',
    members: [
      { name: 'François Goupil', url: 'https://www.linkedin.com/in/fran%C3%A7ois-goupil/' },
      { name: 'David Arturo Amor Quiroz', url: 'https://www.linkedin.com/in/david-arturo-amor-quiroz/' },
      { name: 'Fabien Pesquerel', url: 'https://www.linkedin.com/in/fabien-pesquerel-73515a124/' },
    ],
  },
  {
    title: 'Ecosystem & Mission Alignment',
    members: [
      { name: 'Yann Lechelle', url: 'https://www.linkedin.com/in/ylechelle/' },
      { name: 'Cailean Osborne', url: 'https://www.linkedin.com/in/caileanosborne/' },
    ],
  },
]
</script>

<template>
  <div id="view-about" class="view" role="tabpanel" aria-label="About scikit-learn Central">
    <div class="page-content">
      <div class="about-page">
        <section class="about-section">
          <h2 class="title">Purpose</h2>
          <div class="body">
            <p>
              scikit-learn Central is a community resource dedicated to serving the
              broader scientific Python and machine learning ecosystem. It's curated,
              hosted, and governed by Probabl, with contributions from the community at
              large.
            </p>
            <p>
              The catalog is open to any package that belongs to the scikit-learn
              open-source ecosystem and carries a true open-source license. A small set of
              <strong>featured packages</strong> is highlighted on the catalog page by the
              editors; everywhere else, default ordering uses a <strong>Fit Score</strong>
              derived from usage signals and ecosystem fit.
            </p>
            <p>
              The use cases are curated and forward-looking, highlighting how data
              scientists are using libraries in the scikit-learn ecosystem to tackle
              real-world machine learning problems.
            </p>
          </div>
        </section>

        <section class="about-section">
          <h2 class="title">Sub-committees</h2>
          <p class="intro">
            The project is spearheaded by Probabl and organized as sub-committees.
          </p>

          <div class="committees">
            <div v-for="c in committees" :key="c.title" class="committee">
              <div class="committee-title">{{ c.title }}</div>
              <div class="committee-members">
                <a
                  v-for="m in c.members"
                  :key="m.url"
                  :href="m.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="person-card"
                >
                  <span class="person-name">{{ m.name }}</span>
                  <i class="fab fa-linkedin person-li"></i>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="ranking-methodology" class="about-section">
          <h2 class="title">Ranking Methodology</h2>
          <div class="body">
            <p>
              Each ecosystem package is assigned a <strong>Fit Score</strong> (0–100)
              displayed as a chip in the top-right corner of its card. The score
              combines six deterministic signals; their weights come from
              <a
                href="https://sarahnadi.org/assets/pdf/pubs/NadiSakrEMSE2022.pdf"
                target="_blank"
                rel="noopener"
              >Nadi &amp; Sakr (EMSE 2022)</a>, a 90-participant survey of data
              scientists ranking the factors that drive their library choices. Each
              weight is the paper's reported percentage of respondents who rated that
              factor as a moderate-or-high influence.
            </p>

            <div class="ranking-methodology">
              <div class="ranking-method-row">
                <div class="ranking-method-icon"><i class="fas fa-book"></i></div>
                <div class="ranking-method-detail">
                  <div class="ranking-method-name">
                    Docs <span class="ranking-method-weight">17.9 %</span>
                  </div>
                  <div class="ranking-method-desc">
                    Editorially curated — how many of three documentation pillars the
                    package ships: <strong>getting started</strong>,
                    <strong>API reference</strong>, and a
                    <strong>narrative guide</strong>. Tracks the paper's
                    <em>documentation</em> factor (rank 2).
                  </div>
                </div>
              </div>

              <div class="ranking-method-row">
                <div class="ranking-method-icon"><i class="fas fa-flask"></i></div>
                <div class="ranking-method-detail">
                  <div class="ranking-method-name">
                    Testing <span class="ranking-method-weight">17.9 %</span>
                  </div>
                  <div class="ranking-method-desc">
                    Coverage % auto-fetched daily from
                    <a href="https://codecov.io" target="_blank" rel="noopener">codecov.io</a>
                    when the project publishes there. Falls back to coveralls, then to
                    a manually curated value, then to a flat 50 if a tests/ directory
                    exists, otherwise 0. Tracks the paper's <em>well tested</em> factor
                    (rank 17 by combined moderate+high influence).
                  </div>
                </div>
              </div>

              <div class="ranking-method-row">
                <div class="ranking-method-icon"><i class="fas fa-lightbulb"></i></div>
                <div class="ranking-method-detail">
                  <div class="ranking-method-name">
                    Fitness <span class="ranking-method-weight">17.7 %</span>
                  </div>
                  <div class="ranking-method-desc">
                    Number of curated use cases in which the package appears, on a
                    <strong>linear scale</strong>. Tracks the paper's
                    <em>fit for purpose</em> factor (rank 3 — the biggest gap vs.
                    software developers, since DS care about task-level fit, not
                    API coverage).
                  </div>
                </div>
              </div>

              <div class="ranking-method-row">
                <div class="ranking-method-icon"><i class="fas fa-bolt"></i></div>
                <div class="ranking-method-detail">
                  <div class="ranking-method-name">
                    Activity <span class="ranking-method-weight">17.2 %</span>
                  </div>
                  <div class="ranking-method-desc">
                    Freshness of the latest commit and the latest release, combined via
                    an <strong>exponential decay</strong> with a 180-day half-life
                    (1-week-old commit ≈ 97; 6-month-old ≈ 50; 2-year-old ≈ 13).
                    Tracks the paper's <em>community activeness</em> factor (rank 4).
                  </div>
                </div>
              </div>

              <div class="ranking-method-row">
                <div class="ranking-method-icon"><i class="fas fa-code-branch"></i></div>
                <div class="ranking-method-detail">
                  <div class="ranking-method-name">
                    Community <span class="ranking-method-weight">15.6 %</span>
                  </div>
                  <div class="ranking-method-desc">
                    Average of <strong>log-normalised stars and forks</strong>. Stars
                    proxy general repo visibility; forks proxy contributor base. Tracks
                    <em>community experience</em> (rank 7) — the paper finds DS rely on
                    community signals far more than developers do.
                  </div>
                </div>
              </div>

              <div class="ranking-method-row">
                <div class="ranking-method-icon"><i class="fas fa-download"></i></div>
                <div class="ranking-method-detail">
                  <div class="ranking-method-name">
                    Adoption <span class="ranking-method-weight">13.8 %</span>
                  </div>
                  <div class="ranking-method-desc">
                    Monthly PyPI download count on a <strong>logarithmic scale</strong>.
                    The paper finds popularity is still valued by DS but ranked lower
                    (rank 11), so it carries the smallest weight in the score.
                  </div>
                </div>
              </div>
            </div>

            <p class="ranking-formula">
              <span
                class="ranking-formula-math"
                aria-label="Fit Score equals 0.179 times Docs plus 0.179 times Testing plus 0.177 times Fitness plus 0.172 times Activity plus 0.156 times Community plus 0.138 times Adoption"
              >
                <span class="math-lhs"
                  ><span class="math-ident">Fit Score</span
                  ><span class="math-rel">=</span></span
                >
                <span class="math-group">
                  <span class="math-paren">(</span>
                  <span class="math-term"
                    ><span class="math-num">0.179</span
                    ><span class="math-op">·</span
                    ><span class="math-var">Docs</span></span
                  >
                  <span class="math-plus">+</span>
                  <span class="math-term"
                    ><span class="math-num">0.179</span
                    ><span class="math-op">·</span
                    ><span class="math-var">Testing</span></span
                  >
                  <span class="math-paren">)</span>
                </span>

                <span class="math-lhs"><span class="math-plus">+</span></span>
                <span class="math-group">
                  <span class="math-paren">(</span>
                  <span class="math-term"
                    ><span class="math-num">0.177</span
                    ><span class="math-op">·</span
                    ><span class="math-var">Fitness</span></span
                  >
                  <span class="math-plus">+</span>
                  <span class="math-term"
                    ><span class="math-num">0.172</span
                    ><span class="math-op">·</span
                    ><span class="math-var">Activity</span></span
                  >
                  <span class="math-paren">)</span>
                </span>

                <span class="math-lhs"><span class="math-plus">+</span></span>
                <span class="math-group">
                  <span class="math-paren">(</span>
                  <span class="math-term"
                    ><span class="math-num">0.156</span
                    ><span class="math-op">·</span
                    ><span class="math-var">Community</span></span
                  >
                  <span class="math-plus">+</span>
                  <span class="math-term"
                    ><span class="math-num">0.138</span
                    ><span class="math-op">·</span
                    ><span class="math-var">Adoption</span></span
                  >
                  <span class="math-paren">)</span>
                </span>
              </span>
            </p>
            <p>
              Fitness, Activity, Community, Adoption, and Testing draw on public
              signals we refresh on a regular schedule from upstream sources such as
              repository activity, package indexes, and published test-coverage
              metrics. Fitness also incorporates our curated use-case index. Docs is
              the only axis assessed editorially per package (getting-started
              material, API reference, and a narrative guide). Missing values score 0.
              The catalog is deliberately neutral — scikit-learn core is excluded from
              the normalisation pool since it is displayed separately as the ecosystem
              foundation.
            </p>
          </div>
        </section>

        <div class="about-cta">
          <p class="cta-text">
            Have a suggestion, spotted a missing package, or want to propose a new use
            case? We'd love to hear from you.
          </p>
          <button class="btn btn--primary" type="button" @click="openModal('feedback')">
            <i class="fas fa-plus"></i> Submit Feedback
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-page {
  max-width: 760px;
  margin: 0 auto;
  padding: var(--space-10) var(--space-4) var(--space-16);
}

.about-section {
  margin-bottom: var(--space-12);
}

.about-section .title {
  font-family: var(--font-serif);
  font-size: 28px;
  font-weight: 300;
  color: var(--text-primary);
  margin-bottom: var(--space-5);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
  letter-spacing: var(--tracking-tight);
  line-height: 1.1;
}

.about-section .intro {
  color: var(--text-secondary);
  line-height: 1.75;
  margin-bottom: var(--space-7);
}

.about-section .body p {
  color: var(--text-secondary);
  line-height: 1.75;
  margin-bottom: var(--space-4);
  font-size: var(--text-base);
}

.about-section .body p:last-child {
  margin-bottom: 0;
}

.committees {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.committee {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
}

.committee-title {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: var(--tracking-widest);
  color: var(--text-muted);
  margin-bottom: var(--space-3);
}

.committee-members {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.person-card {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--bg-page);
  border: 1.5px solid var(--border-default);
  border-radius: var(--radius-full);
  text-decoration: none;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.person-card:hover {
  border-color: var(--social-linkedin);
  background: var(--social-linkedin-bg);
}

.person-name {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.person-li {
  color: var(--social-linkedin);
  font-size: 15px;
}

.about-cta {
  border-top: 1px solid var(--border-subtle);
  padding-top: var(--space-10);
  text-align: center;
}

.about-cta .cta-text {
  color: var(--text-muted);
  margin-bottom: var(--space-5);
  font-size: var(--text-base);
  line-height: 1.6;
}

.ranking-methodology {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: var(--space-6) 0;
}

.ranking-method-row {
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
}

.ranking-method-icon {
  font-size: 1.4rem;
  line-height: 1;
  flex-shrink: 0;
  width: 28px;
  text-align: center;
  padding-top: 2px;
}

.ranking-method-detail {
  flex: 1;
}

.ranking-method-name {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--color-near-black);
  margin-bottom: var(--space-1);
}

.ranking-method-weight {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-orange);
  margin-left: 4px;
}

.ranking-method-desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.65;
}

.ranking-formula {
  background: var(--bg-primary);
  color: var(--text-inverse);
  padding: var(--space-5) var(--space-5);
  border-radius: var(--radius-md);
  margin: var(--space-4) 0;
  display: flex;
  justify-content: center;
  overflow-x: auto;
}

.ranking-formula-math {
  display: grid;
  grid-template-columns: auto auto;
  column-gap: 0.4em;
  row-gap: 0.35em;
  align-items: baseline;
  font-family: var(--font-serif);
  font-size: clamp(0.9rem, 1.4vw, 1.15rem);
  line-height: 1.45;
  letter-spacing: 0.01em;
}

.math-lhs {
  display: inline-flex;
  align-items: baseline;
  justify-content: flex-end;
  white-space: nowrap;
}

.math-group {
  display: inline-flex;
  align-items: baseline;
  white-space: nowrap;
}

.math-ident {
  font-style: normal;
  font-weight: 500;
  color: var(--text-inverse);
}

.math-rel {
  font-style: normal;
  color: var(--text-inverse);
  padding: 0 0.35em;
}

.math-plus {
  font-style: normal;
  color: var(--text-inverse);
  padding: 0 0.3em;
}

.math-paren {
  font-style: normal;
  color: var(--text-inverse);
  font-size: 1.25em;
  line-height: 1;
  transform: translateY(0.06em);
}

.math-term {
  display: inline-flex;
  align-items: baseline;
  padding: 0 0.05em;
}

.math-num {
  font-style: normal;
  font-variant-numeric: tabular-nums;
  color: var(--text-inverse);
}

.math-op {
  font-style: normal;
  color: var(--text-inverse);
  padding: 0 0.12em;
}

.math-var {
  font-style: italic;
  color: var(--color-orange);
}
</style>
