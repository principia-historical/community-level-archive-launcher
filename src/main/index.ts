import { Coerce } from '@shared/utils/Coerce';
import { main } from './Main';
import { Init } from './types';

const init = getArgs();

main(init);

function getArgs(): Init {
	const init: Init = {
		args: {},
		rest: '',
	};

	const args = process.argv.slice(2);
	let lastArgIndex = -1;
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		const eqIndex = arg.indexOf('=');
		if (eqIndex >= 0) {
			const name = arg.substr(0, eqIndex);
			const value = arg.substr(eqIndex + 1);
			switch (name) {
				// String value
				case 'connect-remote':
					init.args[name] = value;
					lastArgIndex = i;
					break;
				// Boolean value
				case 'host-remote':
				case 'back-only':
					init.args[name] = Coerce.strToBool(value);
					lastArgIndex = i;
					break;
			}
		}
	}

	init.rest = args.slice(lastArgIndex + 1).join(' ');

	console.log(init); // @DEBUG

	return init;
}
