from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
import requests
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

# Инициализируем Firebase
try:
    cred = credentials.Certificate("firebase-key.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Firebase подключен!")
except Exception as e:
    print(f"❌ Ошибка Firebase: {e}")

app = Flask(__name__)
CORS(app)  # Разрешаем все CORS запросы

# Простой тестовый маршрут
@app.route('/test', methods=['GET'])
def test():
    return jsonify({'message': 'Сервер работает!', 'status': 'ok'})

# Маршрут для загрузки фото
@app.route('/upload', methods=['POST'])
def upload_photo():
    try:
        print("📨 Получен запрос на загрузку фото")
        
        # Проверяем, есть ли файл
        if 'photo' not in request.files:
            print("❌ Нет файла в запросе")
            return jsonify({'error': 'No photo file'}), 400
        
        photo = request.files['photo']
        user_id = request.form.get('userId')
        
        print(f"📸 Файл: {photo.filename}, User: {user_id}")
        
        if photo.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        # Временно возвращаем успех без загрузки
        photo_id = str(uuid.uuid4())
        photo_data = {
            'id': photo_id,
            'user_id': user_id,
            'photo_url': 'https://via.placeholder.com/500x500?text=Photo+Placeholder',
            'timestamp': datetime.now().isoformat(),
            'total_ratings': 0,
            'average_rating': 0,
            'status': 'active'
        }
        
        # Сохраняем в Firebase
        try:
            db.collection('photos').document(photo_id).set(photo_data)
            print("✅ Данные сохранены в Firestore")
        except Exception as firestore_error:
            print(f"⚠️ Ошибка Firestore: {firestore_error}")
            # Продолжаем работу даже без Firestore
        
        return jsonify({
            'success': True,
            'photo': photo_data,
            'message': 'Фото успешно загружено (тестовый режим)'
        })
        
    except Exception as e:
        print(f"❌ Ошибка в upload: {e}")
        return jsonify({'error': str(e)}), 500

# Маршрут для получения фото
@app.route('/get_photo', methods=['GET'])
def get_photo():
    try:
        print("🔄 Запрос на получение фото")
        
        # Тестовое фото
        test_photo = {
            'id': 'test-photo-123',
            'user_id': 'test-user',
            'photo_url': 'https://via.placeholder.com/500x500?text=Test+Photo',
            'timestamp': datetime.now().isoformat(),
            'total_ratings': 42,
            'average_rating': 8.5,
            'status': 'active'
        }
        
        return jsonify({
            'success': True,
            'photo': test_photo
        })
        
    except Exception as e:
        print(f"❌ Ошибка в get_photo: {e}")
        return jsonify({'error': str(e)}), 500

# Маршрут для оценки
@app.route('/rate', methods=['POST'])
def rate_photo():
    try:
        print("⭐ Получена оценка")
        data = request.json
        print(f"Данные: {data}")
        
        return jsonify({
            'success': True,
            'message': 'Оценка принята!'
        })
        
    except Exception as e:
        print(f"❌ Ошибка в rate: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Запуск сервера на http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)