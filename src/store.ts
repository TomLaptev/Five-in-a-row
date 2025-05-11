
 interface IStore {
    id:any,
    avatar: any;
    avatarKey: string;
    playerCode: string,
    available: boolean;
    isMobile: any,
    isSoundEnable: string,
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
    isGameOnlinePressed: boolean;
    isYouX: boolean;
}

const store: IStore = {
    isMobile: null,
    isSoundEnable: localStorage.getItem('isSoundEnable'),
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
    isGameOnlinePressed : false,
    isYouX: false,
    id: null,
    avatar: null,
    avatarKey: "",
    playerCode: null,
    available: true,
    gameData: null,
}

export default store;

