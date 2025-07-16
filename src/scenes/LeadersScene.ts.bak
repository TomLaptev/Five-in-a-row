import { GameConfig } from '../GameConfig';
import { Images } from '../utils/const';
import store from "../store";

export class LeaderBoardScene extends Phaser.Scene {
	texts: Record<string, Record<string, string>> = {};
	constructor() {
		super({
			key: 'Leaders'
		});
	}

	preload() {
		this.fetchAvatars(this);
		this.load.json("texts", "assets/texts.json");
	};

	create() {  

		this.texts = this.cache.json.get("texts");
		this.createBackground();
		this.createliderBoard();
	}

	fetchAvatars(scene: Phaser.Scene) {
		if (store.allPlayers.entries.length) { }
		store.allPlayers.entries.forEach((el: any) => {
			scene.load.image(el.player.uniqueID, el.player.getAvatarSrc('large'));
		});
	}

	createBackground() {
		if (GameConfig.width == 2800) {
			this.add.sprite(0, 0, Images.BACKGROUND_H).setOrigin(0, 0);
		} else this.add.sprite(0, 0, Images.BACKGROUND_V).setOrigin(0, 0);
	}

	createliderBoard() {

		let title: any = this.add
			.sprite(
				this.cameras.main.centerX,
				this.cameras.main.centerY - 400,
				Images.TITLE
			).setOrigin(0.5, 0);

		const leaderBoardText = this.texts[store.lang]?.leaderBoardText || this.texts["en"]?.leaderBoardText;
		const titleText = this.add.text(this.cameras.main.centerX, title.y + 60,
			leaderBoardText,
			{
				font: "32px BadComic-Regular",
				color: "#ffffff",
				align: "center",
			});

		titleText.setOrigin(0.5, 0.5);

		for (let i = 0; i < store.allPlayers.entries.length && i < 10; i++) {
			let plase: any = i;
			let playerAvatar: any = this.add
				.sprite(
					this.cameras.main.centerX - 181,
					this.cameras.main.centerY - 265 + i * 60,
					store.allPlayers.entries[i].player.uniqueID,
				)
				.setOrigin(0, 0);
			playerAvatar.setScale(0.28);

			if (i < 3) {
				plase = this.add
					.sprite(
						this.cameras.main.centerX - 250,
						this.cameras.main.centerY - 270 + i * 60,
						`${i + 1}` + '_line'
					)
					.setOrigin(0, 0);

			} else {
				plase = this.add
					.sprite(
						this.cameras.main.centerX - 250,
						this.cameras.main.centerY - 270 + i * 60,
						'0_line'
					)
					.setOrigin(0, 0);
			}

			const publicName =  this.add.text(this.cameras.main.centerX - 115, plase.y + 20,
				`${store.allPlayers.entries[i].player.publicName}`,
				{
					font: "18px BadComic-Regular",
					color: "#b900a2",
				});

				const maxWidth = plase.width * 0.45; // Ограничение по ширине кнопки
				let originalText = publicName.text; // Исходный текст
				if (publicName.width > maxWidth) {
					let truncatedText = originalText;
					while (publicName.width > maxWidth && truncatedText.length > 1) {
							truncatedText = truncatedText.slice(0, -1); // Удаляем последний символ
							publicName.setText(truncatedText + "…"); // Добавляем многоточие
					}
			}

			this.add.text(this.cameras.main.centerX + 180, plase.y + 20,
				`${store.allPlayers.entries[i].score}`,
				{
					font: "18px BadComic-Regular",
					color: '#ffffff',
				});

			if (+`${store.allPlayers.entries[i].rank}` > 3) {
				this.add.text((+`${store.allPlayers.entries[i].rank}` > 999 ? this.cameras.main.centerX - 230
					: +`${store.allPlayers.entries[i].rank}` > 99 ? this.cameras.main.centerX - 225
						: +`${store.allPlayers.entries[i].rank}` > 9 ? this.cameras.main.centerX - 220
							: this.cameras.main.centerX - 220), plase.y + 20,
					`${store.allPlayers.entries[i].rank}`,
					{
						font: "16px BadComic-Regular",
						color: '#ffffff',
					});
			}
		}

		this.add.sprite(this.cameras.main.centerX - 42,
			this.cameras.main.centerY + 290, Images.BACK_BUTTON)
			.setOrigin(0, 0)
			.setInteractive({ useHandCursor: true })
			.on("pointerdown", (pointer: Phaser.Input.Pointer) =>  {
        if (pointer.rightButtonDown()) {
          return; // Игнорируем правую кнопку, ничего не делаем
        }
				if (store.isGameOnline) {
          store.isRoom = false;
          this.scene.start("Game")
        } else this.scene.start("Start");
			})
	}

}