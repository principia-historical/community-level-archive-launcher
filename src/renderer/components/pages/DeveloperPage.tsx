import { Game } from '@database/entity/Game';
import { Playlist } from '@database/entity/Playlist';
import { getGamePath } from '@renderer/Util';
import { BackIn, BackOut, GameMetadataSyncResponse, GetAllGamesResponseData, GetExecData, ImportMetaEditResponseData, ImportPlaylistData, SaveLegacyPlatformData, ServiceChangeData, TagPrimaryFixData, TagPrimaryFixResponse, WrappedResponse } from '@shared/back/types';
import { IAppConfigData } from '@shared/config/interfaces';
import { LOGOS, SCREENSHOTS } from '@shared/constants';
import { ExecMapping } from '@shared/interfaces';
import { LangContainer } from '@shared/lang';
import { Legacy_PlatformFileIterator } from '@shared/legacy/GameManager';
import { stringifyMetaValue } from '@shared/MetaEdit';
import { remote } from 'electron';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as React from 'react';
import { promisify } from 'util';
import { LangContext } from '../../util/lang';
import { validateSemiUUID } from '../../util/uuid';
import { LogData } from '../LogData';
import { ServiceBox } from '../ServiceBox';
import { SimpleButton } from '../SimpleButton';

// @TODO Move the developer tools to the back and "stream" the log messages back.
//       This makes it work remotely AND should make it lag less + work between changing tabs.

const exists = promisify(fs.exists);
const mkdir  = promisify(fs.mkdir);
type Map<K extends string, V> = { [key in K]: V };

export type DeveloperPageProps = {
	platforms: string[];
	playlists: Playlist[];
};

type DeveloperPageState = {
	/** Text of the log. */
	text: string;
};

export interface DeveloperPage {
	context: LangContainer;
}

/**
 * Page made for developers or advanced users only.
 * It has various "tools" that the user can run to gather information about the current Flashpoint folders data (games, playlists, images etc.), or edit that data on mass.
 * New tools are added as needed.
 */
export class DeveloperPage extends React.Component<DeveloperPageProps, DeveloperPageState> {
	constructor(props: DeveloperPageProps) {
		super(props);
		this.state = {
			text: '',
		};
	}

	componentDidMount() {
		window.Shared.back.on('message', this.onServiceUpdate);
	}

	componentWillUnmount() {
		window.Shared.back.off('message', this.onServiceUpdate);
	}

