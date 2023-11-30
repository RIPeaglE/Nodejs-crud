const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const server = express();

// Middleware
server.use(express.urlencoded({ extended: true }));
server.use(express.json());

// Serve static files from the "public" and "uploads" folders
server.use('/public', express.static(path.join(__dirname, 'public')));
server.use('/uploads', express.static(path.join(__dirname, 'uploads')));

server.set('view engine', 'ejs');
server.set('views', path.join(__dirname, 'views'));
server.set('port', process.env.PORT || 3001);

// Multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Handling root route
server.get('/', (request, response) => {
  response.sendFile(__dirname + '/index.html');
});

// Handling route for creating users
server.get('/createusers', (request, response) => {
  response.sendFile(__dirname + '/createusers.html');
});

// Handling user creation form submission
server.post('/createusers', upload.single('userImage'), (req, res) => {
  // Takes user data from the request
  const { firstName, lastName, username, birthday, occupation } = req.body;
  const userImage = req.file ? req.file.filename : null;

  try {
    // Reading existing user data from file
    const usersData = fs.readFileSync('users.json', 'utf8');
    const users = JSON.parse(usersData);

    const newUser = {
      id: users.length + 1,
      firstName,
      lastName,
      username,
      birthday,
      occupation,
      userImage,
    };

    // Adding the new user to the existing user list
    users.push(newUser);

    // Writing updated user data back to the json file
    fs.writeFile('users.json', JSON.stringify(users, null, 2), (err) => {
      if (err) {
        console.error('Error writing to users.json file:', err);
        res.status(500).send('Internal Server Error: ' + err.message);
      } else {
        res.redirect('/viewusers');
      }
    });
  } catch (error) {
    console.error('Error reading users.json file:', error);
    res.status(500).send('Internal Server Error: ' + error.message);
  }
});

// Handling route for viewing users
server.get('/viewusers', (request, response) => {
  try {
    // Reading user data from file for rendering
    const usersData = fs.readFileSync('users.json', 'utf8');
    const users = JSON.parse(usersData);
    response.render('viewusers.ejs', { users });
  } catch (error) {
    console.error('Error reading users.json file:', error);
    response.status(500).send('Internal Server Error: ' + error.message);
  }
});

// Handling route for editing users
server.get('/editusers', (req, res) => {
  const userId = req.query.id;

  try {
    // Reading user data for editing
    const usersData = fs.readFileSync('users.json', 'utf8');
    const users = JSON.parse(usersData);

    // Finding the user to be edited
    const user = users.find((user) => user.id == userId);

    if (user) {
      // Rendering the edit page with user data
      res.render('editusers.ejs', { user, userImage: user.userImage, users });
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    console.error('Error reading users.json file:', error);
    res.status(500).send('Internal Server Error: ' + error.message);
  }
});

// Handling user edit form submission
server.post('/editusers', upload.single('userImage'), (req, res) => {
  // Extracting updated user data from the request
  const { userId, firstName, lastName, username, birthday, occupation } = req.body;
  const updatedUserImage = req.file ? req.file.filename : null;

  try {
    // Reading existing user data from file
    const usersData = fs.readFileSync('users.json', 'utf8');
    const users = JSON.parse(usersData);

    // Finding the user to be updated
    const user = users.find((user) => user.id == userId);

    if (user) {
      // Updating user data
      user.firstName = firstName;
      user.lastName = lastName;
      user.username = username;
      user.birthday = birthday;
      user.occupation = occupation;

      if (updatedUserImage) {
        user.userImage = updatedUserImage;
      }

      // Writing updated user data back to the file
      fs.writeFile('users.json', JSON.stringify(users, null, 2), (err) => {
        if (err) {
          console.error('Error writing to users.json file:', err);
          res.status(500).send('Internal Server Error: ' + err.message);
        } else {
          res.redirect('/viewusers');
        }
      });
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    console.error('Error reading users.json file:', error);
    res.status(500).send('Internal Server Error: ' + error.message);
  }
});

// Handling 404 - Page Not Found
server.use((request, response) => {
  response.type('text/plain');
  response.status(404);
  response.send('404 - Page Not Found');
});

// Handling generic error handling middleware
server.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error: ' + err.message);
});

// Starting the server
server.listen(3001, () => {
  console.log('Express server started at port 3001');
});
