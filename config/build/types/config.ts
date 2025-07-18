export type BuildMode = 'production' | 'development';

export interface BuildPath {
	entry: string;
	html: string;
	assets: string;
	build: string;
}

export interface BuildOptions {
	mode: BuildMode;
	paths: BuildPath;
	isDev: boolean;
	port: number;
}

export interface BuildEnv {
	mode: BuildMode;
	port: number;
}
