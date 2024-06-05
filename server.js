const express = require('express');
const expressHandlebars = require('express-handlebars');
const session = require('express-session');
const canvas = require('canvas');
require('dotenv').config(); 
const accessToken = process.env.EMOJI_API_KEY;

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Configuration and Setup
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Import necessary modules
// const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Express app setup
const app = express();
const PORT = 3000;

// Use environment variables for client ID and secret
// const CLIENT_ID = process.env.CLIENT_ID;
// const CLIENT_SECRET = process.env.CLIENT_SECRET;

// Configure passport
// passport.use(new GoogleStrategy({
//     clientID: CLIENT_ID,
//     clientSecret: CLIENT_SECRET,
//     callbackURL: `http://localhost:${PORT}/auth/google/callback`
// }, (token, tokenSecret, profile, done) => {
//     return done(null, profile);
// }));

// passport.serializeUser((user, done) => {
//     done(null, user);
// });

// passport.deserializeUser((obj, done) => {
//     done(null, obj);
// });

// Start the server
// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Handlebars Helpers

    Handlebars helpers are custom functions that can be used within the templates 
    to perform specific tasks. They enhance the functionality of templates and 
    help simplify data manipulation directly within the view files.

    In this project, two helpers are provided:
    
    1. toLowerCase:
       - Converts a given string to lowercase.
       - Usage example: {{toLowerCase 'SAMPLE STRING'}} -> 'sample string'

    2. ifCond:
       - Compares two values for equality and returns a block of content based on 
         the comparison result.
       - Usage example: 
            {{#ifCond value1 value2}}
                <!-- Content if value1 equals value2 -->
            {{else}}
                <!-- Content if value1 does not equal value2 -->
            {{/ifCond}}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

// Set up Handlebars view engine with custom helpers
//
app.engine(
    'handlebars',
    expressHandlebars.engine({
        helpers: {
            toLowerCase: function (str) {
                return str.toLowerCase();
            },
            ifCond: function (v1, v2, options) {
                if (v1 === v2) {
                    return options.fn(this);
                }
                return options.inverse(this);
            },
        },
    })
);

app.set('view engine', 'handlebars');
app.set('views', './views');

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Middleware
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app.use(
    session({
        secret: 'oneringtorulethemall',     // Secret key to sign the session ID cookie
        resave: false,                      // Don't save session if unmodified
        saveUninitialized: false,           // Don't create session until something stored
        cookie: { secure: false },          // True if using https. Set to false for development without https
    })
);

// Replace any of these variables below with constants for your application. These variables
// should be used in your template files. 
// 
app.use((req, res, next) => {
    res.locals.appName = 'BirdIsDaWord';
    res.locals.copyrightYear = 2024;
    res.locals.postNeoType = 'Post';
    res.locals.loggedIn = req.session.loggedIn || false;
    res.locals.userId = req.session.userId || '';
    next();
});

app.use(express.static('public'));                  // Serve static files
app.use(express.urlencoded({ extended: true }));    // Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.json());                            // Parse JSON bodies (as sent by API clients)

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Routes
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Home route: render home view with posts and user
// We pass the posts and user variables into the home
// template
//
app.get('/', (req, res) => {
    const posts = getPosts();
    const user = getCurrentUser(req) || {};
    res.render('home', { posts, user });
});

// Register GET route is used for error response from registration
//
app.get('/register', (req, res) => {
    res.render('loginRegister', { regError: req.query.error });
});

// Login route GET route is used for error response from login
//
app.get('/login', (req, res) => {
    res.render('loginRegister', { loginError: req.query.error });
});

//guest error
app.get('/guest', (req, res) => {
    res.render('loginRegister', { regError: req.query.error });
})

// Error route: render error page
//
app.get('/error', (req, res) => {
    res.render('error', { loginError: req.query.error });
});

// Additional routes that you must implement


app.get('/post/:id', (req, res) => {
    // TODO: Render post detail page
    const posts = getPosts();
    res.render('home', {posts} );
});

app.post('/posts', (req, res) => {
    // TODO: Add a new post and redirect to home
    const user = getCurrentUser(req) || {};
    addPost(req.body.title, req.body.content, user);
    const posts = getPosts();
    res.render('home', {posts, user});
});
app.post('/like/:id', (req, res) => {
    // TODO: Update post likes
    const posts = getPosts();
    res.render('post', posts.likes);
});
app.get('/profile', isAuthenticated, (req, res) => {
    // TODO: Render profile page
    res.render('profile');
});
app.get('/avatar/:username', (req, res) => {
    // TODO: Serve the avatar image for the user
    const user = getCurrentUser(req);
    const avatar = generateAvatar(user[0]);
    res.render('home', {avatar, user});
});
app.post('/register', (req, res) => {
    // TODO: Register a new user
    registerUser(req, res);
});
app.post('/login', (req, res) => {
    // TODO: Login a user
    loginUser(req, res);
});

//guest
app.post('/guest', (req, res) => {
    guestUser(req, res);
})

app.get('/logout', (req, res) => {
    // TODO: Logout the user
    logoutUser(req, res);
    const posts = getPosts();
    const user = {};
    res.render('home', { posts, user });
});
app.post('/delete/:id', isAuthenticated, (req, res) => {
    // TODO: Delete a post if the current user is the owner
    const usernameCurrent = req.body.username;
    if(post.username === usernameCurrent) {
        posts[post.id].pop();
    }
    location.reload();
});

app.get('/emojis', (req, res) => {
    fetch("http://emoji-api.com/emojis?access_key="+accessToken)
    .then(response => {
        res.send(response);
        console.log(response);
    });
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Server Activation
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Support Functions and Variables
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Example data for posts and users
let posts = [
    { id: 1, title: 'Sample Post', content: 'This is a sample post.', username: 'SampleUser', timestamp: '2024-01-01 10:00', likes: 0 },
    { id: 2, title: 'Another Post', content: 'This is another sample post.', username: 'AnotherUser', timestamp: '2024-01-02 12:00', likes: 0 },
    { id: 3, title: 'Yet Another Post', content: 'This is yet another sample post.', username: 'YetAnotherUser', timestamp: '2024-01-03 02:00', likes: 0 },
];

let users = [
    { id: 1, username: 'SampleUser', hashedGoogleID: undefined, avatar_url: undefined, memberSince: '2024-01-01 08:00' },
    { id: 2, username: 'AnotherUser', hashedGoogleID: undefined, avatar_url: undefined, memberSince: '2024-01-02 09:00' },
    { id: 3, username: 'YetAnotherUser', hashedGoogleID: undefined, avatar_url: undefined, memberSince: '2024-01-02 10:00' },
];

// Function to find a user by username
function findUserByUsername(username) {
    // TODO: Return user object if found, otherwise return undefined
    return users.filter(user => user.username === username)[0];
}

// Function to find a user by user ID
function findUserById(userId) {
    // TODO: Return user object if found, otherwise return undefined
    return users.filter(user => user.id === userId)[0];
}

// Function to add a new user
function addUser(username) {
    // TODO: Create a new user object and add to users array
    const date = new Date(Date.now());
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const time = date.toLocaleTimeString('es', { hour: "2-digit", minute: "2-digit" });

    const newUser = {
        id: users.length + 1,
        username,
        // hashedGoogleID: hashedGoogleID,
        avatar_url: generateAvatar(username[0]),
        memberSince: `${year}-${month}-${day} ${time}`,
    };

    users.push(newUser);
}


// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    console.log(req.session.userId);
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
}

//Function to randomize Guest User Name
function guestUser(req, res) {
    const username = getRandomName();
    console.log("Attemping to create: ",username);
    if(findUserByUsername(username)) {
        //guest name taken
        res.redirect('/register?error=Username+already+exists');
    }
    else{
        addUser(username);
        console.log("creation successful");
        res.redirect('/login');
    }
}

// Function to register a user
function registerUser(req, res) {
    // TODO: Register a new user and redirect appropriately
    const username = req.body.username;
    console.log("Attemping to register: ",username);
    if (findUserByUsername(username)) {
        // Username already taken
        res.redirect('/register?error=Username+already+exists');
    }
    else {
        // add new username to list
        addUser(username);
        console.log("register successful");
        res.redirect('/login');
    }
}

// Function to login a user
function loginUser(req, res) {
    // TODO: Login a user and redirect appropriately
    const username = req.body.username;
    console.log("Attemping to login: ",username);
    if (findUserByUsername(username)) {
        // passport.authenticate('google', { scope: ['profile'] });
        req.session.userId = findUserByUsername(username).id;
        req.session.loggedIn = true;
        res.redirect('/');
        console.log("login successful");
    }
    else {
        res.redirect('/login?error=Username+does+not+exist');
    }
}

// Function to logout a user
function logoutUser(req, res) {
    // TODO: Destroy session and redirect appropriately
    req.session.loggedIn = false;
    req.session.userId = '';
    res.redirect("/");
    
}

// Function to render the profile page
function renderProfile(req, res) {
    // TODO: Fetch user posts and render the profile page
    const posts = getPosts();
    posts.filter
    res.render('home', {posts})
}

// Function to update post likes
function updatePostLikes(req, res) {
    // TODO: Increment post likes if conditions are met
    location.reload();
}

// Function to handle avatar generation and serving
function handleAvatar(req, res) {
    // TODO: Generate and serve the user's avatar image
    const user = getCurrentUser(req);
    res.render('home', {});

}

// Function to get the current user from session
function getCurrentUser(req) {
    // TODO: Return the user object if the session user ID matches
    const idCompare = req.session.userId;
    for(let i = 0; i < users.length; i++) {
        if (idCompare === users[i].id) {
            return users[i];
        }
    }
}

// Function to get all posts, sorted by latest first
function getPosts() {
    return posts.slice().reverse();
}

// Function to add a new post
function addPost(title, content, user) {
    // TODO: Create a new post object and add to posts array
    const date = new Date(Date.now());
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const time = date.toLocaleTimeString('es', { hour: "2-digit", minute: "2-digit" });

    const newPost = {
        id: posts.length + 1,
        title: title,
        content: content,
        username: user.username,
        timestamp: `${year}-${month}-${day} ${time}`,
        likes: 0,
    };

    posts.push(newPost);
}

// Function to generate an image avatar
function generateAvatar(letter, width = 100, height = 100) {
    // TODO: Generate an avatar image with a letter
    // Steps:
    // 1. Choose a color scheme based on the letter
    function chooseColor() {
        const colors = [
            // red
            '#FF0000',
            // blue
            '#0000FF',
            // green
            '#008000',
            // yellow,
            '#FFFF00',
            // orange
            '#FFA500'
        ];
        const randomNum = Math.floor(Math.random() * 5);
        return colors[randomNum];
    }
    const backgroundColor = chooseColor();

    // 2. Create a canvas with the specified width and height
    const avatarCanvas = canvas.createCanvas(width, height);
    const context = avatarCanvas.getContext('2d');

    // 3. Draw the background color
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, avatarCanvas.width, avatarCanvas.height);

    // 4. Draw the letter in the center
    context.font = '50px Arial';
    context.fillStyle = '#FFFFFF';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(letter.toUpperCase(), avatarCanvas.width / 2, avatarCanvas.height / 2);

    // 5. Return the avatar as a PNG buffer
    const buffer = avatarCanvas.toBuffer();
    return buffer;
}

const randoUserFirst = ["Super", "Ultra", "Mega", "Insanely", "Unfathomably", "Ultimately", "Extremely", "Crazy"];
const randoUserSecond = ["Sassy", "Punk", "Rock", "Jazzy", "Pop", "Metal"];
const randoUserThird = ["99", "100", "101", "002", "999", "77", "090"];

const getRandomName = () => `${randoUserFirst[Math.floor(Math.random() * randoUserFirst.length)]}${randoUserSecond[Math.floor(Math.random() * randoUserSecond.length)]}${randoUserThird[Math.floor(Math.random() * randoUserThird.length)]}`;