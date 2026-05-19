import React, { useEffect, useState } from 'react';

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    function beforeInstall(event) {
      event.preventDefault();
      setPrompt(event);
    }
    function appInstalled() {
      setInstalled(true);
      setPrompt(null);
    }
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', appInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', appInstalled);
    };
  }, []);

  if (installed || !prompt) return null;

  return (
    <button
      className="install-prompt"
      onClick={async () => {
        await prompt.prompt();
        setPrompt(null);
      }}
    >
      Zainstaluj grę
    </button>
  );
}
