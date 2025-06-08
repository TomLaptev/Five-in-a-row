import Cell from '../components/Cell';
import Button from '../components/Button';
import { GameConfig, Source } from '../GameConfig';
import { Images } from '../utils/const';
import { Sounds } from '../utils/const';
import Board from '../components/Board';
import GameAlgoritm from '../components/GA';
import store from "../store";
import { io, Socket } from "socket.io-client";
import Pagination from '../components/Pagination';

// Интерфейс для игрока
interface PlayerData {
  avatar: any,
  id: string,
  opponent?: string,
  name: string;
  rating: number | null,
  available: boolean;
  lang: string,
  games: number,
  wins: number,
  roomId?: string | null,
}

export default class GameScene extends Phaser.Scene {
  BOARD: Board = null;
  GA: GameAlgoritm = null;
  pagination: Pagination = null;
  cells: Cell[] = [];
  movesArr: number[] = [];
  pointer: any;
  sounds: any;
  starsNumber: number;
  prizeStarNumber: number = 5;
  Timer: any;
  gameResult: number = 0;
  player: any;
  playerObj: any;
  playerRating: number;
  playerCurrentRating: number;
  rivalRating: number;
  avatar: any;
  playerRatingDisplay: any;
  timeContainer: any;
  timeBar: any;
  timeMask: any;
  timeForGame: number;
  timeReserve: boolean;
  textForMove: any;
  textInTimeBar: string;
  isTimerOn: boolean;
  isExpert: boolean = false;
  isAmateur: boolean = false;
  isNewbie: boolean = false;
  rivalName: string;
  rivalAvatar: any;
  isMusicEnabled: boolean;
  isMobile: boolean;
  isPopUpCheckStars: boolean;
  X: any;
  Y: any;
  texts: Record<string, Record<string, string>> = {};
  popUp: any;

  public playersContainer: Phaser.GameObjects.Container | null = null;
  public profileContainer: Phaser.GameObjects.Container | null = null;
  sortedPlayersArray: any;
  lastPlayersList: any;
  privateRoomId: string | null = null;
  candidate: string | null = null;
  opponentId: string | null = null;
  opponentAvatar: any;
  avatarMask: any;
  opponentExists: boolean = false;
  frame: any;
  winnersButton: Button;
  backButton: any;
  isProfile: boolean = false;
  roomData: any;
  userRoomId: string | null = null;
  rivalRoomId: string;
  isRoom: boolean = false;
  isRoomDeleted: boolean;
  isSender: boolean = false;
  isYourTurn: boolean;
  isAuthorizationDialog: boolean = false;
  lastMove: number | null = null;
  isGameSession: boolean = false;
  isGameFinished: boolean = false;
  difficultySelection: any;
  numberGames: number = 0;
  numberVictories: number = 0;
  socket: Socket | null = null;
  isRoomInvitation: boolean;
  pages: Phaser.GameObjects.Container[] = [];
  currentPage: number;
  paginationContainer: Phaser.GameObjects.Container;
  games: number;
  wins: number;
  botButton: any;
  botName: any;
  botRating: any;
  inviteButton: Phaser.GameObjects.Sprite;
  mailIcon: any;
  connectionOverlay: any | null = null;
  connectionUI: any;
  exitFromGamePopUp: any | null = null;
  refereeImage: any | null = null;
  continueGameButton: Button | null = null;
  readyToLoseTextBlock: any | null = null;
  soundButton: Button;

  constructor() {
    super("Game");
    this.handleUpdatePlayers = this.handleUpdatePlayers.bind(this); // Привязываем один раз
    this.handleRoomUpdate = this.handleRoomUpdate.bind(this); // Привязываем один раз
    this.handleRoomInvitation = this.handleRoomInvitation.bind(this);
    this.handleRoomDelete = this.handleRoomDelete.bind(this);
    this.handleOpponentDisconnected = this.handleOpponentDisconnected.bind(this);
  }

  async preload() {
    if (store.isAuth) {
      this.playerObj = await (window as any).ysdk.getPlayer();
    }
    this.load.json("texts", "assets/texts.json");
  }

  async create() {
    (window as any).ysdk?.features?.GameplayAPI?.stop?.();

    store.gameData = await (window as any).player.getData();
    console.log("store.gameData:", store.gameData);

    this.games = store.gameData.games === undefined ? 0 : store.gameData.games;
    this.wins = store.gameData.wins === undefined ? 0 : store.gameData.wins;

    this.BOARD = new Board(this);
    this.GA = new GameAlgoritm(this);
    this.texts = this.cache.json.get("texts");

    this.input.once('pointerdown', () => {
      if (store.isMusicEnabled) {
        this.game.sound.resumeAll();
      }

    });

    this.isPopUpCheckStars = false;
    this.timeReserve = true;
    this.isTimerOn = false;

    this.textInTimeBar = '';

    this.createBackground();
    this.createSounds();

    if (store.isVsComputer) {
      this.opponentId = null;
      this.startGame();
    } else if (store.isForTwo) {
      this.opponentId = null;
      this.startGameForTwo()
    }
    else if (store.isGameOnline) this.startGameOnline();

  }

  async setPlayerRating() {
    //console.log('store.gameData.score:', store.gameData.score)
    this.playerRating = store.gameData.score === undefined
      || store.gameData.score === null
      || store.gameData.score < 1000 ? 1100 : store.gameData.score;

    //console.log('this.playerRating :', this.playerRating);
  }

  setStars() {
    if (!this.games) {
      this.starsNumber = this.prizeStarNumber;
    } else if (+localStorage.getItem('stars') > 0) {
      this.starsNumber = +localStorage.getItem('stars');
    } else this.starsNumber = 0;


    if (this.socket && this.starsNumber == 0) {
      this.socket.emit("updatePlayersStatus", {
        id: this.socket.id,
        opponentSocketId: this.socket.id,
        available: false,
        rating: this.playerRating
      });
    }
    console.log('this.starsNumber :', this.starsNumber);
  }

  createPopUp(alpha: number) {
    this.popUp = this.add.sprite(this.cameras.main.centerX - 300,
      this.cameras.main.centerY - 240,
      Images.POPUP).setOrigin(0, 0)
      .setAlpha(alpha);
  }

  getStars() {
    const starsForGameText = this.texts[store.lang]?.starsForGameText || this.texts["en"]?.starsForGameText
    const iWantText = this.texts[store.lang]?.iWantText || this.texts["en"]?.iWantText
    if (!store.isForTwo) {

      this.isPopUpCheckStars = true;

      store.isGameOnline ? this.createPopUp(0.4) : 1;

      const auditorBtn = this.add.sprite(this.popUp.x + 440, this.popUp.y + 240,
        store.isVsComputer || store.isGameOnline ? Images.AMATEUR : '').setOrigin(0, 0);
      auditorBtn.setScale(0.8);

      this.createButtonCancal();

      if (this.difficultySelection) {
        this.difficultySelection.destroy();
      }

      const starsForGameTextBlock = this.add.text(this.popUp.x + this.popUp.width * 0.5, this.popUp.y + 150, starsForGameText, {
        font: "40px BadComic-Regular",
        color: "#d9d9e6",
        align: "center",
      })
      starsForGameTextBlock.setOrigin(0.5, 0.5);

      let confirmGetStars: Button = new Button(
        this,
        this.cameras.main.centerX,
        this.popUp.y + 370,
        null,
        null,
        '#FFE241',
        Images.GET_STARS_BTN,
        'BadComic-Regular',
        28,
        iWantText,
        () => {
          (window as any).ysdk.adv.showRewardedVideo({
            callbacks: {
              onOpen: () => {
                this.game.sound.pauseAll();

                // Принудительно отключаем звук (временно)
                this.game.sound.mute = true;
                console.log('Video ad open.');
              },
              onRewarded: () => {
                console.log('Rewarded!');
                localStorage.setItem('stars', ` ${this.prizeStarNumber}`);
                if (store.isGameOnline) {
                  this.socket.emit("updatePlayersStatus", { id: this.socket.id, opponentSocketId: this.socket.id, available: true, rating: this.playerRating });
                }
              },
              onClose: () => {
                console.log('Video ad closed.');
                if (store.isGameOnline) {
                  this.socket.emit("requestPlayers");
                }
                this.scene.start("Game");
                this.game.sound.mute = false;

              },
              onError: (e: any) => {
                console.log('Error while open video ad:', e);
                this.scene.restart();
              }
            }
          })
        }
      )

    }
  }

