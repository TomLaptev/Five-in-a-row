import { BuildOptions } from './types/config';
import { Configuration as DevServerConfiguration } from 'webpack-dev-server';

export function buildDevServer(options: BuildOptions): DevServerConfiguration {
	const { port } = options;
	return {
		port,
		allowedHosts: 'all',
	};
}
