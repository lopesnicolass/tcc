import Phaser from 'phaser';

export class Food {
  constructor(scene, x, y, id) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.id = id;

    this.taken = false;

    this.body =
      scene.add.graphics();

    this.draw();
  }

  draw() {
    const g = this.body;

    g.clear();

    /*
     * Sombra
     */

    g.fillStyle(
      0x000000,
      0.12
    );

    g.fillEllipse(
      0,
      7,
      28,
      8
    );

    /*
     * Frutinha
     */

    g.fillStyle(
      0xff7043,
      1
    );

    g.fillCircle(
      0,
      0,
      10
    );

    /*
     * Brilho
     */

    g.fillStyle(
      0xffffff,
      0.45
    );

    g.fillCircle(
      -3,
      -4,
      2.5
    );

    /*
     * Folha
     */

    g.fillStyle(
      0x38b85e,
      1
    );

    g.fillEllipse(
      5,
      -10,
      9,
      5
    );

    g.setPosition(
      this.x,
      this.y
    );
  }

  destroy() {
    this.body.destroy();
  }
}