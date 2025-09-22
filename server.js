// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

// Increase timeout for uploads
server.timeout = 300000; // 5 minutes

// --- Database Connection ---
mongoose.connect(process.env.DATABASE_URL, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
    .then(() => console.log('Connected to MongoDB Atlas!'))
    .catch(err => console.error('Could not connect to MongoDB Atlas...', err));

// --- Mongoose Schemas ---
const MediaSchema = new mongoose.Schema({ 
    path: String, 
    originalName: String,
    category: { type: String, enum: ['sfw', 'nsfw', 'word', 'pdf', 'autocad', 'solidworks', 'powerpoint'], default: 'sfw' },
    type: { type: String, enum: ['image', 'gif', 'document'], default: 'image' }
});

const StorySchema = new mongoose.Schema({ 
    title: String, 
    content: String, 
    id: Number,
    filePath: String,
    fileType: String,
    pages: [String] // For multi-page documents
});

const CommentSchema = new mongoose.Schema({
    storyId: Number,
    author: String,
    content: String,
    timestamp: { type: Date, default: Date.now }
});

const SettingsSchema = new mongoose.Schema({
    username: { type: String, default: 'Your Name' },
    profilePicture: { type: String, default: 'placeholder-profile.jpg' },
    banner: { type: String, default: '' },
    bannerPosition: { type: String, default: 'center center' },
    youtubeUrl: { type: String, default: 'https://www.youtube.com' },
    steamProfile: { type: String, default: '' },
    redditProfile: { type: String, default: '' },
    discordProfile: { type: String, default: '' }
});

// --- Mongoose Models ---
const GalleryImage = mongoose.model('GalleryImage', MediaSchema);
const Gif = mongoose.model('Gif', MediaSchema);
const Homework = mongoose.model('Homework', MediaSchema);
const Story = mongoose.model('Story', StorySchema);
const Comment = mongoose.model('Comment', CommentSchema);
const Settings = mongoose.model('Settings', SettingsSchema);

// --- Middleware ---
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// --- File Upload Logic ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow images, gifs, documents
        const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|docx|doc|dwg|ppt|pptx|sldprt|sldasm/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype) || 
                        file.mimetype.includes('application/') || 
                        file.mimetype.includes('document');
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// --- API Endpoints ---

// Multiple file upload endpoint
app.post('/upload-multiple', (req, res) => {
    req.setTimeout(300000);
    res.setTimeout(300000);
    
    const uploadMultiple = upload.array('files', 20); // Allow up to 20 files
    
    uploadMultiple(req, res, async (err) => {
        if (err) {
            console.error('Multiple upload error:', err);
            return res.status(400).json({ error: err.message });
        }
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
        
        const { type, category } = req.body;
        const results = [];
        
        try {
            for (const file of req.files) {
                const filePath = `/uploads/${file.filename}`;
                const fileData = { 
                    path: filePath, 
                    originalName: file.originalname,
                    ...(category && { category }),
                    type: type === 'gif' ? 'gif' : type === 'homework' ? 'document' : 'image'
                };
                
                if (type === 'gallery') {
                    await GalleryImage.create(fileData);
                } else if (type === 'gif') {
                    await Gif.create(fileData);
                } else if (type === 'homework') {
                    await Homework.create(fileData);
                } else if (type === 'story') {
                    const storyData = {
                        title: file.originalname,
                        filePath: filePath,
                        fileType: path.extname(file.originalname).toLowerCase(),
                        id: Date.now() + Math.random()
                    };
                    await Story.create(storyData);
                }
                
                results.push({
                    path: filePath,
                    originalName: file.originalname,
                    ...(category && { category })
                });
            }
            
            res.json({ 
                success: true,
                files: results,
                count: results.length
            });
        } catch (error) {
            console.error('Database save error:', error);
            res.status(500).json({ error: 'Error saving to database' });
        }
    });
});