  startGame() {
    this.setPlayerRating();
    this.createTimeBar();
    this.createTimer();
    this.setStars();

    this.createPopUp(0.4);

    //Возврат на стартовую сцену		
    this.createButtonCancal();

    this.timeMask.x = -this.timeMask.displayWidth

    const popUpContainer = this.add.container(this.cameras.main.centerX - 300, this.cameras.main.centerY - 240);//для отображения на дисплее

    const gameDifficultyText = this.texts[store.lang]?.gameDifficultyText || this.texts["en"]?.gameDifficultyText;

    this.difficultySelection = this.add.text(300, 60, gameDifficultyText,
      {
        font: "36px BadComic-Regular",
        color: "#ffffff",
        align: "center",
      });
    this.difficultySelection.setOrigin(0.5, 0.5);

    //===================== expertButton +  expertText ====================================
    const expertText = this.texts[store.lang]?.expertText || this.texts["en"]?.expertText;

    let proButton =
      this.add.image(290, 160,
        (this.starsNumber > 0 ? Images.EXPERT : Images.EXPERT_Z))
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", (pointer: Phaser.Input.Pointer) => {
          if (pointer.rightButtonDown()) {
            return; // Игнорируем правую кнопку, ничего не делаем
          }
          this.rivalName = expertText;
          this.isExpert = true;
          this.isAmateur = false;
          this.isNewbie = false;
          this.rivalAvatar = Images.EXPERT_G;
          this.rivalRating = 1400;
          this.starsNumber > 0 ? this.chooseRival()
            : !this.isPopUpCheckStars ? this.getStars() : 1;

          popUpContainer.destroy(true);
        })
    proButton.setScale(0.8);

    const expertTextBlock = this.add.text(300, 260, expertText, {
      font: "30px BadComic-Regular",
      color: "#ffff55",
      align: 'center'
    });
    expertTextBlock.setOrigin(0.5, 0.5);

    //===================== expertButton +  expertText ====================================

    //===================== amateurButton +  amateurText ====================================
    const amateurText = this.texts[store.lang]?.amateurText || this.texts["en"]?.amateurText;

    let amateurButton =
      this.add.image(100, 220,
        (this.starsNumber > 0 ? Images.AMATEUR : Images.AMATEUR_Z))
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", (pointer: Phaser.Input.Pointer) => {
          if (pointer.rightButtonDown()) {
            return; // Игнорируем правую кнопку, ничего не делаем
          }
          this.rivalName = amateurText;
          this.isExpert = false;
          this.isAmateur = true;
          this.isNewbie = false;
          this.rivalAvatar = Images.AMATEUR;
          this.rivalRating = 1250;
          this.starsNumber > 0 ? this.chooseRival()
            : !this.isPopUpCheckStars ? this.getStars() : 1;

          popUpContainer.destroy(true);
        })
    amateurButton.setScale(0.7);
    const amateurTextBlock = this.add.text(amateurButton.x, 320, amateurText, {
      font: "30px BadComic-Regular",
      color: "#ffff55",
      align: 'center'
    });
    amateurTextBlock.setOrigin(0.5, 0.5);
    //===================== amateurButton +  amateurText ====================================

    const newbieText = this.texts[store.lang]?.newbieText || this.texts["en"]?.newbieText;
    let newbieButton =
      this.add.image(500, 280, Images.NEWBIE)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", (pointer: Phaser.Input.Pointer) => {
          if (pointer.rightButtonDown()) {
            return; // Игнорируем правую кнопку, ничего не делаем
          }
          this.rivalName = newbieText;
          this.isExpert = false;
          this.isAmateur = false;
          this.isNewbie = true;
          this.rivalAvatar = Images.NEWBIE;
          this.rivalRating = 1150;
          this.chooseRival()
        });
    newbieButton.setScale(0.65)

    const newbieTextBlock = this.add.text(newbieButton.x, 360, newbieText, {
      font: "30px BadComic-Regular",
      color: "#ffff55",
      align: 'center'
    });
    newbieTextBlock.setOrigin(0.5, 0.5);

    popUpContainer.add([
      this.difficultySelection, proButton, amateurButton,
      newbieButton, expertTextBlock, amateurTextBlock, newbieTextBlock
    ]);

    //===================== newbieButton +  newbieText ====================================

    for (let i = 0; i < this.starsNumber; i++) {
      this.add.sprite(
        this.timeContainer.x - 80 + i * 60,
        this.timeContainer.y,
        (this.starsNumber - i) >= 1 ? Images.STAR : Images.STAR0_5
      )
    }
  }

  startGameForTwo() {
    this.createTimeBar();
    this.createTimer();
    this.chooseRival();
  }

  async startGameOnline() {

    this.setPlayerRating();
    this.setStars();

    // console.log('this.isRoom: ', this.isRoom);
    // console.log('this.socket: ', this.socket);
    if (!this.isRoom) {
      if (!this.socket) {
        this.initSocket();
      }

    } else {
      this.createTimeBar();
      this.createTimer();
      this.chooseRival();
    }
  }

  chooseRival() {
    (window as any).ysdk?.features?.GameplayAPI?.start?.();

    store.isYouX = !store.isYouX; //Вы - X => 0	
    // console.log('store.isVsComputer: ', store.isVsComputer);
    // console.log('store.isGameOnline: ', store.isGameOnline);
    // console.log('this.opponentId: ', this.opponentId);

    if (store.isVsComputer || store.isGameOnline && !this.opponentId) {

      localStorage.setItem('stars', ` ${this.starsNumber}`);
      // console.log('this.starsNumber: ', this.starsNumber);
    }
    this.BOARD.drawBoard();
    this.createPointer();
    this.createControl();
    this.Timer.paused = false;
    this.createButtonExit();

    //---------- Ход нолика -------------------
    if (!store.isYouX) {  // Вы - нолик, ходите вторым 

      if (this.GA.moveStorage.length === 0) {
        this.BOARD.drawBoard();
        this.createPointer();
        this.createTimeBar();

        if (this.sys.game.device.os.desktop) {
          this.X = this.cameras.main.centerX - 370;
          this.Y = this.cameras.main.centerY - 140;
          this.createSymbol_0();
          this.X = this.cameras.main.centerX + 370;
          this.createSymbol_X();
        } else {
          this.X = this.cameras.main.centerX - 245;
          this.Y = this.cameras.main.centerY + 340;
          this.createSymbol_0();
          this.X = this.cameras.main.centerX + 225;
          this.createSymbol_X();
        }

        if (store.isVsComputer || store.isGameOnline && !this.opponentId) {
          this.GA.onCellClicked(this.cells[112]);
        }
      }

    } else {
      if (this.sys.game.device.os.desktop) {
        this.X = this.cameras.main.centerX - 370;
        this.Y = this.cameras.main.centerY - 140;
        this.createSymbol_X();
        this.X = this.cameras.main.centerX + 370;
        this.createSymbol_0();
      } else {
        this.X = this.cameras.main.centerX - 245;
        this.Y = this.cameras.main.centerY + 340;
        this.createSymbol_X();
        this.X = this.cameras.main.centerX + 225;
        this.createSymbol_0();
      }
    }

    this.createTimeBar();

    this.createProfilePlayer();
    this.createProfileRival();

    if (store.isVsComputer || store.isGameOnline && !this.opponentId) {
      if (this.isExpert) {
        this.player = Images.EXPERT;
      } else if (this.isAmateur) {
        this.player = Images.AMATEUR;
      } else if (this.isNewbie) {
        this.player = Images.NEWBIE;
      }
    }
  }

  createProfilePlayer() {
    if (this.sys.game.device.os.desktop) {
      const avatar: any = this.add.sprite(
        this.cameras.main.centerX - 370,
        this.cameras.main.centerY - 345,
        store.avatarKey ? store.avatarKey : Images.AVATAR
      )
        .setOrigin(0.5, 0);
      avatar.setScale(0.45);
    }

    const youText = this.texts[store.lang]?.youText || this.texts["en"]?.youText;
    const youTextBlock = this.add.text((this.sys.game.device.os.desktop ? this.cameras.main.centerX - 370 : this.cameras.main.centerX - 250),
      (this.sys.game.device.os.desktop ? this.cameras.main.centerY - 250 : this.cameras.main.centerY + 285), youText, {
      font: "24px BadComic-Regular",
      color: "#ffff55",
      align: "center"
    })
    youTextBlock.setOrigin(0.5, 0);

    !store.isForTwo ? this.createRate() : 1;
  }

  createRate() {
    let font: string;
    let color: string;
    this.GA.isFinish ? font = "30px BadComic-Regular" : font = "24px BadComic-Regular";
    this.GA.isFinish ? color = "#ffff55" : color = "#ffffff";

    this.playerRatingDisplay = this.add.text((this.sys.game.device.os.desktop ? this.cameras.main.centerX - 400 : this.cameras.main.centerX - 275),
      (this.sys.game.device.os.desktop ? this.cameras.main.centerY - 210 : this.cameras.main.centerY + 365), `${this.playerRating}`, {
      font: `${font}`,
      color: `${color}`,
    })
  }

  createProfileRival() {

    if (this.sys.game.device.os.desktop) {
      let avatar: any = this.add
        .sprite(this.cameras.main.centerX + 370, this.cameras.main.centerY - 345, (
          store.isVsComputer ? this.rivalAvatar
            : store.isForTwo ? Images.AMATEUR
              : store.isGameOnline && !this.opponentId ? Images.EXPERT_G
                : this.opponentId))
        .setOrigin(0.5, 0);
      avatar.setScale(0.45);
    }

    const yourFriendText = this.texts[store.lang]?.yourFriendText || this.texts["en"]?.yourFriendText;
    const nickRival: any =
      this.add.text(
        (this.sys.game.device.os.desktop ? this.cameras.main.centerX + 380 : this.cameras.main.centerX + 230),
        (this.sys.game.device.os.desktop ? this.cameras.main.centerY - 250 : this.cameras.main.centerY + 285),
        (!store.isForTwo ? `${this.rivalName} `
          : yourFriendText),
        {
          font: "24px BadComic-Regular",
          color: "#ffff55",
          align: "center"
        }
      )
    nickRival.setOrigin(0.5, 0);

    if (!store.isForTwo) {
      let rate: Button = new Button(
        this,
        (this.sys.game.device.os.desktop ? this.cameras.main.centerX + 365 : this.cameras.main.centerX + 225),
        (this.sys.game.device.os.desktop ? this.cameras.main.centerY - 200 : this.cameras.main.centerY + 380),
        null, null,
        '#ffffff',
        null,
        'BadComic-Regular',
        24,
        `${this.rivalRating}`,
        null,
      );
    }
  }

  createTimeBar() {
    const yourTurnText = this.texts[store.lang]?.yourTurnText || this.texts["en"]?.yourTurnText;
    const rivalTurnText = this.texts[store.lang]?.rivalTurnText || this.texts["en"]?.rivalTurnText;

    if (this.isTimerOn) {
      if (!this.GA.moveStorage.length && store.isYouX) {
        this.textInTimeBar = yourTurnText;
      } else if (!this.GA.moveStorage.length && !store.isYouX) {
        this.textInTimeBar = rivalTurnText;
      }
      else if (store.isYouX && this.GA.moveStorage.length % 2 == 0) {
        this.textInTimeBar = yourTurnText;
      } else if (!store.isYouX && this.GA.moveStorage.length % 2) {
        this.textInTimeBar = yourTurnText;
      } else this.textInTimeBar = rivalTurnText;
    }

    this.GA.isFinish ? this.textInTimeBar = '' : 1;

    this.timeForGame = Source.timeForGame;

    this.timeContainer = this.add.sprite(
      this.cameras.main.centerX - 40,
      (this.sys.game.device.os.desktop ? this.cameras.main.centerY - 340 : -15 + this.cameras.main.centerY - Source.cellHeight * Source.rows / 2 - Source.cellHeight),
      Images.TIMECONTAINER);

    this.timeBar = this.add.sprite(this.timeContainer.x + 35, this.timeContainer.y, Images.TIMEBAR);

    this.timeMask = this.add.sprite(this.timeBar.x, this.timeBar.y, Images.TIMEBAR);

    this.textForMove = this.add.text(this.timeBar.x, this.timeBar.y - 2, this.textInTimeBar, {
      font: "24px BadComic-Regular",
      color: "#ffffff",
      align: "center",
    })
    this.textForMove.setOrigin(0.5, 0.5);
    this.timeMask.visible = false;
    this.timeBar.mask = new Phaser.Display.Masks.BitmapMask(this, this.timeMask);

  }

  createTimer() {
    this.timeForGame = Source.timeForGame;
    this.isTimerOn = true;

    this.Timer = this.time.addEvent({
      delay: Source.delay,
      callback: function () {
        this.timeForGame--;
        let stepWidth = this.timeMask.displayWidth / Source.timeForGame
        this.timeMask.x -= stepWidth;
        if (this.timeForGame < 40 && this.timeForGame % 4 === 0) {
          this.createSingleSound();
        };

        this.timeForGame == 0 ? this.timeReserve = false : 1;
        if (this.timeForGame == 0) {
          this.Timer.destroy();
          if (store.isGameOnline && this.opponentExists
            || !this.opponentId) {
            this.createEndSession();
          }
        }

        if (this.GA.isFinish) {
          this.timeMask.x = -this.timeMask.displayWidth
          this.Timer.destroy();
          this.textForMove.destroy();

          if (!store.isForTwo) {
            for (let i = 0; i < this.starsNumber; i++) {
              this.add.sprite(
                this.timeContainer.x - 80 + i * 60,
                this.timeContainer.y,
                (this.starsNumber - i) >= 1 ? Images.STAR : Images.STAR0_5
              )
            }
          }

          setTimeout(() => {
            if (store.isGameOnline && this.opponentExists
              || !this.opponentId) {
              this.createEndSession();
            }
          }, 3500);
        }
      },
      callbackScope: this,
      paused: true,
      loop: true
    });
  }

  createSingleSound() {
    this.sounds.timer.play();
  }

  createEndSession() {
    const winnerText = this.texts[store.lang]?.winnerText || this.texts["en"]?.winnerText;
    const loserText = this.texts[store.lang]?.loserText || this.texts["en"]?.loserText;
    const exitText = this.texts[store.lang]?.exitText || this.texts["en"]?.exitText;
    const exitWinnerText = this.texts[store.lang]?.exitWinnerText || this.texts["en"]?.exitWinnerText;
    const timeLoserText = this.texts[store.lang]?.timeLoserText || this.texts["en"]?.timeLoserText;
    const firstMoveNotMadeText = this.texts[store.lang]?.firstMoveNotMadeText || this.texts["en"]?.firstMoveNotMadeText;
    const anotherGameText = this.texts[store.lang]?.anotherGameText || this.texts["en"]?.anotherGameText;

    if (!store.isForTwo) {
      for (let i = 0; i < this.starsNumber; i++) {
        this.add.sprite(
          this.timeContainer.x - 80 + i * 60,
          this.timeContainer.y,
          (this.starsNumber - i) >= 1 ? Images.STAR : Images.STAR0_5
        )
      }
    }

    this.isGameFinished = true;
    this.GA.isFinish = true;
    this.lastMove = null;

    this.Timer.destroy();

    console.log(this.isTimerOn);

    (window as any).ysdk?.features?.GameplayAPI?.stop?.();

    this.textForMove ? this.textForMove.destroy() : 1;
    this.timeMask.x = -this.timeMask.displayWidth

    this.clearExitElements();

    let popUp: any = this.add.sprite(this.cameras.main.centerX - 300,
      this.cameras.main.centerY - 220,
      Images.POPUP).setOrigin(0, 0)
      .setAlpha(0.85);

    let finalText: string;
    let isCalculateRating: boolean = true;

    console.log('store.isYouX:', store.isYouX);

    if (this.exitFromGamePopUp) {
      finalText = loserText;
      this.sounds.loss.play();
      this.gameResult = 0;
    }

    else if (!this.opponentExists && store.isGameOnline) {
      if (this.GA.moveStorage.length < 2) {
        finalText = exitText;
        this.sounds.failure.play();
        isCalculateRating = false;
      } else {
        finalText = exitWinnerText;
        this.sounds.complete.play();
        this.gameResult = 1;
      }

    } else if (!this.timeReserve && this.GA.moveStorage.length < 2) {
      finalText = firstMoveNotMadeText;
      this.sounds.failure.play();
      isCalculateRating = false;

    } else if (!this.timeReserve && (store.isYouX && this.GA.moveStorage.length % 2 === 0
      || !store.isYouX && this.GA.moveStorage.length % 2)) {
      finalText = timeLoserText;
      this.sounds.loss.play();
      this.gameResult = 0;

    } else if (this.GA.isFinish && (store.isYouX && this.GA.moveStorage.length % 2
      || !store.isYouX && this.GA.moveStorage.length % 2 === 0)) {
      finalText = winnerText;
      this.sounds.complete.play();
      this.gameResult = 1;

    } else if (this.GA.isFinish && (store.isYouX && this.GA.moveStorage.length % 2 === 0
      || !store.isYouX && this.GA.moveStorage.length % 2)) {
      finalText = loserText;
      this.sounds.loss.play();
      this.gameResult = 0;
    }

    if (!store.isForTwo) {

      if (isCalculateRating) {
        this.calculateRating(this.gameResult);
        this.playerRatingDisplay ? this.playerRatingDisplay.destroy() : 1;
        this.createRate();
      }

    }

    const finalTextBlock = this.add.text(popUp.x + 300, popUp.y + 135,
      finalText,
      {
        font: "40px BadComic-Regular",
        color: "#ffffff",
        align: "center",
      })
    finalTextBlock.setOrigin(0.5, 0.5);

    if (!(!this.timeReserve && !this.GA.moveStorage.length
      || !this.timeReserve && this.GA.moveStorage.length == 1)) {
      const anotherGameTextBlock = this.add.text(popUp.x + 300, popUp.y + 250, anotherGameText, {
        font: "40px BadComic-Regular",
        color: "#ffffff",
        align: "center",
      })
      anotherGameTextBlock.setOrigin(0.5, 0.5);
    }

    const refereeImage = this.add.sprite(popUp.x + 5, popUp.y + 240,
      Images.AMATEUR).setOrigin(0, 0);
    refereeImage.setScale(0.8);

    const yesText = this.texts[store.lang]?.yesText || this.texts["en"]?.yesText

    new Button(
      this,
      this.cameras.main.centerX,
      popUp.y + 360,
      null,
      null,
      '#ffffff',
      Images.CONFIRM,
      'BadComic-Regular',
      36,
      yesText,
      async () => {
        console.log('ButtonConfirm нажата!!!');

        if (await (window as any).ysdk) {
          (window as any).ysdk.adv.showFullscreenAdv({
            callbacks: {
              onClose: (wasShown: boolean) => {
                console.log("============ closed =====");
                this.actionButtonConfirm();
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
                this.actionButtonConfirm();
              }
            }
          })
        }

      }
    );
    this.GA.moveStorage.length = 0;
    this.GA.isFinish = false;

    //после игры с экспертом
    this.isExpert = false;
    this.opponentExists = false;
  }

  createBackground(): void {
    if (GameConfig.width == 2800) {
      this.add.sprite(0, 0, Images.BACKGROUND_H).setOrigin(0, 0);
    } else this.add.sprite(0, 0, Images.BACKGROUND_V).setOrigin(0, 0);
  }
  createSounds() {
    this.sounds = {
      complete: this.sound.add(Sounds.COMPLETE),
      loss: this.sound.add(Sounds.LOSS),
      move: this.sound.add(Sounds.MOVE),
      failure: this.sound.add(Sounds.FAILURE),
      notification: this.sound.add(Sounds.NOTIFICATION),
      timer: this.sound.add(Sounds.TIMER)
    };
  }

  createPointer() {
    this.pointer = this.add
      .sprite(
        (this.cells[0].x + this.cells.at(-1).x) / 2,
        (this.cells[0].y + this.cells.at(-1).y) / 2,
        Images.POINTER
      )
      .setOrigin(0, 0);
  }

  createControl() {

    if (!this.sys.game.device.os.desktop) {

      new Button(
        this,
        this.cameras.main.centerX - 150,
        this.cameras.main.centerY + 345,
        null, null, null,
        Images.LEFT,
        null, null, null,
        () => {
          if (this.isTimerOn && this.pointer.x > this.cells[0].x && !this.GA.isFinish) {
            this.pointer.x -= Source.cellWidth;
          }
        }
      );

      new Button(
        this,
        this.cameras.main.centerX - 10,
        this.cameras.main.centerY + 345,
        null, null, null,
        Images.RIGHT,
        null, null, null,
        () => {
          if (this.isTimerOn && this.pointer.x < this.cells.at(-1).x && !this.GA.isFinish) {
            this.pointer.x += Source.cellWidth;
          }
        }
      );

      new Button(
        this,
        this.cameras.main.centerX - 80,
        this.cameras.main.centerY + 310,
        null, null, null,
        Images.UP,
        null, null, null,
        () => {
          if (this.isTimerOn && this.pointer.y > this.cells[0].y && !this.GA.isFinish) {
            this.pointer.y -= Source.cellHeight;
          }
        }
      );

      new Button(
        this,
        this.cameras.main.centerX - 80,
        this.cameras.main.centerY + 370,
        null, null, null,
        Images.DOWN,
        null, null, null,
        () => {
          if (this.isTimerOn && this.pointer.y < this.cells.at(-1).y && !this.GA.isFinish) {
            this.pointer.y += Source.cellHeight;
          }
        }
      );

      new Button(
        this,
        this.cameras.main.centerX + 100,
        this.cameras.main.centerY + 345,
        null, null, null,
        Images.ENTER,
        null, null, null,
        () => {
          if (this.isTimerOn) {
            let pos =
              (Source.cols * (this.pointer.y - this.cells[0].y)) / Source.cellHeight +
              (this.pointer.x - this.cells[0].x) / Source.cellWidth;
            !store.isGameOnline || store.isGameOnline && !this.opponentId ? this.GA.onCellClicked(this.cells[pos])
              : this.onCellClickedOnline(this.cells[pos]);
          }

        }
      );
    }
  }

  //Для выхода из игрового процесса
  createButtonExit() {
    if (store.isForTwo) { }
    this.add.sprite(this.timeBar.x + 250, this.timeBar.y, Images.CANCEL)

      .setInteractive({ useHandCursor: true })
      .on("pointerdown", async (pointer: Phaser.Input.Pointer) => {
        if (pointer.rightButtonDown()) {
          return; // Игнорируем правую кнопку, ничего не делаем
        }
        console.log('ButtonExit нажата!!!');
        this.clearProfileContainer();
        this.handleExit();
      })


  }

  createButtonCancal() {
    this.add.sprite(this.cameras.main.centerX + 260, this.cameras.main.centerY - 200, Images.CANCEL)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", async (pointer: Phaser.Input.Pointer) => {
        if (pointer.rightButtonDown()) {
          return; // Игнорируем правую кнопку, ничего не делаем
        }
        console.log('ButtonCancal нажата!!!');
        this.handleCancal();
      })

  }

  actionButtonConfirm() {
    this.isSender = false;
    this.clearProfileContainer();
    this.isGameSession = false;
    this.userRoomId = null;
    this.isRoom = false;

    console.log('this.socket:', this.socket);
    console.log('this.opponentId:', this.opponentId);
    this.scene.restart();
    setTimeout(() => {
      if (this.socket) {
        this.socket.emit("updatePlayersStatus", {
          id: this.socket.id,
          opponentSocketId: this.socket.id,
          available: this.starsNumber > 0 ? true : false,
          rating: this.playerRating
        });

        this.socket.emit("refusalPlay", {
          opponentId: this.socket.id, roomId: this.privateRoomId
        });
        this.socket.emit("requestPlayers");
      }
    }, 200)

  }

  createSymbol_0() {
    this.add.sprite(
      this.X,
      this.Y,
      Images.CELL_ZERO);
  }

  createSymbol_X() {
    this.add.sprite(
      this.X,
      this.Y,
      Images.CELL_X)
  }

  async calculateRating(rez: number) {
    if (!store.isForTwo) {
      if (rez === 1) {
        this.wins++;
      }

      this.playerRating += Math.round(20 * (rez - 1 / (1 + 10 ** ((this.rivalRating - this.playerRating) / 400))));
      console.log('this.playerRating: ', this.playerRating)

      if (this.socket) {
        this.socket.emit("updatePlayersStatus", {
          id: this.socket.id,
          opponentSocketId: this.socket.id,
          available: false,
          rating: this.playerRating
        });
      }
      if (store.isAuth) {
        try {
          await (window as any).ysdk.leaderboards.setScore('mainLeaderboard', this.playerRating);
        } catch (e) {
          console.error('Ошибка при установке очков в лидерборд', e);
        }
      }
      await (window as any).player.setData({
        games: this.games,
        wins: this.wins,
        score: this.playerRating
      });

      console.log('store.gameData.score:', store.gameData.score)
    }
  }
  ///////////////////////////////////////////////////////////////////////////////////////////
  //
  //                                      GAME ONLINE
  //
  ///////////////////////////////////////////////////////////////////////////////////////////  

  //=========== создание контейнера и комнаты игроков	=====================	
  createControlPanele() {
    //const startScene = this.scene.get('Start') as StartScene;
    const loginText = this.texts[store.lang]?.loginText || this.texts["en"]?.loginText
    this.deleteControlPanele();

    this.winnersButton = new Button(
      this,
      this.cameras.main.centerX - 192,
      this.cameras.main.centerY + 300,
      null, null, null,
      Images.BUTTON_WINNERS,
      null, null, null,
      async () => {
        if (store.isAuth) {
          try {
            await (window as any).ysdk.getLeaderboards().then(
              (lb: any) => lb.getLeaderboardEntries('mainLeaderboard', { quantityAround: 1, includeUser: true, quantityTop: 5 })
                .then((res: any) => store.allPlayers = res))
          } catch (e) {
            console.log('запрос LeaderboardPlayerEntries', e);
          }
          this.socket.emit("playerExit");
          console.log("Игрок успешно удален из базы данных.");
          this.socket.removeAllListeners(); // Удаляем все сокет-события
          this.socket = null;
          this.scene.start('Leaders');
        } else {
          this.deleteControlPanele();
          this.deletePlayersContainer();
          this.isAuthorizationDialog = true;
          this.createPopUp(0.85);
          const loginTexBlock = this.add.text(this.popUp.x + this.popUp.width * 0.5, this.popUp.y + 170, loginText,
            {
              font: "40px BadComic-Regular",
              color: "#ffffff",
              align: "center"
            });
          loginTexBlock.setOrigin(0.5, 0.5)

          this.createLogIn();
          this.createButtonLater();
        }
      });

    this.backButton = this.add.sprite(this.cameras.main.centerX + 150,
      this.cameras.main.centerY + 265, Images.BACK_BUTTON)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        if (pointer.rightButtonDown()) {
          return; // Игнорируем правую кнопку, ничего не делаем
        }
        console.log('this.backButton нажата!!!');
        this.handleCancal();
      })

    this.frame = this.add.sprite(this.cameras.main.centerX, this.cameras.main.centerY - 10, Images.FRAME).setOrigin(0.5, 0.5);
  }

  createButtonLater() {
    this.add.sprite(this.popUp.x + 550,
      this.cameras.main.centerY - 240, Images.CANCEL)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        if (pointer.rightButtonDown()) {
          return; // Игнорируем правую кнопку, ничего не делаем
        }
        this.scene.start('Game');
        this.isAuthorizationDialog = false;
        this.socket.emit("requestPlayers");
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
        this.socket.emit("playerExit");
        this.socket.removeAllListeners(); // Удаляем все сокет-события
        this.socket = null;
        this.isAuthorizationDialog = false;

        if (!(window as any).player.isAuthorized()) {
          await (window as any).ysdk.auth.openAuthDialog().then(() => {
            this.scene.start("Boot");
          })
            .catch(() => {
              console.log("Игрок не авторизован.")
            });
        }
      }
    )
  }

  createPlayersContainer() {

    this.deletePlayersContainer();

    this.playersContainer = this.add.container(this.cameras.main.centerX - 220, this.cameras.main.centerY - 275);//для отображения на дисплее

    const playersRoomText = this.texts[store.lang]?.playersRoomText || this.texts["en"]?.playersRoomText;
    const roomName = this.add
      .sprite(5, -85, Images.ROOM_NAME)
      .setOrigin(0, 0);
    const roomNameText = this.add.text(roomName.x + roomName.width / 2, roomName.y + roomName.height * 0.9 / 2, playersRoomText,
      {
        font: "32px BadComic-Regular",
        color: "#efefaa",
        align: "center"
      });
    roomNameText.setOrigin(0.5, 0.5);

    this.playersContainer.add([roomName, roomNameText]);
  }

  deleteControlPanele() {
    if (this.frame) {
      this.frame.destroy();
    }
    if (this.winnersButton) {
      this.winnersButton.container.destroy();
    }
    if (this.backButton) {
      this.backButton.destroy();
    }
  }

  deletePlayersContainer() {
    if (this.playersContainer) {
      this.playersContainer.removeAll(true); // Очищаем контейнер
      this.playersContainer.destroy(true); // Удаляем контейнер
    }
  }
  //============== Методы-обработчики ========================

  //--------- Обрабатываем обновленный список игроков ------------------------

  handleUpdatePlayers(playersList: PlayerData[]): void {
    // console.log(`isGameSession: ${this.isGameSession} `); //false
    // console.log(`GA.isFinish: ${this.GA.isFinish} `); //false
    // console.log(`this.isSender: ${this.isSender} `); //false
    // console.log(`isRoom: ${this.isRoom} `); // false
    // console.log(`this.starsNumber: ${this.starsNumber} `);
    // console.log('this.isAuthorizationDialog: ', this.isAuthorizationDialog);
    // console.log('this.profileContainer: ', this.profileContainer);
    console.log('this.isExpert: ', this.isExpert);

    const expertText = this.texts[store.lang]?.expertText || this.texts["en"]?.expertText;

    if (!this.isRoom && !this.isExpert && !this.isGameSession && !this.GA.isFinish
      && !this.isAuthorizationDialog) {

      (window as any).ysdk?.features?.GameplayAPI?.stop?.();

      // Сохраняем последний список игроков
      if (!this.isSender) {
        this.clearProfileContainer(); // Очищаем профиль 
      }

      this.sortedPlayersArray = playersList.sort((a, b) => b.rating - a.rating);

      //========== Проверка кандидата на онлайн ====================================
      if (this.isSender) {
        const candidateStillOnline = playersList.some(player => player.id === this.candidate);
        if (!candidateStillOnline) {
          console.log("Кандидат пропал из списка!");
          this.isSender = false;
          this.candidate = null;

          this.socket.emit("updatePlayersStatus", {
            id: this.socket.id,
            opponentSocketId: this.socket.id,
            available: true,
            rating: this.playerRating
          });
          this.socket.emit("requestPlayers");
          return;
        }
      }

      if (!this.isPopUpCheckStars) {
        this.createPlayersContainer();
        this.createControlPanele();
      }
      // Удаляем старый контейнер пагинации перед созданием нового
      if (this.pagination && this.pagination.parentContainer) {
        this.pagination.parentContainer.destroy(true);
      }

      // Обновляем пагинацию
      const totalPlayers = this.sortedPlayersArray.length;

      this.pagination = new Pagination(this, totalPlayers, this.pagination ? this.pagination.currentPage : 1, (page) => {
        this.updatePlayersContainer(page);
        if (this.pagination) {
          if (this.pagination.totalPages <= 1) {
            this.pagination.hide();
          } else this.pagination.show();
        }
      });
      this.pagination.updateTotalPlayers(totalPlayers);
      console.log("Обновленный список игроков:", playersList);
    }

    this.botButton = this.add.sprite(220, 55, Images.BUTTON_PLAYER)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        if (pointer.rightButtonDown()) {
          return; // Игнорируем правую кнопку, ничего не делаем
        }
        if (this.starsNumber) {
          this.сreateProfile('', store.lang, expertText, 1400, '', '> 1000', '> 1000');
          this.isSender = true;
          this.isExpert = true;
          // Обновляем состояние пользователя (available: false)
          this.socket.emit("updatePlayersStatus", {
            id: this.socket.id,
            opponentSocketId: this.socket.id,
            available: false,
            rating: this.playerRating,
          });
          this.socket.emit("requestPlayers");
          this.deleteControlPanele();
          this.deletePlayersContainer();

        } else if (this.starsNumber <= 0) {
          this.deleteControlPanele();
          this.deletePlayersContainer();
          this.getStars();
        }
      });

    this.botName = this.add.text(55, 40, expertText, {
      font: "24px BadComic-Regular",
      color: "#ffff55",
    });

    this.botRating = this.add.text(320, 40, '1400', {
      font: "24px BadComic-Regular",
      color: "#ffff55",
    });

    this.playersContainer.add([this.botButton, this.botName, this.botRating]);
  }

  updatePlayersContainer(page: number): void {
    let textY = page === 1 ? 45 : 0;

    const playersPerPage = page === 1 ? 9 : 10;
    const start = (page - 1) * playersPerPage;
    const end = start + playersPerPage;
    const visiblePlayers = this.sortedPlayersArray.slice(start, end);

    visiblePlayers.forEach((el: PlayerData) => {
      if (!this.isSender && !this.profileContainer) {
        if (el.id !== this.socket.id) {
          const playerButton = this.add.sprite(220, textY + 55, el.available ? Images.BUTTON_PLAYER : Images.BUTTON_BUSY_PLAYER)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: el.available })
            .on("pointerdown", async (pointer: Phaser.Input.Pointer) => {
              if (pointer.rightButtonDown()) {
                return; // Игнорируем правую кнопку, ничего не делаем
              }
              if (el.available && this.starsNumber > 0) {
                console.log('this.starsNumber: ', this.starsNumber);
                console.log(`Выбран кандидат: ${el.name}`);
                this.isSender = true;
                this.сreateProfile(el.id, el.lang, el.name, el.rating, el.avatar, el.games, el.wins);
                this.candidate = el.id;

                // Обновляем состояние пользователя (available: false)
                this.socket.emit("updatePlayersStatus", {
                  id: this.socket.id,
                  opponentSocketId: this.socket.id,
                  available: false,
                  rating: this.playerRating,
                });
                this.socket.emit("requestPlayers");
                this.deleteControlPanele();
                this.deletePlayersContainer();

              } else if (this.starsNumber <= 0) {
                this.deleteControlPanele();
                this.deletePlayersContainer();
                this.getStars();
              }
            });

          const playerName = this.add.text(55, textY + 40, `${el.name}: `, {
            font: "24px BadComic-Regular",
            color: "#ffff55",
          });

          const playerRating = this.add.text(320, textY + 40, `${el.rating}`, {
            font: "24px BadComic-Regular",
            color: "#ffff55",
          });

          textY += 45;
          this.playersContainer.add([playerButton, playerName, playerRating]);

        }
      } else if (this.isSender && this.profileContainer) {
        this.deleteControlPanele();
        this.deletePlayersContainer();
        if (el.id === this.candidate && !el.available) {
          this.clearProfileContainer();
          console.log("Кандидата увели!");
          this.isSender = false;
          this.candidate = null;
          this.socket.emit("updatePlayersStatus", {
            id: this.socket.id,
            opponentSocketId: this.socket.id,
            available: true,
            rating: this.playerRating
          });
          this.socket.emit("requestPlayers");
        }
      }
    });
  }

  //--------------  Обработчик обновлений комнаты	---------------------------------------	
  handleRoomUpdate(roomData: any): void { //on("roomUpdate")
    // console.log(`this.starsNumber: ${this.starsNumber} `);
    this.pagination.show();
    if (roomData) {
      this.isRoom = true;
      this.roomData = true;

      // console.log("isYouX:", roomData.isYouX);
      // console.log("name:", roomData.name);

      this.deleteControlPanele();

      if (roomData.status === 'waiting') {
        console.log(store.playerName, " подписан на изменения данных в  приватной комнате",);
        this.сreateProfile(roomData.id, roomData.lang, roomData.name, roomData.rating, roomData.avatar, roomData.games, roomData.wins);

        this.privateRoomId = this.rivalRoomId;
        store.isYouX = !roomData.isYouX;
      }

      if (roomData.status === "ready") {
        this.privateRoomId = this.userRoomId;
        this.isGameSession = true;
        this.opponentExists = true;
        this.clearProfileContainer(); // Очистка UI

        this.socket.emit("updatingRoomData", {
          roomId: this.userRoomId,
          opponentId: this.opponentId,
          updatedData: { status: "playing" }
        });

        this.scene.restart();
      }

      if (roomData.status === "playing") {
        this.isGameFinished = false;

        this.opponentExists = true;
        this.isGameSession = true;
      }

      if (roomData.status === "playing"
        && roomData.lastMove !== this.lastMove
        && this.isGameSession) {
        this.GA.onCellClicked(this.cells[roomData.lastMove]);
      }
    }
  }

  //--------------  Обработчик приглашений в комнату --------------------------------
  handleRoomInvitation(data: { roomId: string }): void { //на "roomInvitation"
    console.log(`Приглашение в комнату ${data.roomId}`);

    this.socket.emit("joinRoom", data.roomId);
    this.rivalRoomId = data.roomId;
    this.isRoomInvitation = true;
  }

  handleOpponentDisconnected(roomId: string): void {
    console.log(`Оппонент отключился. Комната ${roomId} закрыта.`);
    // console.log(`isGameSession: ${this.isGameSession} `); //true
    // console.log(`GA.isFinish: ${this.GA.isFinish} `); //false
    // console.log(`opponentExists: ${this.opponentExists} `); //true
    // console.log(`isRoom: ${this.isRoom} `); //true
    // console.log(`isGameFinished: ${this.isGameFinished} `); //false

    if (!this.isGameFinished) {

      if (this.profileContainer && !this.isGameSession) {
        this.clearUserRoom();
        this.socket.emit("updatePlayersStatus", { id: this.socket.id, available: this.starsNumber > 0 ? true : false, rating: this.playerRating });
        this.socket.emit("requestPlayers"); // Запрос списка активных игроков

      } else if (!this.isRoom) {
        this.socket.emit("requestPlayers"); // Запрос списка активных игроков
      } else if (this.isGameSession && this.isRoom && !this.isNewbie) {
        this.opponentExists = false;
        this.createEndSession();
      }
    }

    this.isGameFinished = false;
    this.clearProfileContainer(); // Очистка UI
  }

  createRoom() {
    //const roomId = this.socket.id; // Используем socket.id как идентификатор комнаты
    const roomId = crypto.randomUUID(); // Генерируем уникальный ID комнаты
    const roomData = {
      id: this.socket.id,
      userRoom: roomId,
      avatar: store.avatar,
      name: store.playerName || "Anonim",
      rating: this.playerRating,
      lang: store.lang,
      games: this.games,
      wins: this.wins,
      status: 'waiting',
      isYouX: store.isYouX,
      lastMove: null as number,
    };

    // Отправляем данные о комнате на сервер
    this.socket.emit("createRoom", roomData);

    this.userRoomId = roomId; // Сохраняем ID комнаты
  }

  sendGameInvite(opponentSocketId: string, name: string) {
    if (opponentSocketId) {
      if (!this.userRoomId) {
        this.createRoom(); // Убеждаемся, что комната создана
        this.privateRoomId = this.userRoomId;
      }
      console.log({ roomId: this.userRoomId, opponentSocketId, name });
      // Отправляем на сервер данные для приглашения (только roomId)
      this.socket.emit("sendInvitePlayer", { roomId: this.userRoomId, opponentSocketId, name });

      // Обновляем состояние игроков (available: false)			
      this.socket.emit("updatePlayersStatus", { id: this.socket.id, opponentSocketId, available: false, rating: this.playerRating });
      this.socket.emit("requestPlayers");
      //this.createMailIcon();
    } else {
      this.socket.emit("updatePlayersStatus", { id: this.socket.id, opponentSocketId: this.socket.id, available: false, rating: this.playerRating });
      this.socket.emit("requestPlayers");

      setTimeout(() => {
        console.log(`this.isExpert: ${this.isExpert} `);

        if (this.isExpert) {
          this.scene.restart();

          setTimeout(() => {
            console.log(`this.isSender: ${this.isSender} `);
            this.deleteControlPanele();
            this.deletePlayersContainer();
            this.createTimeBar();
            this.createTimer();
            this.chooseRival();
            this.opponentExists = true;
          }, 200);
        }

      }, 5000);
    }
  }

  initSocket() {

    if (this.socket) {
      // Очищаем ВСЕ слушатели, только если сокет уже был создан
      this.socket.removeAllListeners();
    }

    // Показываем визуальное ожидание подключения
    this.showConnectionWaitPhaser();

    this.socket = io("https://mygamex0x0.ru", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on("connect", () => {
      // console.log("Соединение установлено!!!", this.socket.id);
      this.hideConnectionWaitPhaser(); // Убираем визуалку

      // Отправляем данные о себе на сервер
      this.socket.emit("playerJoin", {
        available: this.starsNumber <= 0 ? false : true,
        id: this.socket.id,
        name: store.playerName || "Anonim",
        rating: this.playerRating,
        avatar: store.avatar || "defaultAvatar",
        lang: store.lang || "en",
        games: this.games || 0,
        wins: this.wins || 0
      });
    });

    // При ошибке подключения — можно что-то добавить
    this.socket.on("connect_error", (err) => {
      console.warn("Ошибка подключения к серверу:", err.message);
    });

    this.socket.on("dataSent", (data) => {
      // console.log("Данные получены", data);

      this.socket.emit("requestPlayers");

      this.socket.off("roomInvitation", this.handleRoomInvitation);
      this.socket.on("roomInvitation", this.handleRoomInvitation);

      this.socket.off("roomUpdate", this.handleRoomUpdate);
      this.socket.on("roomUpdate", this.handleRoomUpdate);

    });

    this.socket.on("connect_error", (err) => {
      console.error("Ошибка подключения:", err);
    });

    // Очищаем перед подпиской
    this.socket.off("updatePlayers", this.handleUpdatePlayers);
    this.socket.on("updatePlayers", this.handleUpdatePlayers);
  }

  //Анимация при подключении ("Крутилка")
  showConnectionWaitPhaser() {
    const petalCount = 12;
    const angleStep = 360 / petalCount;
    const petalWidth = 24;
    const petalHeight = 12;
    const radius = 40;
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    const animationDuration = 2000; // 2.0 секунды
    const petalFade = 0.5;
    const petals: Phaser.GameObjects.Ellipse[] = [];

    this.connectionUI = this.add.container(centerX, centerY);

    // Создаём лепестки
    for (let i = 0; i < petalCount; i++) {
      const angleDeg = i * angleStep;
      const angleRad = Phaser.Math.DegToRad(angleDeg);
      const x = radius * Math.cos(angleRad);
      const y = radius * Math.sin(angleRad);

      const petal = this.add.ellipse(x, y, petalWidth, petalHeight, 0xFF33FF, petalFade);
      petal.setRotation(angleRad);
      this.connectionUI.add(petal);
      petals.push(petal);

      // Анимация вспышки по кругу
      this.tweens.add({
        targets: petal,
        alpha: { from: 1, to: petalFade },
        duration: animationDuration * 1, // яркость быстро, потом плавно уходит
        ease: 'Sine.easeInOut',
        delay: (animationDuration / petalCount) * i,
        repeat: -1
      });
    }

    // Надпись "Подключение..."
    const loadingText = this.texts[store.lang]?.loadingText || this.texts["en"]?.loadingText;
    const errorText = this.texts[store.lang]?.errorText || this.texts["en"]?.errorText;
    const reloadText = this.texts[store.lang]?.reloadText || this.texts["en"]?.reloadText;

    const loadingTextBlock = this.add.text(0, radius + 30, loadingText, {
      font: "20px BadComic-Regular",
      color: "#E0DBEF"
    }).setOrigin(0.5);
    this.connectionUI.add(loadingTextBlock);

    // Сообщение об ошибке + кнопка через 5 циклов (10 сек)

    this.time.delayedCall(animationDuration * 5, () => {
      if (this.socket == null || this.socket && this.socket.id == null) {
        //console.log('number: ', 123);

        const errorTextBlock = this.add.text(0, radius + 60, errorText, {
          font: "16px BadComic-Regular",
          color: "#ff5555",
          align: "center",
          wordWrap: { width: 200 }
        }).setOrigin(0.5);

        this.connectionUI.add(errorTextBlock);

        // Кнопка "Перезагрузить"
        const reloadButton =
          this.add.image(0, 150, Images.GET_STARS_BTN)
            .setInteractive({ useHandCursor: true })
            .setOrigin(0.5);
        reloadButton.on("pointerdown", async (pointer: Phaser.Input.Pointer) => {
          if (pointer.rightButtonDown()) {
            return; // Игнорируем правую кнопку, ничего не делаем
          }
          this.clearProfileContainer();
          this.handleCancal();
        });
        this.connectionUI.add(reloadButton);

        // Надпись "Перезагрузка"
        const reloadTextBlock = this.add.text(reloadButton.x, 150, reloadText, {
          font: "20px BadComic-Regular",
          color: "#E0DBEF",
          align: "center"
        }).setOrigin(0.5);
        this.connectionUI.add(reloadTextBlock);
        console.log('reloadText: ', reloadText);
      }
    });
  }

  hideConnectionWaitPhaser() {
    if (this.connectionUI) {
      this.connectionUI.destroy(true);
      this.connectionUI = null;
    }
  }
  //======== Отслеживание подключения === end ===============================

  // Выход из игрового процесса
  handleExit() {
    console.log('this.isGameSession: ', this.isGameSession)

    if ((store.isForTwo || store.isVsComputer) && this.GA.moveStorage.length < 2) {
      this.scene.start("Start");
    } else if (!store.isForTwo && this.GA.moveStorage.length < 2) {
      if (store.isGameOnline) {
        if (this.socket) {
          this.socket.emit("playerExit");
          this.socket.removeAllListeners(); // Удаляем все сокет-события
          this.deletePlayersContainer(); // Удаляем контейнер
          this.deleteControlPanele();
          this.socket = null;
          this.clearUserRoom();

          console.log("Игрок вышел из игры");
          this.isExpert = false;
          this.scene.start("Start");
        }
      }

    } else if (!store.isForTwo && this.GA.moveStorage.length > 1
      && this.GA.moveStorage.length < 100
      && this.exitFromGamePopUp == null
      && (store.isYouX && this.GA.moveStorage.length % 2 == 0
        || !store.isYouX && this.GA.moveStorage.length % 2 != 0)) {

      this.exitFromGamePopUp = this.add.sprite(this.cameras.main.centerX - 300,
        this.cameras.main.centerY - 220,
        Images.POPUP).setOrigin(0, 0)
        .setAlpha(0.95);

      this.refereeImage = this.add.sprite(this.exitFromGamePopUp.x + 5, this.exitFromGamePopUp.y + 240,
        Images.AMATEUR).setOrigin(0, 0);
      this.refereeImage.setScale(0.8);

      console.log('this.refereeImage :', this.refereeImage);
      const exitWarningText = this.texts[store.lang]?.exitWarningText || this.texts["en"]?.exitWarningText

      this.readyToLoseTextBlock = this.add.text(this.exitFromGamePopUp.x + 300, this.exitFromGamePopUp.y + 135,
        exitWarningText,
        {
          font: "40px BadComic-Regular",
          color: "#ffffff",
          align: "center",
        })
      this.readyToLoseTextBlock.setOrigin(0.5, 0.5);

      const continueGameText = this.texts[store.lang]?.continueGameText || this.texts["en"]?.continueGameText

      this.continueGameButton = new Button(
        this,
        this.cameras.main.centerX + 20,
        this.exitFromGamePopUp.y + 360,
        null,
        null,
        '#ffffff',
        Images.INVITE_BUTTON,
        'BadComic-Regular',
        36,
        continueGameText,
        () => {
          this.clearExitElements();
        })

    } else if (store.isYouX && this.GA.moveStorage.length % 2 == 0
      || !store.isYouX && this.GA.moveStorage.length % 2 != 0
    ) {
      this.createEndSession();

      this.clearExitElements();

      if (this.socket) {
        this.socket.emit("playerExit");
        this.socket.emit("updatePlayersStatus", {
          id: this.socket.id,
          opponentSocketId: this.socket.id,
          available: false,
          rating: this.playerRating
        });

        this.socket.emit("requestPlayers");

        this.socket.removeAllListeners(); // Удаляем все сокет-события
        this.deletePlayersContainer(); // Удаляем контейнер
        this.deleteControlPanele();
        this.socket = null;
        this.clearUserRoom();
        console.log("Игрок вышел из игры");
        this.isExpert = false;
      }
    }
  }

  private clearExitElements() {
    if (this.exitFromGamePopUp) {
      this.exitFromGamePopUp.destroy();
      this.exitFromGamePopUp = null;
    }

    if (this.refereeImage) {
      this.refereeImage.destroy();
      this.refereeImage = null;
    }

    if (this.readyToLoseTextBlock) {
      this.readyToLoseTextBlock.destroy();
      this.readyToLoseTextBlock = null;
    }

    if (this.continueGameButton) {
      this.continueGameButton.container.destroy();
      this.continueGameButton = null;
    }
  }

  handleCancal() {
    if (this.socket) {
      if (this.isPopUpCheckStars) {
        this.scene.start("Game");
        this.socket.emit("requestPlayers");

      } else {
        this.socket.emit("playerExit");
        this.socket.removeAllListeners(); // Удаляем все сокет-события
        this.deletePlayersContainer(); // Удаляем контейнер
        this.deleteControlPanele();
        this.socket = null;
        this.clearUserRoom();
        console.log("Игрок вышел из игры");
        this.scene.start("Start");
      }
    } else this.scene.start("Start"); // Переход на главную сцену		
  }

  //============================= Создание профиля игрока ====================================

  async сreateProfile(id: string, lang: string, name: string, rating: any, avatarUrl: string, games: any, wins: any) {
    const rivalNameText = this.texts[store.lang]?.rivalNameText || this.texts["en"]?.rivalNameText;
    this.opponentId = id;
    this.pagination.hide();

    this.sys.game.device.os.desktop ? this.rivalName = name : this.rivalName = rivalNameText;
    this.rivalRating = rating;

    let inviteTextTween: any;

    this.deletePlayersContainer();
    this.deleteControlPanele();
    this.clearProfileContainer();

    this.profileContainer = this.add.container(this.cameras.main.centerX - 300, this.cameras.main.centerY - 220);//для отображения на дисплее    

    //Вызов динамической загрузки аватара
    console.log(avatarUrl)
    if (avatarUrl) {
      this.loadAvatarDynamically(avatarUrl).then(() => {
        this.opponentAvatar = this.add.image(this.cameras.main.centerX - 180, this.cameras.main.centerY - 25, id);
        this.avatarMask = this.add.image(this.cameras.main.centerX - 181, this.cameras.main.centerY - 26, Images.MASK);

      })
    } else {
      this.opponentAvatar = this.add.image(this.cameras.main.centerX - 180, this.cameras.main.centerY - 25, Images.EXPERT);
      this.avatarMask = this.add.image(this.cameras.main.centerX - 181, this.cameras.main.centerY - 26, Images.MASK);
    }

    const popUp: any = this.add.sprite(0,
      0, Images.POPUP)
      .setOrigin(0, 0)
      .setAlpha(0.95);

    //----------------------------- Кнопка "Пригласить"/"Играть"--------------------------------

    this.inviteButton =
      this.add.sprite(popUp.x + 120, popUp.y + 25, Images.INVITE_BUTTON)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", async (pointer: Phaser.Input.Pointer) => {

          (window as any).ysdk.features?.GameplayAPI?.start?.();
          if (pointer.rightButtonDown()) {
            return; // Игнорируем правую кнопку, ничего не делаем
          }

          // Останавливаем пульсирующую анимацию текста
          if (inviteTextTween) {
            inviteTextTween.stop();
            inviteTextTween.remove(); // Удаляем из TweenManager
          }

          // Удаляем текст с экрана
          if (inviteTextBlock) {
            inviteTextBlock.destroy();
            inviteTextBlock = null;
          }

          // Запускаем анимацию иконки
          this.mailIcon.setAlpha(1);

          this.tweens.add({
            targets: this.mailIcon,
            x: this.inviteButton.x + this.inviteButton.width * 0.9,
            angle: 360,
            duration: 7500,
            ease: 'Linear',
            repeat: -1,
            onComplete: () => {
              this.mailIcon.setAlpha(0);
            }
          });


          if (!this.opponentId) {
            this.sendGameInvite(id, name);

          } else if (this.isSender) {
            this.sendGameInvite(id, name);
            this.isRoom = true;

          } else if (this.isRoom) {
            console.log("Отправка обновления:", {
              roomId: this.rivalRoomId,
              opponentId: this.opponentId,
              updatedData: { status: "ready" },
            });

            this.socket.emit("updatingRoomData", {
              roomId: this.rivalRoomId,
              opponentId: this.opponentId,
              updatedData: { status: "ready" }
            });
            this.scene.restart();

          }
        });

    //----------------------------------------------------------------------

    // Создаем иконку письма, но делаем её невидимой
    this.mailIcon = this.add.sprite(this.inviteButton.x + this.inviteButton.width * 0.1, this.inviteButton.y + 30, Images.INVITE)
      .setOrigin(0.5, 0.5)
      .setScale(0.75) // Масштабируем при необходимости
      .setAlpha(0);  // Изначально скрыта 
    //-------------------------- Текст "Язык" -----------------------------------
    const langText = this.texts[store.lang]?.langText || this.texts["en"]?.langText;

    const langTextBlock = this.add.text(popUp.x + 50, popUp.y + 360, (langText + lang), {
      font: "32px BadComic-Regular",
      color: "#f5ebdf",
    });
    //-------------------------- Текст "Игры" -----------------------------------
    const gamesText = this.texts[store.lang]?.gamesText || this.texts["en"]?.gamesText;

    const gamesTextBlock = this.add.text(popUp.x + 270, popUp.y + 110, (gamesText + games), {
      font: "32px BadComic-Regular",
      color: "#f5ebdf",
    });
    //-------------------------- Текст "Победы" -----------------------------------
    const victoryText = this.texts[store.lang]?.victoryTex || this.texts["en"]?.victoryTex;

    const victoryTextBlock = this.add.text(popUp.x + 270, popUp.y + 180, (victoryText + wins), {
      font: "32px BadComic-Regular",
      color: "#f5ebdf",
    });

    //------------------------ Текст "Пригласить/Играть!"---------------------------------
    const inviteText = this.texts[store.lang]?.inviteText || this.texts["en"]?.inviteText;
    const playText = this.texts[store.lang]?.playText || this.texts["en"]?.playText;

    let inviteTextBlock: any = this.add.text(this.inviteButton.x + this.inviteButton.width / 2, this.inviteButton.y + this.inviteButton.height / 2, (this.isSender || !id ? inviteText : playText), {
      font: "36px BadComic-Regular",
      color: "#ffee27",
      align: "center"
    });
    inviteTextBlock.setOrigin(0.5, 0.5);

    if (!this.isSender && this.opponentId) { }

    inviteTextTween = this.tweens.add({
      targets: inviteTextBlock,
      scaleX: 1.1, // Увеличение на 5%
      scaleY: 1.1,
      alpha: 1, // Увеличение яркости (если alpha < 1)
      duration: 750, // Половина секунды для увеличения
      yoyo: true, // Вернуть в исходное состояние
      repeat: -1, // Зациклить анимацию
      ease: "Sine.easeInOut" // Плавность анимации
    });

    //-------------------------------------------------------------------------
    //-------------------------- Текст name -----------------------------------

    const nameBlock = this.add.text(popUp.x + 50, popUp.y + 320, name, {
      font: "32px BadComic-Regular",
      color: "#f5ebdf",
    });
    //-------------------------------------------------------------------------
    //-------------------------- Текст "Рейтинг:" + rating) -----------------------------------

    const ratingText = this.texts[store.lang]?.ratingText || this.texts["en"]?.ratingText;

    const ratingTextBlock = this.add.text(popUp.x + 270, popUp.y + 250, (ratingText + rating), {
      font: "32px BadComic-Regular",
      color: "#f5ebdf",
    });


    // Кнопка взврата к списку игроков / отклонения приглашения

    const backButton = this.add.sprite(popUp.x + 470, popUp.y + 450, Images.BACK_BUTTON)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        if (pointer.rightButtonDown()) {
          return; // Игнорируем правую кнопку, ничего не делаем
        }
        this.isExpert = false;
        this.clearProfileContainer();
        console.log({ roomId: this.privateRoomId });
        console.log('backButton нажата!!!')
        console.log('this.isRoom', this.isRoom)
        if (this.isRoom) {
          this.socket.emit("refusalPlay", { opponentId: this.opponentId, roomId: this.privateRoomId });
        } else {
          this.scene.start("Game")
        }

        // Уведомляем сервер, что игроки снова доступны
        if (this.starsNumber > 0) {
          this.socket.emit("updatePlayersStatus", {
            id: this.socket.id,
            opponentSocketId: this.opponentId,
            available: true,
            rating: this.playerRating
          });
        } else {
          this.socket.emit("updatePlayersStatus", {
            id: this.opponentId,
            opponentSocketId: this.opponentId,
            available: true,
            rating: this.playerRating
          });
        }

        this.isSender = false;
        this.isRoom = false;
        this.userRoomId = null;

        this.socket.emit("requestPlayers");

      });

    // Кнопка взврата к списку игроков / отклонения приглашения ----------------end----------

    this.createSoundButton();

    this.profileContainer.add([
      popUp, this.inviteButton, this.mailIcon, inviteTextBlock, langTextBlock,
      gamesTextBlock, victoryTextBlock, nameBlock, ratingTextBlock, backButton
    ]);

    this.socket.off("roomDelete", this.handleRoomDelete);
    this.socket.on("roomDelete", this.handleRoomDelete);

    this.socket.off("opponentDisconnected", this.handleOpponentDisconnected);
    this.socket.on("opponentDisconnected", this.handleOpponentDisconnected);

  }

  createSoundButton() {
    let data: string = localStorage.getItem('isSoundEnable');
    this.soundButton = new Button(
      this,
      this.cameras.main.centerX - 205,
      this.cameras.main.centerY + 265,
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

  // Универсальная функция очистки контейнера
  clearProfileContainer(): void {
    if (this.opponentAvatar) {
      this.opponentAvatar.destroy();
      this.avatarMask.destroy();
      this.opponentAvatar = null;
      this.avatarMask = null;

    }

    if (this.profileContainer) {
      this.profileContainer.removeAll(true);
      this.profileContainer.destroy(true);
      this.profileContainer = null;
    }

    if (this.soundButton) {
      this.soundButton.container.destroy();
    }
  }

  handleRoomDelete(roomId: string): void {
    // console.log(`Приватная комната ${JSON.stringify(roomId)} удалена`);

    // console.log(`Оппонент отключился. Комната ${roomId} закрыта.`);
    // console.log(`isGameSession: ${this.isGameSession} `); //true
    // console.log(`GA.isFinish: ${this.GA.isFinish} `); //false
    // console.log(`opponentExists: ${this.opponentExists} `); //true
    // console.log(`isRoom: ${this.isRoom} `); //true
    // console.log(`isGameFinished: ${this.isGameFinished} `); //false

    if (!this.isGameSession && this.isRoom) {
      this.actionButtonConfirm();
    }

    this.isGameSession = false;
    this.opponentExists = false;

    //console.log(101)
    if (this.isTimerOn) {
      this.createEndSession();
    }

    this.clearProfileContainer();
  }

  clearUserRoom() {
    this.isRoom = false; // Сбрасываем флаг комнаты
    this.userRoomId = null; // Сбрасываем ID комнаты
    this.isSender = false;
    this.opponentExists = false;
    this.isGameSession = false;
  }

  // Динамическая загрузка аватара
  loadAvatarDynamically(avatarUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {

      // Загружаем изображение
      this.load.image(this.opponentId, avatarUrl);

      // Успешная загрузка
      this.load.once('complete', () => {
        resolve();
      });

      // Ошибка загрузки
      this.load.once('loaderror', (file: any) => {
        if (file.key === this.opponentId) {
          reject(new Error(`Failed to load avatar from URL: ${avatarUrl}`));
        }
      });

      this.load.start();
    });
  }

  onCellClickedOnline(cell: Cell) {
    if (this.opponentId && this.isTimerOn) {
      this.opponentExists = true;
      // console.log('есть нажатие!')
      // console.log(this.textInTimeBar);
      // console.log(store.isYouX);

      // console.log('this.isGameSession: ', this.isGameSession);
      // console.log('store.isYouX: ', store.isYouX);
      // console.log('this.GA.moveStorage.length: ', this.GA.moveStorage.length);

      if (this.isGameSession && (store.isYouX && this.GA.moveStorage.length % 2 == 0
        || !store.isYouX && this.GA.moveStorage.length % 2 !== 0)) {
        this.Timer.paused = true;
        console.log('есть ход');
        this.lastMove = cell.id;
        console.log(this.lastMove);

        this.socket.emit("updatingRoomData", {
          roomId: this.privateRoomId,
          opponentId: this.opponentId,
          updatedData: { lastMove: this.lastMove }
        });
        this.GA.onCellClicked(this.cells[this.lastMove]);

        setTimeout(() => {
          this.Timer.paused = false;
        }, 1000);
      }
    }
  }

}