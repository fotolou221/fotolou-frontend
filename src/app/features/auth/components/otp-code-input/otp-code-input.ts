import { Component, ElementRef, EventEmitter, Input, Output, QueryList, signal, ViewChildren } from '@angular/core';

@Component({
  selector: 'app-otp-code-input',
  template: `
    <div class="otp-code-input" aria-label="Code de v&eacute;rification">
      @for (digit of digits(); track $index) {
        <input
          #otpInput
          class="otp-code-input__field"
          [class.otp-code-input__field--active]="activeIndex() === $index"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="1"
          [attr.aria-label]="'Chiffre ' + ($index + 1)"
          [value]="digit"
          (focus)="activeIndex.set($index)"
          (input)="onInput($event, $index)"
          (keydown)="onKeyDown($event, $index)"
          (paste)="onPaste($event, $index)"
        />
      }
    </div>
  `,
  styleUrl: './otp-code-input.scss'
})
export class OtpCodeInput {
  @ViewChildren('otpInput') private readonly inputElements!: QueryList<ElementRef<HTMLInputElement>>;
  @Output() readonly codeChange = new EventEmitter<string>();

  protected readonly activeIndex = signal(0);
  protected readonly digits = signal(['', '', '', '', '', '']);

  @Input() set code(value: string) {
    if (value) {
      this.digits.set(this.normalizeCode(value));
      this.emitCode();
    }
  }

  protected onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(-1);
    const digits = [...this.digits()];

    digits[index] = value;
    input.value = value;
    this.digits.set(digits);
    this.activeIndex.set(index);
    this.emitCode();

    if (value && index < digits.length - 1) {
      this.focusField(index + 1);
    }
  }

  protected onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key !== 'Backspace' || this.digits()[index]) {
      return;
    }

    this.focusField(Math.max(index - 1, 0));
  }

  protected onPaste(event: ClipboardEvent, index: number): void {
    event.preventDefault();

    const pastedDigits = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? '';

    if (!pastedDigits) {
      return;
    }

    const digits = [...this.digits()];

    for (let pastedIndex = 0; pastedIndex < pastedDigits.length; pastedIndex += 1) {
      const targetIndex = index + pastedIndex;

      if (targetIndex < digits.length) {
        digits[targetIndex] = pastedDigits[pastedIndex];
      }
    }

    this.digits.set(digits);
    this.emitCode();
    this.focusField(Math.min(index + pastedDigits.length, digits.length - 1));
  }

  private normalizeCode(value: string): string[] {
    const code = value.replace(/\D/g, '').slice(0, 6).padEnd(6, '');

    return Array.from(code);
  }

  private emitCode(): void {
    this.codeChange.emit(this.digits().join(''));
  }

  private focusField(index: number): void {
    globalThis.setTimeout(() => {
      this.inputElements.get(index)?.nativeElement.focus();
    });
  }
}
