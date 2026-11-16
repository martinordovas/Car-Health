import { TestBed } from '@angular/core/testing';
import { DateTimePickerComponent } from './datetime-picker';

describe('DateTimePickerComponent', () => {
  beforeEach(async () => {
    localStorage.setItem('ch-locale', 'es');
    await TestBed.configureTestingModule({
      imports: [DateTimePickerComponent],
    }).compileComponents();
  });

  it('formatea el valor en español y emite al elegir un día', () => {
    const fixture = TestBed.createComponent(DateTimePickerComponent);
    const component = fixture.componentInstance;
    let emitted = '';
    component.registerOnChange((value) => (emitted = value));

    component.writeValue('2026-11-13T18:45');
    fixture.detectChanges();

    expect(component.valueLabel()).toBe('Vie, 13 nov 2026 · 18:45');

    const day = component.days().find((item) => item.currentMonth && item.day === 10);
    expect(day).toBeTruthy();
    component.selectDay(day!);

    expect(emitted).toBe('2026-11-10T18:45');
    expect(component.valueLabel()).toBe('Mar, 10 nov 2026 · 18:45');
  });

  it('normaliza la hora editada y conserva el día seleccionado', () => {
    const fixture = TestBed.createComponent(DateTimePickerComponent);
    const component = fixture.componentInstance;
    let emitted = '';
    component.registerOnChange((value) => (emitted = value));

    component.writeValue('2026-11-13T08:05');
    component.hourDraft.set('9');
    component.minuteDraft.set('7');
    component.commitTime();

    expect(emitted).toBe('2026-11-13T09:07');
    expect(component.hourDraft()).toBe('09');
    expect(component.minuteDraft()).toBe('07');
  });

  it('usa el día de hoy al pulsar Hoy y mantiene la hora', () => {
    const fixture = TestBed.createComponent(DateTimePickerComponent);
    const component = fixture.componentInstance;
    let emitted = '';
    component.registerOnChange((value) => (emitted = value));

    component.writeValue('2026-11-10T18:45');
    component.setToday();

    const today = new Date();
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T18:45`;
    expect(emitted).toBe(expected);
  });
});
