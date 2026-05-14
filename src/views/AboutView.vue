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
  <div id="view-about" class="view" role="tabpanel" aria-label="About Scikit-learn Central">
    <div class="page-content">
      <div class="about-page">
        <section class="about-section">
          <h2 class="about-section__title">Purpose</h2>
          <div class="about-section__body">
            <p>
              Scikit-learn Central is a community resource dedicated to serving the
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