	render() {
		const strings = this.context.developer;
		const { text } = this.state;
		const services = window.Shared.services;
		return (
			<div className='developer-page simple-scroll'>
				<div className='developer-page__inner'>
					<h1 className='developer-page__title'>{strings.developerHeader}</h1>
					<p className='developer-page__description'>{strings.developerDesc}</p>
					<div className='developer-page__buttons'>
						{/* Top Buttons */}
						<SimpleButton
							value={strings.checkMissingImages}
							title={strings.checkMissingImagesDesc}
							onClick={this.onCheckMissingImagesClick} />
						<SimpleButton
							value={strings.checkGameIds}
							title={strings.checkGameIdsDesc}
							onClick={this.onCheckGameIDsClick} />
						<SimpleButton
							value={strings.checkGameTitles}
							title={strings.checkGameTitlesDesc}
							onClick={this.onCheckGameNamesClick} />
						<SimpleButton
							value={strings.checkGameFields}
							title={strings.checkGameFieldsDesc}
							onClick={this.onCheckGameFieldsClick} />
						{/* <SimpleButton
							value={strings.checkPlaylists}
							title={strings.checkPlaylistsDesc}
							onClick={this.onCheckPlaylistsClick} /> */}
						<SimpleButton
							value={strings.checkGameFileLocation}
							title={strings.checkGameFileLocationDesc}
							onClick={this.onCheckFileLocation} />
						<SimpleButton
							value={strings.checkMissingExecMappings}
							title={strings.checkMissingExecMappingsDesc}
							onClick={this.onCheckMissingExecMappings} />
						{/* Log */}
						<LogData
							className='developer-page__log'
							logData={text} />
						{/* Bottom Buttons */}
						<SimpleButton
							value={strings.createMissingFolders}
							title={strings.createMissingFoldersDesc}
							onClick={this.onCreateMissingFoldersClick} />
						<SimpleButton
							value={strings.importLegacyPlatforms}
							title={strings.importLegacyPlatformsDesc}
							onClick={this.onImportLegacyPlatformsClick} />
						<SimpleButton
							value={strings.importLegacyPlaylists}
							title={strings.importLegacyPlaylistsDesc}
							onClick={this.onImportLegacyPlaylistsClick} />
						<SimpleButton
							value={strings.deleteAllPlaylists}
							title={strings.deleteAllPlaylistsDesc}
							onClick={this.onDeleteAllPlaylistsClick} />
						<SimpleButton
							value={strings.fixPrimaryAliases}
							title={strings.fixPrimaryAliasesDesc}
							onClick={this.onFixPrimaryAliases} />
						<SimpleButton
							value={strings.fixCommaTags}
							title={strings.fixCommaTagsDesc}
							onClick={this.onFixCommaTags} />
						<SimpleButton
							value={strings.exportTags}
							title={strings.exportTagsDesc}
							onClick={this.onExportTagsClick} />
						<SimpleButton
							value={strings.importTags}
							title={strings.importTagsDesc}
							onClick={this.onImportTagsClick} />
						<SimpleButton
							value={strings.forceGameMetaSync}
							title={strings.forceGameMetaSyncDesc}
							onClick={this.onForceGameMetaSync} />
						<SimpleButton
							value={strings.importMetaEdits}
							title={strings.importMetaEditsDesc}
							onClick={this.onImportMetaEdits} />
					</div>
					{/* -- Services -- */}
					<h1 className='developer-page__services-title'>{strings.servicesHeader}</h1>
					{(services.length > 0) ? (
						services.map((item, index) => (
							<ServiceBox
								key={index}
								service={item} />
						))) : (
						<p>{strings.servicesMissing}</p>
					)}
				</div>
			</div>
		);
	}

	onServiceUpdate = (response: WrappedResponse<ServiceChangeData>) => {
		if (response.type === BackOut.SERVICE_CHANGE) { this.forceUpdate(); }
	}

	onCheckMissingImagesClick = async (): Promise<void> => {
		// @TODO
	}

	onCheckGameIDsClick = async (): Promise<void> => {
		const res = await fetchAllGames();
		this.setState({ text: checkGameIDs(res) });
	}

	onCheckGameNamesClick = async (): Promise<void> => {
		const res = await fetchAllGames();
		this.setState({ text: checkGameTitles(res) });
	}

	onCheckGameFieldsClick = async (): Promise<void> => {
		const res = await fetchAllGames();
		this.setState({ text: checkGameEmptyFields(res) });
	}

	// onCheckPlaylistsClick = async (): Promise<void> => {
	//   const playlists = this.props.playlists;
	//   const res = await fetchAllGames();
	//   this.setState({ text: checkPlaylists(playlists, res) });
	// }

	onCheckFileLocation = async (): Promise<void> => {
		const res = await fetchAllGames();
		this.setState({ text: checkFileLocation(res) });
	}

	onCheckMissingExecMappings = async (): Promise<void> => {
		const [games, execMappings] = await Promise.all([
			fetchAllGames(),
			window.Shared.back.sendP<GetExecData>(BackIn.GET_EXEC, undefined).then(r => r.data),
		]);
		if (!execMappings) { throw new Error('Failed to get exec mappings - response contained no data'); }
		if (games) {
			this.setState({ text: checkMissingExecMappings(games, execMappings) });
		}
	}

	onCreateMissingFoldersClick = (): void => {
		setTimeout(async () => {
			this.setState({ text: await createMissingFolders() });
		}, 0);
	}

	onImportLegacyPlatformsClick = (): void => {
		setTimeout(async () => {
			importLegacyPlatforms(window.Shared.config.data, (text) => this.setState({ text: text }));
		});
	}

	onImportLegacyPlaylistsClick = () : void => {
		setTimeout(async () => {
			this.setState({ text: 'Importing playlists...' });
			importLegacyPlaylists(window.Shared.config.data).then(num => {
				this.setState({ text: `${num} Playlists Imported!` });
			});
		});
	}

