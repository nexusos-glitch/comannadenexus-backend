import express from "express";
import path from "path";
const app = express();
const distPath = path.join(process.cwd(), 'dist');
console.log('distPath', distPath);
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});
app.listen(3001, () => "listening");
