<template>
  <div class="catalog-list-header card uc-catalog-item" role="row">
    <div class="catalog-list-header-row" role="presentation">
      <div class="catalog-list-hcell catalog-list-hcell--title" role="columnheader">
        Use case &amp; links
      </div>
      <div class="catalog-list-hcell catalog-list-hcell--desc" role="columnheader">Synopsis</div>
      <div
        class="catalog-list-hcell catalog-list-hcell--taxonomy catalog-list-hcell--application-field"
        role="columnheader"
        title="Application field"
      >
        <i class="fas fa-building catalog-list-hcell-icon" aria-hidden="true"></i>
        <span class="catalog-list-hcell-label">Application field</span>
      </div>
      <div
        class="catalog-list-hcell catalog-list-hcell--taxonomy catalog-list-hcell--problem-type"
        role="columnheader"
        title="Problem type"
      >
        <i class="fas fa-bullseye catalog-list-hcell-icon" aria-hidden="true"></i>
        <span class="catalog-list-hcell-label">Problem type</span>
      </div>
      <div
        class="catalog-list-hcell catalog-list-hcell--taxonomy catalog-list-hcell--data-type"
        role="columnheader"
        title="Data type"
      >
        <i class="fas fa-database catalog-list-hcell-icon" aria-hidden="true"></i>
        <span class="catalog-list-hcell-label">Data type</span>
      </div>
      <div class="catalog-list-hcell catalog-list-hcell--packages" role="columnheader">Packages</div>
    </div>
  </div>
</template>

<style src="@/assets/css/use-case-catalog-item.css"></style>
<style src="@/assets/css/use-case-list-layout.css"></style>
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

.catalog-list-hcell--taxonomy {
  flex-direction: column;
  gap: var(--space-1);
  cursor: help;
}

.catalog-list-hcell-icon {
  font-size: var(--text-2xs);
  line-height: 1;
  color: var(--text-muted);
}

.catalog-list-hcell-label {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  line-height: 1.2;
  text-align: center;
  hyphens: auto;
}
</style>
