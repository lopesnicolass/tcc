import Phaser from 'phaser';

export default class TerrariumScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'TerrariumScene',
    });

    this.W = 1200;
    this.H = 620;

    this.groundY = 355;

    this.clouds = [];
    this.fireflies = [];
    this.dust = [];
  }

  // =========================================================
  // CREATE
  // =========================================================

  create() {
    this.createSky();

    this.createSun();

    this.createClouds();

    this.createHorizon();

    this.createSurface();

    this.createVegetation();

    this.createRocks();

    this.createWater();

    this.createSoil();

    this.createRoots();

    this.createColony();

    this.createAtmosphere();

    this.createInterface();

    this.createAmbientAnimation();
  }

  // =========================================================
  // CÉU
  // =========================================================

  createSky() {
    const sky = this.add.graphics();

    /*
     * Criamos o céu em várias faixas.
     * Isso simula um degradê sem precisar
     * de imagem externa.
     */

    const colors = [
      0x9ED6F5,
      0xA9DCF7,
      0xB7E2F9,
      0xC6E9FA,
      0xD5EFFB,
    ];

    const bandHeight =
      this.groundY / colors.length;

    colors.forEach((color, index) => {
      sky.fillStyle(color, 1);

      sky.fillRect(
        0,
        index * bandHeight,
        this.W,
        bandHeight + 3
      );
    });

    /*
     * Brilho central do céu
     */

    const glow = this.add.graphics();

    glow.fillStyle(
      0xFFFFFF,
      0.08
    );

    glow.fillCircle(
      600,
      190,
      260
    );
  }

  // =========================================================
  // SOL
  // =========================================================

  createSun() {
    /*
     * Halo externo
     */

    const halo = this.add.graphics();

    halo.fillStyle(
      0xFFD75A,
      0.13
    );

    halo.fillCircle(
      125,
      105,
      72
    );

    /*
     * Segundo halo
     */

    halo.fillStyle(
      0xFFD75A,
      0.16
    );

    halo.fillCircle(
      125,
      105,
      58
    );

    /*
     * Sol
     */

    const sun = this.add.graphics();

    sun.fillStyle(
      0xFFCB45,
      1
    );

    sun.fillCircle(
      125,
      105,
      42
    );

    /*
     * Brilho
     */

    sun.fillStyle(
      0xFFE99A,
      0.45
    );

    sun.fillCircle(
      113,
      92,
      10
    );
  }

  // =========================================================
  // NUVENS
  // =========================================================

  createClouds() {
    const cloudData = [
      {
        x: 330,
        y: 105,
        scale: 1,
        speed: 0.08,
      },
      {
        x: 720,
        y: 155,
        scale: 0.75,
        speed: 0.05,
      },
      {
        x: 1040,
        y: 80,
        scale: 0.6,
        speed: 0.07,
      },
    ];

    cloudData.forEach((data) => {
      const cloud =
        this.createCloud(
          data.x,
          data.y,
          data.scale
        );

      cloud.speed = data.speed;

      this.clouds.push(cloud);
    });
  }

  createCloud(x, y, scale = 1) {
    const cloud =
      this.add.container(
        x,
        y
      );

    const g =
      this.add.graphics();

    /*
     * Sombra da nuvem
     */

    g.fillStyle(
      0xD5EAF6,
      0.45
    );

    g.fillEllipse(
      0,
      12,
      115 * scale,
      28 * scale
    );

    /*
     * Corpo da nuvem
     */

    g.fillStyle(
      0xFFFFFF,
      0.92
    );

    g.fillEllipse(
      -35 * scale,
      8 * scale,
      55 * scale,
      38 * scale
    );

    g.fillEllipse(
      0,
      0,
      72 * scale,
      52 * scale
    );

    g.fillEllipse(
      35 * scale,
      9 * scale,
      58 * scale,
      36 * scale
    );

    cloud.add(g);

    return cloud;
  }

  // =========================================================
  // HORIZONTE
  // =========================================================

  createHorizon() {
    const horizon =
      this.add.graphics();

    /*
     * Morros distantes
     */

    horizon.fillStyle(
      0x91C8A0,
      0.45
    );

    horizon.beginPath();

    horizon.moveTo(0, this.groundY);

    horizon.lineTo(0, 300);

    horizon.lineTo(130, 280);

    horizon.lineTo(250, 305);

    horizon.lineTo(380, 275);

    horizon.lineTo(510, 305);

    horizon.lineTo(650, 270);

    horizon.lineTo(780, 300);

    horizon.lineTo(930, 275);

    horizon.lineTo(1080, 305);

    horizon.lineTo(1200, 280);

    horizon.lineTo(
      1200,
      this.groundY
    );

    horizon.closePath();

    horizon.fillPath();

    /*
     * Segundo plano verde
     */

    horizon.fillStyle(
      0x63AD78,
      0.55
    );

    horizon.beginPath();

    horizon.moveTo(0, this.groundY);

    horizon.lineTo(0, 330);

    horizon.lineTo(180, 315);

    horizon.lineTo(350, 325);

    horizon.lineTo(540, 305);

    horizon.lineTo(730, 325);

    horizon.lineTo(910, 310);

    horizon.lineTo(1060, 325);

    horizon.lineTo(1200, 305);

    horizon.lineTo(
      1200,
      this.groundY
    );

    horizon.closePath();

    horizon.fillPath();
  }

  // =========================================================
  // SUPERFÍCIE
  // =========================================================

  createSurface() {
    const surface =
      this.add.graphics();

    /*
     * Terra principal
     */

    surface.fillStyle(
      0x765044,
      1
    );

    surface.fillRect(
      0,
      this.groundY,
      this.W,
      this.H - this.groundY
    );

    /*
     * Camada superior da terra
     */

    surface.fillStyle(
      0x896052,
      1
    );

    surface.fillRect(
      0,
      this.groundY,
      this.W,
      18
    );

    /*
     * Linha de grama
     */

    surface.fillStyle(
      0x3E914D,
      1
    );

    surface.fillRect(
      0,
      this.groundY - 6,
      this.W,
      7
    );

    /*
     * Pequenos tufos de grama
     */

    for (
      let x = 8;
      x < this.W;
      x += 24
    ) {
      const height =
        Phaser.Math.Between(
          4,
          11
        );

      surface.lineStyle(
        2,
        0x3B8749,
        1
      );

      surface.beginPath();

      surface.moveTo(
        x,
        this.groundY
      );

      surface.lineTo(
        x - 3,
        this.groundY - height
      );

      surface.moveTo(
        x,
        this.groundY
      );

      surface.lineTo(
        x + 4,
        this.groundY - height - 2
      );

      surface.strokePath();
    }
  }

  // =========================================================
  // VEGETAÇÃO
  // =========================================================

  createVegetation() {
    const plants = [
      {
        x: 85,
        scale: 1.05,
      },
      {
        x: 230,
        scale: 0.8,
      },
      {
        x: 900,
        scale: 0.95,
      },
      {
        x: 1080,
        scale: 1.1,
      },
    ];

    plants.forEach(
      (plant) => {
        this.createPlant(
          plant.x,
          this.groundY,
          plant.scale
        );
      }
    );

    /*
     * Flores
     */

    const flowers = [
      [145, 340],
      [285, 338],
      [835, 341],
      [970, 337],
      [1140, 340],
    ];

    flowers.forEach(
      ([x, y], index) => {
        this.createFlower(
          x,
          y,
          index
        );
      }
    );
  }

  createPlant(x, y, scale = 1) {
    const plant =
      this.add.container(
        x,
        y
      );

    const g =
      this.add.graphics();

    /*
     * caule
     */

    g.lineStyle(
      7 * scale,
      0x3D9250,
      1
    );

    g.beginPath();

    g.moveTo(
      0,
      0
    );

    g.lineTo(
      0,
      -58 * scale
    );

    g.lineTo(
      22 * scale,
      -78 * scale
    );

    g.strokePath();

    /*
     * galho esquerdo
     */

    g.beginPath();

    g.moveTo(
      0,
      -34 * scale
    );

    g.lineTo(
      -28 * scale,
      -53 * scale
    );

    g.strokePath();

    /*
     * folhas
     */

    g.fillStyle(
      0x39A952,
      1
    );

    g.fillEllipse(
      27 * scale,
      -82 * scale,
      38 * scale,
      18 * scale
    );

    g.fillEllipse(
      -32 * scale,
      -57 * scale,
      36 * scale,
      17 * scale
    );

    /*
     * brilho das folhas
     */

    g.fillStyle(
      0x72C878,
      0.7
    );

    g.fillEllipse(
      23 * scale,
      -85 * scale,
      17 * scale,
      6 * scale
    );

    g.fillEllipse(
      -37 * scale,
      -60 * scale,
      15 * scale,
      6 * scale
    );

    plant.add(g);
  }

  createFlower(x, y, index) {
    const flower =
      this.add.container(
        x,
        y
      );

    const g =
      this.add.graphics();

    /*
     * caule
     */

    g.lineStyle(
      2,
      0x3B8E4C,
      1
    );

    g.lineBetween(
      0,
      0,
      0,
      -15
    );

    /*
     * pétalas
     */

    const petalColors = [
      0xFF8A65,
      0xFFC93C,
      0x90CAF9,
      0xE78AC3,
    ];

    const color =
      petalColors[
        index %
        petalColors.length
      ];

    g.fillStyle(
      color,
      1
    );

    g.fillCircle(
      -5,
      -17,
      5
    );

    g.fillCircle(
      5,
      -17,
      5
    );

    g.fillCircle(
      0,
      -22,
      5
    );

    g.fillCircle(
      0,
      -13,
      5
    );

    /*
     * centro
     */

    g.fillStyle(
      0xFFD54F,
      1
    );

    g.fillCircle(
      0,
      -17,
      3
    );

    flower.add(g);
  }

  // =========================================================
  // PEDRAS
  // =========================================================

  createRocks() {
    const rocks = [
      {
        x: 175,
        y: this.groundY + 45,
        w: 72,
        h: 42,
      },
      {
        x: 430,
        y: this.groundY + 90,
        w: 50,
        h: 30,
      },
      {
        x: 800,
        y: this.groundY + 60,
        w: 62,
        h: 36,
      },
      {
        x: 1030,
        y: this.groundY + 105,
        w: 78,
        h: 43,
      },
    ];

    rocks.forEach(
      (rock) => {
        this.createRock(
          rock.x,
          rock.y,
          rock.w,
          rock.h
        );
      }
    );
  }

  createRock(
    x,
    y,
    width,
    height
  ) {
    const g =
      this.add.graphics();

    /*
     * sombra
     */

    g.fillStyle(
      0x3F2E2A,
      0.22
    );

    g.fillEllipse(
      x + 4,
      y + height * 0.42,
      width + 12,
      height * 0.45
    );

    /*
     * pedra
     */

    g.fillStyle(
      0x73878D,
      1
    );

    g.fillEllipse(
      x,
      y,
      width,
      height
    );

    /*
     * parte clara
     */

    g.fillStyle(
      0x9BAFB4,
      0.75
    );

    g.fillEllipse(
      x - width * 0.15,
      y - height * 0.12,
      width * 0.55,
      height * 0.3
    );

    /*
     * contorno
     */

    g.lineStyle(
      3,
      0x536A70,
      1
    );

    g.strokeEllipse(
      x,
      y,
      width,
      height
    );
  }

  // =========================================================
  // ÁGUA
  // =========================================================

  createWater() {
    const pools = [
      {
        x: 310,
        y: this.groundY + 42,
        w: 70,
        h: 28,
      },
      {
        x: 940,
        y: this.groundY + 48,
        w: 82,
        h: 31,
      },
    ];

    pools.forEach(
      (pool) => {
        const g =
          this.add.graphics();

        g.fillStyle(
          0x263E43,
          0.18
        );

        g.fillEllipse(
          pool.x + 3,
          pool.y + 3,
          pool.w + 8,
          pool.h + 5
        );

        g.fillStyle(
          0x79B7C8,
          1
        );

        g.fillEllipse(
          pool.x,
          pool.y,
          pool.w,
          pool.h
        );

        g.fillStyle(
          0xB8E4EE,
          0.5
        );

        g.fillEllipse(
          pool.x - 10,
          pool.y - 5,
          pool.w * 0.42,
          pool.h * 0.3
        );

        g.lineStyle(
          3,
          0x527F8A,
          1
        );

        g.strokeEllipse(
          pool.x,
          pool.y,
          pool.w,
          pool.h
        );
      }
    );
  }

  // =========================================================
  // TEXTURA DA TERRA
  // =========================================================

  createSoil() {
    const soil =
      this.add.graphics();

    /*
     * Partículas maiores
     */

    for (let i = 0; i < 130; i++) {
      const x =
        Phaser.Math.Between(
          15,
          this.W - 15
        );

      const y =
        Phaser.Math.Between(
          this.groundY + 25,
          this.H - 10
        );

      const radius =
        Phaser.Math.FloatBetween(
          1,
          3.5
        );

      const alpha =
        Phaser.Math.FloatBetween(
          0.08,
          0.2
        );

      soil.fillStyle(
        0x4B342E,
        alpha
      );

      soil.fillCircle(
        x,
        y,
        radius
      );
    }

    /*
     * Pequenos grãos claros
     */

    for (let i = 0; i < 70; i++) {
      const x =
        Phaser.Math.Between(
          15,
          this.W - 15
        );

      const y =
        Phaser.Math.Between(
          this.groundY + 20,
          this.H - 10
        );

      soil.fillStyle(
        0xB17D68,
        0.12
      );

      soil.fillCircle(
        x,
        y,
        1.5
      );
    }
  }

  // =========================================================
  // RAÍZES
  // =========================================================

  createRoots() {
    const roots =
      this.add.graphics();

    roots.lineStyle(
      6,
      0x4D332C,
      0.8
    );

    /*
     * raiz esquerda
     */

    roots.beginPath();

    roots.moveTo(
      95,
      this.groundY
    );

    roots.lineTo(
      115,
      415
    );

    roots.lineTo(
      150,
      455
    );

    roots.lineTo(
      175,
      505
    );

    roots.strokePath();

    roots.beginPath();

    roots.moveTo(
      115,
      415
    );

    roots.lineTo(
      75,
      450
    );

    roots.strokePath();

    /*
     * raiz direita
     */

    roots.beginPath();

    roots.moveTo(
      1080,
      this.groundY
    );

    roots.lineTo(
      1060,
      410
    );

    roots.lineTo(
      1025,
      455
    );

    roots.lineTo(
      1000,
      505
    );

    roots.strokePath();

    roots.beginPath();

    roots.moveTo(
      1060,
      410
    );

    roots.lineTo(
      1110,
      450
    );

    roots.strokePath();
  }

  // =========================================================
  // COLÔNIA
  // =========================================================

  createColony() {
    /*
     * A colônia fica centralizada.
     */

    const cx = 600;

    /*
     * Sombra geral
     */

    const shadow =
      this.add.graphics();

    shadow.fillStyle(
      0x34231F,
      0.3
    );

    shadow.fillEllipse(
      cx,
      565,
      500,
      110
    );

    /*
     * Câmara esquerda
     */

    this.createChamber(
      450,
      485,
      190,
      120
    );

    /*
     * Câmara principal
     */

    this.createChamber(
      600,
      490,
      260,
      160
    );

    /*
     * Câmara direita
     */

    this.createChamber(
      770,
      500,
      180,
      115
    );

    /*
     * Túnel vertical
     */

    this.createTunnel(
      600,
      this.groundY + 3,
      600,
      440,
      34
    );

    /*
     * Túneis laterais
     */

    this.createTunnel(
      600,
      440,
      490,
      485,
      28
    );

    this.createTunnel(
      600,
      455,
      735,
      500,
      28
    );

    /*
     * Entrada
     */

    this.createEntrance(
      cx,
      this.groundY
    );

    /*
     * Câmara central interna
     */

    this.createNestCenter(
      cx,
      505
    );
  }

  createChamber(
    x,
    y,
    width,
    height
  ) {
    const g =
      this.add.graphics();

    /*
     * sombra
     */

    g.fillStyle(
      0x3C2925,
      0.45
    );

    g.fillEllipse(
      x + 5,
      y + 7,
      width + 14,
      height + 12
    );

    /*
     * interior
     */

    g.fillStyle(
      0x9A7061,
      1
    );

    g.fillEllipse(
      x,
      y,
      width,
      height
    );

    /*
     * iluminação da parte superior
     */

    g.fillStyle(
      0xC29A87,
      0.28
    );

    g.fillEllipse(
      x - 10,
      y - 15,
      width * 0.7,
      height * 0.42
    );

    /*
     * borda
     */

    g.lineStyle(
      5,
      0x51372F,
      1
    );

    g.strokeEllipse(
      x,
      y,
      width,
      height
    );
  }

  createTunnel(
    x1,
    y1,
    x2,
    y2,
    width
  ) {
    const g =
      this.add.graphics();

    /*
     * túnel externo
     */

    g.lineStyle(
      width + 12,
      0x4A302A,
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

    /*
     * interior do túnel
     */

    g.lineStyle(
      width,
      0x6D4A3E,
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

    /*
     * luz suave no centro
     */

    g.lineStyle(
      5,
      0x9A6F60,
      0.18
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

  // =========================================================
  // ENTRADA DA COLÔNIA
  // =========================================================

  createEntrance(x, y) {
    const g =
      this.add.graphics();

    /*
     * sombra
     */

    g.fillStyle(
      0x34231F,
      0.4
    );

    g.fillEllipse(
      x,
      y + 5,
      100,
      38
    );

    /*
     * buraco
     */

    g.fillStyle(
      0x352420,
      1
    );

    g.fillEllipse(
      x,
      y,
      82,
      32
    );

    /*
     * borda de terra
     */

    g.lineStyle(
      5,
      0x51372F,
      1
    );

    g.strokeEllipse(
      x,
      y,
      88,
      38
    );

    /*
     * pequenos pedaços de terra
     */

    g.fillStyle(
      0xA57764,
      1
    );

    g.fillCircle(
      x - 55,
      y + 5,
      5
    );

    g.fillCircle(
      x + 50,
      y + 7,
      4
    );

    g.fillCircle(
      x - 40,
      y + 14,
      3
    );
  }

  // =========================================================
  // INTERIOR DO NINHO
  // =========================================================

  createNestCenter(x, y) {
    const g =
      this.add.graphics();

    /*
     * plataforma
     */

    g.fillStyle(
      0xAD8170,
      0.8
    );

    g.fillEllipse(
      x,
      y,
      170,
      80
    );

    /*
     * brilho central
     */

    g.fillStyle(
      0xD5AD99,
      0.2
    );

    g.fillEllipse(
      x - 15,
      y - 10,
      100,
      35
    );

    /*
     * ovos
     */

    const eggs = [
      [-45, 8],
      [-28, 15],
      [-10, 6],
      [10, 14],
      [28, 7],
      [45, 15],
    ];

    eggs.forEach(
      ([dx, dy]) => {
        g.fillStyle(
          0xF8F1DD,
          1
        );

        g.fillEllipse(
          x + dx,
          y + dy,
          17,
          12
        );

        g.lineStyle(
          1.5,
          0xD4C9AD,
          1
        );

        g.strokeEllipse(
          x + dx,
          y + dy,
          17,
          12
        );
      }
    );
  }

  // =========================================================
  // ATMOSFERA
  // =========================================================

  createAtmosphere() {
    /*
     * Camada de luz na superfície
     */

    const light =
      this.add.graphics();

    light.fillStyle(
      0xFFFFFF,
      0.035
    );

    light.fillRect(
      0,
      0,
      this.W,
      this.groundY
    );

    /*
     * Partículas de poeira
     */

    for (let i = 0; i < 30; i++) {
      const particle =
        this.add.circle(
          Phaser.Math.Between(
            0,
            this.W
          ),
          Phaser.Math.Between(
            40,
            this.groundY - 20
          ),
          Phaser.Math.FloatBetween(
            1,
            2.5
          ),
          0xFFFFFF,
          0.25
        );

      particle.speed =
        Phaser.Math.FloatBetween(
          0.1,
          0.35
        );

      particle.baseX =
        particle.x;

      particle.phase =
        Phaser.Math.FloatBetween(
          0,
          Math.PI * 2
        );

      this.dust.push(
        particle
      );
    }
  }

  // =========================================================
  // ANIMAÇÕES
  // =========================================================

  createAmbientAnimation() {
    /*
     * Nuvens
     */

    this.clouds.forEach(
      (cloud) => {
        this.tweens.add({
          targets: cloud,

          x:
            cloud.x + 35,

          duration: 9000,

          ease: 'Sine.inOut',

          yoyo: true,

          repeat: -1,
        });
      }
    );

    /*
     * Flores balançando
     */

    this.tweens.add({
      targets:
        this.children.list.filter(
          (child) =>
            child.type === 'Container'
        ),

      angle: 1.5,

      duration: 1800,

      ease: 'Sine.inOut',

      yoyo: true,

      repeat: -1,
    });
  }

  // =========================================================
  // INTERFACE DENTRO DO JOGO
  // =========================================================

  createInterface() {
    /*
     * Placa pequena
     */

    const panel =
      this.add.graphics();

    panel.fillStyle(
      0x123524,
      0.78
    );

    panel.fillRoundedRect(
      20,
      20,
      190,
      58,
      16
    );

    panel.fillStyle(
      0x38B85E,
      1
    );

    panel.fillCircle(
      43,
      49,
      7
    );

    this.add.text(
      60,
      34,
      'COLÔNIA ATIVA',
      {
        fontFamily:
          'Arial',

        fontSize:
          '16px',

        fontStyle:
          'bold',

        color:
          '#FFFFFF',
      }
    );

    this.add.text(
      60,
      54,
      'Terrário nível 1',
      {
        fontFamily:
          'Arial',

        fontSize:
          '12px',

        color:
          '#B8E7C4',
      }
    );
  }

  // =========================================================
  // UPDATE
  // =========================================================

  update(time, delta) {
    /*
     * Movimento suave das partículas.
     */

    this.dust.forEach(
      (particle) => {
        particle.y -=
          particle.speed *
          (delta / 16);

        particle.x =
          particle.baseX +
          Math.sin(
            time * 0.001 +
            particle.phase
          ) *
          12;

        if (
          particle.y <
          20
        ) {
          particle.y =
            this.groundY - 20;
        }
      }
    );
  }
}