	onDeleteAllPlaylistsClick = () : void => {
		setTimeout(async () => {
			this.setState({ text: 'Deleting playlist, please wait...' });
			await window.Shared.back.sendP(BackIn.DELETE_ALL_PLAYLISTS, undefined);
			this.setState({ text: 'Deleted all playlists!' });
		});
	}

	onFixPrimaryAliases = () : void => {
		setTimeout(async () => {
			this.setState({ text: 'Fixing tags, please wait...'});
			fixPrimaryAliases().then(num => {
				this.setState({ text: `${num} Tag Aliases Fixed!`});
			});
		});
	}

	onFixCommaTags = () : void => {
		setTimeout(async () => {
			this.setState({ text: 'Fixing tags, please wait...'});
			window.Shared.back.sendP(BackIn.CLEANUP_TAGS, undefined).then(() => {
				this.setState({ text: 'Tags Fixed!'});
			});
		});
	}

	onExportTagsClick = () : void => {
		setTimeout(async () => {
			exportTags((text) => this.setState({ text: text }))
			.then((count) => {
				this.setState({ text: `${count} Tags exported!`});
			})
			.catch((error) => {
				this.setState({ text: `Tags Not Exported\nERROR - ${error}`});
			});
		});
	}

	onImportTagsClick = () : void => {
		setTimeout(async () => {
			importTags((text) => this.setState({ text: text }))
			.then((count) => {
				this.setState({ text: `${count} new or changed Tags imported!`});
			})
			.catch((error) => {
				this.setState({ text: `Tags Not Imported\nERROR - ${error}`});
			});
		});
	}

	onForceGameMetaSync = () : void => {
		setTimeout(async () => {
			this.setState({ text: 'Syncing...' });
			window.Shared.back.sendP<GameMetadataSyncResponse,any>(BackIn.SYNC_GAME_METADATA, undefined).then((res) => {
				if (res.data) {
					if (res.data.error) {
						this.setState({ text: `ERROR: ${res.data.error}` });
					} else {
						this.setState({ text: `Requested ${res.data.total} modified games, successfully saved ${res.data.successes}.`});
					}
				}
			});
		});
	};

	onImportMetaEdits = (): void => {
		setTimeout(async () => {
			this.setState({ text: 'Importing meta edits...' });
			window.Shared.back.sendP<ImportMetaEditResponseData, undefined>(BackIn.IMPORT_META_EDITS, undefined).then((res) => {
				let text = 'Meta edit import complete!\n\n\n\n';

				if (res.data) {
					// Aborted
					if (res.data.aborted) {
						text += 'IMPORT ABORTED!\n\n\n\n';
					}

					if (res.data.changedMetas) {
						// Applied
						const applied = res.data.changedMetas.filter(v => v.apply.length > 0);
						text += `Applied changes (${applied.reduce((a, v) => a + v.apply.length, 0)} changes in ${applied.length} games):\n\n`;
						for (const changedMeta of applied) {
							text += `  ${changedMeta.title} (${changedMeta.id})\n`;
							for (const change of changedMeta.apply) {
								text += `    ${change.property}:\n` +
												`      from: ${stringifyMetaValue(change.prevValue)}\n` +
												`      to:   ${stringifyMetaValue(change.value)}\n`;
							}
							text += '\n';
						}
						text += '\n\n';

						// Discarded
						const discarded = res.data.changedMetas.filter(v => v.discard.length > 0);
						text += `Discarded changes (${discarded.reduce((a, v) => a + v.discard.length, 0)} changes in ${discarded.length} games):\n\n`;
						for (const changedMeta of discarded) {
							text += `  ${changedMeta.title} (${changedMeta.id})\n`;
							for (const change of changedMeta.discard) {
								text += `    ${change.property}: ${stringifyMetaValue(change.value)}\n`;
							}
							text += '\n';
						}
						text += '\n\n';
					}

					// Games not found
					if (res.data.gameNotFound) {
						text += `Games not found (${res.data.gameNotFound.length}):\n\n`;
						for (const notFound of res.data.gameNotFound) {
							text += `  ${notFound.id}\n` +
											`    Files (${notFound.filenames.length}):\n` +
											notFound.filenames.map(filename => `      ${filename}\n`) + '\n';
						}
						if (res.data.gameNotFound.length === 0) { text += '\n'; }
						text += '\n\n';
					}

					// Errors
					if (res.data.errors) {
						text += `Errors (${res.data.errors.length}):\n\n`;
						for (let i = 0; i < res.data.errors.length; i++) {
							const error = res.data.errors[i];
							text += `  ${error.name || 'Error'}: #${i + 1}\n` +
											`    Message: ${error.message}\n`;
							if (typeof error.stack === 'string') {
								text += `    Stack: ${error.stack.replace(/\n */g, '\n      ')}\n`;
							}
							text += '\n';
						}
					}
				} else {
					text += 'Response data is missing. Launcher bug!\n';
				}

				this.setState({ text });
			});
		});
	};

