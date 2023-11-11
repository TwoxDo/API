// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');


const app = express();
const port = 3000;

mongoose.connect('mongodb://localhost:27017/userdb', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;


const userSchema = new mongoose.Schema({
  id: String,
  email: String,
  accessToken: String,
  marketingConsent: Boolean,
});

const User = mongoose.model('User', userSchema);

app.use(express.json());

app.post('/register', async (req, res) => {
  try {
    const { email, marketingConsent } = req.body;


    const id = crypto.createHash('sha1').update(email + '450d0b0db2bcf4adde5032eca1a7c416e560cf44').digest('hex');


    const accessToken = jwt.sign({ id, email }, 'your-secret-key', { expiresIn: '1h' });


    const user = new User({
      id,
      email,
      accessToken,
      marketingConsent,
    });


    await user.save();

    res.status(201).json({ message: 'User registered successfully', id, accessToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { accessToken } = req.headers;


    jwt.verify(accessToken, 'your-secret-key', async (err, decoded) => {
      if (err || decoded.id !== id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }


      const user = await User.findOne({ id });

      if (user && !user.marketingConsent) {
        delete user.email;
      }

      res.json(user);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
