import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AdoptionFilter } from '../../model/adoption-filter.model';

@Component({
  standalone: true,
  selector: 'app-adoption-filters',
  templateUrl: './adoption-filters.component.html',
  styleUrls: ['./adoption-filters.component.css'],
  imports: [CommonModule, TranslateModule]
})
export class AdoptionFiltersComponent {
  @Output() filtersChanged = new EventEmitter<AdoptionFilter>();

  expanded = {
    age: false,
    size: false
  };

  filter: AdoptionFilter = {
    age: undefined,
    size: undefined
  };

  toggle(section: keyof typeof this.expanded): void {
    this.expanded[section] = !this.expanded[section];
  }

  updateFilter<K extends keyof AdoptionFilter>(property: K, value: AdoptionFilter[K]): void {
    this.filter[property] = value;
    this.filtersChanged.emit({ ...this.filter });
  }

  clearFilters(): void {
    this.filter = {};
    this.filtersChanged.emit({});
    Object.keys(this.expanded).forEach(
      key => this.expanded[key as keyof typeof this.expanded] = false
    );
  }
}