	static contextType = LangContext;
}

function checkGameIDs(games: Game[]): string {
	const timeStart = Date.now(); // Start timing
	const dupes = checkDupes(games, game => game.id); // Find all games with duplicate IDs
	const invalidIDs: Game[] = games.filter(game => !validateSemiUUID(game.id)); // Find all games with invalid IDs
	const timeEnd = Date.now(); // End timing
	// Write log message
	let text = '';
	text += `Checked games for duplicate and invalid IDs (in ${timeEnd - timeStart}ms)\n`;
	text += '\n';
	text += `Games with duplicate IDs (${Object.keys(dupes).length}):\n`;
	for (const id in dupes) {
		text += `ID: "${id}" | Games (${dupes[id].length}): ${dupes[id].map(game => `${game.id}`).join(', ')}\n`;
	}
	text += '\n';
	text += `Games with invalid IDs (${invalidIDs.length}):\n`;
	invalidIDs.forEach(game => { text += `"${game.title}" (ID: ${game.id})\n`; });
	text += '\n';
	return text;
}

function checkGameTitles(games: Game[]): string {
	// Find all games for the same platform that has identical titles
	const timeStart = Date.now(); // Start timing
	const gamesPerPlatform = categorizeByProp(games, 'platform');
	const dupesPerPlatform: Map<string, Map<string, Game[]>> = {};
	for (const key in gamesPerPlatform) {
		dupesPerPlatform[key] = checkDupes(gamesPerPlatform[key], game => game.title.toUpperCase());
	}
	const timeEnd = Date.now(); // End timing
	// Write log message
	let text = '';
	text += `Checked for games with identical titles (case-insensitive) on the same platform (in ${timeEnd - timeStart}ms)\n`;
	text += '\n';
	const platforms = Object.keys(gamesPerPlatform).sort();
	if (platforms.length > 0) {
		for (let i = 0; i < platforms.length; i++) {
			const platform = platforms[i];
			const dupes = dupesPerPlatform[platform];
			const titles = Object.keys(dupes).sort();
			if (titles.length > 0) {
				text += `Platform: "${platform}" (${titles.length})\n`;
				for (let j = 0; j < titles.length; j++) {
					const title = titles[j];
					text += `  "${title}" ${repeat(' ', 60 - title.length)}(Games: ${dupes[title].length})\n`;
				}
				text += '\n';
			}
		}
	} else {
		text += 'No duplicates found!\n';
	}
	return text;
}

type GameKeys = NonNullable<AllowedNames<Game, string>>;
type EmptyRegister = { [key in GameKeys]?: Game[] }; // empty[fieldName] = [ game... ]
function checkGameEmptyFields(games: Game[]): string {
	const timeStart = Date.now(); // Start timing
	// Find all games with empty fields (that should not be empty)
	const empty: EmptyRegister = {};
	for (let i = 0; i < games.length - 1; i++) {
		const game = games[i];
		// Check if any game field (that should not be empty) is empty
		checkField(game, empty, 'author');
		checkField(game, empty, 'source');
		checkField(game, empty, 'platform');
		checkField(game, empty, 'levelType');
		checkField(game, empty, 'status');
		checkField(game, empty, 'applicationPath');
		checkField(game, empty, 'launchCommand');
	}
	const timeEnd = Date.now(); // End timing
	// Write log message
	let text = '';
	text += `Checked all games for empty fields (in ${timeEnd - timeStart}ms)\n`;
	text += '\n';
	text += 'Summary:\n';
	text += '\n';
	for (const field in empty) {
		const array = empty[field as GameKeys];
		if (array) {
			text += `"${field}" has ${array.length} games with missing values.\n`;
		}
	}
	text += '\n';
	text += 'Detailed list:\n';
	text += '\n';
	for (const field in empty) {
		const array = empty[field as GameKeys];
		if (array) {
			text += `Field "${field}" has ${array.length} games with missing values:\n`;
			array.forEach(game => { text += `"${game.title}" (ID: ${game.id})\n`; });
		} else {
			text += `Field "${field}" has no games with missing values!\n`;
		}
		text += '\n';
	}
	text += '\n';
	return text;
	// -- Functions --
	function checkField(game: Game, empty: EmptyRegister, field: GameKeys): void {
		if (game[field] === '') {
			// Check if field is empty, if so add it to the collection of that field
			const array = empty[field] || [];
			array.push(game);
			if (!empty[field]) { empty[field] = array; }
		}
	}
}

