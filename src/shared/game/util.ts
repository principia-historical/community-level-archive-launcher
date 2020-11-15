import { Game } from '../../database/entity/Game';

export namespace ModelUtils {
	export function createGame(): Game {
		return {
			id: '',
			title: '',
			series: '',
			author: '',
			platform: '',
			dateAdded: new Date().toISOString(),
			dateModified: new Date().toISOString(),
			broken: false,
			extreme: false,
			levelType: '',
			status: '',
			notes: '',
			tags: [],
			source: '',
			applicationPath: '',
			launchCommand: '',
			releaseDate: '',
			version: '',
			description: '',
			language: '',
			library: '',
			orderTitle: '',
			placeholder: false
		};
	}
}
