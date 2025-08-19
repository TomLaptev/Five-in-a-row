import Button from '../components/Button';
import { GameConfig } from '../GameConfig';
import { Images } from '../utils/const';
import store from '../store';

export class StartScene extends Phaser.Scene {
  topTitle: Button;
  soundButton: Button;
  playButton: Button;
  winnersButton: Button;
  vsComputerButton: Button;
  forTwoButton: Button;
  onlineButton: Button;
  confirmButton: Button;
  popUp: any;
  exitFromGamePopUp: any;
  isMusicEnabled: boolean;
  texts: Record<string, Record<string, string>> = {};
  world: any;
  backButton: any;
  pointer: Phaser.Input.Pointer;
  constructor() {
    super({
      key: 'Start'
    });
  }

  preload() {
    this.load.json("texts", "assets/texts.json");
  }

  create() {
    //store.lang = 'zh';
    this.texts = this.cache.json.get("texts");

    this.createBackground();
    this.createWordl();
    this.createNameGame();

    this.createSoundButton();
    this.input.once('pointerdown', () => {
      if (store.isMusicEnabled) {
        this.game.sound.resumeAll();
      }
    });

    this.createWinnersButton();

    this.createPlayButton();
    if (store.isVsComputer || store.isForTwo || store.isGameOnline) {
      this.createPlayButtonActions();
      this.createBackButton();
      store.isGameOnline = false;
      store.isVsComputer = false;
      store.isForTwo = false;
    }

    (window as any).ysdk?.features?.GameplayAPI?.stop?.();
    store.isGameStarted = true;
  };

  createBackground() {
    if (GameConfig.width == 2800) {
      this.add.sprite(0, 0, Images.BACKGROUND_H).setOrigin(0, 0);
    }
    else {
      this.add.sprite(0, 0, Images.BACKGROUND_V).setOrigin(0, 0);
    }
  }

  createWordl() {
    this.world = this.add
      .sprite(
        this.cameras.main.centerX - 345,
        this.cameras.main.centerY - 170,
        Images.WORLD
      )
      .setOrigin(0, 0);
  }

  createPopUp(alpha: number) {
    this.popUp = this.add.sprite(this.cameras.main.centerX - 300,
      this.cameras.main.centerY - 230,
      Images.POPUP).setOrigin(0, 0)
      .setAlpha(alpha);
  }

