/** Represents a collection of games */
export interface Legacy_IGameCollection {
	games: Legacy_IGameInfo[];
}

/**
 * Represents the meta data for a single Game (that gets saved)
 * (This will replace "IRawLaunchBoxGame" once a JSON format is used instead of XML)
 */
export interface Legacy_IPureGameInfo {
	/** ID of the game (unique identifier) */
	id: string;
	/** Full title of the game */
	title: string;
	/** Game series the game belongs to (empty string if none) */
	series: string;
	/** Name of the author of the level */
	author: string;
	/** Date-time of when the game was added to collection */
	dateAdded: string;
	/** Platform the game runs on (Flash, HTML5, Shockwave etc.) */
	platform: string;
	/** If the game is "broken" or not */
	broken: boolean;
	/** Game is not suitable for children */
	extreme: boolean;
	/** The type of the level (puzzle, adventure, custom) */
	levelType: string;
	/** How playable the game is */
	status: string;
	/** Information that could be useful for the player (of varying importance) */
	notes: string;
	/** Tags of the game (seperated by semi-colon) */
	tags: string;
	/** Source if the game files, either full URL or the name of the website */
	source: string;
	/** Path to the application that runs the game */
	applicationPath: string;
	/** Command line argument(s) passed to the application to launch the game */
	launchCommand: string;
	/** Date of when the game was released */
	releaseDate: string;
	/** Revision of the game */
	revision: string;
	/** Description of the game */
	description: string;
	/** The language(s) the game is in */
	language: string;
}

/** Represents the meta data for a single Game (including temporary data) */
export interface Legacy_IGameInfo extends Legacy_IPureGameInfo {
	/** Library this game belongs to */
	library: string;
	/** The title but reconstructed to be suitable for sorting and ordering (and not be shown visually) */
	orderTitle: string;
	/** If the game is a placeholder (and can therefore not be saved) */
	placeholder: boolean;
}

export type Legacy_PlatformInfo = {
	name: string;
	library: string;
	size: number;
}

export type Legacy_GamePlatform = {
	filePath: string;
	name: string;
	library: string;
	data: Legacy_IRawPlatformFile;
	collection: Legacy_IGameCollection;
}

export type Legacy_IRawPlatformFile = {
	LaunchBox: Legacy_IRawPlatform;
}

export type Legacy_IRawPlatform = {
	Game: Legacy_IRawGameInfo[];
}

/**
 * This interface represents a Game as stored in Platform XMLs (<Game> Tag)
 * Comments represent their XML data types and IPureGameInfo counterparts
 * (NOTE: The property names are not necessarily the same as the XML node names,
 *	so this might not be completely convertible by making the first character lower/upper case)
 * ( http://pluginapi.launchbox-app.com/html/b33d2055-e2be-3f42-12c6-adbc5668f454.htm )
 */
export type Legacy_IRawGameInfo = {
	ID: string;						// (String)
	Title?: string;					// (String)
	Series?: string;				// (String)
	Author?: string;				// (String)
	DateAdded?: string;				// (DateTime)
	Platform?: string;				// (String)
	Broken?: boolean;				// (Boolean)
	Hide?: boolean;					// (Boolean) - Extreme
	LevelType?: string;				// (String)
	Status?: string;				// (String)
	Notes?: string;					// (String)
	Genre?: string;					// (String) - Tags / Genres
	Source?: string;				// (String)
	ApplicationPath?: string;		// (String)
	CommandLine?: string;			// (String) - Launch Command
	ReleaseDate?: string;			// (Nullable<DateTime>)
	Revision?: string;				// (String)
	Description?: string;	// (String)
	Language?: string;				// (String)
}
