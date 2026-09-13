import Phaser from 'phaser';

export class Ant {
  constructor(scene, x, y, id) {
    this.scene = scene;
    this.id = id;

    this.x = x;
    this.y = y;

    this.speed = Phaser.Math.FloatBetween(45, 65);

    this.direction =
      Phaser.Math.Between(0, 1) === 0 ? -1 : 1;

    this.state = 'WANDERING';

    this.food = null;

    this.targetFood = null;

    this.changeDirectionTimer = Phaser.Math.Between(
      1000,
      3000
    );

    this.walkTime = 0;

    this.body = scene.add.graphics();

    this.draw();
  }

  // =====================================================
  // DESENHO DA FORMIGA
  // =====================================================

  draw() {
    const g = this.body;

    g.clear();

    /*
     * SOMBRA
     */

    g.fillStyle(0x000000, 0.12);

    g.fillEllipse(
      2,
      12,
      38,
      9
    );

    /*
     * ABDÔMEN
     */

    g.fillStyle(0x263238, 1);

    g.fillEllipse(
      9,
      0,
      25,
      19
    );

    /*
     * TÓRAX
     */

    g.fillCircle(
      -7,
      0,
      10
    );

    /*
     * CABEÇA
     */

    g.fillCircle(
      -20,
      -1,
      9
    );

    /*
     * OLHO
     */

    g.fillStyle(0xffffff, 1);

    g.fillCircle(
      -23,
      -4,
      2.5
    );

    /*
     * PUPILA
     */

    g.fillStyle(0x111111, 1);

    g.fillCircle(
      -23,
      -4,
      1
    );

    /*
     * ANTENAS
     */

    g.lineStyle(
      2,
      0x263238,
      1
    );

    g.beginPath();

    g.moveTo(-24, -8);
    g.lineTo(-31, -16);
    g.lineTo(-36, -17);

    g.strokePath();

    g.beginPath();

    g.moveTo(-18, -9);
    g.lineTo(-20, -17);
    g.lineTo(-17, -21);

    g.strokePath();

    /*
     * PERNAS
     */

    this.drawLeg(
      g,
      -7,
      -5,
      -15,
      -13
    );

    this.drawLeg(
      g,
      0,
      -5,
      4,
      -14
    );

    this.drawLeg(
      g,
      7,
      -4,
      15,
      -11
    );

    this.drawLeg(
      g,
      -7,
      5,
      -15,
      13
    );

    this.drawLeg(
      g,
      0,
      5,
      4,
      14
    );

    this.drawLeg(
      g,
      7,
      4,
      15,
      11
    );

    /*
     * COMIDA
     */

    if (this.food) {
      g.fillStyle(
        0xffc93c,
        1
      );

      g.fillCircle(
        25,
        -4,
        6
      );

      g.lineStyle(
        1.5,
        0xd99f00,
        1
      );

      g.strokeCircle(
        25,
        -4,
        6
      );
    }

    g.setPosition(
      this.x,
      this.y
    );

    /*
     * Espelha a formiga
     */

    g.setScale(
      this.direction,
      1
    );
  }

  // =====================================================
  // PERNAS
  // =====================================================

  drawLeg(g, x1, y1, x2, y2) {
    g.lineStyle(
      2,
      0x263238,
      1
    );

    g.beginPath();

    g.moveTo(
      x1,
      y1
    );

    g.lineTo(
      x2,
      y2
    );

    g.strokePath();
  }

  // =====================================================
  // UPDATE
  // =====================================================

  update(delta) {
    this.walkTime += delta;

    switch (this.state) {
      case 'WANDERING':
        this.wander(delta);
        break;

      case 'SEARCHING':
        this.searchFood(delta);
        break;

      case 'CARRYING':
        this.returnToColony(delta);
        break;

      case 'DEPOSITING':
        this.depositFood();
        break;
    }

    this.animate(delta);

    this.body.setPosition(
      this.x,
      this.y
    );

    this.body.setScale(
      this.direction,
      1
    );
  }

  // =====================================================
  // ANDAR ALEATORIAMENTE
  // =====================================================

  wander(delta) {
    this.x +=
      this.direction *
      this.speed *
      (delta / 1000);

    this.changeDirectionTimer -= delta;

    if (
      this.changeDirectionTimer <= 0
    ) {
      this.changeDirectionTimer =
        Phaser.Math.Between(
          1200,
          3500
        );

      /*
       * Pequena chance de
       * começar a procurar comida
       */

      if (
        Phaser.Math.Between(
          0,
          100
        ) < 40
      ) {
        this.state =
          'SEARCHING';
      } else {
        this.direction *= -1;
      }
    }

    this.keepInside();
  }

