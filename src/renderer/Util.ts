import { Game } from '@database/entity/Game';
import { AddLogData, BackIn } from '@shared/back/types';
import { htdocsPath } from '@shared/constants';
import { getFileServerURL } from '@shared/Util';
import { remote } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { Paths } from './Paths';

export const gameIdDataType = 'text/game-id';

/** How much the maximum/minimum game scale will scale the games up/down */
export const gameScaleSpan = 0.6;

export function easterEgg(search: string) {
	if (search === 'ROllerozxa') {
		// spell-checker: disable
		window.Shared.back.send<any, AddLogData>(BackIn.ADD_LOG, {
			source: '',
			content: 'uwu',
		});
	}
}

/**
 * Copy and shuffle an array.
 * @param {Array} array The array to copy and shuffle
 * @returns Shuffled copy of the given array
 */
export function shuffle<T>(array: T[]): T[] {
	const shuffled = array.slice();
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const temp = shuffled[j];
		shuffled[j] = shuffled[i];
		shuffled[i] = temp;
	}
	return shuffled;
}

/**
 * Join a library route with the browse route
 * @param route Library route
 */
export function joinLibraryRoute(route: string): string {
	let cleanRoute = (
		route
		.replace(/\//g, '')
		.replace(/\\/g, '')
	);
	if (cleanRoute === '..') { cleanRoute = ''; }
	return path.posix.join(Paths.BROWSE, cleanRoute);
}

/** (HTML)Element but only with the "parentElement" property. */
type ElementBase<T extends ElementBase<T>> = { parentElement: T | null; };

/**
 * @param target Current target element for testing.
 * @param count Number of steps up the ancestry chain the target is (0 means it's the input element, 1 means it's the input element's parent).
 * @param input The element the search started from.
 * @returns If the target element is the ancestor the function is looking for.
 */
export type ElementAncestorFunction<T extends ElementBase<T>> = (target: T, count: number, input: T) => boolean;

/**
 * Find the first ancestor of an element where "fn" returns true (starting with the parent of the input element).
 * @param element The input element.
 * @param fn Function that is called for each ancestor of element until it returns true, or runs out of ancestors.
 * @param checkElement If the input element should also be checked. Defaults to false.
 * @returns The found ancestor, or undefined if "fn" returned false for all ancestors (or if the element has no ancestors).
 */
export function findElementAncestor<T extends ElementBase<T>>(element: T, fn: ElementAncestorFunction<T>, checkElement = false): T | undefined {
	let current = checkElement ? element : element.parentElement;
	let count = 0;
	while (true) {
		if (!current) { break; }
		if (fn(current, count, element)) { return current; }
		current = current.parentElement;
		count += 1;
	}
	return undefined;
}

/**
 * Check if an element is the same as another element, or an ancestor of it.
 * @param start First element to compare to (it will climb up the parents of this recursively).
 * @param target Element to find.
 * @returns If the "target" element was found.
 */
export function checkIfAncestor(start: Element | null, target: Element | null): boolean {
	let element: Element | null = start;
	while (element) {
		if (element === target) { return true; }
		element = element.parentElement;
	}
	return false;
}

export function getGameImageURL(folderName: string, gameId: string): string {
	return `${getFileServerURL()}/images/${folderName}/${gameId.substr(0, 2)}/${gameId.substr(2, 2)}/${gameId}.png`;
}

export function getPlatformIconURL(platform: string): string {
	return `${getFileServerURL()}/logos/${platform}.png`;
}

export function getGameImagePath(folderName: string, gameId: string): string {
	return path.join(
		window.Shared.config.fullFlashpointPath,
		window.Shared.config.data.imageFolderPath,
		folderName,
		`${gameId.substr(0, 2)}/${gameId.substr(2, 2)}/${gameId}.png`
	);
}

type IGamePathInfo = Pick<Game, 'platform' | 'launchCommand'>;

/* istanbul ignore next */
export function getGamePath(game: IGamePathInfo, fpPath: string): string | undefined {
	const urlObj = toForcedURL(game.launchCommand);
	return urlObj
		? path.join(fpPath, htdocsPath, urlToFilePath(urlObj))
		: undefined;
}

/** Convert a URL to a path, where the hostname is the first folder, and the pathname the folders afterwards. */
function urlToFilePath(url: URL): string {
	return decodeURIComponent(path.join(url.hostname, url.pathname));
}

/** Try to create a URL object (both with the unedited string and a protocol). */
export function toForcedURL(str: string): URL | undefined {
	return toURL(str) || toURL('http://'+str);
}

/** Try to create a URL object (returns undefined if the string is not valid). */
export function toURL(str: string): URL | undefined {
	try { return new URL(str); }
	catch { return undefined; }
}

/** Open a confirmation box, returning true if Yes, false if No, throwing if Cancelled. */
export async function openConfirmDialog(title: string, message: string, cancel = false): Promise<boolean> {
	const buttons = ['Yes', 'No'];
	if (cancel) { buttons.push('Cancel'); }
	const res = await remote.dialog.showMessageBox({
		title: title,
		message: message,
		buttons: buttons
	});
	if (res.response === 0) { return true; }
	if (res.response === 1) { return false; }
	else { throw 'Cancelled'; }
}

// @TODO Move this to the back process
export function isFlashpointValidCheck(flashpointPath: string): Promise<boolean> {
	return new Promise(resolve => fs.stat(path.join(flashpointPath, 'FPSoftware'), error => resolve(!error)));
}
