import Cell from './Cell';
type MyType = [Cell, Cell[], Cell[], Cell[], Cell[]];
export default class TestKit {
  cell: Cell;
  cells: Cell[] = [];
  
  arraysCell: MyType;
  constructor(param1: Cell, param2: Cell[]) {
    this.cell = param1;
    this.cells = param2;
  }

  createTestKit() {
    //====== Создаем массивы для нажатой ячейки param1==========
    const arr1: Cell[] = []; //горизонтальный массив
    const arr2: Cell[] = []; //вертикальный массив
    const arr3: Cell[] = []; //диагон. массив (лево-верх -> право-низ)
    const arr4: Cell[] = []; //диагон. массив (право-верх -> лево-низ)
    
    for (let i = 0; i < this.cells.length; i++ ) {
      //Заполняем массивы ячейками массива param2 в заданном диапазоне
      // Для массива arr1
      if (
        this.cells[i].x >= this.cell.x - 4 * this.cell.width &&
        this.cells[i].x <= this.cell.x + 4 * this.cell.width &&
        this.cells[i].y == this.cell.y
      ) {
        arr1.push(this.cells[i]);
      }
      // Для массива arr2
      if (
        this.cells[i].y >= this.cell.y - 4 * this.cell.height &&
        this.cells[i].y <= this.cell.y + 4 * this.cell.height &&
        this.cells[i].x == this.cell.x
      ) {
        arr2.push(this.cells[i]);
      }
      // Для массива arr3
      if (
        this.cells[i].x >= this.cell.x - 4 * this.cell.width &&
        this.cells[i].x <= this.cell.x + 4 * this.cell.width &&
        this.cells[i].x - this.cells[i].y == this.cell.x - this.cell.y
      ) {
        arr3.push(this.cells[i]);
      }
      // Для массива arr4
      if (
        this.cells[i].x >= this.cell.x - 4 * this.cell.width &&
        this.cells[i].x <= this.cell.x + 4 * this.cell.width &&
        this.cells[i].x + this.cells[i].y == this.cell.x + this.cell.y
      ) {
        arr4.push(this.cells[i]);

      }
    }
    this.arraysCell = [this.cell, arr1, arr2, arr3, arr4]; //общий массив

    return this.arraysCell;
  }
}
