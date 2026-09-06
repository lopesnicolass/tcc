import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import TerrariumScene from './game/TerrariumScene.js';

export default function TerrariumGame() {
  const containerRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const config = {
      type: Phaser.AUTO,

      width: 1200,
      height: 620,

      parent: containerRef.current,

      backgroundColor: '#BFE4FA',

      scene: TerrariumScene,

      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1200,
        height: 620,
      },

      render: {
        antialias: true,
        pixelArt: false,
        roundPixels: true,
      },

      fps: {
        target: 60,
        forceSetTimeOut: false,
      },
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="terrarium-phaser-container"
    />
  );
}