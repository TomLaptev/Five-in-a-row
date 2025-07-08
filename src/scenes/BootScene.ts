import SoundManager from "../components/SoundManager";
import store from "../store";

export class BootScene extends Phaser.Scene {
  private loadingBar: Phaser.GameObjects.Graphics;
  private progressBar: Phaser.GameObjects.Graphics;
  playerName: string;
  texts: Record<string, Record<string, string>> = {};

  constructor() {
    super({
      key: 'Boot',
    });
  }

  private loadTitleWithTranslation(): void {
    // Здесь логика для перевода заголовка по store.lang
    // console.log('Перевод заголовка с учетом языка:', store.lang);
    // Например:
    const playerNameText = this.texts[store.lang]?.playerNameText || this.texts["en"]?.playerNameText;
    store.playerName = playerNameText;
  }

  async initSDK(): Promise<any> {
    return (window as any).YaGames
      .init()
      .then((ysdk: any) => {
        (window as any).ysdk = ysdk;

        store.lang = ysdk.environment.i18n.lang;
        this.loadTitleWithTranslation(); // язык гарантированно установлен
        console.log('Язык установлен:', store.lang);
        return ysdk;
      })
  }

  async waitForLoadingAPI(timeout = 3000): Promise<boolean> {
    const start = performance.now();
    while (performance.now() - start < timeout) {
      const api = (window as any).ysdk?.features?.LoadingAPI;
      if (api?.ready) return true;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return false;
  }

  async preload(): Promise<void> {
    this.createLoadingbar();
    this.load.json("texts", "assets/texts.json");

    window.addEventListener("contextmenu", (event) => event.preventDefault());

    // pass value to change the loading bar fill
    this.load.on(
      'progress',
      function (value: number) {
        this.progressBar.clear();
        this.progressBar.fillStyle(0xfff6d3, 1);
        this.progressBar.fillRect(
          this.cameras.main.width / 4,
          this.cameras.main.height / 2 - 16,
          (this.cameras.main.width / 2) * value,
          16
        );
      },
      this
    );

    // delete bar graphics, when loading complete
    this.load.on(
      'complete',
      function () {
        this.progressBar.destroy();
        this.loadingBar.destroy();
      },
      this
    );
    this.load.pack('preload', './assets/pack.json', 'preload');

    const YaSdk = await this.initSDK();// Ждем SDK.

    (window as any).ysdk = YaSdk;

    (window as any).player = await (window as any).ysdk.getPlayer();
    console.log((window as any).player);

    store.avatar = (window as any).player.getPhoto("large");

    this.load.image("user", store.avatar);
    this.load.once("complete", () => {
      store.avatarKey = "user"; // Сохраняем ключ загруженного изображения
    });
    this.load.start();

    store.id = await (window as any).player.getUniqueID().replace(/\//g, "0");

    this.playerName = await (window as any).player.getName();
    store.playerName = this.playerName;

    const playerNameText = this.texts[store.lang]?.playerNameText || this.texts["en"]?.playerNameText;

    if ((window as any).player.isAuthorized()) {
      store.isAuth = true;
    } else {
      store.playerName = playerNameText
    }

    try {
      const leaderboard = (window as any).ysdk.leaderboards;

      if (store.isAuth) {
        try {
          await leaderboard.getPlayerEntry('mainLeaderboard');
        } catch (e) {
          console.warn('Игрока ещё нет в лидерборде, устанавливаю очки…');
          try {
            await leaderboard.setScore('mainLeaderboard', 1100);
          } catch (setErr) {
            console.error('Ошибка при установке очков', setErr);
          }
        }
      }

    } catch (e) {
      console.error('Ошибка инициализации лидерборда', e);
    }

  }

  async create() {
    console.log('store.isGameStarted:', store.isGameStarted);
    this.texts = this.cache.json.get("texts");
    await (window as any).ysdk.adv.showBannerAdv();
    console.log('store.isGameStarted:', store.isGameStarted);
    new SoundManager(this);
    this.game.sound.pauseAll();

    localStorage.setItem('isSoundEnable', 'true');

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    });

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('Страница скрыта');
        this.game.sound.pauseAll();
      } else if (document.visibilityState === 'visible') {
        console.log('Страница снова видима');
        if (store.isMusicEnabled && store.isGameStarted) {
          this.game.sound.resumeAll();
        }
      }
    };

    const onBlur = () => {
      console.log('Окно потеряло фокус');
      this.game.sound.pauseAll();
    };

    const onFocus = () => {
      console.log('Окно снова в фокусе');
      if (store.isMusicEnabled && store.isGameStarted) {
        if (this.game.sound.locked) {
          this.input.once('pointerdown', () => this.game.sound.resumeAll());
        } else {
          this.game.sound.resumeAll();
        }
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);

    if (await this.waitForLoadingAPI()) {
      try {
        await (window as any).ysdk.features.LoadingAPI.ready();
        console.log('[YSDK] LoadingAPI.ready() вызван успешно');
      } catch (e) {
        console.warn('[YSDK] LoadingAPI.ready() вызвал ошибку:', e);
      }
    } else {
      console.warn('[YSDK] features.LoadingAPI не доступен после 3 секунд.');
    }

    // Удаляем обработчики, чтобы не вмешивались в другие сцены
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('focus', onFocus);

    if (store.isGameOnline) {
      this.scene.start('Game');
    } else {
      this.scene.start('Start');
    }

  }

  private createLoadingbar(): void {
    this.loadingBar = this.add.graphics();
    this.loadingBar.fillStyle(0x5dae47, 1);
    this.loadingBar.fillRect(
      this.cameras.main.width / 4 - 2,
      this.cameras.main.height / 2 - 18,
      this.cameras.main.width / 2 + 4,
      20
    );
    this.progressBar = this.add.graphics();
  }

}
