const express = require('express');
const registerHandler = require('./api/auth/register');

const app = express();
app.use(express.json());
app.use('/api/auth/register', registerHandler);

const PORT = 3000;
app.listen(PORT, () => console.log(`Test server running on port ${PORT}`));