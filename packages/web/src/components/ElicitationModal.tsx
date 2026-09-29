/** The host's confirmation dialog: here, the person at the keyboard answers the server. */
export function ElicitationModal({ message, onAnswer }: { message: string; onAnswer: (a: 'accept' | 'decline' | 'cancel') => void }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="elicit-title">
        <p className="eyebrow" id="elicit-title">The server asks you</p>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="primary" onClick={() => onAnswer('accept')}>Yes</button>
          <button onClick={() => onAnswer('decline')}>No</button>
          <button className="ghost" onClick={() => onAnswer('cancel')}>Cancel</button>
        </div>
        <p className="muted small">An MCP elicitation, answered by you as the customer. The time you take is not counted as server latency.</p>
      </div>
    </div>
  );
}
