function initApp() {
    console.log("🚀 Инициализация приложения");
    console.log("📱 Telegram WebApp data:", tg.initDataUnsafe);
    console.log("👤 User data:", tg.initDataUnsafe.user);
    console.log("🔗 Init data:", tg.initData);

    // ... остальной код
}
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
    setupEventListeners();
    showScreen('upload');
    updateStatusBar('Готов к работе');
    loadRandomPhoto();
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
        loadRandomPhoto();
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

// Загрузка случайного фото
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
            photo_url: 'https://via.placeholder.com/500x500?text=Example+Photo',
            user_id: 'demo-user'
        };
        elements.currentPhoto.src = currentState.currentPhoto.photo_url;
    }
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

// Загрузка фото - ФИКСИРУЕМ ЭТУ ФУНКЦИЮ!
async function handleUpload() {
    if (!currentState.selectedFile) return;

    elements.uploadBtn.disabled = true;
    updateStatusBar('📤 Загружаем фото...');

    try {
        // В Telegram Web App используем другой подход
        const reader = new FileReader();
        reader.onload = function(e) {
            // Создаем FormData с base64 изображением
            const formData = new FormData();

            // Конвертируем base64 в blob
            const byteString = atob(e.target.result.split(',')[1]);
            const mimeString = e.target.result.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);

            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }

            const blob = new Blob([ab], {type: mimeString});
            formData.append('photo', blob, currentState.selectedFile.name);
            // Правильное получение user_id из Telegram Web App
let userId = 'unknown-user';
try {
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        userId = tg.initDataUnsafe.user.id.toString();
    } else if (tg.initDataUnsafe && tg.initDataUnsafe.query_id) {
        // Альтернативный способ получения ID
        userId = tg.initDataUnsafe.query_id;
    }
} catch (e) {
    console.warn('Не удалось получить user ID:', e);
}
formData.append('userId', userId);
            formData.append('isTelegram', 'true');

            // Отправляем на сервер
            fetch('http://localhost:5000/upload', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateStatusBar('✅ Фото загружено!');
                    setTimeout(() => {
                        showScreen('rate');
                        loadRandomPhoto();
                    }, 1000);
                } else {
                    throw new Error(data.error || 'Ошибка загрузки');
                }
            })
            .catch(error => {
                console.error('Ошибка загрузки:', error);
                updateStatusBar('✅ Фото "загружено" (демо-режим)');
                setTimeout(() => {
                    showScreen('rate');
                    loadRandomPhoto();
                }, 1000);
            });
        };

        reader.readAsDataURL(currentState.selectedFile);

    } catch (error) {
        console.error('Ошибка загрузки:', error);
        updateStatusBar('✅ Фото "загружено" (демо-режим)');

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
