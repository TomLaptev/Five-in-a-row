import { Sounds } from "../utils/const";

export default class SoundManager {
	private scene: Phaser.Scene;
	private soundTrack: Phaser.Sound.BaseSound | null = null;
  
	constructor(scene: Phaser.Scene) {
	  this.scene = scene;
  
	  this.soundTrack = this.scene.sound.add(Sounds.THEME);
	  this.soundTrack.play({ volume: 0.2, loop: true });
  
	  // Отключаем встроенные обработчики фокуса
	  this.scene.game.events.off(
		Phaser.Core.Events.BLUR,
		this.scene.sound.pauseAll,
		this.scene.sound
	  );
	  this.scene.game.events.off(
		Phaser.Core.Events.FOCUS,
		this.scene.sound.resumeAll,
		this.scene.sound
	  );
  
	  // Обрабатываем реальную видимость вкладки
	  document.addEventListener('visibilitychange', () => {
		if (document.hidden) {
			console.log('Страница скрыта');
		  this.soundTrack?.pause();
		} else {
			console.log('Страница снова видима');
		  this.soundTrack?.resume();
		}
	  });
	}
  }
  