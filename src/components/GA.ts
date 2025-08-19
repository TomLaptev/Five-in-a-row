import { Source } from '../GameConfig';
import GameScene from '../scenes/GameScene';
import TestKit from '../components/Test';
import { Images } from '../utils/const';
import Cell from './Cell';
import templateX from '../../assets/templateX.json';
import templateZero from '../../assets/templateZero.json';
import store from '../store';
type MyType = [Cell, Cell[], Cell[], Cell[], Cell[]];

export default class GameAlgoritm {
  scene: GameScene;
  moveStorage: Cell[] = [];
  cells: Cell[] = [];

  cellsGA: Cell[] = []; // массив сделанных ходов АИ
  cellsR: Cell[] = []; // массив сделанных ходов игрока
  bestCellsR: Cell[] = []; // массив лучших сделанных ходов (по z) игрока
  cellsFieldGA: Cell[] = []; // массив возможных ходов АИ
  sampleGA: Cell[] = []; // массив лучших возможных ходов (по w) АИ
  cellsFieldR: Cell[] = []; // массив возможных ходов игрока
  sampleR: Cell[] = []; // массив лучших возможных ходов (по z) игрока
  testKitLastMovesR: MyType[] = []; // набор тестов для сделанных ходов игрока
  testKitGA: MyType[] = []; // набор тестов для возможных ходов АИ
  testKitR: MyType[] = []; // набор тестов для возможных ходов игрока
  bestGA: number; // id выбранной ячейки
  bestR: number; // id выбранной ячейки 
  isFinish: boolean = false;
  templX: any = templateX;
  templZero: any = templateZero;
  isMoveAllowed: boolean = true;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  onCellClicked(cell: Cell) {
    if (cell.value == -1
      && !this.isFinish
      && this.scene.timeReserve
      && this.scene.isTimerOn
      && this.isMoveAllowed
      && !this.scene.exitFromGamePopUp) {
      this.isMoveAllowed = false;
      this.scene.pointer.destroy();

      // console.log('cell.id: ', cell.id);

      //для крестика "обесцвечиваем" предыдущий нолик
      if (this.moveStorage.length % 2 == 0) {
        if (this.moveStorage.length > 0) {
          this.scene.add
            .sprite(this.moveStorage.at(-1).x, this.moveStorage.at(-1).y, Images.CELL_ZERO)
            .setOrigin(0, 0);
        }
        this.scene.add.sprite(cell.x, cell.y, Images.CELL_X_HIGHLIGHTED).setOrigin(0, 0);

        cell.value = 1;
        store.isYouX ? this.cellsR.push(cell) : this.cellsGA.push(cell);
      } else {
        //для нолика "обесцвечиваем" предыдущий крестик
        if (this.moveStorage.length % 2) {
          this.scene.add
            .sprite(this.moveStorage.at(-1).x, this.moveStorage.at(-1).y, Images.CELL_X)
            .setOrigin(0, 0);
        }

        this.scene.add.sprite(cell.x, cell.y, Images.CELL_ZERO_HIGHLIGHTED).setOrigin(0, 0);

        cell.value = 0;
        store.isYouX ? this.cellsGA.push(cell) : this.cellsR.push(cell);
      }
      this.moveStorage.push(cell);
      //console.log('this.moveStorage.length:', this.moveStorage.length)
      this.scene.sounds.move.play({ volume: 0.5 });
      this.scene.createTimeBar();
      this.scene.timeMask.destroy();

      if (this.moveStorage.length == 2
        && !store.isForTwo
        //&& !this.scene.isNewbie
      ) {
        this.scene.starsNumber >= 0.5 ? this.scene.starsNumber -= 0.5 : 1;
      }

      if (this.moveStorage.length == 2) {
        this.scene.games++;
      }

      if (!store.isForTwo) {
        localStorage.setItem('stars', ` ${this.scene.starsNumber}`);
        console.log('stars:', this.scene.starsNumber);
      }

      //=========================================================================================

      this.scene.createPointer();
      if (this.moveStorage.length > 1 && !this.isFinish) {
        this.scene.pointer.x = this.moveStorage.at(-2).x;
        this.scene.pointer.y = this.moveStorage.at(-2).y;
      }

      // Проверка наличия победителя
      // Запускаем createTestKit() в кл. TestKit и получаем массив,
      // для ячейки cell, содержащий в себе 4 массива
      let testWinKit: any[] = new TestKit(cell, this.scene.cells).createTestKit();

      let winLine = [];
      let count: number;
      let symbol: any = cell.value;

      symbol == 1 ? (symbol = Images.CELL_X_HIGHLIGHTED) : (symbol = Images.CELL_ZERO_HIGHLIGHTED);

      for (let i = 1; i < testWinKit.length; i++) {
        outer: while (testWinKit[i].length >= 5) {
          winLine.length = 0;
          count = 0;
          for (let j = 0; j < 5; j++) {
            if (
              testWinKit[i][testWinKit[i].length - 1 - count].value === cell.value
            ) {
              winLine.push(testWinKit[i][testWinKit[i].length - 1 - count]);
              count++;
              if (count == 5) {
                //console.log("Ура! Победа");                
                this.isFinish = true;
                this.scene.isTimerOn = false;

                //"обесцвечиваем" предыдущий символ
                if (this.moveStorage.length % 2 === 0) {
                  this.scene.add
                    .sprite(this.moveStorage.at(-1).x, this.moveStorage.at(-1).y, Images.CELL_ZERO)
                    .setOrigin(0, 0);
                } else {
                  this.scene.add
                    .sprite(this.moveStorage.at(-1).x, this.moveStorage.at(-1).y, Images.CELL_X)
                    .setOrigin(0, 0);
                }

                winLine.reverse(); // Разворачиваем массив, чтобы анимация шла в порядке хода
                winLine.forEach((cell, index) => {
                  setTimeout(() => {
                    this.scene.add
                      .sprite(cell.x, cell.y, symbol)
                      .setOrigin(0, 0);
                    this.scene.sounds.notification.play({ volume: 0.3 });
                  }, index * 700); // Увеличиваем задержку для каждого символа
                });
                break outer;
              }
            }
          }
          testWinKit[i].pop();
        }
      }
      //==================================== 

      // Задержка на ход бота

      if (this.moveStorage.length && (store.isVsComputer || store.isGameOnline && !this.scene.opponentId)) {
        if ((this.moveStorage.length % 2 && store.isYouX) // Ход нолика 
          || this.moveStorage.length % 2 === 0 && !store.isYouX) {  // Ход крестика 
          setTimeout(() => {
            this.chooseFirstStepGA();
          }, this.moveStorage.length < 10 ? 1500 : 3000)
        } else {
          this.chooseFirstStepGA();
        }
      } else if (store.isGameOnline || store.isForTwo) {
        this.isMoveAllowed = true;
      }

    }
  }