// Single file upload endpoint with timeout handling
app.post('/upload', (req, res) => {
    // Set longer timeout for this route
    req.setTimeout(300000); // 5 minutes
    res.setTimeout(300000);
    
    upload.single('file')(req, res, async (err) => {
        if (err) {
            console.error('Upload error:', err);
            return res.status(400).json({ error: err.message });
        }
        
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        
        const filePath = `/uploads/${req.file.filename}`;
        const { type, category } = req.body;
        
        try {
            const fileData = { 
                path: filePath, 
                originalName: req.file.originalname,
                ...(category && { category }),
                type: type === 'gif' ? 'gif' : type === 'homework' ? 'document' : 'image'
            };
            
            if (type === 'gallery') {
                await GalleryImage.create(fileData);
            } else if (type === 'gif') {
                await Gif.create(fileData);
            } else if (type === 'homework') {
                await Homework.create(fileData);
            } else if (type === 'story') {
                // Handle document upload for stories
                const storyData = {
                    title: req.file.originalname,
                    filePath: filePath,
                    fileType: path.extname(req.file.originalname).toLowerCase(),
                    id: Date.now()
                };
                await Story.create(storyData);
            } else if (type === 'profile') {
                await Settings.updateOne({}, { profilePicture: filePath }, { upsert: true });
            } else if (type === 'banner') {
                await Settings.updateOne({}, { banner: filePath }, { upsert: true });
            }
            
            res.json({ 
                success: true,
                path: filePath, 
                originalName: req.file.originalname,
                ...(category && { category })
            });
        } catch (error) {
            console.error('Database save error:', error);
            res.status(500).json({ error: 'Error saving to database' });
        }
    });
});

