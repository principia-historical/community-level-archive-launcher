import { Game } from '@database/entity/Game';
import { ExecMapping, Omit } from '@shared/interfaces';
import { LangContainer } from '@shared/lang';
import { fixSlashes, padStart, stringifyArray } from '@shared/Util';
import { ChildProcess, exec, execFile } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';
import { LogFunc, OpenDialogFunc, OpenExternalFunc } from './types';

export type LaunchGameOpts = LaunchBaseOpts & {
	game: Game;
	native: boolean;
}

type LaunchBaseOpts = {
	fpPath: string;
	execMappings: ExecMapping[];
	lang: LangContainer;
	isDev: boolean;
	exePath: string;
	log: LogFunc;
	openDialog: OpenDialogFunc;
	openExternal: OpenExternalFunc;
}

export namespace GameLauncher {
	const logSource = 'Game Launcher';

	/**
	 * Launch a game
	 * @param game Game to launch
	 */
	export async function launchGame(opts: LaunchGameOpts): Promise<void> {
		// Abort if placeholder (placeholders are not "actual" games)
		if (opts.game.placeholder) { return; }

		// Launch game
		const appPath: string = getApplicationPath(opts.game.applicationPath, opts.execMappings, opts.native);
		switch (appPath) {
			case ':flash:': {
				const env = getEnvironment(opts.fpPath);
				if ('ELECTRON_RUN_AS_NODE' in env) {
					delete env['ELECTRON_RUN_AS_NODE']; // If this flag is present, it will disable electron features from the process
				}
				const proc = execFile(
					process.execPath, // path.join(__dirname, '../main/index.js'),
					[path.join(__dirname, '../main/index.js'), 'flash=true', opts.game.launchCommand],
					{ env, cwd: process.cwd() }
				);
				logProcessOutput(proc, opts.log);
				opts.log({
					source: logSource,
					content: `Launch Game "${opts.game.title}" (PID: ${proc.pid}) [\n`+
									`    applicationPath: "${appPath}",\n`+
									`    launchCommand:   "${opts.game.launchCommand}" ]`
				});
			} break;
			default: {
				const gamePath: string = fixSlashes(path.join(opts.fpPath, getApplicationPath(opts.game.applicationPath, opts.execMappings, opts.native)));
				const gameArgs: string = opts.game.launchCommand;
				const useWine: boolean = process.platform != 'win32' && gamePath.endsWith('.exe');
				const command: string = createCommand(gamePath, gameArgs, useWine);
				const proc = exec(command, { env: getEnvironment(opts.fpPath) });
				logProcessOutput(proc, opts.log);
				opts.log({
					source: logSource,
					content: `Launch Game "${opts.game.title}" (PID: ${proc.pid}) [\n`+
									 `    applicationPath: "${opts.game.applicationPath}",\n`+
									 `    launchCommand:   "${opts.game.launchCommand}",\n`+
									 `    command:         "${command}" ]`
				});

			} break;
		}
	}

	/**
	 * The paths provided in the Game XMLs are only accurate
	 * on Windows. So we replace them with other hard-coded paths here.
	 */
	function getApplicationPath(filePath: string, execMappings: ExecMapping[], native: boolean): string {
		const platform = process.platform;

		// Bat files won't work on Wine, force a .sh file on non-Windows platforms instead. Sh File may not exist.
		if (platform !== 'win32' && filePath.endsWith('.bat')) {
			return filePath.substr(0, filePath.length - 4) + '.sh';
		}

		// Skip mapping if on Windows or Native application was not requested
		if (platform !== 'win32' && native) {
			for (let i = 0; i < execMappings.length; i++) {
				const mapping = execMappings[i];
				if (mapping.win32 === filePath) {
					switch (platform) {
						case 'linux':
							return mapping.linux || mapping.win32;
						case 'darwin':
							return mapping.darwin || mapping.win32;
						default:
							return filePath;
					}
				}
			}
		}

		// No Native exec found, return Windows/XML application path
		return filePath;
	}

