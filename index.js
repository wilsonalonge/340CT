#!/usr/bin/env node

/**
 * Routes File
 */

// 'use strict'

/* MODULE IMPORTS */
const Koa = require('koa');
// import Router from 'koa-trie-router'
const Router = require('koa-router')
const views = require('koa-views')
const staticDir = require('koa-static')
const bodyParser = require('koa-bodyparser')
const koaBody = require('koa-body')({multipart: true, uploadDir: '.'})
const session = require('koa-session')
const sqlite = require('sqlite-async')
const bcrypt = require('bcrypt-promise')
const fs = require('fs-extra')
const mime = require('mime-types')
//const jimp = require('jimp')

/* IMPORT CUSTOM MODULES */
const accounts = require('./modules/accounts')

const app = new Koa()
const router = new Router()

/* CONFIGURING THE MIDDLEWARE */
app.keys = ['darkSecret']
app.use(staticDir('public'))
app.use(bodyParser())
app.use(session(app))
app.use(views(`${__dirname}/views`, { extension: 'handlebars' }, {map: { handlebars: 'handlebars' }}))
app.use(router.routes())
app.use(router.allowedMethods())

const sqlite3 = require('sqlite3').verbose()
let db = new sqlite3.Database('website.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the website database.');
});
const port = 8080
const saltRounds = 10
global.articl = [];	
global.rows;

/**
 * The secure home page.
 *
 * @name Home Page
 * @route {GET} /
 * @authentication This route requires cookie-based authentication.
 */
router.get('/', async ctx => {
	// console.log(data)

// try {
		if(ctx.session.authorised !== true){ return ctx.redirect('/login?msg=you need to log in')}
		
		
		// if(ctx.query.msg){} data.msg = ctx.query.msg
		
		//take out
		// const sql = 'SELECT * FROM Articles;'
		// 		db.all(sql, [], (err, rows) => {
		// 		if (err) {
		// 			console.error('db error: '+ err.message)
		// 			throw err;
		// 		}
		// 		if(!err){
		// 		articl = rows;
		// 		}
				// console.log(data)

				// var index = this.render('index')

				// console.log(rows)
				// console.log(ctx.matchedRoute)

	// })
	// // console.log(rows)
	// ctx.redirect('')
	// await console.log(articl)
	// var index = await ctx.render('index', { article: articl })
	
	// } 
	// catch(err) {
	// 	await ctx.render('error', {message: err.message})
	// }
// router.get('/', function(ctx) {
		// try {
				// const sql = 'SELECT * FROM Articles;'
				// db.all(sql, [], (err, rows) => {
				// if (err) {
					// console.error('db error: '+ err.message)
					// throw err;
				// }
				// else{
				// rows.forEach((row) => {
					// console.log(row.name);
				  // });
				  // console.log(rows)
				  // console.log(ctx.matchedRoute)

				// return ctx.render(`index`, { article: rows })
				// }

		// })
	// } catch (err) {
		// console.log(err.message)
		// return ctx.render('error')
	// }
})
router.get('/', async ctx => ctx.render('index'))


/**
 * The user registration page.
 *
 * @name Register Page
 * @route {GET} /register
 */
router.get('/register', async ctx => await ctx.render('register'))

/**
 * The script to process new user registrations.
 *
 * @name Register Script
 * @route {POST} /register
 */
router.post('/register', koaBody, async ctx => {
	try {
		const body = ctx.request.body
		console.log(body)
		// PROCESSING FILE
		const {path, type} = ctx.request.files.avatar
		const fileExtension = mime.extension(type)
		console.log(`path: ${path}`)
		console.log(`type: ${type}`)
		console.log(`fileExtension: ${fileExtension}`)
		await fs.copy(path, 'public/avatars/avatar.png')
		// ENCRYPTING PASSWORD AND BUILDING SQL
		body.pass = await bcrypt.hash(body.pass, saltRounds)
		const sql = `INSERT INTO users(user, pass) VALUES("${body.user}", "${body.pass}")`
		console.log(sql)
		// DATABASE COMMANDS
		const db = await sqlite.open('./website.db')
		await db.run(sql)
		await db.close()
		// REDIRECTING USER TO HOME PAGE
		ctx.redirect(`/?msg=new user "${body.name}" added`)
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})
global.fullArticle = [];
router.get('/article', async ctx => {
	const body = ctx.query.id
	const sql = 'SELECT * FROM Articles WHERE id = '+ body + ';'
	db.all(sql, [], (err, rows) => {
	if (err) {
		console.error('db error: '+ err.message)
		throw err;
	}
	if(!err){
	fullArticle = rows;
	}
	});
	ctx.type = 'text/plain'
	ctx.body = `You sent: ${body}`
	console.log(fullArticle)
	// const data = {}
	// if(ctx.query.msg) data.msg = ctx.query.msg
	// if(ctx.query.user) data.user = ctx.query.user
	var articleview = await ctx.render('article',{ article: fullArticle} )  
})

router.get('/login', async ctx => {
	const data = {}
	if(ctx.query.msg) data.msg = ctx.query.msg
	if(ctx.query.user) data.user = ctx.query.user
	await ctx.render('login', data)  
})

router.post('/login', async ctx => {
	try {
		const body = ctx.request.body
		const db = await sqlite.open('./website.db')
		// DOES THE USERNAME EXIST?
		const records = await db.get(`SELECT count(id) AS count FROM users WHERE user="${body.user}";`)
		if(!records.count) return ctx.redirect('/login?msg=invalid%20username')
		const record = await db.get(`SELECT pass FROM users WHERE user = "${body.user}";`)
		await db.close()
		// DOES THE PASSWORD MATCH?
		const valid = await bcrypt.compare(body.pass, record.pass)
		if(valid == false) return ctx.redirect(`/login?user=${body.user}&msg=invalid%20password`)
		// WE HAVE A VALID USERNAME AND PASSWORD
		ctx.session.authorised = true
		return ctx.redirect('/add')
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})

// router.post('/login', async ctx => { // 19 lines reduced to 10!
// 	const body = ctx.request.body
// 	try {
// 		await accounts.checkCredentials(body.user, body.pass)
// 		ctx.session.authorised = true
// 		return ctx.redirect('/?msg=you are now logged in...')
// 	} catch(err) {
// 		return ctx.redirect(`/login?user=${body.user}&msg=${err.message}`)
// 	}
// })

router.get('/logout', async ctx => {
	ctx.session.authorised = null;
	ctx.redirect('/')	
})

app.use(router.routes())
module.exports = app.listen(port, async() => {
	// MAKE SURE WE HAVE A DATABASE WITH THE CORRECT SCHEMA
	const db = await sqlite.open('./website.db')
	await db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT, pass TEXT);')
	await db.close()
	console.log(`listening on port ${port}`)
})