// Banner position update
app.post('/api/banner-position', async (req, res) => {
    try {
        const { position } = req.body;
        await Settings.updateOne({}, { bannerPosition: position }, { upsert: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error updating banner position' });
    }
});

// Remove banner
app.post('/api/remove-banner', async (req, res) => {
    try {
        await Settings.updateOne({}, { banner: '', bannerPosition: 'center center' }, { upsert: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error removing banner' });
    }
});

// Universal media deletion
app.delete('/api/media', async (req, res) => {
    const { filePath, type, category } = req.body;
    if (!filePath || typeof filePath !== 'string') return res.status(400).json({ error: 'Invalid file path' });
    
    // Delete physical file
    const physicalPath = path.join(__dirname, 'public', filePath);
    if (fs.existsSync(physicalPath)) {
        try {
            fs.unlinkSync(physicalPath);
        } catch (err) {
            console.error('Error deleting file:', err);
        }
    }
    
    // Delete from database
    try {
        const models = { 
            galleryImages: GalleryImage, 
            gifs: Gif, 
            homework: Homework,
            stories: Story 
        };
        if (models[type]) {
            const query = { path: filePath };
            if (category && (type === 'galleryImages' || type === 'gifs')) {
                query.category = category;
            }
            await models[type].deleteOne(query);
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Database deletion error:', error);
        res.status(500).json({ error: 'Error deleting from database' });
    }
});

// Get all data
app.get('/api/data', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) settings = await Settings.create({});
        
        const galleryImages = await GalleryImage.find();
        const gifs = await Gif.find();
        
        res.json({
            galleryImages: galleryImages.map(img => ({
                path: img.path,
                originalName: img.originalName,
                category: img.category || 'sfw'
            })),
            gifs: gifs.map(gif => ({
                path: gif.path,
                originalName: gif.originalName,
                category: gif.category || 'sfw'
            })),
            stories: await Story.find().sort({id: -1}).limit(5),
            homework: await Homework.find(),
            settings: settings
        });
    } catch (error) {
        console.error('Data fetch error:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});

// Get gallery by category
app.get('/api/gallery/:category', async (req, res) => {
    try {
        const category = req.params.category;
        const images = await GalleryImage.find({ category });
        res.json(images);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching gallery images' });
    }
});

// Get GIF gallery by category
app.get('/api/gifs/:category', async (req, res) => {
    try {
        const category = req.params.category;
        const gifs = await Gif.find({ category });
        res.json(gifs);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching GIFs' });
    }
});

// Get homework by category
app.get('/api/homework/:category', async (req, res) => {
    try {
        const category = req.params.category;
        const files = await Homework.find({ category });
        res.json(files);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching homework files' });
    }
});

// Get all stories (paginated)
app.get('/api/stories/all', async (req, res) => {
    try {
        const stories = await Story.find().sort({id: -1});
        res.json(stories);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching stories' });
    }
});

// Get story content
app.get('/api/story/:id', async (req, res) => {
    try {
        const story = await Story.findOne({ id: req.params.id });
        if (!story) return res.status(404).json({ error: 'Story not found' });
        res.json(story);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching story' });
    }
});

// Comments endpoints
app.get('/api/comments/:storyId', async (req, res) => {
    try {
        const comments = await Comment.find({ storyId: req.params.storyId }).sort({ timestamp: -1 });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching comments' });
    }
});

app.post('/api/comments', async (req, res) => {
    try {
        const comment = await Comment.create(req.body);
        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ error: 'Error creating comment' });
    }
});

// Music endpoint
app.get('/api/music', (req, res) => {
    const musicPath = path.join(__dirname, 'public/assets/music');
    
    if (!fs.existsSync(musicPath)) {
        return res.json([]);
    }
    
    fs.readdir(musicPath, (err, files) => {
        if (err) {
            console.error("Could not list the music directory.", err);
            return res.status(500).json({ error: "Could not read music directory" });
        }
        
        const musicLibrary = files
            .filter(file => file.endsWith('.mp3'))
            .map(file => {
                const songName = path.parse(file).name;
                const coverFile = files.find(img => 
                    img.startsWith(songName) && (img.endsWith('.jpg') || img.endsWith('.png'))
                );
                return {
                    title: songName.replace(/[_-]/g, ' '),
                    src: `/assets/music/${file}`,
                    cover: coverFile ? `/assets/music/${coverFile}` : '/assets/placeholder-album-art.jpg'
                };
            });
        res.json(musicLibrary);
    });
});

// Settings endpoints
app.post('/api/stories', async (req, res) => { 
    try {
        const newStory = await Story.create({ id: Date.now(), ...req.body }); 
        res.status(201).json(newStory); 
    } catch (error) {
        res.status(500).json({ error: 'Error creating story' });
    }
});

app.delete('/api/stories/:id', async (req, res) => { 
    try {
        await Story.deleteOne({ id: req.params.id }); 
        res.json({ success: true }); 
    } catch (error) {
        res.status(500).json({ error: 'Error deleting story' });
    }
});

app.post('/api/settings', async (req, res) => { 
    try {
        const updateData = {};
        const allowedFields = ['username', 'youtubeUrl', 'steamProfile', 'redditProfile', 'discordProfile'];
        
        Object.keys(req.body).forEach(key => {
            if (allowedFields.includes(key)) {
                updateData[key] = req.body[key];
            }
        });
        
        const updatedSettings = await Settings.findOneAndUpdate({}, updateData, { 
            new: true, 
            upsert: true 
        }); 
        res.json(updatedSettings); 
    } catch (error) {
        res.status(500).json({ error: 'Error updating settings' });
    }
});

// Database cleanup
app.post('/api/sync-database', async (req, res) => { 
    try {
        let cleanedCount = 0;
        
        // Check all models for orphaned files
        const models = [GalleryImage, Gif, Homework, Story];
        
        for (const Model of models) {
            const docs = await Model.find();
            for (const doc of docs) {
                if (doc.path) {
                    const filePath = path.join(__dirname, 'public', doc.path);
                    if (!fs.existsSync(filePath)) {
                        await Model.deleteOne({ _id: doc._id });
                        cleanedCount++;
                    }
                }
            }
        }
        
        res.json({ success: true, cleanedCount }); 
    } catch (error) {
        res.status(500).json({ error: 'Error cleaning database' });
    }
});

// --- Socket.IO for Live Chat ---
io.on('connection', (socket) => {
    console.log('User connected to chat');
    socket.on('chat message', (msg) => io.emit('chat message', msg));
    socket.on('disconnect', () => {
        console.log('User disconnected from chat');
    });
});

// --- Final Setup ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    ensureDirectoriesExist();
});

// Social media profile fetching endpoints
app.post('/api/fetch-social-profile', async (req, res) => {
    const { platform, url } = req.body;
    
    try {
        let profileData = { name: '', avatar: '', url: url };
        
        // Basic URL validation and profile extraction
        switch (platform) {
            case 'youtube':
                if (url.includes('youtube.com') || url.includes('youtu.be')) {
                    // Extract channel name from URL or use a default
                    const channelMatch = url.match(/(?:channel\/|c\/|user\/)([^\/\?]+)/);
                    profileData.name = channelMatch ? channelMatch[1] : 'YouTube Channel';
                    profileData.avatar = '/assets/icons/youtube-icon.png';
                }
                break;
            case 'steam':
                if (url.includes('steamcommunity.com')) {
                    const profileMatch = url.match(/(?:profiles\/|id\/)([^\/\?]+)/);
                    profileData.name = profileMatch ? profileMatch[1] : 'Steam Profile';
                    profileData.avatar = '/assets/icons/steam-icon.png';
                }
                break;
            case 'reddit':
                if (url.includes('reddit.com')) {
                    const userMatch = url.match(/\/u(?:ser)?\/([^\/\?]+)/);
                    profileData.name = userMatch ? `u/${userMatch[1]}` : 'Reddit User';
                    profileData.avatar = '/assets/icons/reddit-icon.png';
                }
                break;
            case 'discord':
                // Discord doesn't have public profile URLs, so we'll use the provided name
                profileData.name = url || 'Discord User';
                profileData.avatar = '/assets/icons/discord-icon.png';
                profileData.url = '#'; // Discord doesn't have clickable profile links
                break;
        }
        
        // Update settings with the profile data
        const updateData = {};
        updateData[`${platform}Profile`] = profileData.name;
        updateData[`${platform}Url`] = profileData.url;
        updateData[`${platform}Avatar`] = profileData.avatar;
        
        await Settings.updateOne({}, updateData, { upsert: true });
        
        res.json({ success: true, profile: profileData });
    } catch (error) {
        console.error('Social profile fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Create placeholder icons directory
const createIconsDirectory = () => {
    const iconsPath = path.join(__dirname, 'public/assets/icons');
    if (!fs.existsSync(iconsPath)) {
        fs.mkdirSync(iconsPath, { recursive: true });
        console.log('Created icons directory at /public/assets/icons');
        
        // Create placeholder icon files (you can replace these with actual icons)
        const placeholderIcons = [
            'youtube-icon.png',
            'steam-icon.png', 
            'reddit-icon.png',
            'discord-icon.png',
            'word-icon.png',
            'pdf-icon.png',
            'autocad-icon.png',
            'solidworks-icon.png',
            'powerpoint-icon.png'
        ];
        
        // Create simple colored rectangles as placeholders
        placeholderIcons.forEach(iconName => {
            const iconPath = path.join(iconsPath, iconName);
            if (!fs.existsSync(iconPath)) {
                // Create a simple text file as placeholder
                fs.writeFileSync(iconPath, `Placeholder for ${iconName} - Replace with actual icon`);
                console.log(`Created placeholder: ${iconName}`);
            }
        });
    }
};

// Update the ensureDirectoriesExist function
const ensureDirectoriesExist = () => {
    const directories = [
        'public/uploads',
        'public/assets/music',
        'public/assets/gallery-covers',
        'public/assets/gif-covers',
        'public/assets/icons'
    ];
    
    directories.forEach(dir => {
        const fullPath = path.join(__dirname, dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            console.log(`Created directory: ${dir}`);
        }
    });
    
    // Create placeholder cover images
    const placeholderCovers = [
        'public/assets/gallery-covers/sfw-cover.jpg',
        'public/assets/gallery-covers/nsfw-cover.jpg',
        'public/assets/gif-covers/sfw-gif-cover.gif',
        'public/assets/gif-covers/nsfw-gif-cover.gif'
    ];
    
    placeholderCovers.forEach(coverPath => {
        const fullPath = path.join(__dirname, coverPath);
        if (!fs.existsSync(fullPath)) {
            console.log(`Note: ${coverPath} not found. Add cover images for your widgets.`);
        }
    });
    
    // Create icons
    createIconsDirectory();
};