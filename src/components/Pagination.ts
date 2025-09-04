import GameScene from "../scenes/GameScene";
import Button from '../components/Button';
import { Images } from '../utils/const';

export default class Pagination {
  public currentPage: number;
  public totalPages: number;
  private buttonsPerRange: number = 3;
  public parentContainer: Phaser.GameObjects.Container;
  private onPageChange: (page: number) => void;
  private scene: Phaser.Scene; // Сохраняем сцену для удобства


  constructor(scene: Phaser.Scene, totalPlayers: number, currentPage: number, onPageChange: (page: number) => void) {
    this.scene = scene;
   // this.totalPages = Math.ceil(totalPlayers / 10);
    if (totalPlayers <= 8) {
      this.totalPages = 1
    } else  {
       this.totalPages = 1 + Math.ceil((totalPlayers - 8) / 10)
    }
    console.log('totalPlayers: ', totalPlayers)
    this.currentPage = Math.min(currentPage, this.totalPages); // Сохраняем текущую страницу
    this.onPageChange = onPageChange;
    this.parentContainer = this.createContainer();
    this.updateButtons(this.currentPage);
   // console.log("Создаём новый Pagination. Получена страница:", currentPage);
    //console.log("Итоговая текущая страница после обработки:", this.currentPage);
  }

  private createContainer() {
    // Удаляем старый контейнер, если он есть
    if (this.parentContainer) {
      this.parentContainer.removeAll(true);
      this.parentContainer.destroy(true);
    }
    // Создаем новый контейнер
    return this.scene.add.container(
      (this.scene as GameScene).playersContainer.x,
      (this.scene as GameScene).playersContainer.y
    );
  }

  private updateButtons(targetPage: number) {
   
    //console.log(`Обновление кнопок. Получена страница: ${targetPage}, Текущая страница: ${this.currentPage}`);
    // Пересоздаем контейнер перед обновлением
    this.parentContainer = this.createContainer();
    this.currentPage = targetPage; // Перенёс сюда, чтобы гарантировать актуальное значение

    // 1. Определяем диапазон страниц
    let rangeIndex = Math.ceil(targetPage / this.buttonsPerRange);
    let startPage = Math.max(1, (rangeIndex - 1) * this.buttonsPerRange + 1);
    let endPage = Math.min(this.totalPages, startPage + this.buttonsPerRange - 1);

    //================================================================
    if (endPage > 3 && endPage == this.totalPages) {
      startPage = endPage - this.buttonsPerRange + 1;
    }
    //================================================================

    //console.log(`Диапазон страниц: ${startPage} - ${endPage}`);

    // 2. Добавляем стрелку "назад", если есть предыдущий диапазон
    if (startPage > 1 ) {
      const leftArrow = this.scene.add.text(90, 550, "<", { font: "44px Arial", color: "#ffffff" })
        .setInteractive()
        .on("pointerdown", () => {
          this.updateButtons(startPage - 1);
          // this.parentContainer;
        });
      this.parentContainer.add(leftArrow);
    }

    // 3. Добавляем кнопки страниц
    for (let i = startPage; i <= endPage; i++) {
     const button = new Button(this.scene, 155 + (i - startPage) * 60, 575, null, null, 
        i === targetPage ? "#ffff00" : "#eee", Images.BUTTON_FRAME, "'BadComic-Regular", 28, `${i}`, () => {
        this.changePage(i);
      });

      this.parentContainer.add(button.container);
    }

    // 4. Добавляем стрелку "вперед", если есть следующий диапазон
    if (endPage < this.totalPages) {
      const rightArrow = this.scene.add.text(320, 550, ">", { font: "44px Arial", color: "#ffffff" })
        .setInteractive()
        .on("pointerdown", () => {
          this.updateButtons(endPage + 1)
          // this.parentContainer;
        });
      this.parentContainer.add(rightArrow);
    }

    // 5. Вызываем onPageChange для обновления данных
    this.onPageChange(targetPage);
  }

  private changePage(newPage: number) {
    this.currentPage = newPage;
    this.updateButtons(newPage);   

  }

  // Обновление числа игроков и пересчет страниц
  public updateTotalPlayers(totalPlayers: number) {
   // console.log(`Обновление числа игроков. Текущая страница: ${this.currentPage}, Всего страниц: ${this.totalPages}`);

   if (totalPlayers <=8) {
    this.totalPages = 1
   } else this.totalPages = 1 + Math.ceil((totalPlayers - 8) / 10);

    this.currentPage = Math.min(this.currentPage, this.totalPages); // ✅ Проверяем, можно ли остаться на той же странице

    //console.log(`После проверки границ. Текущая страница: ${this.currentPage}, Всего страниц: ${this.totalPages}`);

    this.updateButtons(this.currentPage);
  }

  public hide() {
    this.parentContainer.setVisible(false);
  }
  
  public show() {
    this.parentContainer.setVisible(true);
  }

}
