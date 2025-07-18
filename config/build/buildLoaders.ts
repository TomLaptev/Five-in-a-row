import webpack from 'webpack';

export function buildLoaders(): webpack.RuleSetRule[] {
	const tsLoader = {
		test: /\.tsx?$/,
		use: 'ts-loader',
		exclude: /node_modules/,
	};
	const fileLoader = {
		test: /\.(gif|png|jpe?g|svg|xml|)$/i,
		use: 'file-loader',
		exclude: /node_modules/,
	};
	const css = {
		test: /\.css$/i,
		use: ['style-loader', 'css-loader'],
		exclude: /node_modules/,
	};
	const fonts = {
		test: /\.(woff|woff2|ttf|eot|otf)$/i,
		type: 'asset/resource',
		exclude: /node_modules/,		
	  }
	return [tsLoader, fileLoader, css, fonts];
}
