<template>
  <div class="catalog-list-header card pkg-catalog-item" role="row">
    <div class="catalog-list-header-row" role="presentation">
      <div class="catalog-list-hcell catalog-list-hcell--skore" role="columnheader">
        Package, score &amp; links
      </div>
      <div class="catalog-list-hcell catalog-list-hcell--desc" role="columnheader">Description</div>
      <div class="catalog-list-hcell catalog-list-hcell--cats" role="columnheader">Category</div>
      <div class="catalog-list-hcell catalog-list-hcell--info" role="columnheader">
        Information
      </div>
      <div
        class="catalog-list-hcell catalog-list-hcell--fitn"
        role="columnheader"
        title="Documentation pillars present (getting started, API reference, narrative guide)"
      >
        <i class="fas fa-book catalog-list-hcell-icon" aria-hidden="true"></i>
        <span class="sr-only">Fit docs</span>
      </div>
      <div
        class="catalog-list-hcell catalog-list-hcell--fitn"
        role="columnheader"
        title="Test coverage from codecov/coveralls (falls back to 50 if a tests/ directory exists)"
      >
        <i class="fas fa-flask catalog-list-hcell-icon" aria-hidden="true"></i>
        <span class="sr-only">Fit testing</span>
      </div>
      <div
        class="catalog-list-hcell catalog-list-hcell--fitn"
        role="columnheader"
        title="Fitness for purpose — how many curated use cases reference this package"
      >
        <i class="fas fa-lightbulb catalog-list-hcell-icon" aria-hidden="true"></i>
        <span class="sr-only">Fit fitness</span>
      </div>
      <div
        class="catalog-list-hcell catalog-list-hcell--fitn"
        role="columnheader"
        title="Activity — freshness of the latest commit and release (180-day half-life)"
      >
        <i class="fas fa-bolt catalog-list-hcell-icon" aria-hidden="true"></i>
        <span class="sr-only">Fit activity</span>
      </div>
      <div
        class="catalog-list-hcell catalog-list-hcell--fitn"
        role="columnheader"
        title="Community experience — log-normalised mean of GitHub stars and forks"
      >
        <i class="fas fa-code-branch catalog-list-hcell-icon" aria-hidden="true"></i>
        <span class="sr-only">Fit community</span>
      </div>
      <div
        class="catalog-list-hcell catalog-list-hcell--fitn"
        role="columnheader"
        title="Adoption — log-normalised PyPI monthly download volume"
      >
        <i class="fas fa-download catalog-list-hcell-icon" aria-hidden="true"></i>
        <span class="sr-only">Fit adoption</span>
      </div>
      <div class="catalog-list-hcell catalog-list-hcell--uc" role="columnheader">Use cases</div>
      <div class="catalog-list-hcell catalog-list-hcell--tags" role="columnheader">Tags</div>
    </div>
  </div>
</template>

<style src="@/assets/css/package-catalog-item.css"></style>
<style src="@/assets/css/catalog-list-layout.css"></style>
<style scoped>
.catalog-list-hcell {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  line-height: 1.2;
  hyphens: auto;
}

.catalog-list-hcell-icon {
  font-size: var(--text-2xs);
  line-height: 1;
  color: var(--text-muted);
}

.catalog-list-hcell--stat,
.catalog-list-hcell--fitn {
  cursor: help;
}
</style>
