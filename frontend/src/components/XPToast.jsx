import { useEffect } from 'react';
import { useGamification } from '../context/GamificationShared.js';

export default function XPToast() {
  const { toast, clearToast } = useGamification();

  useEffect(() => {
    if (!toast) return;
    const clear = setTimeout(clearToast, 2200);
    return () => {
      clearTimeout(clear);
    };
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div key={toast.key} className="xp-toast show">
      ⭐ +{toast.amount} XP{toast.reason ? ` · ${toast.reason}` : ''}
    </div>
  );
}