export type InitArgs = Partial<{
	// Main mode
	'connect-remote': string;
	'host-remote': boolean;
	'back-only': boolean;
}>;

export type Init = {
	args: InitArgs;
	rest: string;
}
