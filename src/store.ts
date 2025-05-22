
 interface IStore {
    id:any,
    avatar: any;
    avatarKey: string;
    available: boolean;
    isMobile: any,
    isMusicEnabled: boolean;
    playerName: string,
    lang: string,
    gameData: any,
    lb: any, 
    playerData:any,
    allPlayers:any,
    isAuth: boolean,
    startRating: number,
    soundTrack: boolean,    
    playerPhoto: any;
    isVsComputer: boolean;
    isForTwo: boolean;
    isGameOnline: boolean;
    isYouX: boolean;
}

const store: IStore = {
    isMobile: null,
    isMusicEnabled: localStorage.getItem('isSoundEnable') === 'true' ? true : false,
    playerName: null,
    lang: '',
    lb: null,
    playerData: null,
    allPlayers: null,
    isAuth: false,
    startRating: 0,
    soundTrack: false,
    playerPhoto: null,
    isVsComputer: false, 
    isForTwo: false,
    isGameOnline : false,
    isYouX: false,
    id: null,
    avatar: null,
    avatarKey: "",
    available: true,
    gameData: null,
}

export default store;

