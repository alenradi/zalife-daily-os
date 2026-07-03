import {
  forwardRef,
  useRef,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { containsAmpak } from "../lib/ampak";
import { useAmpakToast } from "./AmpakToast";

/**
 * Shared hook: intercepts the forbidden word "ampak" on every change,
 * fires the global toast, and reports a violation flag for styling/blocking.
 * Violation state is derived directly from the controlled value.
 */
function useAmpakGuard(
  value: string,
  onViolationChange?: (v: boolean) => void
) {
  const { flag } = useAmpakToast();
  const prevViolation = useRef(false);
  const violation = containsAmpak(value);

  const check = (next: string) => {
    const bad = containsAmpak(next);
    if (bad && !prevViolation.current) flag();
    if (bad !== prevViolation.current) {
      prevViolation.current = bad;
      onViolationChange?.(bad);
    }
  };

  return { violation, check };
}

type TAProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  onViolationChange?: (v: boolean) => void;
};

export const GuardedTextarea = forwardRef<HTMLTextAreaElement, TAProps>(
  function GuardedTextarea(
    { className = "", onChange, onViolationChange, value = "", ...rest },
    ref
  ) {
    const { violation, check } = useAmpakGuard(
      String(value),
      onViolationChange
    );
    return (
      <textarea
        ref={ref}
        value={value}
        className={`textarea ${violation ? "violation" : ""} ${className}`}
        onChange={(e) => {
          check(e.target.value);
          onChange?.(e);
        }}
        {...rest}
      />
    );
  }
);

type INProps = InputHTMLAttributes<HTMLInputElement> & {
  onViolationChange?: (v: boolean) => void;
};

export const GuardedInput = forwardRef<HTMLInputElement, INProps>(
  function GuardedInput(
    { className = "", onChange, onViolationChange, value = "", ...rest },
    ref
  ) {
    const { violation, check } = useAmpakGuard(
      String(value),
      onViolationChange
    );
    return (
      <input
        ref={ref}
        value={value}
        className={`input ${violation ? "violation" : ""} ${className}`}
        onChange={(e) => {
          check(e.target.value);
          onChange?.(e);
        }}
        {...rest}
      />
    );
  }
);
