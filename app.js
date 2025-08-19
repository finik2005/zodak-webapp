// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

// Состояние приложения
let currentState = {
    screen: 'upload',
    selectedFile: null,
    currentRating: 0,
    currentPhoto: null,
    uploadedPhotos: []
};

let ratedPhotos = [];
let userStats = {
    photos_uploaded: 0,
    ratings_given: 0,
    photos_remaining: 0
};

// Элементы DOM
const elements = {
    uploadScreen: document.getElementById('upload-screen'),
    rateScreen: document.getElementById('rate-screen'),
    thanksScreen: document.getElementById('thanks-screen'),
    uploadArea: document.getElementById('upload-area'),
    photoInput: document.getElementById('photo-input'),
    uploadBtn: document.getElementById('upload-btn'),
    currentPhoto: document.getElementById('current-photo'),
    stars: document.getElementById('stars'),
    ratingValue: document.getElementById('rating-value'),
    submitRating: document.getElementById('submit-rating'),
    rateAnother: document.getElementById('rate-another'),
    statusBar: document.getElementById('status-bar')
};

// Инициализация приложения
function initApp() {
    console.log("🚀 Инициализация приложения");
    setupEventListeners();
    showScreen('upload');
    updateStatusBar('Готов к работе');
    loadUserStats();
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Загрузка фото
    elements.uploadArea.addEventListener('click', () => elements.photoInput.click());
    elements.uploadArea.addEventListener('dragover', handleDragOver);
    elements.uploadArea.addEventListener('drop', handleDrop);
    elements.photoInput.addEventListener('change', handleFileSelect);
    elements.uploadBtn.addEventListener('click', handleUpload);

    // Оценка фото
    elements.stars.addEventListener('click', handleStarClick);
    elements.submitRating.addEventListener('click', handleRatingSubmit);
    elements.rateAnother.addEventListener('click', () => {
        showScreen('upload');
        updateStatusBar('Готов к работе');
    });
}

// Показ экрана
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    switch(screenName) {
        case 'upload':
            elements.uploadScreen.classList.add('active');
            break;
        case 'rate':
            elements.rateScreen.classList.add('active');
            loadRandomPhoto();
            break;
        case 'thanks':
            elements.thanksScreen.classList.add('active');
            break;
    }

    currentState.screen = screenName;
}

// Обновление статус бара
function updateStatusBar(message, isError = false) {
    elements.statusBar.textContent = message;
    elements.statusBar.style.color = isError ? '#e74c3c' : '#666';
}

// Загрузка статистики пользователя
async function loadUserStats() {
    try {
        const userId = tg.initDataUnsafe?.user?.id?.toString();
        if (userId) {
            const response = await fetch(`http://localhost:5000/stats/${userId}`);
            const data = await response.json();
            if (data.success) {
                userStats = data.stats;
                console.log("📊 Статистика пользователя:", userStats);
            }
        }
    } catch (error) {
        console.log('Не удалось загрузить статистику');
    }
}

// Загрузка случайного фото
async function loadRandomPhoto() {
    try {
        updateStatusBar('🔄 Ищем фото для оценки...');
        
        const userId = tg.initDataUnsafe?.user?.id?.toString() || 'unknown';
        
        // Пробуем получить неоцененное фото с сервера
        try {
            const response = await fetch(`http://localhost:5000/get_unrated_photo/${userId}`);
            const data = await response.json();
            
            if (data.success && data.photo) {
                currentState.currentPhoto = data.photo;
                elements.currentPhoto.src = data.photo.photo_url;
                updateStatusBar('✅ Новое фото для оценки!');
                return;
            }
            
            if (data.error === 'no_more_photos') {
                showNoMorePhotosScreen();
                return;
            }
        } catch (error) {
            console.log('Сервер недоступен, пробуем локально');
        }
        
        // Локальная логика для fallback
        const unratedPhotos = currentState.uploadedPhotos.filter(photo => 
            !ratedPhotos.includes(photo.id)
        );
        
        if (unratedPhotos.length > 0) {
            const randomPhoto = unratedPhotos[Math.floor(Math.random() * unratedPhotos.length)];
            currentState.currentPhoto = randomPhoto;
            elements.currentPhoto.src = randomPhoto.photo_url;
            updateStatusBar('✅ Локальное фото для оценки!');
        } else {
            showNoMorePhotosScreen();
        }
        
    } catch (error) {
        console.error('Ошибка загрузки фото:', error);
        showNoMorePhotosScreen();
    }
}

