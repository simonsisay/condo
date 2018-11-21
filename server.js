	const express = require('express');
	const bodyParser = require('body-parser');
	const knex = require('knex');
	const cors = require('cors');
	const uuid = require('uuid');
	const bcrypt = require('bcrypt-nodejs')

	const app = express();

	const database = knex({
		client:'pg',
		connection:{
			host:'127.0.0.1',
			user:'postgres',
			password:'1234',
			database:'condo'
		}
	})


	app.use(bodyParser.json())
	app.use(cors())


	app.get('/condo/all', (req, res) => {
		database.select('*').from('houses')
		.returning('*')
		.then(houses => {
			res.json(houses)
		})
		.catch(error => {
			res.status(400).json('Failed to load data')
		})

	})


	app.get('/condo/type/:id', (req, res) => {
		const { id } = req.params;

		database.select('*').from('houses')
		.where('type', '=', id)
		.returning('*')
		.then(houses => {
			res.json(houses)
		}) 
		.catch(error => {
			res.status(400).json('Error getting houses')
		})

	})


	app.get('/condo/search/:searchText', (req, res) => {
		const { searchText } = req.params;
	})


	app.post('/condo/create', (req, res) => {
		 const { owner,  description, price, location, status, type, floor, userId } = req.body;

		 database.insert({
		 	  owner:owner,
		 	  ownerid:userId,
	        createdat:new Date(),
	        description:description,
	        houseid: uuid(),
	        price: price,
	        location: location,
	        status: status,
	        type: type,
	        floor: floor,
		 })
		 .into('houses')
		 .returning('*')
		 .then(house => {
		 	res.json(house)
		 })
		 .catch(error => {
		 	res.send(error)
		 })

	})


	app.get('/condo/profile/:userId', (req, res) => {
		const { userId } = req.params;

		database.select('*').from('houses')
		.where('ownerid', '=', userId)
		.returning('*')
		.then(houses => {
			res.json(houses)
		})
		.catch(error => {
			res.status(400).json('Unable to fetch')
		})
	})


	app.put('/condo/edit/:houseid', (req, res) => {
		const { description, price, location, status, type, floor, sold, owner } = req.body;
		const { houseid } = req.params;

		database('houses')
		.where('houseid', '=', houseid)
		.update({
			  description:description,
	        price: price,
	        location: location,
	        status: status,
	        type: type,
	        sold:sold,
	        floor: floor,
	        owner: owner
		})
		.returning('*')
		.then(house => {
			res.json(house)
		})
		.catch(error => {
			res.status(400).json('Unable to edit')
		})
	});


	app.delete('/condo/delete/:id', (req, res) => {
		const { id } = req.params;

		database('houses')
		.where('houseid', '=', id)
		.del()
		.then(house => {
			res.json('deleted')
		})
		.catch(error => {
			res.status(400).json('Unable to delete')
		})
	});

	app.post('/condo/signin', (req, res) => {
		const { username, password } = req.body;

		database.select('username', 'hash').from('login')
		.where('username', '=', username)
		.then(data => {
			const isValid = bcrypt.compareSync(password, data[0].hash)
			if(isValid){
				database.select('*').from('users')
				.where('username','=', username)
				.then(user => {
					res.json(user)
				})
				.catch(error => {
					res.status(400).json('Unable to sign in')
				})
			}
		})
		.catch(error => {
			res.status(400).json('Unable to sign in')
		})
	})



	app.post('/condo/signUp', (req, res) => {
		const { username, password } = req.body;
		const hash = bcrypt.hashSync(password)
		
		database.transaction(trx => {
			trx.insert({
				userid:uuid(),
				username:username,
				hash:hash
			})
			.into('login')
			.returning(['username', 'userid'])
			.then(user => {
				return trx('users')
				.insert({
					username:user[0].username,
					userid:uuid(),
					joined:new Date()
				})
				.returning('*')
				.then(user => {
					res.json(user);
				})
			})
			.then(trx.commit)
			.catch(trx.rollback)
		})
		.catch(() => res.status(400).json('Unable to sign up'))
	})


	app.listen(8000, () => {
		console.log('Listening to port 8000')
	});