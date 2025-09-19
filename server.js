const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({ 
    stories: [], galleryImages: [], gifs: [], homework: [],
    settings: {
        username: 'Your Name', profilePicture: 'placeholder-profile.jpg', banner: '', youtubeUrl: 'https://www.youtube.com'
    }
}).write();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    const filePath = `/uploads/${req.file.filename}`;
    const { type } = req.body;
    const collections = { gallery: 'galleryImages', gif: 'gifs', homework: 'homework' };
    const settings = { profile: 'profilePicture', banner: 'banner' };
    if (collections[type]) {
        db.get(collections[type]).push({ path: filePath, originalName: req.file.originalname }).write();
    } else if (settings[type]) {
        db.set(`settings.${settings[type]}`, filePath).write();
    }
    res.json({ path: filePath, originalName: req.file.originalname });
});

app.delete('/api/media', (req, res) => {
    const { filePath, type } = req.body;
    if (!filePath || typeof filePath !== 'string') return res.status(400).send('Invalid file path provided.');
    const physicalPath = path.join(__dirname, 'public', filePath);
    if (fs.existsSync(physicalPath)) fs.unlinkSync(physicalPath);
    db.get(type).remove({ path: filePath }).write();
    res.json({ success: true });
});

app.post('/api/gallery/reorder', (req, res) => { db.set('galleryImages', req.body.newOrder).write(); res.json({ success: true }); });
app.delete('/api/stories/:id', (req, res) => { db.get('stories').remove({ id: parseInt(req.params.id, 10) }).write(); res.json({ success: true }); });
app.post('/api/settings', (req, res) => { const { username, youtubeUrl } = req.body; if (username) db.set('settings.username', username).write(); if (youtubeUrl) db.set('settings.youtubeUrl', youtubeUrl).write(); res.json(db.get('settings').value()); });
app.post('/api/sync-database', (req, res) => {
    const collectionsToSync = ['galleryImages', 'gifs', 'homework'];
    let cleanedCount = 0;
    collectionsToSync.forEach(collectionName => {
        const validEntries = db.get(collectionName).value().filter(entry => {
            if (fs.existsSync(path.join(__dirname, 'public', entry.path))) return true;
            cleanedCount++;
            return false;
        });
        db.set(collectionName, validEntries).write();
    });
    res.json({ success: true, cleanedCount });
});
app.get('/api/data', (req, res) => res.json(db.getState()));
app.post('/api/stories', (req, res) => { const newStory = { id: Date.now(), ...req.body }; db.get('stories').push(newStory).write(); res.status(201).json(newStory); });

// NEW: Endpoint to scan and return the music library
app.get('/api/music', (req, res) => {
    const musicPath = path.join(__dirname, 'public/assets/music');
    fs.readdir(musicPath, (err, files) => {
        if (err) {
            console.error("Could not list the music directory.", err);
            return res.status(500).json({ error: "Could not read music directory. Make sure /public/assets/music exists." });
        }
        
        const musicLibrary = files
            .filter(file => file.endsWith('.mp3'))
            .map(file => {
                const songName = path.parse(file).name;
                const coverFile = files.find(img => img.startsWith(songName) && (img.endsWith('.jpg') || img.endsWith('.png')));
                return {
                    title: songName.replace(/_/g, ' ').replace(/-/g, ' '),
                    src: `/assets/music/${file}`,
                    cover: coverFile ? `/assets/music/${coverFile}` : 'placeholder-album-art.jpg'
                };
            });
        res.json(musicLibrary);
    });
});

io.on('connection', (socket) => {
    socket.on('chat message', (msg) => io.emit('chat message', msg));
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
server.listen(PORT, () => console.log(`Server is running at http://localhost:${PORT}`));