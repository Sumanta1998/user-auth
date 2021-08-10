require("dotenv").config();
const express= require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./mongoData.js');
const auth = require("./middleware/auth");

const port = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(cors());

const mongoURI =
	'mongodb+srv://admin:7KAiXXLjKFOGwS2Y@cluster0.sq9nl.mongodb.net/userDB?retryWrites=true&w=majority';

mongoose.connect(mongoURI, {
	useCreateIndex: true,
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

app.get('/', (req, res) => {
	res.status(200).send('Hello Sumanta!');
});

app.post('/register', async (req, res) => {
	try {
		const { first_name, last_name, email, password } = req.body;

		if (!(email && password && first_name && last_name)) {
			res.status(400).send('All input is required');
		}

		const oldUser = await User.findOne({ email });

		if (oldUser) {
			return res.status(409).send('User Already Exist. Please Login');
		}
		let encryptedPassword = await bcrypt.hash(password, 10);

		const user = await User.create({
			first_name,
			last_name,
			email: email.toLowerCase(), // sanitize: convert email to lowercase
			password: encryptedPassword,
		});

		const token = jwt.sign(
			{ user_id: user._id, email },
			process.env.TOKEN_KEY,
			{
				expiresIn: '2h',
			},
		);
		user.token = token;

		res.status(201).json(user);
	} catch (err) {
		console.log(err);
	}
});

app.post("/login", async (req, res) => {

  try {
    const { email, password } = req.body;

    if (!(email && password)) {
      res.status(400).send("All input is required");
    }
    const user = await User.findOne({ email });
    if(!user){
  	      res.status(400).json({user: ""});
    }

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { user_id: user._id, email },
        process.env.TOKEN_KEY,
        {
          expiresIn: "2h",
        }
      );

      user.token = token;

      res.status(200).json(user);
    }
    res.status(400).send("Invalid Credentials");
  } catch (err) {
    console.log(err);
  }
});

app.post('/logout', function(req, res) {
  res.status(200).send({ auth: false, token: null });
});

app.post("/welcome", auth, (req, res) => {
  res.status(200).send("Welcome 🙌 ");
});

app.get('/me', auth, async (req, res, next) => {
   try {
    const { email } = req.user;

    const user = await User.findOne({ email });
    if(!user){
  	      res.status(404).send("No user found.");
    }

    user.password = "";
    res.status(200).send(user);


  } catch (err) {
    console.log(err);
  }

});




app.listen(port, () => {
	console.log(`http://localhost:${port}`);
});
