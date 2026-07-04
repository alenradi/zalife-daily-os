import { sl } from "../i18n/sl";

/** AI mentor — coming soon placeholder (live GPT integration disabled for now). */
export function MentorPanel({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`mentor-panel mentor-panel-soon ${compact ? "mentor-panel-compact" : ""}`}>
      {!compact && (
        <div className="mentor-panel-head">
          <div>
            <h3>{sl.mentor.title}</h3>
            <p>{sl.mentor.subtitle}</p>
          </div>
          <span className="mentor-orb">AI</span>
        </div>
      )}

      <div className="mentor-soon-body">
        <span className="mentor-soon-badge">{sl.mentor.comingSoonBadge}</span>
        <p className="mentor-soon-text">{sl.mentor.comingSoonBody}</p>
      </div>
    </div>
  );
}