  chooseFirstStepGA() {
    this.isMoveAllowed = true;
    if (this.moveStorage.length === 1 && store.isYouX) {
      let correctionX: number = 0;
      let additiveX: number = 0;
      let correctionY: number = 0;
      let additiveY: number = 0;
      let indexPosition: number = 0;
      let differenceX: number = 0;
      let differenceY: number = 0;

      if (this.moveStorage.at(-1).x < this.scene.cells[0].x + 4 * Source.cellWidth) {
        correctionX = 1;
        additiveX = 1;
      } else if (
        this.moveStorage.at(-1).x >
        this.scene.cells.at(-1).x - 4 * Source.cellWidth
      ) {
        correctionX = -1;
        additiveX = 1;
      }
      if (
        this.moveStorage.at(-1).y <
        this.scene.cells[0].y + Math.ceil(Source.rows / 2) * Source.cellHeight
      ) {
        correctionY = 1;
      } else correctionY = -1;
      if (this.moveStorage.at(-1).y < this.scene.cells[0].y + 3 * Source.cellHeight) {
        additiveY = Source.cols;
      } else if (
        this.moveStorage.at(-1).y >
        this.scene.cells.at(-1).y - 3 * Source.cellWidth
      ) {
        additiveY = Source.cols;
      }

      differenceX = Math.abs(this.moveStorage.at(-1).x - this.scene.cells[112].x) / Source.cellWidth;
      differenceY = Math.abs(this.moveStorage.at(-1).y - this.scene.cells[112].y) / Source.cellHeight;

      if (differenceX < 2 && differenceY < 2) {
        indexPosition = this.moveStorage.at(-1).id + this.templX[0].arr[Math.floor(Math.random() * 8)];
      } else {
        indexPosition =
          this.moveStorage.at(-1).id +
          correctionY * (Source.cols + additiveY) +
          correctionX * (1 + additiveX);
      }
      this.onCellClicked(this.scene.cells[indexPosition]);
    } else this.chooseStepGA();
  }

