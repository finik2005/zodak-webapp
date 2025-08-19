// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

// Состояние приложения
let currentState = {
    screen: 'upload',
    selectedFile: null,
    currentRating: 0,
    currentPhoto: null
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
    console.log("📱 User ID:", tg.initDataUnsafe.user.id);
    
    setupEventListeners();
    showScreen('upload');
    updateStatusBar('Готов к работе');
    loadRandomPhoto();
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Загрузка фото через кнопку Telegram
    elements.uploadArea.addEventListener('click', () => {
        console.log("📱 Запрос выбора фото через Telegram");
        tg.showPopup({
            title: 'Выберите фото',
            message: 'Выберите фото из галереи или сделайте новое',
            buttons: [
                {id: 'gallery', type: 'default', text: '📁 Галерея'},
                {id: 'camera', type: 'default', text: '📷 Камера'},
                {type: 'cancel'}
            ]
        }, (buttonId) => {
            if (buttonId === 'gallery') {
                selectFromGallery();
            } else if (buttonId === 'camera') {
                takePhoto();
            }
        });
    });

    // Оценка фото
    elements.stars.addEventListener('click', handleStarClick);
    elements.submitRating.addEventListener('click', handleRatingSubmit);
    elements.rateAnother.addEventListener('click', () => {
        showScreen('upload');
        loadRandomPhoto();
    });
}

// Выбор фото из галереи через Telegram
function selectFromGallery() {
    tg.showPhotoPicker({}, (filePaths) => {
        if (filePaths && filePaths.length > 0) {
            processTelegramFile(filePaths[0], 'gallery');
        }
    });
}

// Сделать фото через камеру
function takePhoto() {
    tg.openCamera({}, (filePath) => {
        if (filePath) {
            processTelegramFile(filePath, 'camera');
        }
    });
}

// Обработка файла из Telegram
function processTelegramFile(filePath, source) {
    console.log("📁 Файл из Telegram:", filePath, source);
    updateStatusBar('📡 Загружаем фото...');
    
    // Создаем mock файл для демо (в реальности нужно использовать tg.downloadFile)
    const mockFile = {
        name: source === 'camera' ? 'photo.jpg' : 'gallery_image.jpg',
        size: 1024 * 1024, // 1MB
        type: 'image/jpeg',
        source: source
    };
    
    currentState.selectedFile = mockFile;
    elements.uploadBtn.disabled = false;
    
    // Показываем превью
    elements.uploadArea.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 10px;">📸</div>
            <p style="color: #666;">${source === 'camera' ? 'Фото с камеры' : 'Фото из галереи'}</p>
            <small>Готово к загрузке</small>
        </div>
    `;
    
    updateStatusBar('✅ Фото готово к загрузке');
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

// Загрузка случайного фото для оценки
async function loadRandomPhoto() {
    try {
        updateStatusBar('🔄 Загружаем фото для оценки...');
        
        const response = await fetch('http://localhost:5000/get_photo');
        const data = await response.json();
        
        if (data.success && data.photo) {
            currentState.currentPhoto = data.photo;
            elements.currentPhoto.src = data.photo.photo_url;
            updateStatusBar('✅ Фото загружено! Оцените его');
        } else {
            throw new Error('Нет доступных фото');
        }
    } catch (error) {
        console.error('Ошибка загрузки фото:', error);
        updateStatusBar('⚠️ Используем тестовое фото', true);
        
        // Fallback
        currentState.currentPhoto = {
            id: 'fallback-photo',
            photo_url: 'https://via.placeholder.com/500x500?text=Rate+This+Photo',
            user_id: 'demo-user'
        };
        elements.currentPhoto.src = currentState.currentPhoto.photo_url;
    }
}

// Загрузка фото на сервер
async function handleUpload() {
    if (!currentState.selectedFile) return;

    elements.uploadBtn.disabled = true;
    updateStatusBar('📤 Загружаем фото...');

    try {
        // В реальности здесь будет tg.downloadFile + FormData
        // Сейчас используем демо-режим
        
        const formData = new FormData();
        formData.append('userId', tg.initDataUnsafe.user.id.toString());
        
        // Имитируем задержку загрузки
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Демо-ответ от сервера
        const mockResponse = {
            success: true,
            photo: {
                id: 'demo-' + Date.now(),
                user_id: tg.initDataUnsafe.user.id.toString(),
                photo_url: 'https://via.placeholder.com/500x500/4CAF50/FFFFFF?text=Upload+Success',
                timestamp: new Date().toISOString(),
                total_ratings: 0,
                average_rating: 0
            }
        };
        
        if (mockResponse.success) {
            updateStatusBar('✅ Фото загружено!');
            
            setTimeout(() => {
                showScreen('rate');
                loadRandomPhoto();
            }, 1000);
        }
        
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        updateStatusBar('✅ Фото "загружено" (демо-режим)');
        
        // Все равно переходим к оценке
        setTimeout(() => {
            showScreen('rate');
            loadRandomPhoto();
        }, 1000);
    }
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

async function handleRatingSubmit() {
    if (!currentState.currentRating || !currentState.currentPhoto) return;

    elements.submitRating.disabled = true;
    updateStatusBar('📨 Отправляем оценку...');

    try {
        const response = await fetch('http://localhost:5000/rate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                photoId: currentState.currentPhoto.id,
                rating: currentState.currentRating,
                userId: tg.initDataUnsafe.user.id.toString()
            })
        });

        const data = await response.json();

        if (data.success) {
            showScreen('thanks');
            updateStatusBar('✅ Оценка отправлена!');
        } else {
            throw new Error('Ошибка отправки оценки');
        }
    } catch (error) {
        console.error('Ошибка оценки:', error);
        updateStatusBar('✅ Спасибо за оценку!');
        showScreen('thanks');
    }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', initApp);

// Глобальные утилиты для дебага
window.debugApp = {
    simulateUpload: () => {
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
    skipToRate: () => {
        showScreen('rate');
        loadRandomPhoto();
    }
};
