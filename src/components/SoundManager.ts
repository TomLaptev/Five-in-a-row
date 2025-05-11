import { Images, Sounds } from '../utils/const';
export default class SoundManager {
	scene: Phaser.Scene;
	soundTrack: any;
	constructor(scene: Phaser.Scene) {
		this.scene = scene;
		this.soundTrack = this.scene.sound.add(Sounds.THEME);				
		this.soundTrack.play({ volume: 0.1, loop: true });		 
	}
}