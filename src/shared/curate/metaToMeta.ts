import { Game } from '@database/entity/Game';
import { TagCategory } from '@database/entity/TagCategory';
import { ParsedCurationMeta } from './parse';
import { EditCurationMeta } from './types';

/**
 * Convert game into a raw object representation in the curation format.
 * @param game Game to convert.
 */
export function convertGameToCurationMetaFile(game: Game, categories: TagCategory[]): CurationMetaFile {
	const parsed: CurationMetaFile = {};
	const tagCategories = game.tags.map(t => {
		const cat = categories.find(c => c.id === t.categoryId);
		return cat ? cat.name : 'default';
	});
	// Game meta
	parsed['Title']				= game.title;
	parsed['Series']			= game.series;
	parsed['Author']			= game.author;
	parsed['Level Type']		= game.levelType;
	parsed['Release Date']		= game.releaseDate;
	parsed['Revision']			= game.revision;
	parsed['Languages']			= game.language;
	parsed['Extreme']			= game.extreme ? 'Yes' : 'No';
	parsed['Tags']				= game.tags.map(t => t.primaryAlias.name).join('; ');
	parsed['Tag Categories']	= tagCategories.join('; ');
	parsed['Source']			= game.source;
	parsed['Platform']			= game.platform;
	parsed['Status']			= game.status;
	parsed['Application Path']	= game.applicationPath;
	parsed['Launch Command']	= game.launchCommand;
	parsed['Game Notes']		= game.notes;
	parsed['Description']		= game.description;

	// Return
	return parsed;
}

/**
 * Convert curation into a raw object representation in the curation meta format. (for saving)
 * @param curation Curation to convert.
 */
export function convertEditToCurationMetaFile(curation: EditCurationMeta, categories: TagCategory[]): CurationMetaFile {
	const parsed: CurationMetaFile = {};
	const tagCategories = curation.tags ? curation.tags.map(t => {
		const cat = categories.find(c => c.id === t.categoryId);
		return cat ? cat.name : 'default';
	}) : [''];
	// Edit curation meta
	parsed['Title']				= curation.title;
	parsed['Library']			= curation.library;
	parsed['Series']			= curation.series;
	parsed['Author']			= curation.author;
	parsed['Level Type']		= curation.levelType;
	parsed['Release Date']		= curation.releaseDate;
	parsed['Revision']			= curation.revision;
	parsed['Languages']			= curation.language;
	parsed['Extreme']			= curation.extreme ? 'Yes' : 'No';
	parsed['Tags']				= curation.tags ? curation.tags.map(t => t.primaryAlias.name).join('; ') : '';
	parsed['Tag Categories']	= tagCategories.join('; ');
	parsed['Source']			= curation.source;
	parsed['Platform']			= curation.platform;
	parsed['Status']			= curation.status;
	parsed['Application Path']	= curation.applicationPath;
	parsed['Launch Command']	= curation.launchCommand;
	parsed['Game Notes']		= curation.notes;
	parsed['Description']		= curation.description;
	parsed['Curation Notes']	= curation.curationNotes;
	// Return
	return parsed;
}

/**
 * Convert parsed meta into a raw object representation in the curation meta format. (for saving)
 * @param curation Parsed meta to convert.
 */
export function convertParsedToCurationMeta(curation: ParsedCurationMeta, categories: TagCategory[]): CurationMetaFile {
	const parsed: CurationMetaFile = {};
	const tagCategories = curation.game.tags ? curation.game.tags.map(t => {
		const cat = categories.find(c => c.id === t.categoryId);
		return cat ? cat.name : 'default';
	}) : [''];
	// Edit curation meta
	parsed['Title']				= curation.game.title;
	parsed['Library']			= curation.game.library;
	parsed['Series']			= curation.game.series;
	parsed['Author']			= curation.game.author;
	parsed['Level Type']		= curation.game.levelType;
	parsed['Release Date']		= curation.game.releaseDate;
	parsed['Revision']			= curation.game.revision;
	parsed['Languages']			= curation.game.language;
	parsed['Extreme']			= curation.game.extreme ? 'Yes' : 'No';
	parsed['Tags']				= curation.game.tags ? curation.game.tags.map(t => t.primaryAlias.name).join('; ') : '';
	parsed['Tag Categories']	= tagCategories.join('; ');
	parsed['Source']			= curation.game.source;
	parsed['Platform']			= curation.game.platform;
	parsed['Status']			= curation.game.status;
	parsed['Application Path']	= curation.game.applicationPath;
	parsed['Launch Command']	= curation.game.launchCommand;
	parsed['Game Notes']		= curation.game.notes;
	parsed['Description']		= curation.game.description;
	parsed['Curation Notes']	= curation.game.curationNotes;
	// Return
	return parsed;
}

type CurationMetaFile = {
	'Application Path'?: string;
	'Author'?: string;
	'Extreme'?: string;
	'Game Notes'?: string;
	'Languages'?: string;
	'Launch Command'?: string;
	'Description'?: string;
	'Level Type'?: string;
	'Platform'?: string;
	'Release Date'?: string;
	'Series'?: string;
	'Source'?: string;
	'Status'?: string;
	'Tags'?: string;
	'Tag Categories'?: string;
	'Title'?: string;
	'Library'?: string;
	'Revision'?: string;
	'Curation Notes'?: string;
};
