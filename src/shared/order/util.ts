import { GameOrderBy, GameOrderReverse } from './interfaces';

/** An array with all valid values of GameOrderBy */
export const gameOrderByOptions: GameOrderBy[] = [ 'dateAdded', 'dateModified', 'tags', 'platform', 'series', 'title', 'author' ];

/** An array with all valid values of GameOrderReverse */
export const gameOrderReverseOptions: GameOrderReverse[] = [ 'ASC', 'DESC' ];
