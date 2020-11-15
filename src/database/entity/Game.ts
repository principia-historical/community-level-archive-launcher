import { Column, CreateDateColumn, Entity, Index, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Tag } from './Tag';

@Index('IDX_lookup_title',			['library', 'title'])
@Index('IDX_lookup_dateAdded',		['library', 'dateAdded'])
@Index('IDX_lookup_dateModified',	['library', 'dateModified'])
@Index('IDX_lookup_author',			['library', 'author'])
@Index('IDX_lookup_series',			['library', 'series'])
@Index('IDX_lookup_platform',		['library', 'platform'])
@Index('IDX_total',					['library', 'broken', 'extreme'])
@Entity()
export class Game {
	@PrimaryGeneratedColumn('uuid')
	/** ID of the game (unique identifier) */
	id: string;

	@ManyToOne(type => Game)
	parentGame?: Game;

	@Column({ nullable: true })
	parentGameId?: string;

	@Column({collation: 'NOCASE'})
	@Index('IDX_gameTitle')
	/** Full title of the game */
	title: string;

	@Column({collation: 'NOCASE'})
	/** Game series the game belongs to (empty string if none) */
	series: string;

	@Column({collation: 'NOCASE'})
	/** Name of the author of the level */
	author: string;

	@Column({ type: 'datetime' })
	/** Date-time of when the game was added to collection */
	dateAdded: string;

	@UpdateDateColumn()
	/** Date-time of when the game was added to collection */
	dateModified: string;

	@Column({collation: 'NOCASE'})
	/** Platform the game runs on (Flash, HTML5, Shockwave etc.) */
	platform: string;

	@Column()
	/** If the game is "broken" or not */
	broken: boolean;

	@Column()
	/** Game is not suitable for children */
	extreme: boolean;

	@Column({collation: 'NOCASE'})
	/** The type of the level (puzzle, adventure, custom) */
	levelType: string;

	@Column({collation: 'NOCASE'})
	/** How playable the game is */
	status: string;

	@Column({collation: 'NOCASE'})
	/** Information that could be useful for the player (of varying importance) */
	notes: string;

	@ManyToMany(type => Tag, t => t.gamesUsing, { cascade: true, eager: true })
	@JoinTable()
	/** Tags of the game (seperated by semi-colon) */
	tags: Tag[];

	@Column({collation: 'NOCASE'})
	/** Source if the game files, either full URL or the name of the website */
	source: string;

	@Column()
	/** Path to the application that runs the game */
	applicationPath: string;

	@Column()
	/** Command line argument(s) passed to the application to launch the game */
	launchCommand: string;

	@Column({collation: 'NOCASE'})
	/** Date of when the game was released */
	releaseDate: string;

	@Column({collation: 'NOCASE'})
	/** Version of the game */
	version: string;

	@Column({collation: 'NOCASE'})
	/** Description of the game */
	description: string;

	@Column({collation: 'NOCASE'})
	/** The language(s) the game is in */
	language: string;

	@Column({collation: 'NOCASE'})
	/** Library this game belongs to */
	library: string;

	@Column({collation: 'NOCASE'})
	/** The title but reconstructed to be suitable for sorting and ordering (and not be shown visually) */
	orderTitle: string;

	/** If the game is a placeholder (and can therefore not be saved) */
	placeholder: boolean;
}
