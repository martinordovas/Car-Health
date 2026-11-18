import {
  Component,
  HostListener,
  OnDestroy,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { I18nService } from '../../core/i18n.service';
import type { Locale } from '../../core/i18n';
import { IconComponent } from '../icon/icon';

interface CalendarDay {
  date: Date;
  day: number;
  currentMonth: boolean;
  today: boolean;
  selected: boolean;
}

interface DateFormats {
  monthYear: Intl.DateTimeFormat;
  weekdayShort: Intl.DateTimeFormat;
  dayMonthYear: Intl.DateTimeFormat;
  fullDate: Intl.DateTimeFormat;
  weekdayNarrow: Intl.DateTimeFormat;
}

const formatCache = new Map<Locale, DateFormats>();

function dateFormats(locale: Locale): DateFormats {
  const cached = formatCache.get(locale);
  if (cached) return cached;

  const tag = locale === 'en' ? 'en-GB' : 'es-ES';
  const formats: DateFormats = {
    monthYear: new Intl.DateTimeFormat(tag, { month: 'long', year: 'numeric' }),
    weekdayShort: new Intl.DateTimeFormat(tag, { weekday: 'short' }),
    dayMonthYear: new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short', year: 'numeric' }),
    fullDate: new Intl.DateTimeFormat(tag, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    weekdayNarrow: new Intl.DateTimeFormat(tag, { weekday: 'narrow' }),
  };
  formatCache.set(locale, formats);
  return formats;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function parseInputValue(value: string | null | undefined): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value ?? '');
  if (!match) return null;

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

function toInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function sameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

@Component({
  selector: 'app-datetime-picker',
  imports: [IconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateTimePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="relative" (click)="$event.stopPropagation()">
      <div class="field-shell">
        <span class="field-icon"><app-icon name="calendar" [size]="17" /></span>
        <button
          type="button"
          class="field flex items-center gap-2 pe-10 text-left"
          [id]="inputId()"
          [class.field-error]="invalid()"
          [class.date-trigger-open]="open()"
          [disabled]="disabled()"
          [attr.aria-expanded]="open()"
          aria-haspopup="dialog"
          [attr.aria-label]="i18n.t('datePicker.fieldAria', { value: valueLabel() })"
          (click)="toggle()"
        >
          <span class="min-w-0 flex-1 truncate" [class.text-faint]="!selected()">{{
            valueLabel()
          }}</span>
          <app-icon
            name="chevron-down"
            [size]="15"
            class="shrink-0 text-faint transition-transform"
            [class.rotate-180]="open()"
          />
        </button>
      </div>

      @if (open() || closing()) {
        <div
          class="popover-backdrop fixed inset-0 z-[60] bg-[#07140d]/35 backdrop-blur-[1px] sm:hidden"
          [class.is-closing]="closing()"
          aria-hidden="true"
          (click)="close()"
        ></div>
        <div
          class="popover-panel fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[70] max-h-[calc(100dvh-7rem)] origin-bottom overflow-y-auto overscroll-contain rounded-[22px] border border-line bg-surface shadow-float sm:absolute sm:inset-auto sm:left-0 sm:top-[calc(100%+8px)] sm:z-50 sm:max-h-none sm:w-[336px] sm:origin-top-left sm:overflow-hidden"
          [class.is-closing]="closing()"
          [attr.inert]="closing() ? '' : null"
          role="dialog"
          [attr.aria-label]="i18n.t('datePicker.dialogAria')"
        >
          <div class="flex items-center justify-between gap-2 px-3 pb-1 pt-3">
            <button
              type="button"
              class="icon-btn size-8"
              [attr.aria-label]="i18n.t('datePicker.previousMonth')"
              (click)="moveMonth(-1)"
            >
              <app-icon name="chevron-left" [size]="17" />
            </button>
            <p class="text-sm font-bold tracking-[-0.02em]">{{ monthLabel() }}</p>
            <button
              type="button"
              class="icon-btn size-8"
              [attr.aria-label]="i18n.t('datePicker.nextMonth')"
              (click)="moveMonth(1)"
            >
              <app-icon name="chevron-right" [size]="17" />
            </button>
          </div>

          <div class="grid grid-cols-7 gap-1 px-3 pb-1 pt-2 text-center">
            @for (weekday of weekdays(); track weekday) {
              <span class="text-[9px] font-[800] uppercase tracking-[0.08em] text-faint">{{
                weekday
              }}</span>
            }
          </div>

          <div class="grid grid-cols-7 gap-1 px-3 pb-2">
            @for (day of days(); track day.date.getTime()) {
              <button
                type="button"
                [class]="dayClasses(day)"
                [attr.aria-label]="dayAria(day)"
                [attr.aria-pressed]="day.selected ? 'true' : 'false'"
                [attr.aria-current]="day.today ? 'date' : null"
                (click)="selectDay(day)"
              >
                {{ day.day }}
              </button>
            }
          </div>

          <div
            class="flex items-center justify-between gap-3 border-t border-line bg-surface-soft/60 px-3 py-2.5"
          >
            <div class="flex items-center gap-1.5">
              <app-icon name="clock" [size]="14" class="text-faint" />
              <span class="text-[9px] font-[800] uppercase tracking-[0.1em] text-faint">{{
                i18n.t('datePicker.hour')
              }}</span>
              <div class="ms-1 flex items-center gap-1">
                <input
                  type="text"
                  inputmode="numeric"
                  maxlength="2"
                  class="time-part"
                  [attr.aria-label]="i18n.t('datePicker.hoursAria')"
                  autocomplete="off"
                  [value]="hourDraft()"
                  [disabled]="disabled()"
                  (focus)="selectInput($event)"
                  (input)="onTimeInput('hour', $event)"
                  (change)="commitTime()"
                  (blur)="commitTime()"
                  (keydown.enter)="$event.preventDefault(); commitTime()"
                />
                <span class="pb-0.5 text-sm font-extrabold text-faint">:</span>
                <input
                  type="text"
                  inputmode="numeric"
                  maxlength="2"
                  class="time-part"
                  [attr.aria-label]="i18n.t('datePicker.minutesAria')"
                  autocomplete="off"
                  [value]="minuteDraft()"
                  [disabled]="disabled()"
                  (focus)="selectInput($event)"
                  (input)="onTimeInput('minute', $event)"
                  (change)="commitTime()"
                  (blur)="commitTime()"
                  (keydown.enter)="$event.preventDefault(); commitTime()"
                />
              </div>
            </div>
            <span class="text-[9px] font-medium text-faint">{{ i18n.t('datePicker.24h') }}</span>
          </div>

          <div class="flex items-center justify-between gap-2 border-t border-line px-3 py-2">
            <div class="flex items-center gap-1">
              <button type="button" class="btn btn-ghost btn-sm px-2.5" (click)="setToday()">
                {{ i18n.t('datePicker.today') }}
              </button>
              <button type="button" class="btn btn-ghost btn-sm px-2.5" (click)="setNow()">
                {{ i18n.t('datePicker.now') }}
              </button>
            </div>
            <button type="button" class="btn btn-primary btn-sm" (click)="close()">
              {{ i18n.t('datePicker.done') }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class DateTimePickerComponent implements ControlValueAccessor, OnDestroy {
  readonly i18n = inject(I18nService);
  readonly inputId = input('date');
  readonly invalid = input(false);
  readonly disabled = signal(false);
  readonly open = signal(false);
  readonly closing = signal(false);
  private closeTimer: ReturnType<typeof window.setTimeout> | null = null;

  private readonly selected = signal<Date | null>(null);
  private readonly viewYear = signal(new Date().getFullYear());
  private readonly viewMonth = signal(new Date().getMonth());
  readonly hourDraft = signal(pad(new Date().getHours()));
  readonly minuteDraft = signal(pad(new Date().getMinutes()));

  readonly weekdays = computed(() => {
    const formats = dateFormats(this.i18n.locale());
    return Array.from({ length: 7 }, (_, index) =>
      formats.weekdayNarrow.format(new Date(2024, 0, 1 + index, 12)),
    );
  });

  readonly valueLabel = computed(() => {
    const locale = this.i18n.locale();
    const date = this.selected();
    if (!date) return this.i18n.t('datePicker.placeholder');

    const formats = dateFormats(locale);
    const weekday = capitalize(formats.weekdayShort.format(date).replace(/\./g, ''));
    const day = formats.dayMonthYear.format(date).replace(/\./g, '');
    return `${weekday}, ${day} · ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  });

  readonly monthLabel = computed(() => {
    const locale = this.i18n.locale();
    const parts = dateFormats(locale).monthYear.formatToParts(
      new Date(this.viewYear(), this.viewMonth(), 1, 12),
    );
    const month = parts.find((part) => part.type === 'month')?.value ?? '';
    const year = parts.find((part) => part.type === 'year')?.value ?? '';
    return capitalize(`${month} ${year}`.trim());
  });

  readonly days = computed<CalendarDay[]>(() => {
    const year = this.viewYear();
    const month = this.viewMonth();
    const first = new Date(year, month, 1, 12);
    const offset = (first.getDay() + 6) % 7;
    const today = new Date();
    const selected = this.selected();

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(year, month, 1 - offset + index, 12);
      return {
        date,
        day: date.getDate(),
        currentMonth: date.getMonth() === month && date.getFullYear() === year,
        today: sameDay(date, today),
        selected: selected ? sameDay(date, selected) : false,
      };
    });
  });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    const date = parseInputValue(value);
    this.selected.set(date);

    if (date) {
      this.hourDraft.set(pad(date.getHours()));
      this.minuteDraft.set(pad(date.getMinutes()));
      this.viewYear.set(date.getFullYear());
      this.viewMonth.set(date.getMonth());
      return;
    }

    const now = new Date();
    this.hourDraft.set(pad(now.getHours()));
    this.minuteDraft.set(pad(now.getMinutes()));
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  toggle(): void {
    if (this.disabled()) return;
    if (this.open()) {
      this.close();
      return;
    }

    const date = this.selected() ?? new Date();
    this.viewYear.set(date.getFullYear());
    this.viewMonth.set(date.getMonth());
    if (this.closeTimer) window.clearTimeout(this.closeTimer);
    this.closing.set(false);
    this.open.set(true);
  }

  close(): void {
    if (!this.open()) return;
    this.commitTime();
    this.open.set(false);
    this.closing.set(true);
    this.onTouched();
    if (this.closeTimer) window.clearTimeout(this.closeTimer);
    this.closeTimer = window.setTimeout(() => {
      this.closing.set(false);
      this.closeTimer = null;
    }, 140);
  }

  moveMonth(offset: number): void {
    const next = new Date(this.viewYear(), this.viewMonth() + offset, 1, 12);
    this.viewYear.set(next.getFullYear());
    this.viewMonth.set(next.getMonth());
  }

  selectDay(day: CalendarDay): void {
    const current = this.selected() ?? new Date();
    const date = new Date(
      day.date.getFullYear(),
      day.date.getMonth(),
      day.date.getDate(),
      current.getHours(),
      current.getMinutes(),
    );
    this.viewYear.set(date.getFullYear());
    this.viewMonth.set(date.getMonth());
    this.emit(date);
  }

  setToday(): void {
    const now = new Date();
    const current = this.selected() ?? now;
    this.viewYear.set(now.getFullYear());
    this.viewMonth.set(now.getMonth());
    this.emit(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        current.getHours(),
        current.getMinutes(),
      ),
    );
  }

  setNow(): void {
    const now = new Date();
    this.viewYear.set(now.getFullYear());
    this.viewMonth.set(now.getMonth());
    this.emit(now);
    this.close();
  }

  selectInput(event: Event): void {
    (event.target as HTMLInputElement).select();
  }

  onTimeInput(part: 'hour' | 'minute', event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 2);
    input.value = digits;

    if (part === 'hour') {
      this.hourDraft.set(digits);
    } else {
      this.minuteDraft.set(digits);
    }
  }

  commitTime(): void {
    const date = this.selected();
    if (!date) return;

    const parsedHour = Number(this.hourDraft());
    const parsedMinute = Number(this.minuteDraft());
    const hour =
      Number.isInteger(parsedHour) && this.hourDraft() !== ''
        ? Math.min(23, Math.max(0, parsedHour))
        : date.getHours();
    const minute =
      Number.isInteger(parsedMinute) && this.minuteDraft() !== ''
        ? Math.min(59, Math.max(0, parsedMinute))
        : date.getMinutes();

    this.hourDraft.set(pad(hour));
    this.minuteDraft.set(pad(minute));

    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute);
    if (toInputValue(next) !== toInputValue(date)) {
      this.emit(next);
    }
  }

  dayClasses(day: CalendarDay): string {
    return [
      'date-picker-day',
      day.currentMonth ? '' : 'date-picker-day-outside',
      day.today ? 'date-picker-day-today' : '',
      day.selected ? 'date-picker-day-selected' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  dayAria(day: CalendarDay): string {
    return capitalize(dateFormats(this.i18n.locale()).fullDate.format(day.date));
  }

  @HostListener('document:click')
  @HostListener('document:keydown.escape')
  onDocumentClick(): void {
    this.close();
  }

  ngOnDestroy(): void {
    if (this.closeTimer) window.clearTimeout(this.closeTimer);
  }

  private emit(date: Date): void {
    this.selected.set(date);
    this.hourDraft.set(pad(date.getHours()));
    this.minuteDraft.set(pad(date.getMinutes()));
    this.onChange(toInputValue(date));
  }
}
