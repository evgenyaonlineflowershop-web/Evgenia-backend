const fs = require('fs');
const path = require('path');

module.exports = async () => {
  // 1. Читаем CSV файл
  const csvPath = path.join(__dirname, 'result.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('❌ Файл result.csv не найден в корне проекта!');
    return;
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim() !== '');

  console.log(`🚀 Найдено ${lines.length} строк для обработки...`);

  // Предположим, формат CSV: id_товара, имя_картинки
  // Если у тебя разделитель точка с запятой (;), замени split(',') на split(';')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const [productId, imageName] = line.split(',');

    if (!productId || !imageName) continue;

    const cleanProductId = productId.trim();
    const cleanImageName = imageName.trim();

    try {
      // 2. Ищем картинку в медиабиблиотеке Strapi по имени файла
      const mediaFiles = await strapi.plugins['upload'].services.upload.fetchAll({
        filters: { name: { $contains: cleanImageName } }
      });

      if (mediaFiles.length === 0) {
        console.log(`⚠️ Картинка "${cleanImageName}" не найдена в медиабиблиотеке.`);
        continue;
      }

      const mediaId = mediaFiles[0].id;

      // 3. Привязываем картинку к товару
      await strapi.entityService.update('api::product.product', cleanProductId, {
        data: {
          images: mediaId, // или [mediaId], если у тебя связь "много картинок к одному товару"
        },
      });

      console.log(`✅ Товар ID ${cleanProductId} успешно связан с картинкой "${cleanImageName}" (Media ID: ${mediaId})`);
    } catch (err) {
      console.error(`❌ Ошибка при связывании товара ID ${cleanProductId}:`, err.message);
    }
  }

  console.log('🏁 Автоматическое восстановление связей завершено!');
};