import { useState, useEffect, useRef } from 'react'

const DOWNLOAD_LINKS = {
  mac: {
    osName: 'macOS',
    icon: '🍎',
    label: 'macOS Apple Silicon (.dmg)',
    file: 'TicTacToe-Arena-1.0.0-arm64.dmg',
    url: 'https://github.com/Mel6502-AI/ticktacktoe/releases/download/v1.0.0/TicTacToe-Arena-1.0.0-arm64.dmg',
  },
  win: {
    osName: 'Windows',
    icon: '🪟',
    label: 'Windows 64-bit (.zip / .exe)',
    file: 'TicTacToe-Arena-1.0.0-win.zip',
    url: 'https://github.com/Mel6502-AI/ticktacktoe/releases/download/v1.0.0/TicTacToe-Arena-1.0.0-win.zip',
  },
  linux: {
    osName: 'Linux',
    icon: '🐧',
    label: 'Linux 64-bit (.tar.gz)',
    file: 'ticktacktoe-1.0.0.tar.gz',
    url: 'https://github.com/Mel6502-AI/ticktacktoe/releases/download/v1.0.0/ticktacktoe-1.0.0.tar.gz',
  },
}

function detectPlatform() {
  if (typeof window === 'undefined') return 'unknown'
  const ua = window.navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  if (/android/.test(ua)) return 'android'
  if (/macintosh|mac os x/.test(ua)) return 'mac'
  if (/windows|win32|win64/.test(ua)) return 'win'
  if (/linux/.test(ua)) return 'linux'
  return 'unknown'
}

