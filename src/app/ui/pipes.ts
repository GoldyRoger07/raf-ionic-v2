import { Pipe, PipeTransform } from '@angular/core';

import { formatAgo, formatDate, formatDateTime, formatHtg, formatNumber } from '../core/format';

@Pipe({ name: 'num' })
export class NumPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatNumber(value);
  }
}

@Pipe({ name: 'htg' })
export class HtgPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatHtg(value);
  }
}

@Pipe({ name: 'dateTime' })
export class DateTimePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return formatDateTime(value);
  }
}

@Pipe({ name: 'date' })
export class DatePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return formatDate(value);
  }
}

@Pipe({ name: 'ago' })
export class AgoPipe implements PipeTransform {
  transform(value: string): string {
    return formatAgo(value);
  }
}
