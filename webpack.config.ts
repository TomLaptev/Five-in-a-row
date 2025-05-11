import webpack from 'webpack';
import { buildWebpackConfig } from './config/build/buildWebpackConfig';
import { BuildEnv, BuildPath } from './config/build/types/config';
import path from 'path';

export default (env: BuildEnv) => {
	const paths: BuildPath = {
		entry: path.resolve(__dirname, 'src', 'Game.ts'),
		html: path.resolve(__dirname, 'public', 'index.html'),
		build: path.resolve(__dirname, 'build'),
		assets: path.resolve(__dirname, 'assets'),
	};



	const mode = env.mode || 'development';
	const port = env.port || 3001;

	const isDev = mode === 'development';
	console.log('envempode', mode);

	const config: webpack.Configuration = buildWebpackConfig({
		mode,
		paths,
		isDev,
		port,
	});
	return config;
};

