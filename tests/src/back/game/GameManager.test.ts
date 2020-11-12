import { GameManager } from '@back/game/GameManager';
import { GameManagerState } from '@back/game/types';
import { EventQueue } from '@back/util/EventQueue';
import { uuid } from '@back/util/uuid';
import { deepCopy } from '@shared/Util';
import { RESULT_PATH, STATIC_PATH } from '@tests/setup';
import * as path from 'path';

const STATIC_PLATFORMS_PATH = path.join(STATIC_PATH, 'GameManager/platforms');
const RESULT_PLATFORMS_PATH = path.join(RESULT_PATH, 'GameManager/platforms');

describe('GameManager', () => {
	test('Load Platforms', async () => {
		const state = createState();
		state.platformsPath = STATIC_PLATFORMS_PATH;
		const errors = await GameManager.loadPlatforms(state);
		expect(state.platforms.length).toBe(3); // Total number of platforms loaded
		expect(errors.length).toBe(0); // No platforms should fail to load
		// @TODO Compare that parsed content to a "snapshot" to verify that it was parsed correctly
	});

	test('Add Games (to the same and already existing platform)', () => {
		// Setup
		const state = createState();
		const platform = createPlatform('test_platform', 'test_library', state.platformsPath);
		state.platforms.push(platform);
		for (let i = 0; i < 10; i++) {
			const before = deepCopy(platform);
			// Add Game
			const game = createGame(before.name, before.library);
			GameManager.updateMeta(state, {
				game: game
			});
			// Compare
			expect(platform).toEqual({ // Game have been added to the end of the collections in the correct order
				...before,
				data: {
					LaunchBox: {
						Game: [
							...before.data.LaunchBox.Game,
							GameParser.reverseParseGame(game),
						],
					},
				},
				collection: {
					games: [ ...before.collection.games, game, ],
				},
			});
		}
	});

	test('Add Games (to differnt and non-existing platforms)', () => {
		// Setup
		const state = createState();
		for (let i = 0; i < 10; i++) {
			// Add Game
			const game = createGame(`platform_${i}`, 'some_library');
			GameManager.updateMeta(state, {
				game: game
			});
			// Compare
			const platform = state.platforms.find(p => (p.name === game.platform) && (p.library === game.library));
			expect(platform).toEqual({ // Platform has been created and contains the game and add-apps
				filePath: path.join(state.platformsPath, game.library, game.platform + '.xml'),
				name: game.platform,
				library: game.library,
				data: {
					LaunchBox: {
						Game: [ GameParser.reverseParseGame(game) ],
					},
				},
				collection: {
					games: [ game ],
				},
			});
		}
	});

	test('Move Game (between existing platforms)', () => {
		// Setup
		const state = createState();
		const fromPlatform = createPlatform('from_platform', 'some_library', state.platformsPath);
		const toPlatform = createPlatform('to_platform', 'another_library', state.platformsPath);
		state.platforms.push(fromPlatform, toPlatform);
		// Add Game
		const game = createGame(fromPlatform.name, fromPlatform.library);
		GameManager.updateMeta(state, {
			game: game
		});
		// Move Game
		const sameGame: IGameInfo = {
			...game,
			platform: toPlatform.name,
			library: toPlatform.library,
		};
		GameManager.updateMeta(state, {
			game: sameGame
		});
		// Compare
		expect(fromPlatform).toEqual({ // First platform is empty
			...fromPlatform,
			data: {
				LaunchBox: {
					Game: [],
				},
			},
			collection: {
				games: [],
			},
		});
		expect(toPlatform).toEqual({ // Second platform has the game and add-apps
			...toPlatform,
			data: {
				LaunchBox: {
					Game: [ GameParser.reverseParseGame(sameGame) ],
				},
			},
			collection: {
				games: [ sameGame ],
			},
		});
	});

	test('Update Game (update the value of a field)', () => {
		// Setup
		const state = createState();
		const platform = createPlatform('test_platform', 'test_library', state.platformsPath);
		state.platforms.push(platform);
		// Add Game
		const game = createGame(platform.name, platform.library);
		GameManager.updateMeta(state, {
			game: game
		});
		// Update Game
		const before = deepCopy(platform);
		const updatedGame: IGameInfo = {
			...game,
			title: 'New Title',
		};
		GameManager.updateMeta(state, {
			game: updatedGame
		});
		// Compare
		expect(platform).not.toEqual(before); // Platform has been changed
		expect(platform).toEqual({ // Game has been added to the platform
			...before,
			data: {
				LaunchBox: {
					Game: [ GameParser.reverseParseGame(updatedGame) ],
				},
			},
			collection: {
				games: [ updatedGame ],
			},
		});
	});

	test('Remove Games (from one platform)', () => {
		// Setup
		const state = createState();
		const platform = createPlatform('test_platform', 'test_library', state.platformsPath);
		state.platforms.push(platform);
		// Add Games
		for (let i = 0; i < 10; i++) {
			const game = createGame(platform.name, platform.library);
			GameManager.updateMeta(state, {
				game: game
			});
		}
		// Remove Games
		for (let i = platform.collection.games.length - 1; i >= 0; i--) {
			const before = deepCopy(platform);
			const index = ((i + 7) ** 3) % platform.collection.games.length; // Pick a "random" index
			const gameId = platform.collection.games[index].id;
			// Remove Game
			GameManager.removeGame(state, gameId);
			// Compare
			expect(platform).toEqual({ // Game have been removed
				...before,
				data: {
					LaunchBox: {
						Game: before.data.LaunchBox.Game.filter(g => g.ID !== gameId),
					}
				},
				collection: {
					games: before.collection.games.filter(g => g.id !== gameId),
				},
			});
		}
	});

	test('Save Games to file (multiple times)', () => {
		// Setup
		const state = createState();
		const platform = createPlatform('test_platform', 'test_library', state.platformsPath);
		state.platforms.push(platform);
		// Add content to platform
		for (let i = 0; i < 10; i++) {
			const game = createGame(platform.name, platform.library);
			GameManager.updateMeta(state, {
				game: game
			});
		}
		// Save file multiple times
		const saves: Promise<any>[] = [];
		for (let i = 0; i < 5; i++) {
			saves.push(expect(GameManager.savePlatforms(state, [ platform ])).resolves.toBe(undefined));
		}
		return Promise.all(saves);
	});

	test('Find Game', () => {
		// Setup
		const state = createState();
		const platform = createPlatform('test_platform', 'test_library', state.platformsPath);
		const game = createGame('', '');
		game.title = 'Sonic';
		platform.collection.games.push(game);
		// Find Sonic (not Tails)
		expect(GameManager.findGame([platform], g => g.title === 'Tails')).toBe(undefined);
		expect(GameManager.findGame([platform], g => g.title === 'Sonic')).toHaveProperty('title', 'Sonic');
	});

	// @TODO Add tests for adding, moving and removing add-apps
	// @TODO Test that edited games and add-apps retain their position in the arrays
	// @TODO Test that added games and add-apps get pushed to the end of the arrays

	// @TODO Test "GameManager.findGame"
	// @TODO Test functions in the "LaunchBox" namespace?
});

function createState(): GameManagerState {
	return {
		platforms: [],
		platformsPath: RESULT_PLATFORMS_PATH,
		saveQueue: new EventQueue(),
		log: () => {}, // Don't log
	};
}

function createPlatform(name: string, library: string, folderPath: string): GamePlatform {
	return {
		filePath: path.join(folderPath, library, name + '.xml'),
		name: name,
		library: library,
		data: {
			LaunchBox: {
				Game: [],
			},
		},
		collection: {
			games: [],
		},
	};
}

function createGame(platform: string, library: string): IGameInfo {
	const id = uuid();
	return {
		library: library,
		orderTitle: '',
		placeholder: false,
		title: '',
		id: id,
		parentGameId: id,
		series: '',
		developer: '',
		publisher: '',
		dateAdded: '',
		platform: platform,
		broken: false,
		extreme: false,
		playMode: '',
		status: '',
		notes: '',
		tags: '',
		source: '',
		originalDescription: '',
		applicationPath: '',
		language: '',
		launchCommand: '',
		releaseDate: '',
		version: '',
	};
}