  // =====================================================
  // PROCURAR COMIDA
  // =====================================================

  searchFood(delta) {
    const foods =
      this.scene.foods || [];

    if (foods.length === 0) {
      this.state =
        'WANDERING';

      return;
    }

    /*
     * Procura a comida mais próxima
     */

    let closest = null;

    let closestDistance =
      Infinity;

    for (const food of foods) {
      if (food.taken) continue;

      const distance =
        Phaser.Math.Distance.Between(
          this.x,
          this.y,
          food.x,
          food.y
        );

      if (
        distance <
        closestDistance
      ) {
        closestDistance =
          distance;

        closest = food;
      }
    }

    /*
     * Nenhuma comida disponível
     */

    if (!closest) {
      this.state =
        'WANDERING';

      return;
    }

    this.targetFood =
      closest;

    /*
     * Anda em direção à comida
     */

    this.moveTowards(
      closest.x,
      closest.y,
      delta
    );

    /*
     * Chegou
     */

    const distance =
      Phaser.Math.Distance.Between(
        this.x,
        this.y,
        closest.x,
        closest.y
      );

    if (distance < 18) {
      this.pickFood();
    }
  }

  // =====================================================
  // PEGAR COMIDA
  // =====================================================

  pickFood() {
    if (!this.targetFood) return;

    if (
      this.targetFood.taken
    ) {
      this.targetFood = null;

      this.state =
        'WANDERING';

      return;
    }

    this.targetFood.taken = true;

    this.food =
      this.targetFood;

    this.targetFood =
      null;

    /*
     * Remove a comida
     * do cenário
     */

    this.food.destroy();

    this.food = true;

    /*
     * Volta para a colônia
     */

    this.state =
      'CARRYING';
  }

  // =====================================================
  // VOLTAR PARA COLÔNIA
  // =====================================================

  returnToColony(delta) {
    const entranceX =
      this.scene.scale.width / 2;

    const entranceY =
      this.scene.groundY + 5;

    this.moveTowards(
      entranceX,
      entranceY,
      delta
    );

    const distance =
      Phaser.Math.Distance.Between(
        this.x,
        this.y,
        entranceX,
        entranceY
      );

    if (distance < 22) {
      this.state =
        'DEPOSITING';
    }
  }

  // =====================================================
  // DEPOSITAR
  // =====================================================

  depositFood() {
    /*
     * A comida foi entregue.
     */

    this.food = null;

    this.scene.colonyFood =
      (this.scene.colonyFood || 0) + 1;

    /*
     * Pequena chance de comemorar
     */

    this.scene.showFoodMessage?.();

    /*
     * Volta a andar
     */

    this.direction =
      Phaser.Math.Between(
        0,
        1
      ) === 0
        ? -1
        : 1;

    this.state =
      'WANDERING';

    this.changeDirectionTimer =
      Phaser.Math.Between(
        1000,
        3000
      );
  }

  // =====================================================
  // MOVIMENTO
  // =====================================================

  moveTowards(
    targetX,
    targetY,
    delta
  ) {
    const angle =
      Phaser.Math.Angle.Between(
        this.x,
        this.y,
        targetX,
        targetY
      );

    this.x +=
      Math.cos(angle) *
      this.speed *
      (delta / 1000);

    this.y +=
      Math.sin(angle) *
      this.speed *
      (delta / 1000);

    if (
      Math.cos(angle) > 0
    ) {
      this.direction = 1;
    } else {
      this.direction = -1;
    }
  }

  // =====================================================
  // LIMITES
  // =====================================================

  keepInside() {
    const width =
      this.scene.scale.width;

    if (this.x < 40) {
      this.x = 40;
      this.direction = 1;
    }

    if (
      this.x >
      width - 40
    ) {
      this.x =
        width - 40;

      this.direction = -1;
    }
  }

  // =====================================================
  // ANIMAÇÃO
  // =====================================================

  animate(delta) {
    const walking =
      Math.sin(
        this.walkTime * 0.025
      );

    /*
     * Pequeno balanço vertical
     */

    this.body.y =
      this.y +
      walking * 1.5;
  }
showFoodMessage() {
  const message =
    this.scene.add.text(
      this.scene.scale.width / 2,
      this.scene.groundY - 45,
      '+1 alimento!',
      {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#123524',
        fontStyle: 'bold',
      }
    )
    .setOrigin(0.5);

  this.scene.tweens.add({
    targets: message,
    y: message.y - 30,
    alpha: 0,
    duration: 1000,
    onComplete: () => {
      message.destroy();
    },
  });
}
}