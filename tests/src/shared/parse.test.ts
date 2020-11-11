import { convertMeta } from '@shared/curate/parse';

describe('Curate Parse', () => {
	test('Catch Invalid and Empty Metas', () => {
		const mockOnError = jest.fn();
		convertMeta('brokens', mockOnError);

		expect(mockOnError).toHaveBeenCalled();
		expect(convertMeta('')).toEqual({
			game: {}
		});
	});
});