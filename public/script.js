document.addEventListener('DOMContentLoaded', () => {

    const urlParams = new URLSearchParams(window.location.search);
    const isAdmin = urlParams.get('admin') === 'true';

    let currentGallery = [];
    let currentIndex = 0;
    let musicLibrary = [];
    let songIndex = 0;
    let isPlaying = false;

    const elements = {
        body: document.body,
        username: document.getElementById('username-display'),
        profilePic: document.getElementById('profile-picture-display'),
        banner: document.getElementById('banner-display'),
        youtubeLink: document.getElementById('youtube-link'),
        imageGrid: document.getElementById('image-grid'),
        gifGrid: document.getElementById('gif-grid'),
        storyList: document.getElementById('story-list'),
        homeworkList: document.getElementById('homework-list'),
        lightbox: document.getElementById('lightbox'),
        lightboxImage: document.querySelector('.lightbox-content'),
        lightboxPrev: document.getElementById('lightbox-prev'),
        lightboxNext: document.getElementById('lightbox-next'),
        audioPlayer: document.getElementById('audio-source'),
        playPauseBtn: document.getElementById('play-pause-button'),
        prevBtn: document.getElementById('prev-button'),
        nextBtn: document.getElementById('next-button'),
        albumArt: document.getElementById('album-art'),
        songTitle: document.getElementById('song-title'),
        songArtist: document.getElementById('song-artist'),
        progressContainer: document.getElementById('progress-container'),
        progress: document.getElementById('progress'),
        currentTimeEl: document.getElementById('current-time'),
        durationEl: document.getElementById('duration'),
        playlistToggle: document.getElementById('playlist-toggle'),
        playlist: document.getElementById('playlist'),
        chatForm: document.getElementById('chat-form'),
        chatInput: document.getElementById('chat-input'),
        messages: document.getElementById('messages'),
        socket: io(),
        moreImagesContainer: document.getElementById('more-images-container'),
        moreImagesTrigger: document.getElementById('more-images-trigger'),
        moreImagesWidget: document.getElementById('more-images-widget'),
        moreImagesGrid: document.getElementById('more-images-grid'),
        scrollLeftButton: document.getElementById('scroll-left-button'),
        scrollRightButton: document.getElementById('scroll-right-button'),
        backgroundCategories: document.getElementById('background-categories'),
        backgroundSwitcher: document.getElementById('background-switcher'),
        musicUploadButton: document.getElementById('music-upload-button'),
        musicUploadInput: document.getElementById('music-upload-input'),
    };

    // --- HELPER FUNCTIONS ---

    const playSong = () => {
        isPlaying = true;
        elements.audioPlayer.play();
        elements.playPauseBtn.textContent = '⏸️';
    };

    const pauseSong = () => {
        isPlaying = false;
        elements.audioPlayer.pause();
        elements.playPauseBtn.textContent = '▶️';
    };

    const loadSong = (song) => {
        elements.songTitle.textContent = song.title;
        elements.songArtist.textContent = "Your Artist Name";
        elements.audioPlayer.src = song.src;
        elements.albumArt.src = song.cover;
        document.querySelectorAll('#playlist li').forEach(li => {
            li.classList.toggle('playing', li.dataset.songSrc === song.src);
        });
    };

    const prevSong = () => {
        songIndex--;
        if (songIndex < 0) { songIndex = musicLibrary.length - 1; }
        loadSong(musicLibrary[songIndex]);
        playSong();
    };

    const nextSong = () => {
        songIndex++;
        if (songIndex > musicLibrary.length - 1) { songIndex = 0; }
        loadSong(musicLibrary[songIndex]);
        playSong();
    };

    const updateProgress = (e) => {
        const { duration, currentTime } = e.srcElement;
        if (isNaN(duration)) return;
        const progressPercent = (currentTime / duration) * 100;
        elements.progress.style.width = `${progressPercent}%`;
        const formatTime = (time) => {
            if (isNaN(time)) return "0:00";
            const minutes = Math.floor(time / 60);
            let seconds = Math.floor(time % 60);
            if (seconds < 10) { seconds = `0${seconds}`; }
            return `${minutes}:${seconds}`;
        };
        elements.durationEl.textContent = formatTime(duration);
        elements.currentTimeEl.textContent = formatTime(currentTime);
    };

    const setProgress = (e) => {
        const width = e.currentTarget.clientWidth;
        const clickX = e.offsetX;
        const duration = elements.audioPlayer.duration;
        if (duration) {
            elements.audioPlayer.currentTime = (clickX / width) * duration;
        }
    };

    const openLightbox = (clickedItem, galleryType) => {
        let gallerySource;
        if (galleryType === 'galleryImages') {
            gallerySource = Array.from(document.querySelectorAll('#image-grid .grid-item, #more-images-grid .grid-item'));
        } else {
            gallerySource = Array.from(document.querySelectorAll('#gif-grid .grid-item'));
        }
        currentGallery = gallerySource.map(item => item.dataset.filePath);
        currentIndex = currentGallery.indexOf(clickedItem.path);
        showImageAtIndex(currentIndex);
        elements.lightbox.classList.remove('hidden');
    };

    const showImageAtIndex = (index) => {
        if (index < 0 || index >= currentGallery.length) return;
        elements.lightboxImage.src = currentGallery[index];
        elements.lightboxPrev.style.display = index === 0 ? 'none' : 'block';
        elements.lightboxNext.style.display = index === currentGallery.length - 1 ? 'none' : 'block';
    };

    const backgrounds = {
        sfw: [ '/assets/backgrounds/sfw/bg1.jpg', '/assets/backgrounds/sfw/bg2.jpg', '/assets/backgrounds/sfw/bg3.jpg', '/assets/backgrounds/sfw/bg4.jpg', '/assets/backgrounds/sfw/bg5.jpg' ],
        nsfw: [ '/assets/backgrounds/nsfw/bg1.jpg', '/assets/backgrounds/nsfw/bg2.jpg', '/assets/backgrounds/nsfw/bg3.jpg', '/assets/backgrounds/nsfw/bg4.jpg', '/assets/backgrounds/nsfw/bg5.jpg' ]
    };
    
    const setBackground = (bgPath) => {
        document.body.style.backgroundImage = `url(${bgPath})`;
        localStorage.setItem('selectedBackground', bgPath);
        document.querySelectorAll('.bg-thumbnail').forEach(thumb => {
            thumb.classList.toggle('active', thumb.dataset.bgPath === bgPath);
        });
    };

    const generateThumbnails = (category) => {
        elements.backgroundSwitcher.innerHTML = '';
        if (!backgrounds[category]) return;
        backgrounds[category].forEach(bgPath => {
            const thumb = document.createElement('div');
            thumb.className = 'bg-thumbnail';
            thumb.style.backgroundImage = `url(${bgPath})`;
            thumb.dataset.bgPath = bgPath;
            elements.backgroundSwitcher.appendChild(thumb);
        });
        const savedBackground = localStorage.getItem('selectedBackground');
        if (savedBackground && backgrounds[category].includes(savedBackground)) {
            setBackground(savedBackground);
        }
    };

    const addImageToGallery = (item) => {
        const gridItem = createGridItem(item, 'galleryImages');
        if (elements.imageGrid.children.length < 3) {
            elements.imageGrid.appendChild(gridItem);
        } else {
            elements.moreImagesContainer.classList.remove('hidden');
            elements.moreImagesGrid.appendChild(gridItem);
            const count = elements.moreImagesGrid.children.length;
            elements.moreImagesTrigger.querySelector('span').textContent = count;
        }
    };

    const universalUploader = async (file, type) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        try {
            const response = await fetch('/upload', { method: 'POST', body: formData });
            if (!response.ok) throw new Error(await response.text());
            return await response.json();
        } catch (error) {
            console.error(`Upload failed for ${type}:`, error);
            alert(`Upload failed: ${error.message}`);
        }
    };

    const createGridItem = (item, type) => {
        const container = document.createElement('div');
        container.className = 'grid-item';
        container.dataset.filePath = item.path;
        container.dataset.originalName = item.originalName;
        const img = document.createElement('img');
        img.src = item.path;
        img.onclick = () => openLightbox(item, type);
        container.appendChild(img);
        if (isAdmin) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-button';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.onclick = async () => {
                if (!confirm('Are you sure?')) return;
                await fetch('/api/media', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filePath: item.path, type }) });
                initializePage();
            };
            container.appendChild(deleteBtn);
            if (type === 'galleryImages') {
                const dragHandle = document.createElement('span');
                dragHandle.className = 'drag-handle';
                dragHandle.textContent = '☰';
                container.appendChild(dragHandle);
            }
        }
        return container;
    };
    
    const addStoryToList = (story) => {
        const storyDiv = document.createElement('div');
        storyDiv.className = 'story-item';
        storyDiv.innerHTML = `<div><h4>${story.title}</h4><p>${story.content.substring(0, 50)}...</p></div>`;
        storyDiv.querySelector('div').onclick = () => alert(`Title: ${story.title}\n\n${story.content}`);
        if (isAdmin) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-button';
            deleteBtn.onclick = async (e) => {
                e.stopPropagation();
                if (!confirm('Delete this story?')) return;
                await fetch(`/api/stories/${story.id}`, { method: 'DELETE' });
                storyDiv.remove();
            };
            storyDiv.appendChild(deleteBtn);
        }
        elements.storyList.prepend(storyDiv);
    };

    const addHomeworkToList = (file) => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="${file.path}" download="${file.originalName}">${file.originalName}</a>`;
        if (isAdmin) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-button';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.onclick = async () => {
                if (!confirm('Delete this file?')) return;
                await fetch('/api/media', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filePath: file.path, type: 'homework' }) });
                li.remove();
            };
            li.appendChild(deleteBtn);
        }
        elements.homeworkList.appendChild(li);
    };

    async function loadMusicLibrary() {
        try {
            const res = await fetch('/api/music');
            musicLibrary = await res.json();
            elements.playlist.innerHTML = '';
            if (musicLibrary.length > 0) {
                loadSong(musicLibrary[songIndex]);
                musicLibrary.forEach((song, index) => {
                    const li = document.createElement('li');
                    li.dataset.songSrc = song.src;
                    li.innerHTML = `<img src="${song.cover}" alt="cover"> <span>${song.title}</span>`;
                    li.addEventListener('click', () => {
                        songIndex = index;
                        loadSong(musicLibrary[songIndex]);
                        playSong();
                    });
                    elements.playlist.appendChild(li);
                });
            }
        } catch (error) {
            console.error("Could not load music library", error);
        }
    }

    async function initializePage() {
        if (isAdmin) document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
        try {
            const response = await fetch('/api/data');
            const data = await response.json();
            elements.username.childNodes[0].nodeValue = data.settings.username + ' ';
            elements.profilePic.src = data.settings.profilePicture;
            if(data.settings.banner) elements.banner.style.backgroundImage = `url(${data.settings.banner})`;
            elements.youtubeLink.href = data.settings.youtubeUrl;
            elements.imageGrid.innerHTML = '';
            elements.moreImagesGrid.innerHTML = '';
            elements.moreImagesContainer.classList.add('hidden');
            data.galleryImages.forEach(addImageToGallery);
            elements.gifGrid.innerHTML = '';
            data.gifs.forEach(item => elements.gifGrid.appendChild(createGridItem(item, 'gifs')));
            elements.storyList.innerHTML = '';
            data.stories.forEach(addStoryToList);
            elements.homeworkList.innerHTML = '';
            data.homework.forEach(addHomeworkToList);
            if (isAdmin) {
                new Sortable(elements.imageGrid, {
                    handle: '.drag-handle', animation: 150,
                    onEnd: async (evt) => {
                        const newOrder = Array.from(evt.target.children).map(item => ({ path: item.dataset.filePath, originalName: item.dataset.originalName }));
                        await fetch('/api/gallery/reorder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newOrder }) });
                    }
                });
            }
        } catch (error) {
            console.error("Failed to initialize page data:", error);
        }
        await loadMusicLibrary();
    }
    
    const savedBackground = localStorage.getItem('selectedBackground');
    let startingCategory = 'sfw';
    if (savedBackground && backgrounds.nsfw.includes(savedBackground)) {
        startingCategory = 'nsfw';
        document.querySelector('#background-categories button[data-category="nsfw"]').classList.add('active');
        document.querySelector('#background-categories button[data-category="sfw"]').classList.remove('active');
    }
    generateThumbnails(startingCategory);
    setBackground(savedBackground || backgrounds.sfw[0]);
    
    initializePage();

    const themeToggleButton = document.getElementById('theme-toggle');
    function setTheme(theme) { document.body.className = ''; if (theme === 'dark') document.body.classList.add('dark-theme'); localStorage.setItem('theme', theme); }
    setTheme(localStorage.getItem('theme') || 'system');
    
    // --- EVENT LISTENERS ---
    
    elements.playPauseBtn.addEventListener('click', () => (isPlaying ? pauseSong() : playSong()));
    elements.prevBtn.addEventListener('click', prevSong);
    elements.nextBtn.addEventListener('click', nextSong);
    elements.audioPlayer.addEventListener('timeupdate', updateProgress);
    elements.progressContainer.addEventListener('click', setProgress);
    elements.audioPlayer.addEventListener('ended', nextSong);
    elements.playlistToggle.addEventListener('click', () => { elements.playlist.classList.toggle('hidden'); });

    elements.lightboxPrev.addEventListener('click', () => { if (currentIndex > 0) { currentIndex--; showImageAtIndex(currentIndex); } });
    elements.lightboxNext.addEventListener('click', () => { if (currentIndex < currentGallery.length - 1) { currentIndex++; showImageAtIndex(currentIndex); } });
    
    elements.backgroundCategories.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const category = e.target.dataset.category;
            document.querySelectorAll('#background-categories button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            generateThumbnails(category);
        }
    });
    
    elements.backgroundSwitcher.addEventListener('click', (e) => {
        if (e.target.classList.contains('bg-thumbnail')) {
            setBackground(e.target.dataset.bgPath);
        }
    });

    elements.moreImagesTrigger.addEventListener('mouseenter', () => elements.moreImagesWidget.classList.remove('hidden'));
    elements.moreImagesContainer.addEventListener('mouseleave', () => elements.moreImagesWidget.classList.add('hidden'));
    elements.scrollLeftButton.addEventListener('click', () => { elements.moreImagesGrid.scrollLeft -= 110; });
    elements.scrollRightButton.addEventListener('click', () => { elements.moreImagesGrid.scrollLeft += 110; });
    
    if (isAdmin) {
        document.getElementById('exit-admin-button').onclick = () => { window.location.search = ''; };
        document.getElementById('clean-db-button').onclick = async () => { if (!confirm('This will remove all database entries for files that are missing. Are you sure?')) return; const response = await fetch('/api/sync-database', { method: 'POST' }); const result = await response.json(); if (result.success) { alert(`Sync complete! ${result.cleanedCount} orphaned entries removed. The page will now reload.`); window.location.reload(); } else { alert('Sync failed.'); } };
        document.getElementById('admin-fab').onclick = () => document.getElementById('admin-menu').classList.toggle('hidden');
        elements.musicUploadButton.addEventListener('click', async () => {
            const input = elements.musicUploadInput;
            if (!input.files[0]) return alert('Please select a music or cover file.');
            const data = await universalUploader(input.files[0], 'music');
            if (data) { alert(`Successfully uploaded ${data.originalName}`); await loadMusicLibrary(); }
            input.value = '';
        });
    }

    themeToggleButton.addEventListener('click', () => setTheme(document.body.classList.contains('dark-theme') ? 'light' : 'dark'));
    
    elements.lightbox.querySelector('.close-button').onclick = () => elements.lightbox.classList.add('hidden');
    
    document.getElementById('change-name-button').onclick = async () => { const newName = prompt('Enter new name:', elements.username.childNodes[0].nodeValue.trim()); if (!newName) return; await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: newName }) }); elements.username.childNodes[0].nodeValue = newName + ' '; };
    document.getElementById('change-url-button').onclick = async () => { const newUrl = prompt('Enter new YouTube URL:', elements.youtubeLink.href); if (!newUrl) return; await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ youtubeUrl: newUrl }) }); elements.youtubeLink.href = newUrl; };
    
    const setupUpload = (btnId, inputId, type, addToListFunc) => { const input = document.getElementById(inputId); document.getElementById(btnId).onclick = async () => { if (!input.files[0]) return alert('Please select a file.'); const data = await universalUploader(input.files[0], type); if (data) addToListFunc(data); input.value = ''; }; };
    setupUpload('gallery-upload-button', 'gallery-upload-input', 'gallery', addImageToGallery);
    setupUpload('gif-upload-button', 'gif-upload-input', 'gif', (data) => elements.gifGrid.appendChild(createGridItem(data, 'gifs')));
    setupUpload('homework-upload-button', 'homework-upload-input', 'homework', addHomeworkToList);
    
    elements.profilePic.onclick = () => document.getElementById('profile-picture-upload').click();
    
    document.getElementById('profile-picture-upload').onchange = async (e) => { if (!e.target.files[0]) return; const { path } = await universalUploader(e.target.files[0], 'profile'); if (path) elements.profilePic.src = path; };
    
    document.getElementById('change-banner-button').onclick = () => document.getElementById('banner-upload').click();
    
    document.getElementById('banner-upload').onchange = async (e) => { if (!e.target.files[0]) return; const { path } = await universalUploader(e.target.files[0], 'banner'); if (path) elements.banner.style.backgroundImage = `url(${path})`; };
    
    document.getElementById('story-form').addEventListener('submit', async (e) => { e.preventDefault(); const title = document.getElementById('story-title').value; const content = document.getElementById('story-content').value; const response = await fetch('/api/stories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content }) }); addStoryToList(await response.json()); e.target.reset(); });
    
    elements.chatForm.addEventListener('submit', (e) => { e.preventDefault(); if (elements.chatInput.value) { elements.socket.emit('chat message', elements.chatInput.value); elements.chatInput.value = ''; } });
    
    elements.socket.on('chat message', (msg) => { const item = document.createElement('li'); item.textContent = msg; elements.messages.appendChild(item); elements.messages.scrollTop = elements.messages.scrollHeight; });
});
// Lenis smooth scrolling setup
const lenis = new Lenis({
  duration: 1.2,    // adjust smoothness speed
  easing: (t) => t, // linear easing, replace if you want custom easing
  smooth: true,
})

function raf(time) {
  lenis.raf(time)
  requestAnimationFrame(raf)
}

requestAnimationFrame(raf)