function triggerDownload(url, filename) {
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  link.setAttribute('target', '_blank')
  link.setAttribute('rel', 'noopener noreferrer')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function InstallAppButton() {
  const [platform, setPlatform] = useState('unknown')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showIosTip, setShowIosTip] = useState(false)
  const [downloadToast, setDownloadToast] = useState(null)
  const deferredPromptRef = useRef(null)
  const dropdownRef = useRef(null)

  const isElectron =
    typeof window !== 'undefined' &&
    (Boolean(window.navigator?.userAgent?.includes('Electron')) ||
      Boolean(window.process?.versions?.electron))

  useEffect(() => {
    setPlatform(detectPlatform())

    const handleBeforeInstall = (e) => {
      e.preventDefault()
      deferredPromptRef.current = e
    }

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  if (isElectron) {
    return null
  }

  const handlePrimaryClick = () => {
    if (platform === 'ios') {
      setShowIosTip(true)
      return
    }

    if (platform === 'android') {
      if (deferredPromptRef.current) {
        deferredPromptRef.current.prompt()
        deferredPromptRef.current = null
      } else {
        setShowIosTip(true)
      }
      return
    }

    const target = DOWNLOAD_LINKS[platform] || DOWNLOAD_LINKS.mac
    triggerDownload(target.url, target.file)
    setDownloadToast(`Starting download: ${target.file}`)
    setTimeout(() => setDownloadToast(null), 4000)
  }

  const handleSelectPlatform = (key) => {
    setIsMenuOpen(false)
    if (key === 'ios' || key === 'android') {
      setShowIosTip(true)
      return
    }
    const target = DOWNLOAD_LINKS[key]
    if (target) {
      triggerDownload(target.url, target.file)
      setDownloadToast(`Starting download: ${target.file}`)
      setTimeout(() => setDownloadToast(null), 4000)
    }
  }

  const getButtonLabel = () => {
    if (platform === 'mac') return 'Install for Mac'
    if (platform === 'win') return 'Install for Windows'
    if (platform === 'linux') return 'Install for Linux'
    if (platform === 'ios' || platform === 'android') return 'Install App'
    return 'Install App'
  }

  return (
    <div className="install-app-wrapper" ref={dropdownRef}>
      <div className="install-app-btn-group">
        <button
          type="button"
          className="btn-install-primary"
          onClick={handlePrimaryClick}
          title={`Download installer for ${platform.toUpperCase()}`}
          aria-label={getButtonLabel()}
        >
          <svg className="install-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span className="install-label">{getButtonLabel()}</span>
        </button>

        <button
          type="button"
          className={`btn-install-dropdown-toggle ${isMenuOpen ? 'is-active' : ''}`}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          title="Choose platform (macOS, Windows, Linux, Mobile)"
          aria-label="Choose platform"
          aria-expanded={isMenuOpen}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Platforms Dropdown Menu */}
      {isMenuOpen && (
        <div className="install-dropdown-menu" role="menu">
          <div className="install-dropdown-header">Choose Your Platform</div>

          <button
            type="button"
            className="install-dropdown-item"
            onClick={() => handleSelectPlatform('mac')}
            role="menuitem"
          >
            <span className="dropdown-item-icon">🍎</span>
            <div className="dropdown-item-info">
              <span className="dropdown-item-title">macOS Apple Silicon</span>
              <span className="dropdown-item-desc">Native .dmg installer</span>
            </div>
            {platform === 'mac' && <span className="dropdown-detected-pill">Your OS</span>}
          </button>

          <button
            type="button"
            className="install-dropdown-item"
            onClick={() => handleSelectPlatform('win')}
            role="menuitem"
          >
            <span className="dropdown-item-icon">🪟</span>
            <div className="dropdown-item-info">
              <span className="dropdown-item-title">Windows 64-bit</span>
              <span className="dropdown-item-desc">Portable .zip with .exe</span>
            </div>
            {platform === 'win' && <span className="dropdown-detected-pill">Your OS</span>}
          </button>

          <button
            type="button"
            className="install-dropdown-item"
            onClick={() => handleSelectPlatform('linux')}
            role="menuitem"
          >
            <span className="dropdown-item-icon">🐧</span>
            <div className="dropdown-item-info">
              <span className="dropdown-item-title">Linux 64-bit</span>
              <span className="dropdown-item-desc">Standalone .tar.gz bundle</span>
            </div>
            {platform === 'linux' && <span className="dropdown-detected-pill">Your OS</span>}
          </button>

          <button
            type="button"
            className="install-dropdown-item"
            onClick={() => handleSelectPlatform('ios')}
            role="menuitem"
          >
            <span className="dropdown-item-icon">📱</span>
            <div className="dropdown-item-info">
              <span className="dropdown-item-title">iPhone & Android</span>
              <span className="dropdown-item-desc">Fullscreen Home Screen WebApp</span>
            </div>
            {(platform === 'ios' || platform === 'android') && (
              <span className="dropdown-detected-pill">Your Device</span>
            )}
          </button>
        </div>
      )}

      {/* iOS / Mobile Installation Tip Modal */}
      {showIosTip && (
        <div className="mobile-tip-overlay" onClick={() => setShowIosTip(false)}>
          <div className="mobile-tip-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-tip-header">
              <span className="mobile-tip-icon">📱</span>
              <h3>Install on Mobile</h3>
              <button
                type="button"
                className="mobile-tip-close"
                onClick={() => setShowIosTip(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="mobile-tip-subtitle">
              Add Tic-Tac-Toe Arena to your phone screen with zero app store install:
            </p>
            <ol className="mobile-tip-steps">
              <li>
                <strong>iPhone (Safari):</strong> Tap the <strong>Share</strong> button (⎙), scroll down and tap <strong>Add to Home Screen (+)</strong>.
              </li>
              <li>
                <strong>Android (Chrome):</strong> Tap the <strong>Menu (⋮)</strong> and tap <strong>Install App</strong> or <strong>Add to Home screen</strong>.
              </li>
            </ol>
            <button
              type="button"
              className="btn btn--primary"
              style={{ width: '100%', marginTop: '1rem' }}
              onClick={() => setShowIosTip(false)}
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification when download starts */}
      {downloadToast && (
        <div className="install-toast" role="status">
          <span className="toast-dot" />
          <span>{downloadToast}</span>
        </div>
      )}
    </div>
  )
}

export default InstallAppButton
