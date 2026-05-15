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

        <section class="about-section">
          <h2 class="title">Ranking Methodology</h2>
          <div class="body">
            <p>
              Each ecosystem package is assigned a <strong>Fit Score</strong> (0–100)
              displayed as a chip in the top-right corner of its card. Hovering over the
              chip reveals the three underlying sub-scores.
            </p>

            <div class="ranking-methodology">
              <div class="ranking-method-row">
                <div class="ranking-method-icon"><i class="fas fa-star"></i></div>
                <div class="ranking-method-detail">
                  <div class="ranking-method-name">
                    Stars <span class="ranking-method-weight">⅓</span>
                  </div>
                  <div class="ranking-method-desc">
                    GitHub star count on a <strong>logarithmic scale</strong>. The
                    package with the most stars in the catalog scores 100%; others are
                    normalised relative to that maximum. The log scale dampens the
                    outsized effect of very popular packages.
                  </div>
                </div>
              </div>

              <div class="ranking-method-row">
                <div class="ranking-method-icon"><i class="fas fa-download"></i></div>
                <div class="ranking-method-detail">
                  <div class="ranking-method-name">
                    Monthly Downloads <span class="ranking-method-weight">⅓</span>
                  </div>
                  <div class="ranking-method-desc">
                    PyPI monthly download count, also on a
                    <strong>logarithmic scale</strong>. Reflects real-world adoption and
                    active usage in production codebases, normalised to the catalog
                    maximum.
                  </div>
                </div>
              </div>

              <div class="ranking-method-row">
                <div class="ranking-method-icon"><i class="fas fa-lightbulb"></i></div>
                <div class="ranking-method-detail">
                  <div class="ranking-method-name">
                    Use Cases <span class="ranking-method-weight">⅓</span>
                  </div>
                  <div class="ranking-method-desc">
                    Number of curated use cases in which the package appears, on a
                    <strong>linear scale</strong>. A higher count signals broader
                    applicability across real-world ML problems.
                  </div>
                </div>
              </div>
            </div>

            <p class="ranking-formula">
              <strong>Fit Score</strong> = (Stars<sub>log</sub> + Downloads<sub>log</sub>
              + UseCases<sub>linear</sub>) ÷ 3
            </p>
            <p>
              Scores are computed dynamically from live catalog data and renormalised
              whenever the catalog is updated. The catalog is deliberately neutral —
              scikit-learn core is excluded from the normalisation pool since it is
              displayed separately as the ecosystem foundation.
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
  color: var(--text-inverse) !important;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-md);
  text-align: center;
  margin: var(--space-4) 0;
  letter-spacing: 0.01em;
}

.ranking-formula strong {
  color: var(--text-inverse);
}

.ranking-formula sub {
  font-size: 0.75em;
  color: var(--color-orange);
}
</style>
