import GameScene from '../scenes/GameScene';

export default class Cell extends Phaser.GameObjects.Sprite {
    id: number;
    value: number = 0; // можно явно задать начальное значение
    sum: number = 0;
    onClick: (cell: Cell) => void;

    constructor(
        scene: GameScene,
        position: { x: number, y: number },
        texture: string,
        id: number,
        onClick: (cell: Cell) => void
    ) {
        super(scene, position.x, position.y, texture);

        this.id = id;
        this.scene = scene;
        this.onClick = onClick;

        // Добавляем объект на сцену
        this.scene.add.existing(this);

        // Настройка визуальных параметров
        this.setOrigin(0, 0);
        this.setInteractive({ cursor: 'pointer' });

        // Обработка клика
        this.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // Игнорируем правую кнопку
            if (pointer.rightButtonDown()) {
                return;
            }
            this.emit('clickCell', this);
        });

        // Реакция на событие "клик по ячейке"
        this.on('clickCell', this.onClick.bind(this), this);
    }

    /** Отключает возможность клика по ячейке */
    disable(): void {
        this.disableInteractive();
    }

    /** Включает обратно */
    enable(): void {
        this.setInteractive({ cursor: 'pointer' });
    }
}
