<script setup lang="ts">
import { useSubmitModal } from '@/composables/useSubmitModal'

const { open: openModal } = useSubmitModal()

interface Person {
  name: string
  url: string
}
interface Committee {
  title: string
  members: Person[]
}

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
          <h2 class="about-section__title">Purpose</h2>
          <div class="about-section__body">
            <p>
              scikit-learn Central is a community resource dedicated to serving the
              broader scientific Python and machine learning ecosystem. It's curated,
              hosted, and governed by Probabl, with contributions from the community at
              large.
            </p>
            <p>
              The catalog is open to any package that belongs to the scikit-learn
              open-source ecosystem and carries a true open-source license. Default
              rankings reflect usage signals and ecosystem fit; Probabl-maintained
              packages may appear prominently as Probabl is the steward of this resource.
            </p>
            <p>
              The use cases are curated and forward-looking, highlighting how data
              scientists are using libraries in the scikit-learn ecosystem to tackle
              real-world machine learning problems.
            </p>
          </div>
        </section>

        <section class="about-section">
          <h2 class="about-section__title">Sub-committees</h2>
          <p class="about-section__intro">
            The project is spearheaded by Probabl and organized as sub-committees.
          </p>

          <div class="committees">
            <div v-for="c in committees" :key="c.title" class="committee">
              <div class="committee__title">{{ c.title }}</div>
              <div class="committee__members">
                <a
                  v-for="m in c.members"
                  :key="m.url"
                  :href="m.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="person-card"
                >
                  <span class="person-card__name">{{ m.name }}</span>
                  <i class="fab fa-linkedin person-card__li"></i>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section class="about-section">
          <h2 class="about-section__title">Ranking Methodology</h2>
          <div class="about-section__body">
            <p>
              Each ecosystem package is assigned a <strong>Fit Score</strong> (0–100)
              displayed as a chip in the top-right corner of its card. The score
              combines four deterministic signals; their weights come from
              <a
                href="https://sarahnadi.org/assets/pdf/pubs/NadiSakrEMSE2022.pdf"
                target="_blank"
                rel="noopener"
              >Nadi &amp; Sakr (EMSE 2022)</a>, a 90-participant survey of data
              scientists ranking the factors that drive their library choices.
              Each weight is the paper's reported percentage of respondents who
              rated that factor as a moderate-or-high influence.
            </p>

            <div class="ranking-methodology">
              <div class="ranking-method-row">
                <div class="ranking-method-icon"><i class="fas fa-book"></i></div>
                <div class="ranking-method-detail">
                  <div class="ranking-method-name">
                    Docs <span class="ranking-method-weight">17.9 %</span>
                  </div>
                  <div class="ranking-method-desc">
                    Editorially curated — how many of three documentation pillars
                    the package ships: <strong>getting started</strong>,
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
                    when the project publishes there. Falls back to a manually
                    curated value, then to a flat 50 if a tests/ directory exists,
                    otherwise 0. Tracks the paper's <em>well tested</em> factor
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
                    Freshness of the latest commit and the latest release, combined
                    via an <strong>exponential decay</strong> with a 180-day
                    half-life (1-week-old commit ≈ 97; 6-month-old ≈ 50; 2-year-old
                    ≈ 13). Tracks the paper's <em>community activeness</em> factor
                    (rank 4).
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
                    Average of <strong>log-normalised stars and forks</strong>.
                    Stars proxy general repo visibility; forks proxy contributor
                    base. Tracks <em>community experience</em> (rank 7) — the
                    paper finds DS rely on community signals far more than
                    developers do.
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
                    Monthly PyPI download count on a <strong>logarithmic
                    scale</strong>. The paper finds popularity is still valued by
                    DS but ranked lower (rank 11) — so it carries the smallest
                    weight in the score.
                  </div>
                </div>
              </div>
            </div>

            <p class="ranking-formula">
              <strong>Fit Score</strong> = 0.179 · Docs + 0.179 · Testing
              + 0.177 · Fitness + 0.172 · Activity
              + 0.156 · Community + 0.138 · Adoption
            </p>
            <p>
              Fitness, Activity, Community, Adoption, and Testing read from
              <code>data/stats.json</code>, refreshed daily by a GitHub Action
              that pulls live data from GitHub, PyPI, codecov, and coveralls.
              Fitness also reads the curated use-case index in
              <code>data/use-cases.json</code>. Testing prefers the auto-fetched
              codecov number, then falls back to coveralls, then to a manually
              curated value in <code>data/packages/*.json</code>, then to a flat
              50 when a tests/ directory exists. Docs is the only axis that is
              purely editorial per-package (three booleans for getting-started,
              API reference, and narrative guide). Missing values score 0. The
              catalog is deliberately neutral — scikit-learn core is excluded
              from the normalisation pool since it is displayed separately as
              the ecosystem foundation.
            </p>
          </div>
        </section>

        <div class="about-cta">
          <p class="about-cta__text">
            Have a suggestion, spotted a missing package, or want to propose a new use
            case? We'd love to hear from you.
          </p>
          <button class="btn btn--primary" @click="openModal('feedback')">
            <i class="fas fa-plus"></i> Submit Feedback
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
