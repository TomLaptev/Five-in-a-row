import { BootScene } from './scenes/BootScene';
import { StartScene } from './scenes/StartScene';
import { LeaderBoardScene } from './scenes/LeadersScene';
import  GameScene  from './scenes/GameScene';

export const GameConfig: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	scene: [BootScene, StartScene, LeaderBoardScene, GameScene]
}

export const isMobile: any = {
	Android: function () {
		return navigator.userAgent.match(/Android/i);
	},
	BlackBerry: function () {
		return navigator.userAgent.match(/BlackBerry/i);
	},
	iOS: function () {
		return navigator.userAgent.match(/iPhone|iPad|iPod/i);
	},
	Opera: function () {
		return navigator.userAgent.match(/Opera Mini/i);
	},
	Windows: function () {
		return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
	},
	any: function () {
		return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
	}
};

if (!isMobile.any() /* || isMobile.any() && window.innerWidth / window.innerHeight > 1 */) {
	console.log('Desktop')
	GameConfig.width = 2800;
	GameConfig.height = 920;
	GameConfig.scale = {
		mode: Phaser.Scale.HEIGHT_CONTROLS_WIDTH,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	}

} else if (
	isMobile.any()
	&& window.innerWidth / window.innerHeight > 0.8
	&& window.innerWidth / window.innerHeight <= 1) {
	GameConfig.width = 830;
	GameConfig.height = 1600;
	GameConfig.scale = {
		mode: Phaser.Scale.WIDTH_CONTROLS_HEIGHT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	}

} else if (
	isMobile.any()){
	GameConfig.width = 602;
	GameConfig.height = 1720;
	GameConfig.scale = {
		mode: Phaser.Scale.WIDTH_CONTROLS_HEIGHT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	}
}

export const Source: any = {
	rows: 15,
	cols: 15,
	cellWidth: 40,
	cellHeight: 40,
	delay: 250,
	timeForGame: 300
};


