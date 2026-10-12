import { useState } from 'react'

function QuitModal({ isOpen, onClose, onConfirmExit }) {
  const [closedNotice, setClosedNotice] = useState(false)

  if (!isOpen) return null

  function handleActualExit() {
    try {
      window.close()
    } catch {
      // Browsers often block scripts from closing tabs not opened by script
    }
    setClosedNotice(true)
    if (onConfirmExit) {
      onConfirmExit()
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="quit-modal-title">
      <div className="modal-card">
        {!closedNotice ? (
          <>
            <div className="modal-icon-badge">🚪</div>
            <h2 id="quit-modal-title" className="modal-title">Quit Game?</h2>
            <p className="modal-desc">
              Are you sure you want to quit? Any unsaved progress or match score will be closed.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn--danger"
                onClick={handleActualExit}
              >
                Yes, Exit Game
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={onClose}
              >
                Cancel & Keep Playing
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-icon-badge">✨</div>
            <h2 className="modal-title">Thanks for playing!</h2>
            <p className="modal-desc">
              You can now safely close this browser window or return to the main menu.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  setClosedNotice(false)
                  onClose()
                }}
              >
                Return to Menu
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default QuitModal
