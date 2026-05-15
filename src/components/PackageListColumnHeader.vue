<template>
  <div class="catalog-list-header card pkg-catalog-item" role="row">
    <div class="catalog-list-header-row" role="presentation">
      <div class="catalog-list-hcell catalog-list-hcell--skore" role="columnheader">
        Package, score &amp; links
      </div>
      <div class="catalog-list-hcell catalog-list-hcell--desc" role="columnheader">Description</div>
      <div class="catalog-list-hcell catalog-list-hcell--cats" role="columnheader">Category</div>
      <div
        class="catalog-list-hcell catalog-list-hcell--stat"
        role="columnheader"
        title="Latest published version on PyPI"
      >
        <i class="fas fa-tag catalog-list-hcell-icon" aria-hidden="true"></i>
        <span class="sr-only">Release version</span>
      </div>
      <div
        class="catalog-list-hcell catalog-list-hcell--stat"
        role="columnheader"
        title="Date of the last PyPI release"
      >
        <i class="fas fa-calendar-day catalog-list-hcell-icon" aria-hidden="true"></i>
        <span class="sr-only">Release date</span>
      </div>
      <div
        class="catalog-list-hcell catalog-list-hcell--stat"
        role="columnheader"
        title="SPDX license identifier for the package"
      >
        <i class="fas fa-scale-balanced catalog-list-hcell-icon" aria-hidden="true"></i>
        <span class="sr-only">License</span>
      </div>
      <div
        class="catalog-list-hcell catalog-list-hcell--stat"
        role="columnheader"
        title="Number of forks on the GitHub repository"
      >
        <i class="fas fa-code-branch catalog-list-hcell-icon" aria-hidden="true"></i>
        <span class="sr-only">Forks</span>
      </div>
      <div
        class="catalog-list-hcell catalog-list-hcell--stat"
        role="columnheader"
        title="Stargazers count on GitHub"
      >
        <i class="fas fa-star catalog-list-hcell-icon" aria-hidden="true"></i>
        <span class="sr-only">Stars</span>
      </div>
      <div
        class="catalog-list-hcell catalog-list-hcell--stat"
        role="columnheader"
        title="Estimated PyPI downloads per month"
      >
        <i class="fas fa-cloud-arrow-down catalog-list-hcell-icon" aria-hidden="true"></i>
        <span class="sr-only">Downloads per month</span>
      </div>
      <div
        class="catalog-list-hcell catalog-list-hcell--fitn"
        role="columnheader"
        title="Share of the catalog fit score from GitHub stars"
      >
        <i class="fas fa-star-half-stroke catalog-list-hcell-icon" aria-hidden="true"></i>
        <span class="sr-only">Fit stars</span>
      </div>
      <div
        class="catalog-list-hcell catalog-list-hcell--fitn"
        role="columnheader"
        title="Share of the fit score from PyPI download volume"
      >
        <i class="fas fa-download catalog-list-hcell-icon" aria-hidden="true"></i>
        <span class="sr-only">Fit downloads</span>
      </div>
      <div
        class="catalog-list-hcell catalog-list-hcell--fitn"
        role="columnheader"
        title="Share of the fit score from curated use cases in this catalog"
      >
        <i class="fas fa-lightbulb catalog-list-hcell-icon" aria-hidden="true"></i>
        <span class="sr-only">Fit use cases</span>
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