// Find and list any used executables missing an entry in the exec mapping file
function checkMissingExecMappings(games: Game[], execMappings: ExecMapping[]): string {
	const allExecs: string[] = [];
	let text = '';
	// Gather list of all unique execs
	for (let i = 0; i < games.length; i++) {
		const game = games[i];
		if (allExecs.findIndex((exec) => { return exec === game.applicationPath; }) === -1) {
			allExecs.push(game.applicationPath);
		}
	}
	// Report missing win32 exec mappings
	text += 'Missing "win32" Exec Mappings:\n';
	for (let i = 0; i < allExecs.length; i++) {
		const exec = allExecs[i];
		if (execMappings.findIndex((mapping) => { return mapping.win32 === exec; }) === -1) {
			text += `    ${exec}\n`;
		}
	}
	text += '\n';
	// Report missing linux exec mappings
	text += 'Missing "linux" Exec Mappings:\n';
	for (let i = 0; i < allExecs.length; i++) {
		const exec = allExecs[i];
		if (execMappings.findIndex((mapping) => { return mapping.win32 === exec && mapping.linux; }) === -1) {
			text += `    ${exec}\n`;
		}
	}
	text += '\n';
	// Report missing darwin exec mappings
	text += 'Missing "darwin" Exec Mappings:\n';
	for (let i = 0; i < allExecs.length; i++) {
		const exec = allExecs[i];
		if (execMappings.findIndex((mapping) => { return mapping.win32 === exec && mapping.darwin; }) === -1) {
			text += `    ${exec}\n`;
		}
	}
	return text;
}

/**
 * Organize the elements in an array into a map of arrays, based on the value of a key of the objects.
 * @param array Elements to sort.
 * @param prop Property of the elements to organize by.
 */
function categorizeByProp<T extends Map<K, V>, K extends string, V extends string>(array: T[], prop: K): Map<string, T[]> {
	const map: Map<string, T[]> = {};
	for (let i = 0; i < array.length; i++) {
		const item = array[i];
		const key = item[prop];
		if (!map[key]) { map[key] = []; }
		map[key].push(item);
	}
	return map;
}

/**
 * Find all elements in an array with common values.
 * @param array Elements to search through.
 * @param fn Function that gets the value of an element to compare.
 */
function checkDupes<T>(array: T[], fn: (element: T) => string): { [key: string]: T[] } {
	const registry: { [key: string]: T[] } = {};
	const dupes: string[] = [];
	// Find all duplicates
	for (let i = 0; i < array.length; i++) {
		const item = array[i];
		const val = fn(item);
		// Add prop to registry (to check for duplicates)
		if (!registry[val]) { registry[val] = []; }
		else if (registry[val].length === 1) { dupes.push(val); }
		registry[val].push(item);
	}
	// Prepare return value (only include the registry items that are duplicates)
	const clean: { [key: string]: T[] } = {};
	dupes.forEach(dupe => { clean[dupe] = registry[dupe]; });
	return clean;
}

