import HTMLPlugin from 'html-webpack-plugin';
import webpack, { WebpackPluginInstance } from 'webpack';
import { BuildOptions } from './types/config';
import CopyPlugin from 'copy-webpack-plugin';

export function buildPlugins({ paths }: BuildOptions): WebpackPluginInstance[] {
	return [
		new HTMLPlugin({
			template: paths.html,
		}),
		new CopyPlugin({
			patterns: [{ from: paths.assets, to: paths.build + '/assets' }],
		}),
		new webpack.ProgressPlugin(),
	];
}
