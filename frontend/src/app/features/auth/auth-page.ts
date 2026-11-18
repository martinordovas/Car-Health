import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChildren,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  type AbstractControl,
  type ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth.service';
import { errorMessage, km, money } from '../../core/format';
import type { TranslationKey } from '../../core/i18n';
import { I18nService } from '../../core/i18n.service';
import type { VerificationResponse } from '../../core/models';
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
export class AuthPageComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(I18nService);

  @ViewChildren('codeDigit') private codeInputs?: QueryList<ElementRef<HTMLInputElement>>;

  readonly isRegister = this.route.snapshot.data['mode'] === 'register';
  readonly isDemo = environment.demo;
  protected readonly km = km;
  protected readonly money = money;
  readonly loading = signal(false);
  readonly showPassword = signal(false);
  readonly error = signal<string | null>(null);

  readonly verificationEmail = signal<string | null>(null);
  readonly codeDigits = signal<string[]>(['', '', '', '', '', '']);
  readonly verificationLoading = signal(false);
  readonly verificationError = signal<string | null>(null);
  readonly verificationNotice = signal<string | null>(null);
  private readonly verificationNow = signal(Date.now());
  private readonly verificationExpiresAt = signal(0);
  private readonly verificationResendAt = signal(0);
  private verificationTimer: ReturnType<typeof window.setInterval> | null = null;

  readonly verificationCode = computed(() => this.codeDigits().join(''));
  readonly verificationExpiresIn = computed(() =>
    Math.max(0, Math.ceil((this.verificationExpiresAt() - this.verificationNow()) / 1000)),
  );
  readonly verificationResendIn = computed(() =>
    Math.max(0, Math.ceil((this.verificationResendAt() - this.verificationNow()) / 1000)),
  );
  readonly verificationExpired = computed(
    () => this.verificationEmail() !== null && this.verificationExpiresIn() <= 0,
  );
  readonly canResend = computed(
    () =>
      this.verificationEmail() !== null &&
      this.verificationResendIn() <= 0 &&
      !this.verificationLoading(),
  );

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
    const email = value.email.trim();
    this.loading.set(true);
    this.error.set(null);

    if (this.isRegister) {
      this.auth
        .register(email, value.password, value.displayName.trim())
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (response) => this.beginVerification(response),
          error: (error: unknown) => this.error.set(errorMessage(error)),
        });
      return;
    }

    this.auth
      .login(email, value.password)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.afterAuth(),
        error: (error: unknown) => this.handleLoginError(error, email),
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

  verify(): void {
    const email = this.verificationEmail();
    if (!email || this.verificationLoading()) return;
    if (this.verificationCode().length !== 6) {
      this.verificationError.set(this.i18n.t('auth.verificationCodeRequired'));
      return;
    }
    if (this.verificationExpired()) {
      this.verificationError.set(this.i18n.t('auth.verificationExpired'));
      return;
    }

    this.verificationLoading.set(true);
    this.verificationError.set(null);
    this.verificationNotice.set(null);
    this.auth
      .verifyEmail(email, this.verificationCode())
      .pipe(finalize(() => this.verificationLoading.set(false)))
      .subscribe({
        next: () => {
          this.stopVerificationTimer();
          this.afterAuth();
        },
        error: (error: unknown) => this.verificationError.set(errorMessage(error)),
      });
  }

  resend(): void {
    const email = this.verificationEmail();
    if (!email || !this.canResend()) return;

    this.verificationLoading.set(true);
    this.verificationError.set(null);
    this.verificationNotice.set(null);
    this.auth
      .resendVerification(email)
      .pipe(finalize(() => this.verificationLoading.set(false)))
      .subscribe({
        next: (response) => this.beginVerification(response, 'auth.verificationResent'),
        error: (error: unknown) => this.verificationError.set(errorMessage(error)),
      });
  }

  backToForm(): void {
    this.stopVerificationTimer();
    this.verificationEmail.set(null);
    this.verificationError.set(null);
    this.verificationNotice.set(null);
    this.codeDigits.set(['', '', '', '', '', '']);
    this.error.set(null);
  }

  togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  onCodeInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, '');
    if (!raw) {
      this.setCodeDigit(index, '');
      return;
    }

    const digits = raw.slice(0, 6 - index).split('');
    const next = [...this.codeDigits()];
    digits.forEach((digit, offset) => {
      if (index + offset < next.length) {
        next[index + offset] = digit;
      }
    });
    this.codeDigits.set(next);
    input.value = next[index] ?? '';
    this.focusCode(Math.min(5, index + digits.length));
  }

  onCodeKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.codeDigits()[index] && index > 0) {
      event.preventDefault();
      this.setCodeDigit(index - 1, '');
      this.focusCode(index - 1);
      return;
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusCode(index - 1);
      return;
    }
    if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      this.focusCode(index + 1);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.verify();
    }
  }

  onCodePaste(event: ClipboardEvent): void {
    const raw = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!raw) return;
    event.preventDefault();
    const digits = raw.split('');
    this.codeDigits.set(['', '', '', '', '', ''].map((_, index) => digits[index] ?? ''));
    this.focusCode(Math.min(5, digits.length - 1));
  }

  selectCode(event: Event): void {
    (event.target as HTMLInputElement).select();
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

  formatCountdown(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  }

  ngOnDestroy(): void {
    this.stopVerificationTimer();
  }

  private handleLoginError(error: unknown, email: string): void {
    if (
      error instanceof HttpErrorResponse &&
      error.status === 403 &&
      error.error?.verificationRequired === true
    ) {
      const payload = error.error as {
        email?: string;
        expiresInSeconds?: number;
        resendAfterSeconds?: number;
      };
      this.beginVerification(
        {
          email: payload.email ?? email,
          expiresInSeconds: payload.expiresInSeconds ?? 0,
          resendAfterSeconds: payload.resendAfterSeconds ?? 0,
          verificationRequired: true,
        },
        'auth.verificationExistingNotice',
      );
      return;
    }
    this.error.set(errorMessage(error));
  }

  private beginVerification(response: VerificationResponse, noticeKey?: TranslationKey): void {
    this.stopVerificationTimer();
    const now = Date.now();
    this.verificationEmail.set(response.email);
    this.verificationExpiresAt.set(now + response.expiresInSeconds * 1000);
    this.verificationResendAt.set(now + response.resendAfterSeconds * 1000);
    this.verificationNow.set(now);
    this.codeDigits.set(['', '', '', '', '', '']);
    this.verificationError.set(null);
    this.verificationNotice.set(noticeKey ? this.i18n.t(noticeKey) : null);
    this.error.set(null);
    this.startVerificationTimer();
    window.setTimeout(() => this.focusCode(0), 60);
  }

  private setCodeDigit(index: number, digit: string): void {
    this.codeDigits.update((digits) => {
      const next = [...digits];
      next[index] = digit;
      return next;
    });
  }

  private focusCode(index: number): void {
    const input = this.codeInputs?.get(index)?.nativeElement;
    input?.focus();
    input?.select();
  }

  private startVerificationTimer(): void {
    this.verificationTimer = window.setInterval(() => {
      this.verificationNow.set(Date.now());
    }, 1000);
  }

  private stopVerificationTimer(): void {
    if (this.verificationTimer !== null) {
      window.clearInterval(this.verificationTimer);
      this.verificationTimer = null;
    }
  }

  private afterAuth(): void {
    const redirect = this.route.snapshot.queryParamMap.get('redirect');
    const target = redirect && redirect.startsWith('/') ? redirect : '/app/dashboard';
    void this.router.navigateByUrl(target);
  }
}