  chooseStepGA() {
    this.cellsFieldGA.length = 0;
    this.sampleGA.length = 0;
    this.cellsFieldR.length = 0;
    this.sampleR.length = 0;
    this.testKitGA.length = 0;
    this.testKitR.length = 0;
    let maxAttackR: number = 0; // номер выбранной ячейки в массиве this.cellsR

    if (this.moveStorage.length > 1) {

      //Собираем все свободные ячейки возможных ходов ИА для создания проверочных массивов в this.cellsFieldGA
      this.createCellsField(this.cellsGA, this.cellsFieldGA);
      //Для противника (игрока) в cellsFieldR
      this.createCellsField(this.cellsR, this.cellsFieldR);

      //Создаем массивы testKit(в каждом: тестируемая ячейка и 4 массива - гориз., верт. и диагон-е)
      // для последнего хода и каждой ячейки cellsField(для сравнения с шаблонами)
      this.createTestKit(this.testKitLastMovesR, this.cellsR);
      this.createTestKit(this.testKitGA, this.cellsFieldGA);
      this.createTestKit(this.testKitR, this.cellsFieldR);

      // Определяем вес возможных ходов в атаке АИ.
      if (store.isYouX) {
        this.getWeightField(this.testKitLastMovesR, this.templX);
        this.getWeightField(this.testKitR, this.templX);
        this.getWeightField(this.testKitGA, this.templZero);
      } else {
        this.getWeightField(this.testKitLastMovesR, this.templZero);
        this.getWeightField(this.testKitR, this.templZero);
        this.getWeightField(this.testKitGA, this.templX);
      }
      //============== Массив (this.sampleGA) 'лучших' возможных ходов АИ === start =============
      this.getBestAttackGA();
      this.getBestAttackR();

      //====================== end ====================================================
      //============ Выбираем ячейку из this.cellsR с максимальным z =================
      this.bestCellsR = this.cellsR.slice().sort((a, b) => b.z - a.z).slice(0, 1);

      //console.log('this.bestCellsR: ', this.bestCellsR, 'id: ', this.bestCellsR[0].id, 'z: ', this.bestCellsR[0].z)
      //console.log(this.sampleR)
      // =====Выбор хода === GA === start ===========
      if (this.moveStorage.length > 1 && store.isYouX && this.moveStorage.at(-1).value === 1
        || !store.isYouX && this.moveStorage.at(-1).value === 0) {
        if (this.scene.isExpert) {

          if (this.sampleGA[0].w >= this.templX[2].attackWeight  // 5!

            || (this.sampleGA[0].w >= this.templX[4].attackWeight + this.templX[13].attackWeight// зкр.4 + откр.2
              && this.sampleR[0].z < this.templX[2].protectionWeight) // меньше 5

            || (this.sampleGA[0].w >= this.templX[10].attackWeight  //откр.3
              && this.sampleR[0].z < this.templX[4].protectionWeight + this.templX[10].protectionWeight)  // зкр.4 + откр.3

            || this.sampleR[0].z < 2 * this.templX[10].protectionWeight

            || this.bestCellsR[0].z >= 2 * this.templX[10].protectionWeight// 2 откр.3
            && this.bestCellsR[0].z < this.templX[4].protectionWeight

          ) {

            console.log("атака");

            if (this.moveStorage.length < 3) {
              this.onCellClicked(this.scene.cells[this.sampleGA[Math.floor(Math.random() * 3)].id]);;

            } else {
              this.onCellClicked(this.scene.cells[this.sampleGA[this.bestGA].id]);
            }

          } else {

            if (this.sampleR[0].z >= 2 * this.templX[10].protectionWeight) {
              this.onCellClicked(this.scene.cells[this.sampleR[0].id]);
              console.log("защита-1");
            } else {
              this.onCellClicked(this.scene.cells[this.sampleR[this.bestR].id]);
              console.log("защита-2");
            }
          }

        } else if (this.scene.isAmateur) {
          console.log('Kesha');

          if (this.sampleGA[0].w >= this.templX[2].attackWeight  // 5!

            || (this.sampleGA[0].w >= this.templX[4].attackWeight //+ this.templX[13].attackWeight// зкр.4 + откр.2
              && this.sampleR[0].z < this.templX[2].protectionWeight) // меньше 5

            || (this.sampleGA[0].w >= this.templX[10].attackWeight  //откр.3
              && this.sampleR[0].z < this.templX[4].protectionWeight + this.templX[10].protectionWeight)  // зкр.4 + откр.3
            || this.sampleR[0].z == this.templX[4].protectionWeight // зкр.4

          ) {
            // console.log("атака");

            if (this.moveStorage.length < 4) {
              this.onCellClicked(this.scene.cells[this.sampleGA[Math.floor(Math.random() * 2)].id]);

            } else {
              this.onCellClicked(this.scene.cells[this.sampleGA[0].id]);
            }

          } else {

            //console.log("защита");
            this.onCellClicked(this.scene.cells[this.sampleR[0].id]);
          }
        }
        else if (this.scene.isNewbie) {

          if (this.sampleGA[0].w >= this.templX[2].attackWeight
            && Math.random() > 0.7  // 5!

            || (this.sampleGA[0].w >= this.templX[10].attackWeight  //откр.3
              && Math.random() > 0.5

            )) {
            // console.log("атака");

            this.onCellClicked(this.scene.cells[this.sampleGA[0].id]);


          } else {
            if (Math.random() > 0.5) {
              this.onCellClicked(this.scene.cells[this.sampleR[0].id]);
            } else {
              this.onCellClicked(this.scene.cells[this.sampleR[1].id]);
            }


          }

        }

      }
    }
  }