	/** Get an object containing the environment variables to use for the game */
	function getEnvironment(fpPath: string): NodeJS.ProcessEnv {
		// When using Linux, use the proxy created in BackgroundServices.ts
		// This is only needed on Linux because the proxy is installed on system
		// level entire system when using Windows.
		return {
			// Add proxy env vars if it's running on linux
			...((process.platform === 'linux') ? { http_proxy: 'http://localhost:22500/' } : null),
			// Copy this processes environment variables
			...process.env,
		};
	}

	function createCommand(filename: string, args: string, useWine: boolean): string {
		// This whole escaping thing is horribly broken. We probably want to switch
		// to an array representing the argv instead and not have a shell
		// in between.
		switch (process.platform) {
			case 'win32':
				return `"${filename}" ${escapeWin(args)}`;
			case 'darwin':
			case 'linux':
				if (useWine) {
					return `wine start /unix "${filename}" ${escapeLinuxArgs(args)}`;
				}
				return `"${filename}" ${escapeLinuxArgs(args)}`;
			default:
				throw Error('Unsupported platform');
		}
	}

	function logProcessOutput(proc: ChildProcess, log: LogFunc): void {
		// Log for debugging purposes
		// (might be a bad idea to fill the console with junk?)
		const logStuff = (event: string, args: any[]): void => {
			log({
				source: logSource,
				content: `${event} (PID: ${padStart(proc.pid, 5)}) ${stringifyArray(args, stringifyArrayOpts)}`,
			});
		};
		doStuffs(proc, [/* 'close', */ 'disconnect', 'error', 'exit', 'message'], logStuff);
		if (proc.stdout) { proc.stdout.on('data', (data) => { logStuff('stdout', [data.toString('utf8')]); }); }
		if (proc.stderr) { proc.stderr.on('data', (data) => { logStuff('stderr', [data.toString('utf8')]); }); }
	}
}

const stringifyArrayOpts = {
	trimStrings: true,
};

function doStuffs(emitter: EventEmitter, events: string[], callback: (event: string, args: any[]) => void): void {
	for (let i = 0; i < events.length; i++) {
		const e: string = events[i];
		emitter.on(e, (...args: any[]) => {
			callback(e, args);
		});
	}
}

/**
 * Escape a string that will be used in a Windows shell (command line)
 * ( According to this: http://www.robvanderwoude.com/escapechars.php )
 */
function escapeWin(str: string): string {
	return (
		splitQuotes(str)
		.reduce((acc, val, i) => acc + ((i % 2 === 0)
			? val.replace(/[\^&<>|]/g, '^$&')
			: `"${val}"`
		), '')
	);
}

/**
 * Escape arguments that will be used in a Linux shell (command line)
 * ( According to this: https://stackoverflow.com/questions/15783701/which-characters-need-to-be-escaped-when-using-bash )
 */
function escapeLinuxArgs(str: string): string {
	return (
		splitQuotes(str)
		.reduce((acc, val, i) => acc + ((i % 2 === 0)
			? val.replace(/[~`#$&*()\\|[\]{};<>?!]/g, '\\$&')
			: '"' + val.replace(/[$!\\]/g, '\\$&') + '"'
		), '')
	);
}

/**
 * Split a string to separate the characters wrapped in quotes from all other.
 * Example: '-a -b="123" "example.com"' => ['-a -b=', '123', ' ', 'example.com']
 * @param str String to split.
 * @returns Split of the argument string.
 *			Items with odd indices are wrapped in quotes.
 *			Items with even indices are NOT wrapped in quotes.
 */
function splitQuotes(str: string): string[] {
	// Search for all pairs of quotes and split the string accordingly
	const splits: string[] = [];
	let start = 0;
	while (true) {
		const begin = str.indexOf('"', start);
		if (begin >= 0) {
			const end = str.indexOf('"', begin + 1);
			if (end >= 0) {
				splits.push(str.substring(start, begin));
				splits.push(str.substring(begin + 1, end));
				start = end + 1;
			} else { break; }
		} else { break; }
	}
	// Push remaining characters
	if (start < str.length) {
		splits.push(str.substring(start, str.length));
	}
	return splits;
}
