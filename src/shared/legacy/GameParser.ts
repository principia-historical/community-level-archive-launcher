import { Legacy_IGameCollection, Legacy_IGameInfo, Legacy_IRawPlatformFile, Legacy_IRawGameInfo } from './interfaces';

export class Legacy_GameParser {
	public static parse(data: Legacy_IRawPlatformFile, filename: string): Legacy_IGameCollection {
		const collection: Legacy_IGameCollection = {
			games: [],
		};
		let games = data.LaunchBox.Game;
		if (games) {
			if (!Array.isArray(games)) { games = [ games ]; }
			for (let i = games.length - 1; i >= 0; i--) {
				collection.games[i] = Legacy_GameParser.parseRawGame(games[i], filename);
			}
		}
		return collection;
	}


	public static parseRawGame(data: Partial<Legacy_IRawGameInfo>, library: string): Legacy_IGameInfo {
		const title: string = Legacy_unescapeHTML(data.Title);
		return {
			id: Legacy_unescapeHTML(data.ID),
			title: title,
			series: Legacy_unescapeHTML(data.Series),
			developer: Legacy_unescapeHTML(data.Developer),
			platform: Legacy_unescapeHTML(data.Platform),
			dateAdded: Legacy_unescapeHTML(data.DateAdded),
			broken: !!data.Broken,
			extreme: !!data.Hide,
			playMode: Legacy_unescapeHTML(data.PlayMode),
			status: Legacy_unescapeHTML(data.Status),
			notes: Legacy_unescapeHTML(data.Notes),
			tags: Legacy_unescapeHTML(data.Genre),
			source: Legacy_unescapeHTML(data.Source),
			applicationPath: Legacy_unescapeHTML(data.ApplicationPath),
			launchCommand: Legacy_unescapeHTML(data.CommandLine),
			releaseDate: Legacy_unescapeHTML(data.ReleaseDate),
			version: Legacy_unescapeHTML(data.Version),
			originalDescription: Legacy_unescapeHTML(data.OriginalDescription),
			language: Legacy_unescapeHTML(data.Language),
			library: library,
			orderTitle: title.toLowerCase(),
			placeholder: false, // (No loaded game is a placeholder)
		};
	}

	public static reverseParseGame(game: Legacy_IGameInfo): Legacy_IRawGameInfo {
		return {
			ID: escapeHTML(game.id),
			Title: escapeHTML(game.title),
			Series: escapeHTML(game.series),
			Developer: escapeHTML(game.developer),
			Platform: escapeHTML(game.platform),
			DateAdded: escapeHTML(game.dateAdded),
			Broken: !!game.broken,
			Hide: !!game.extreme,
			PlayMode: escapeHTML(game.playMode),
			Status: escapeHTML(game.status),
			Notes: escapeHTML(game.notes),
			Genre: escapeHTML(game.tags),
			Source: escapeHTML(game.source),
			ApplicationPath: escapeHTML(game.applicationPath),
			CommandLine: escapeHTML(game.launchCommand),
			ReleaseDate: escapeHTML(game.releaseDate),
			Version: escapeHTML(game.version),
			OriginalDescription: escapeHTML(game.originalDescription),
			Language: escapeHTML(game.language),
		};
	}

	/**
	 * Split a field value from a game into an array.
	 * Some field values store multiple values, each value separated by a semicolon.
	 * @param value Value to split.
	 */
	public static splitFieldValue(value: string): string[] {
		return value.split(/\s?;\s?/);
	}

	/**
	 * Join multiple values into a single field value.
	 * Some field values store multiple values, each value separated by a semicolon.
	 * @param value Value to join.
	 */
	public static joinFieldValue(value: string[]): string {
		return value.join('; ');
	}
}

// Escape / Unescape some HTML characters
// ( From: https://stackoverflow.com/questions/18749591/encode-html-entities-in-javascript/39243641#39243641 )
// spell-checker: disable
export const Legacy_unescapeHTML = (function() {
	const htmlEntities: any = Object.freeze({
		nbsp: ' ',
		cent: '¢',
		pound: '£',
		yen: '¥',
		euro: '€',
		copy: '©',
		reg: '®',
		lt: '<',
		gt: '>',
		quot: '"',
		amp: '&',
		apos: '\''
	});
	return function(str?: string): string {
		return ((str||'')+'').replace(/&([^;]+);/g, function (entity: string, entityCode: string): string {
			let match;
			if (entityCode in htmlEntities) {
				return htmlEntities[entityCode];
			} else if (match = entityCode.match(/^#x([\da-fA-F]+)$/)) { // eslint-disable-line no-cond-assign
				return String.fromCharCode(parseInt(match[1], 16));
			} else if (match = entityCode.match(/^#(\d+)$/)) { // eslint-disable-line no-cond-assign
				return String.fromCharCode(~~match[1]);
			} else {
				return entity;
			}
		});
	};
}());
const escapeHTML = (function() {
	const escapeChars = {
		'¢' : 'cent',
		'£' : 'pound',
		'¥' : 'yen',
		'€': 'euro',
		'©' :'copy',
		'®' : 'reg',
		'<' : 'lt',
		'>' : 'gt',
		'"' : 'quot',
		'&' : 'amp',
		'\'' : '#39'
	};
	let regexString = '[';
	for (const key in escapeChars) {
		regexString += key;
	}
	regexString += ']';
	const regex = new RegExp(regexString, 'g');
	return function escapeHTML(str: string): string {
		return str.replace(regex, function(m) {
			return '&' + (escapeChars as any)[m] + ';';
		});
	};
}());
