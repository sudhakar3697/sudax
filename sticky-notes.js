const path = require('path');
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');

async function readStickyNotes() {
    try {
        const stickyNotesDbPath = path.join(process.env.LocalAppData, 'Packages', 'Microsoft.MicrosoftStickyNotes_8wekyb3d8bbwe', 'LocalState', 'plum.sqlite');
        const db = await sqlite.open({
            filename: stickyNotesDbPath,
            driver: sqlite3.Database
        });
        const rows = await db.all('SELECT Id, Text FROM note');
        await db.close();
        return rows.filter(row => !!row.Text).map(row => {
            if (row.Text) {
                return {
                    id: row.Id,
                    content: row.Text.replace(/\\id=[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '')
                }
            }
        });
    } catch (error) {
        console.error(error.message);
        return [];
    }
}

module.exports = { readStickyNotes };
