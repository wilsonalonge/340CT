
'use strict'

let data = []

const sqlite3 = require('sqlite3').verbose()

// open the database
let db = new sqlite3.Database('website.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the website database.');
});

module.exports.clear = () => {
	data = []
}

module.exports.getAll = (callback) => {
	const sql = 'SELECT * FROM Articles order by date(date) DESC;'
	console.log(sql)
	// db.all(sql, (err, data) => {
		// if (err) console.error(err.message)
		// callback(data)
	// })
	// open the database
	db.all(sql, [], (err, rows) => {
	if (err) {
		console.error('db error: '+ err.message)
		throw err;
	}
	rows.forEach((row) => {
		console.log(row.name);
	  });
	callback(data)
	});
}

module.exports.add = (headline, shortSummary, MLC) => {
	//console.log(req.body)
	const sql = `INSERT INTO Articles(headline, shortSummary, MLC)
	VALUES("${headline}",
		"${shortSummary}",
		"${MLC}");`
	//console.log(sql)
	data.push({headline: headline, shortSummary: shortSummary, MLC: MLC})
	db.run(sql, err => {
		if (err) console.error(err.message)
	})
}

module.exports.getTrackers = (callback) => {
	const sql = 'SELECT * FROM Articles WHERE (shortSummary <= MLC);'
	console.log(sql)
	db.all(sql, (err, data) => {
		if (err) console.error(err.message)
		callback(data)
	})
}