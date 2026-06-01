const express = require('express');
const app = express();
const path = require('path');
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
app.listen(3001, () => console.log('Listening'));
