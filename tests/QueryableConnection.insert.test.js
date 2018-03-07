import QueryableConnection from '../src/QueryableConnection';

describe('insert', () => {
    it('converts table name and the values', async () => {
        const connection = new QueryableConnection();
        const queryMock = jest.spyOn(connection, 'query').mockImplementation();

        await connection.insert('table', {some: 'value'});

        expect(queryMock).toHaveBeenCalledTimes(1);

        const mockCalls = queryMock.mock.calls;
        const sql = mockCalls[0][0];

        expect(sql.values).toMatchObject(['value']);
        expect(sql.text.trim()).toMatch('INSERT INTO "table" ("some") VALUES ($1)');
    });
});
