import { useEffect, useState } from "react";
import { QUOTES } from "../data/quotes";

/** Rotating ambient leadership quote footer. */
export function Footer() {
  const [i, setI] = useState(() => Math.floor(Math.random() * QUOTES.length));

  useEffect(() => {
    const id = window.setInterval(
      () => setI((n) => (n + 1) % QUOTES.length),
      9000
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <footer className="footer-quote">
      <span className="spark">✦</span>
      <em className="key" key={i}>
        „{QUOTES[i]}"
      </em>
    </footer>
  );
}
