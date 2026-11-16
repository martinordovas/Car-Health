import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, type AbstractControl, type ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth.service';
import { errorMessage, km, money } from '../../core/format';
import { I18nService } from '../../core/i18n.service';
import { IconComponent } from '../../shared/icon/icon';
import { LanguageToggleComponent } from '../../shared/i18n/language-toggle';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { LogoComponent } from '../../shared/logo/logo';
import { VehicleVisualComponent } from '../../shared/vehicle-visual/vehicle-visual';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmation = control.get('confirmPassword')?.value;
  return password && confirmation && password !== confirmation ? { mismatch: true } : null;
}

@Component({
  selector: 'app-auth-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IconComponent,
    LanguageToggleComponent,
    LogoComponent,
    TranslatePipe,
    VehicleVisualComponent,
  ],
  templateUrl: './auth-page.html',
})
export class AuthPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(I18nService);

  readonly isRegister = this.route.snapshot.data['mode'] === 'register';
  readonly isDemo = environment.demo;
  protected readonly km = km;
  protected readonly money = money;
  readonly loading = signal(false);
  readonly showPassword = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group(
    {
      displayName: ['', this.isRegister ? [Validators.required, Validators.maxLength(80)] : []],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: [''],
    },
    { validators: this.isRegister ? passwordsMatch : undefined },
  );

  submit(): void {
    if (this.loading()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);

    const request = this.isRegister
      ? this.auth.register(value.email.trim(), value.password, value.displayName.trim())
      : this.auth.login(value.email.trim(), value.password);

    request.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => this.afterAuth(),
      error: (error: unknown) => this.error.set(errorMessage(error)),
    });
  }

  enterDemo(): void {
    if (this.loading() || !this.isDemo) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth
      .login('demo@carhealth.app', 'demo1234')
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.afterAuth(),
        error: (error: unknown) => this.error.set(errorMessage(error)),
      });
  }

  togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  fieldError(field: string): string | null {
    const control = this.form.get(field);
    if (!control || !control.invalid || !(control.touched || control.dirty)) return null;
    if (control.errors?.['required']) return this.i18n.t('common.required');
    if (control.errors?.['email']) return this.i18n.t('auth.error.email');
    if (control.errors?.['minlength']) return this.i18n.t('auth.error.passwordMin');
    if (control.errors?.['maxlength']) return this.i18n.t('common.tooLong');
    return this.i18n.t('common.reviewField');
  }

  confirmError(): string | null {
    const control = this.form.get('confirmPassword');
    if (!control || !(control.touched || control.dirty)) return null;
    if (control.errors?.['required']) return this.i18n.t('auth.error.confirmRequired');
    if (this.form.errors?.['mismatch']) return this.i18n.t('auth.error.mismatch');
    return null;
  }

  private afterAuth(): void {
    const redirect = this.route.snapshot.queryParamMap.get('redirect');
    const target = redirect && redirect.startsWith('/') ? redirect : '/app/dashboard';
    void this.router.navigateByUrl(target);
  }
}
