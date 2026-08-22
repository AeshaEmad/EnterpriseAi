function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-panel" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3>{title}</h3>
          <button
            className="modal-close"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            x
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
