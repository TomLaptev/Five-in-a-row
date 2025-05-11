export default class Button {
  private buttonContainer: Phaser.GameObjects.Container;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number | null,
    height: number | null,
    fontColor: string,
    texture: string | null,
    font: string,
    fontSize: number,
    text: string | null,
    callback: () => void | null
  ) {
    const buttonText = text ? scene.add
      .text(0, 0, text, { font: `${fontSize}px ${font}`, color: fontColor })
      .setColor(fontColor)
      .setOrigin(0.5) : null;
    const buttonImage = texture ? scene.add.image(0, 0, texture) : null;

    this.buttonContainer = scene.add.container(x, y);

    if (buttonImage) {
      this.buttonContainer.add(buttonImage)
    }

    if (buttonText) {
      this.buttonContainer.add(buttonText)
    }

    this.buttonContainer
      .setSize(buttonImage ? buttonImage.displayWidth : width || 1,
        buttonImage ? buttonImage.displayHeight : height || 1)
      .setInteractive({ cursor: "pointer" });
    this.buttonContainer
      .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (pointer.rightButtonDown()) {
          return; // Игнорируем правую кнопку, ничего не делаем
        }
        callback();
      })
      .on('pointerover', () => { })
      .on('pointerout', () => { });
  }

  get container() {
    return this.buttonContainer;
  }
}