function checkFileLocation(games: Game[]): string {
	const timeStart = Date.now(); // Start timing
	const pathFailed: Game[] = []; // (Games that it failed to get the path from)
	const pathError: [ Game, Error ][] = []; // (Games that it threw an error while attempting to get the path)
	let skippedCount = 0; // (Number of skipped games)
	// Try getting the path from all games
	for (const game of games) {
		if (game.broken) { skippedCount += 1; }
		else {
			try {
				const gamePath = getGamePath(game, window.Shared.config.fullFlashpointPath);
				if (gamePath === undefined) { pathFailed.push(game); }
			} catch (error) {
				pathError.push([ game, error ]);
			}
		}
	}
	const timeEnd = Date.now(); // End timing
	// Write log message
	let text = '';
	text += `Checked all games to see if their "launch command" could be parsed into a file path (in ${timeEnd - timeStart}ms)\n`;
	text += '\n';
	text += `Total games that failed: ${pathFailed.length + pathError.length}\n`;
	text += `Path not found: ${pathFailed.length}\n`;
	text += `Error while getting path: ${pathError.length}\n`;
	text += `Games skipped (all "broken" games are skipped): ${skippedCount}\n`;
	text += '\n';
	text += `Path not found (${pathFailed.length}):\n`;
	for (const game of pathFailed) {
		text += `"${game.title}" (Platform: "${game.platform}", ID: ${game.id})\n`;
	}
	text += '\n';
	text += `Error while getting path (${pathError.length}):\n`;
	for (const [ game, error ] of pathError) {
		text += `"${game.title}" (Platform: "${game.platform}", ID: "${game.id}")\n`+
						`    ${error.toString()}\n`;
	}
	// Done
	return text;
}

type FilterFlags<Base, Condition> = {
	[Key in keyof Base]: Base[Key] extends Condition ? Key : never
};
type AllowedNames<Base, Condition> = FilterFlags<Base, Condition>[keyof Base];


type FolderStructure = { [key: string]: FolderStructure | string[] } | string[];
async function createMissingFolders(): Promise<string> {
	let str = '';
	const fullFlashpointPath = window.Shared.config.fullFlashpointPath;
	// Create "static" folder structure (folders that should always exist)
	str += 'Creating "static" folders:\n';
	str += '(Folders that should be in every Flashpoint folder)\n\n';
	str += `${fullFlashpointPath}\n`;
	await createFolderStructure(
		fullFlashpointPath, {
			'Data': {
				'Images': [
					LOGOS,
					SCREENSHOTS
				],
				[LOGOS]: [],
				'MetaEdits': [],
				'Platforms': [],
				'Playlists': [],
				'Themes': [],
			},
			'Extras': [],
			'FPSoftware': [],
			'Launcher': [],
			'Server': [],
		}, (text?: string) => { str += (typeof text === 'string') ? text+'\n' : '\n'; }, 2
	).catch(logError);
	str += '\n';
	return str;

	/** Create all the folders that are missing in a folder structure. */
	async function createFolderStructure(rootPath: string, structure: FolderStructure, log: (text: string) => void, depth = 0) {
		const pad = '| '.repeat(depth - 1);
		if (Array.isArray(structure)) {
			for (let i = 0; i < structure.length; i++) {
				const folderName = structure[i];
				const folderPath = path.join(rootPath, folderName);
				const success = await createMissingFolder(folderPath);
				log(folderLogMessage(folderName, success));
			}
		} else {
			for (const key in structure) {
				const folderPath = path.join(rootPath, key);
				const success = await createMissingFolder(folderPath);
				log(folderLogMessage(key, success));
				await createFolderStructure(folderPath, structure[key], log, depth + 1);
			}
		}
		/** */
		function folderLogMessage(folderName: string, success: boolean): string {
			let str = `${pad}+ ${folderName}`;
			str += ' '.repeat(Math.max(1, 40 - str.length));
			str += success ? 'Created!' : 'Exists.';
			return str;
		}
		/** Create a folder if it is missing. */
		async function createMissingFolder(folderPath: string): Promise<boolean> {
			if (!await exists(folderPath)) { // Folder does not already exist
				if (folderPath.startsWith(rootPath)) { // Folder is a sub-folder of it's root (no "../" climbing allowed)
					await mkdir(folderPath).catch(logError);
					return true;
				}
			}
			return false;
		}
	}

	/** Log error (if there is any). */
	function logError(error: any): void {
		if (error) { console.warn(error); }
	}
}
/** Remove the last "item" in a path ("C:/foo/bar.png" => "C:/foo") */
export function removeLastItemOfPath(filePath: string): string {
	return filePath.substr(0, Math.max(0, filePath.lastIndexOf('/'), filePath.lastIndexOf('\\')));
}

