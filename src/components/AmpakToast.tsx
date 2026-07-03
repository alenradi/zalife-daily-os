import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { sl } from "../i18n/sl";

interface AmpakToastApi {
  flag: () => void;
}

const AmpakToastContext = createContext<AmpakToastApi>({ flag: () => {} });

export function useAmpakToast(): AmpakToastApi {
  return useContext(AmpakToastContext);
}

export function AmpakToastProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [nonce, setNonce] = useState(0);
  const timer = useRef<number | null>(null);

  const flag = useCallback(() => {
    setVisible(true);
    setNonce((n) => n + 1);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setVisible(false), 3600);
  }, []);

  return (
    <AmpakToastContext.Provider value={{ flag }}>
      {children}
      {visible && (
        <div className="ampak-toast" key={nonce} role="alert">
          <div className="icon">!</div>
          <div>
            <b>{sl.ampak.title}</b>
            <span>{sl.ampak.message}</span>
          </div>
        </div>
      )}
    </AmpakToastContext.Provider>
  );
}