  getBestAttackGA() {
    this.sampleGA = this.cellsFieldGA.sort((a, b) => b.w - a.w).slice(0, 5);

    this.bestGA = 0;
    let max = 0;
    for (let i = 0; i < this.sampleGA.length; i++) {
      if (this.sampleGA.length > 0 && this.sampleGA[i].sum > max) {
        max = this.sampleGA[i].sum;
        this.bestGA = i;
      }
    }
  }

  getBestAttackR() {

    this.sampleR = this.cellsFieldR.sort((a, b) => b.z - a.z).slice(0, 5);

    this.bestR = 0; // номер эл. в массиве this.sampleR
    let max = 0;
    for (let i = 0; i < this.sampleR.length; i++) {
      if (this.sampleR.length > 0 && this.sampleR[i].sum > max) {
        max = this.sampleR[i].sum;
        this.bestR = i;
      }
    }
  }

  createCellsField(ARRAY: Cell[], FIELD: Cell[]) {
    //Собираем все ячейки возможных ходов для АИ и игрока в свой массив
    for (let i = 0; i < ARRAY.length; i++) {
      for (let j = 0; j < this.templX[1].arr.length; j++) {
        if (
          this.scene.cells[ARRAY[i].id + this.templX[1].arr[j]] != null && // ячейка существует
          this.scene.cells[ARRAY[i].id + this.templX[1].arr[j]].value == -1 && // ячейка свободна
          Math.abs(
            this.scene.cells[ARRAY[i].id + this.templX[1].arr[j]].x - ARRAY[i].x
          ) <
          3 * Source.cellWidth //ячейка не далее 2 длин своей ширины
        ) {
          this.scene.cells[ARRAY[i].id + this.templX[1].arr[j]].value = 1; // обозначаем ее как занятую
          FIELD.push(this.scene.cells[ARRAY[i].id + this.templX[1].arr[j]]); // отправляем в массив
        }
      }
    }

    FIELD.forEach((el: Cell) => {
      el.value = -1; // вновь обозначаем ячейки как свободные
    });
    return FIELD;
  }

  createTestKit(ARR: any[], FIELD: Cell[]) {
    for (let i = 0; i < FIELD.length; i++) {
      ARR[i] = new TestKit(FIELD[i], this.scene.cells).createTestKit();
    }
    return ARR;
  }

  getWeightField(TEST: any[], TEMPLATE: any[]) {
    let count: number = 0;
    let test: any[] = [];

    for (let i = 0; i < TEST.length; i++) {
      if (TEST === this.testKitGA) {
        store.isYouX ? TEST[i][0].value = 0 : TEST[i][0].value = 1;
        this.testKitGA[i][0].w = 0;
      } else if (TEST === this.testKitR) {
        store.isYouX ? TEST[i][0].value = 1 : TEST[i][0].value = 0;
        this.testKitR[i][0].z = 0;
      } else if (TEST === this.testKitLastMovesR) {
        store.isYouX ? TEST[i][0].value = 1 : TEST[i][0].value = 0;
        this.testKitLastMovesR[i][0].z = 0;
      }
      outer: for (let j = 1; j < 5; j++) {
        // проходим по шаблонам
        for (let k = 2; k < TEMPLATE.length; k++) {
          count = 0;
          // выбираем тест из набора и создаем его копию
          test = TEST[i][j].slice();
          while (test.length >= TEMPLATE[k].arr.length) {
            // проходим по тесту и шаблону с конца
            if (
              test[test.length - 1 - count].value ===
              TEMPLATE[k].arr[TEMPLATE[k].arr.length - 1 - count]
            ) {
              count++;
              if (count === TEMPLATE[k].arr.length) {

                if (TEST === this.testKitGA) {
                  this.testKitGA[i][0].w += TEMPLATE[k].attackWeight;
                } else if (TEST === this.testKitR) {
                  this.testKitR[i][0].z += TEMPLATE[k].protectionWeight;

                } else if (TEST === this.testKitLastMovesR) {
                  this.testKitLastMovesR[i][0].z += TEMPLATE[k].protectionWeight;
                }
                continue outer;
              }
            } else {
              test.pop();
              count = 0;
            }
          }
        }
      }
      TEST[i][0].sum = TEST[i][0].w + TEST[i][0].z;
      if (TEST !== this.testKitLastMovesR) {
        TEST[i][0].value = -1;
      }

    }
  }
}


















