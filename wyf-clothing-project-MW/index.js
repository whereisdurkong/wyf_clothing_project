var express = require('express');
var dotenv = require('dotenv');
var cors = require('cors');
dotenv.config();
var path = require('path');

var userRoutes = require('./routes/userRoutes');
var product = require('./routes/product');
var blog = require('./routes/blog')

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from products folder

// Log environment variables (without password!)
console.log('📦 Environment loaded:');
console.log('  SERVER:', process.env.SERVER);
console.log('  DATABASE:', process.env.DATABASE);
console.log('  USER:', process.env.USER);
console.log('  PORT:', process.env.APP_SERVER_PORT || 'Using default');



app.use(cors());
app.use(express.json());

app.use('/products', express.static(path.join(__dirname, 'products')));
app.use('/collectionImages', express.static(path.join(__dirname, 'collectionImages')));
app.use('/setupImages', express.static(path.join(__dirname, 'setupImages')));
app.use('/blogAlbum', express.static(path.join(__dirname, 'blogAlbum')));
app.use('/dashboardImages', express.static(path.join(__dirname, 'dashboardImages')));


app.use('/api/users', userRoutes);
app.use('/api/product', product);
app.use('/api/blog', blog);


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});