import 'phaser';
import { GameConfig } from './GameConfig';
import './styles.css';
import './fonts.css';

class Game extends Phaser.Game {
	constructor(GameConfig: Phaser.Types.Core.GameConfig) {
		super(GameConfig);
	}
}

window.addEventListener('load', () => {
	new Game(GameConfig);
});