  createBackButton() {
    this.backButton = this.add.sprite(this.cameras.main.centerX + 158,
      this.cameras.main.centerY + 215, Images.BACK_BUTTON)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        if (pointer.rightButtonDown()) {
          return; // Игнорируем правую кнопку, ничего не делаем
        }
        this.scene.start("Start");
      })
  }

  createLogIn() {
    const yesText = this.texts[store.lang]?.yesText || this.texts["en"]?.yesText;
    let confirmAuth: Button = new Button(
      this,
      this.cameras.main.centerX,
      this.cameras.main.centerY + 140,
      null,
      null,
      '#ffffff',
      Images.CONFIRM,
      'BadComic-Regular',
      36,
      yesText,
      async () => {
        if (!(window as any).player.isAuthorized()) {
          await (window as any).ysdk.auth.openAuthDialog().then(() => {
            this.scene.start("Boot");
          })
            .catch(() => {
              // Игрок не авторизован.
            });
        }
      }
    )
  }

  createNameGame() {
    const gameName = this.texts[store.lang]?.gameName || this.texts["en"]?.gameName
    const gameNameText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 300,
      gameName,
      {
        font: "54px BadComic-Regular",
        color: "#f5ebdf",
        align: "center", // Выравнивание по центру
      });

    gameNameText.setOrigin(0.5, 0.5);
  }

  createLogInLater() {
    this.add.sprite(this.cameras.main.centerX + 250,
      this.cameras.main.centerY - 240, Images.CANCEL)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        if (pointer.rightButtonDown()) {
          return; // Игнорируем правую кнопку, ничего не делаем
        }
        this.scene.start("Start");
      })
  }

  createSoundButton() {
    let data: string = localStorage.getItem('isSoundEnable');
    this.soundButton = new Button(
      this,
      this.cameras.main.centerX - 200,
      this.cameras.main.centerY + 250,
      null,
      null,
      '#d9d9e6',
      Images.BUTTON_SOUND,
      'BadComic-Regular',
      20,
      data === 'true' ? '' : '         X',
      () => {
        if (store.isMusicEnabled) {
          this.game.sound.pauseAll();
          localStorage.setItem('isSoundEnable', 'false');
        } else {
          this.game.sound.resumeAll();
          localStorage.setItem('isSoundEnable', 'true');
        }
        store.isMusicEnabled = !store.isMusicEnabled;
        this.soundButton.container.destroy();
        this.createSoundButton();
      }
    );
  }

  createWinnersButton() {
    const loginText = this.texts[store.lang]?.loginText || this.texts["en"]?.loginText

    this.winnersButton = new Button(
      this,
      this.cameras.main.centerX - 10,
      this.cameras.main.centerY + 250,
      null, null, null,
      Images.BUTTON_WINNERS,
      null, null, null,
      async () => {
        this.winnersButton.container.destroy();
        this.playButton.container.destroy();
        if (store.isAuth) {
          try {
            await (window as any).ysdk.leaderboards.getEntries('mainLeaderboard', { quantityTop: 5, includeUser: true, quantityAround: 1 })
              .then((res: any) => store.allPlayers = res)
          }
          catch (e) {
            console.log('запрос LeaderboardPlayerEntries', e);
          }
          this.scene.start('Leaders');
        } else {
          this.world.destroy();
          this.soundButton.container.destroy();

          this.createPopUp(0.4);

          const loginTextBlock = this.add.text(this.popUp.x + this.popUp.width * 0.5, this.popUp.y + 170,
            loginText,
            {
              font: "40px BadComic-Regular",
              color: "#d9d9e6",
              align: "center",
            });
          loginTextBlock.setOrigin(0.5, 0.5);
        }

        //Согласие на авторизацию
        this.createLogIn();

        //Отказ от  авторизации	
        this.createLogInLater()

      }
    );
  }

  createPlayButton() {
    this.playButton = new Button(
      this,
      this.cameras.main.centerX + 200,
      this.cameras.main.centerY + 250,
      null, null, null,
      Images.PLAY_BUTTON,
      null, null, null,
      () => {
        this.createBackButton();
        this.createPlayButtonActions();
      }

    );
  }

  createPlayButtonActions() {
    const vsCompText = this.texts[store.lang]?.vsCompText || this.texts["en"]?.vsCompText;
    const forTwoText = this.texts[store.lang]?.forTwoText || this.texts["en"]?.forTwoText;
    const onlineText = this.texts[store.lang]?.onlineText || this.texts["en"]?.onlineText;
    this.winnersButton.container.destroy();
    this.playButton.container.destroy();

    this.world.destroy();
    this.createPopUp(0.4);

    this.vsComputerButton = new Button(
      this,
      this.cameras.main.centerX - 0,
      this.cameras.main.centerY - 120,
      null, null, '#f5ebdf',
      Images.SELECT_MODE,
      'BadComic-Regular',
      30,
      vsCompText,
      async () => {
        store.isVsComputer = true;
        store.isForTwo = false;
        store.isGameOnline = false;
        if (await (window as any).ysdk) {
          (window as any).ysdk.adv.showFullscreenAdv({
            callbacks: {
              onClose: (wasShown: boolean) => {
                console.log("============ closed =====");
                this.scene.start("Game");
                this.game.sound.mute = false;
              },
              onOpen: (opened: boolean) => {
                console.log("===== OPENED!!! =====");
                this.game.sound.pauseAll();

                // Принудительно отключаем звук (временно)
                this.game.sound.mute = true;
              },
              onError: function (error: boolean) {
                // some action on error
                console.log("===== ERROR =====");
              }
            }
          })
        }

      }
    );

    this.forTwoButton = new Button(
      this,
      this.cameras.main.centerX - 0,
      this.cameras.main.centerY - 0,
      null, null, '#f5ebdf',
      Images.SELECT_MODE,
      'BadComic-Regular',
      30,
      forTwoText,
      () => {
        store.isForTwo = true;
        store.isVsComputer = false;
        store.isGameOnline = false;
        this.scene.start("Game");
      }
    );

    this.onlineButton = new Button(
      this,
      this.cameras.main.centerX - 0,
      this.cameras.main.centerY + 120,
      null, null, '#f5ebdf',
      Images.SELECT_MODE,
      'BadComic-Regular',
      30,
      onlineText,
      async () => {
        store.isVsComputer = false;
        store.isForTwo = false;
        if (await (window as any).ysdk) {
          (window as any).ysdk.adv.showFullscreenAdv({
            callbacks: {
              onClose: (wasShown: boolean) => {
                console.log("============ closed =====");
                store.isGameOnline = true;
                this.scene.start("Game");
                this.game.sound.mute = false;

              },
              onOpen: (opened: boolean) => {
                console.log("===== OPENED!!! =====");
                this.game.sound.pauseAll();

                // Принудительно отключаем звук (временно)
                this.game.sound.mute = true;
              },
              onError: function (error: boolean) {
                // some action on error
                console.log("===== ERROR =====");
              }
            }
          })
        }
      }
    );
  }
}