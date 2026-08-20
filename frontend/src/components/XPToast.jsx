import { useEffect, useState } from 'react';
import { useGamification } from '../context/GamificationContext.jsx';

export default function XPToast() {
  const { toast, clearToast } = useGamification();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) return;
    setVisible(true);
    const hide = setTimeout(() => setVisible(false), 1800);
    const clear = setTimeout(() => clearToast(), 2200);
    return () => {
      clearTimeout(hide);
      clearTimeout(clear);
    };
  }, [toast]);

  if (!toast) return null;

  return (
    <div className={`xp-toast ${visible ? 'show' : ''}`}>
      ⭐ +{toast.amount} XP{toast.reason ? ` · ${toast.reason}` : ''}
    </div>
  );
}