function repeat(char: string, n: number): string {
	return char.repeat(Math.max(0, n));
}

function fetchAllGames(): Promise<Game[]> {
	return new Promise((resolve, reject) => {
		window.Shared.back.send<GetAllGamesResponseData>(BackIn.GET_ALL_GAMES, undefined, result => {
			if (result.data) { resolve(result.data.games); }
			else { reject(new Error('Failed to fetch all games. Data is undefined.')); }
		});
	});
}

async function importLegacyPlatforms(config: IAppConfigData, setText: (text: string) => void): Promise<void> {
	const text: string[] = [];
	text.push('Finding XMLs...');
	setText(text.join('\n'));

	const platformsPath = path.join(config.flashpointPath, config.platformFolderPath);
	const iterator = new Legacy_PlatformFileIterator(platformsPath);
	await iterator.init();
	if (iterator.initialized) {
		const startTime = new Date();
		let totalGames = 0;
		while (!iterator.done) {
			const platform = await iterator.next();
			if (platform) {
				text.push(`\nAdding Platform ${platform.library} - ${platform.name} - ${platform.collection.games.length} Games`);
				setText(text.join('\n'));
				totalGames += platform.collection.games.length;
				await window.Shared.back.sendP<any, SaveLegacyPlatformData>(BackIn.SAVE_LEGACY_PLATFORM, platform);
			}
		}
		const timeTaken = Date.now() - startTime.getTime();
		text.push(`Finished! Took ${Math.floor((timeTaken / 1000) / 60)}m ${Math.round((timeTaken / 1000) % 60)}s to add ${totalGames} Games!`);
		text.push(`${Math.ceil(timeTaken / totalGames)}ms per game.`);
		setText(text.join('\n'));
	}
}

async function importLegacyPlaylists(config: IAppConfigData): Promise<number> {
	let playlistsImported = 0;
	const playlistsPath = path.join(config.flashpointPath, config.playlistFolderPath);
	const files = await fs.promises.readdir(playlistsPath);
	console.log(files);
	for (const file of files) {
		if (file.toLowerCase().endsWith('.json')) {
			const fullPath = path.join(playlistsPath, file);
			await window.Shared.back.sendP<any, ImportPlaylistData>(BackIn.IMPORT_PLAYLIST, { filePath: fullPath });
			playlistsImported++;
		}
	}
	return playlistsImported;
}

async function fixPrimaryAliases(): Promise<number> {
	const res = await window.Shared.back.sendP<TagPrimaryFixResponse, TagPrimaryFixData>(BackIn.FIX_TAG_PRIMARY_ALIASES, null);
	return res.data || 0;
}

async function exportTags(setText: (text: string) => void): Promise<number> {
	const defaultPath = path.join(window.Shared.config.fullFlashpointPath, 'Data');
	await fs.ensureDir(defaultPath);
	const filePath = remote.dialog.showSaveDialogSync({
		title: 'Export Tags',
		defaultPath: path.join(defaultPath, 'exported_tags.json'),
		filters: [{
			name: 'Tags file',
			extensions: ['json'],
		}]
	});
	if (filePath) {
		setText('Exporting tags, please wait...');
		const res = await window.Shared.back.sendP<number, string>(BackIn.EXPORT_TAGS, filePath);
		return res.data || 0;
	} else {
		throw new Error('User Cancelled');
	}
}

async function importTags(setText: (text: string) => void): Promise<number> {
	const defaultPath = path.join(window.Shared.config.fullFlashpointPath, 'Data');
	await fs.ensureDir(defaultPath);
	const filePath = remote.dialog.showSaveDialogSync({
		title: 'Import Tags',
		defaultPath: path.join(defaultPath, 'exported_tags.json'),
		filters: [{
			name: 'Tags file',
			extensions: ['json'],
		}]
	});
	if (filePath) {
		setText('Importing tags, please wait...');
		const res = await window.Shared.back.sendP<number, string>(BackIn.IMPORT_TAGS, filePath);
		return res.data || 0;
	} else {
		throw new Error('User Cancelled');
	}
}
