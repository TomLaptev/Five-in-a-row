import { GameConfig, Source } from '../GameConfig';
import GameScene from '../scenes/GameScene';
import { Images } from '../utils/const';
import Cell from './Cell';

export default class Board {
  scene: GameScene;

  offsetX: number;
  offsetY: number;
  GA: Cell[];

  constructor(scene: GameScene) {
    this.scene = scene;

    this.scene.input.on(
      'gameobjectdown',
      function (pointer: Phaser.Input.Pointer, gameObject: Cell) {
        gameObject.emit('clickCell', gameObject);
      },
      this
    );
  }

  public drawBoard(): void {
    this.createCells();
  }

  private getCellsPositions() {
    let positions = [];
    this.offsetX = (+GameConfig.width - Source.cellWidth * Source.cols) / 2;
    if (GameConfig.width == 2800) {
      this.offsetY = (+GameConfig.height - Source.cellHeight * Source.rows) / 2
    } else this.offsetY = -20 + (+GameConfig.height - Source.cellHeight * Source.rows) / 2

    for (let row = 0; row < Source.rows; row++) {
      for (let col = 0; col < Source.cols; col++) {
        positions.push({
          x: this.offsetX + col * Source.cellWidth,
          y: this.offsetY + row * Source.cellHeight,
        });
      }
    }
    return positions;
  }

  private createCells(): void {
    let positions = this.getCellsPositions();

    for (let i = 0; i < positions.length; i++) {
      this.scene.cells[i] =
        new Cell(
          this.scene,
          positions[i],
          Images.CELL_FREE,
          i,
          this.handleCellClick
        );
      this.scene.cells[i].value = -1; //Отмечаем закрытые(свободные) ячейки
    }
  }
  private handleCellClick(cell: any): void {
    if (cell.value !== -1 || this.scene.isGameFinished) {
      console.log('cell.value: ', cell.value)
      return;
    }

      if (this.scene.opponentId) {
        this.scene.onCellClickedOnline(cell);
      } else {
        this.scene.GA.onCellClicked(cell);
      }
    
  }
}