// Экран "нет больше фото"
function showNoMorePhotosScreen() {
    // Скрываем все стандартные экраны
    elements.uploadScreen.style.display = 'none';
    elements.rateScreen.style.display = 'none';
    elements.thanksScreen.style.display = 'none';
    
    // Создаем экран "нет фото"
    const noPhotosScreen = document.createElement('div');
    noPhotosScreen.className = 'screen active';
    noPhotosScreen.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
            <h2>Вы оценили все фото!</h2>
            <p>Спасибо за ваши оценки!</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <p style="margin: 5px 0;">📊 <strong>Ваша статистика:</strong></p>
                <p style="margin: 5px 0;">✅ Оценено фото: ${userStats.ratings_given || ratedPhotos.length}</p>
                <p style="margin: 5px 0;">📸 Ваших фото: ${userStats.photos_uploaded || currentState.uploadedPhotos.length}</p>
            </div>
            <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 20px;">
                🔄 Обновить ленту
            </button>
        </div>
    `;
    
    document.querySelector('.main-content').appendChild(noPhotosScreen);
    updateStatusBar('✅ Вы оценили все доступные фото!');
}

// Обработка drag and drop
function handleDragOver(e) {
    e.preventDefault();
    elements.uploadArea.classList.add('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    elements.uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        processFile(e.target.files[0]);
    }
}

// Обработка выбора файла
function processFile(file) {
    if (!file.type.startsWith('image/')) {
        updateStatusBar('❌ Выберите изображение!', true);
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        updateStatusBar('❌ Файл слишком большой! Макс. 10MB', true);
        return;
    }

    currentState.selectedFile = file;
    elements.uploadBtn.disabled = false;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        elements.uploadArea.innerHTML = `
            <div style="text-align: center;">
                <img src="${e.target.result}" style="max-width: 100%; max-height: 200px; border-radius: 10px;">
                <p style="margin-top: 10px; color: #666;">${file.name}</p>
                <small>${(file.size / 1024 / 1024).toFixed(2)} MB</small>
            </div>
        `;
    };
    reader.readAsDataURL(file);

    updateStatusBar('✅ Фото готово к загрузке');
}

// Загрузка фото
async function handleUpload() {
    if (!currentState.selectedFile) return;

    elements.uploadBtn.disabled = true;
    updateStatusBar('📤 Загружаем фото...');

    const reader = new FileReader();
    reader.onload = async function(e) {
        const userId = tg.initDataUnsafe?.user?.id?.toString() || 'user_' + Date.now();
        const photoDataUrl = e.target.result;
        
        try {
            // Пробуем отправить на сервер
            const formData = new FormData();
            formData.append('photo', currentState.selectedFile);
            formData.append('userId', userId);
            
            const response = await fetch('http://localhost:5000/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                updateStatusBar('✅ Фото загружено! Теперь можете оценивать другие фото');
                // Обновляем статистику
                userStats.photos_uploaded = (userStats.photos_uploaded || 0) + 1;
            } else {
                updateStatusBar(data.error || 'Ошибка загрузки', true);
                elements.uploadBtn.disabled = false;
                return;
            }
            
        } catch (error) {
            console.log('Сервер недоступен, сохраняем локально');
            const localPhoto = {
                id: 'local_' + Date.now(),
                user_id: userId,
                photo_url: photoDataUrl,
                filename: currentState.selectedFile.name,
                timestamp: new Date().toISOString(),
                total_ratings: 0,
                average_rating: 0
            };
            
            currentState.uploadedPhotos.push(localPhoto);
            updateStatusBar('✅ Фото сохранено! Теперь можете оценивать другие фото');
            userStats.photos_uploaded = (userStats.photos_uploaded || 0) + 1;
        }
        
        // Сбрасываем форму
        currentState.selectedFile = null;
        elements.uploadArea.innerHTML = `
            <div class="upload-placeholder">
                <span class="upload-icon">📁</span>
                <p>Перетащите сюда фото или нажмите для загрузки</p>
                <small>Макс. размер: 10MB</small>
            </div>
        `;
    };
    
    reader.readAsDataURL(currentState.selectedFile);
}

// Оценка фото
function handleStarClick(e) {
    if (e.target.classList.contains('star')) {
        const rating = parseInt(e.target.dataset.value);
        currentState.currentRating = rating;

        document.querySelectorAll('.star').forEach((star, index) => {
            star.classList.toggle('active', index < rating);
        });

        elements.ratingValue.textContent = `${rating}/10`;
        elements.submitRating.disabled = false;
    }
}

// Отправка оценки
async function handleRatingSubmit() {
    if (!currentState.currentRating || !currentState.currentPhoto) return;

    elements.submitRating.disabled = true;
    updateStatusBar('📨 Отправляем оценку...');

    try {
        const userId = tg.initDataUnsafe?.user?.id?.toString() || 'unknown';
        const photoId = currentState.currentPhoto.id;
        
        // Пробуем отправить на сервер
        const response = await fetch('http://localhost:5000/rate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                photoId: photoId,
                rating: currentState.currentRating,
                userId: userId
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            console.log('Ошибка отправки оценки:', data.error);
        }
        
    } catch (error) {
        console.log('Сервер недоступен, сохраняем локально');
    }
    
    // Добавляем фото в список оцененных
    ratedPhotos.push(currentState.currentPhoto.id);
    userStats.ratings_given = (userStats.ratings_given || 0) + 1;
    
    // Сбрасываем оценку
    currentState.currentRating = 0;
    document.querySelectorAll('.star').forEach(star => {
        star.classList.remove('active');
    });
    elements.ratingValue.textContent = '0/10';
    
    // Сразу загружаем следующее фото
    loadRandomPhoto();
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', initApp);

// Глобальные функции для дебага
window.debugApp = {
    forceRateScreen: function() {
        showScreen('rate');
    },
    testUpload: function() {
        currentState.selectedFile = { name: 'test.jpg', size: 1024000 };
        elements.uploadBtn.disabled = false;
        elements.uploadArea.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 48px;">📸</div>
                <p>Тестовое фото</p>
            </div>
        `;
        updateStatusBar('✅ Тестовое фото готово');
    },
    resetRatings: function() {
        ratedPhotos = [];
        userStats.ratings_given = 0;
        updateStatusBar('✅ Оценки сброшены');
        loadRandomPhoto();
    },
    getStats: function() {
        return {
            ratedPhotos: ratedPhotos,
            userStats: userStats,
            uploadedPhotos: currentState.uploadedPhotos
        };
    }
};

console.log("🔧 Debug mode: window.debugApp доступен");
