import * as fs from 'fs';
import * as path from 'path';
import * as YAML from 'yaml';
import { convertMeta, ParsedCurationMeta } from '@shared/curate/parse';
import { stripBOM } from '@shared/Util';

describe('convertMeta()',function () {
	test('Empty meta', () => {
		const meta = fs.readFileSync(path.resolve(emptyMetaPath));
		const parsedMeta = YAML.parse(stripBOM(meta.toString()));
		expect(convertMeta(parsedMeta))
		.toEqual(emptyMeta);
	});

	test('Library case insensitive', () => {
		const meta = fs.readFileSync(path.resolve(libraryCasePath));
		const parsedMeta = YAML.parse(stripBOM(meta.toString()));
		expect(convertMeta(parsedMeta))
		.toEqual(libraryCase);
	});

	test('Example file', () => {
		const meta = fs.readFileSync(path.resolve(exampleMetaPath));
		const parsedMeta = YAML.parse(stripBOM(meta.toString()));
		expect(convertMeta(parsedMeta))
		.toEqual(exampleMeta);
	});
});

const emptyMetaPath = './tests/static/curate/format/meta_empty.yaml';
const emptyMeta: ParsedCurationMeta = {
	game: {}
};

const libraryCasePath = './tests/static/curate/format/meta_libraryCase.yaml';
const libraryCase: ParsedCurationMeta = {
	game: {
		library: 'arcade'
	}
};

const exampleMetaPath = './tests/static/curate/format/meta_example.yaml';
const exampleMeta: ParsedCurationMeta = {
	game: {
		title: 'Test Curation',
		library: 'arcade',
		series: 'Series',
		author: 'Author',
		levelType: 'Custom',
		releaseDate: '2019-01-01',
		revision: '1.0.0',
		language: 'en',
		extreme: 'Yes',
		tags: 'List; Of; Tags',
		source: 'http://example.com/',
		platform: 'HTML5',
		status: 'Playable',
		applicationPath: 'FPSoftware\\Basilisk-Portable\\Basilisk-Portable.exe',
		launchCommand: 'http://example.com/index.html',
		notes: 'Notes',
		description: 'Original\nMultiline\nDesc'
	}
};